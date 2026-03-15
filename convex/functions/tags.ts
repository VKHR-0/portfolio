import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { toSlug } from "../../shared/slug";
import { query } from "../_generated/server";
import { sortedPaginate } from "../_lib/sorted";
import { zAuthedMutation, zQuery } from "../_lib/validated";

const TAG_INDEXES = {
	name: "by_name",
	slug: "by_slug",
	_creationTime: "by_creation_time",
} as const;

const list = zQuery({
	args: {
		paginationOpts: z.object({
			cursor: z.union([z.string(), z.null()]),
			numItems: z.number(),
		}),
		sortField: z.enum(["name", "slug", "_creationTime"]).optional(),
		sortDirection: z.enum(["asc", "desc"]).optional(),
	},
	handler: async (ctx, args) => {
		return sortedPaginate(ctx.db, "tags", TAG_INDEXES, args);
	},
});

const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("tags")
			.withIndex("by_name")
			.order("asc")
			.collect();
	},
});

const create = zAuthedMutation({
	args: {
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
	},
	handler: async (ctx, args) => {
		const { name } = args;
		const slug = toSlug(args.slug);

		const existing = await ctx.db
			.query("tags")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new ConvexError("Tag with this slug already exists.");
		}

		return await ctx.db.insert("tags", { name, slug });
	},
});

const update = zAuthedMutation({
	args: {
		id: zid("tags"),
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
	},
	handler: async (ctx, args) => {
		const { id, name } = args;
		const existing = await ctx.db.get(id);

		if (!existing) {
			throw new ConvexError("Tag not found.");
		}

		const slug = toSlug(args.slug);

		const conflicting = await ctx.db
			.query("tags")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Tag with this slug already exists.");
		}

		await ctx.db.patch(id, { name, slug });
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("tags"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const tag = await ctx.db.get(id);

		if (!tag) {
			throw new ConvexError("Tag not found.");
		}

		const associatedPost = await ctx.db
			.query("postTag")
			.withIndex("by_tag", (q) => q.eq("tagId", id))
			.first();

		if (associatedPost) {
			throw new ConvexError(
				"Cannot delete tag while it is associated with posts.",
			);
		}

		await ctx.db.delete(id);
	},
});

export { list, listAll, create, update, remove };
