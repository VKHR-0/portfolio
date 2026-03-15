import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { toSlug } from "../../shared/slug";
import { sortedPaginate } from "../_lib/sorted";
import { zAuthedMutation, zQuery } from "../_lib/validated";

const CATEGORY_INDEXES = {
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
		return sortedPaginate(ctx.db, "categories", CATEGORY_INDEXES, args);
	},
});

const create = zAuthedMutation({
	args: {
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
		description: z.string().trim().optional(),
	},
	handler: async (ctx, args) => {
		const { name, description } = args;
		const slug = toSlug(args.slug);

		const existing = await ctx.db
			.query("categories")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new ConvexError("Category with this slug already exists.");
		}

		return await ctx.db.insert("categories", { name, slug, description });
	},
});

const update = zAuthedMutation({
	args: {
		id: zid("categories"),
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
		description: z.string().trim().optional(),
	},
	handler: async (ctx, args) => {
		const { id, name, description } = args;
		const existing = await ctx.db.get(id);

		if (!existing) {
			throw new ConvexError("Category not found.");
		}

		const slug = toSlug(args.slug);

		const conflicting = await ctx.db
			.query("categories")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Category with this slug already exists.");
		}

		await ctx.db.patch(id, { name, slug, description });
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("categories"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const category = await ctx.db.get(id);

		if (!category) {
			throw new ConvexError("Category not found.");
		}

		const associatedPost = await ctx.db
			.query("posts")
			.withIndex("by_category", (q) => q.eq("categoryId", id))
			.first();

		if (associatedPost) {
			throw new ConvexError(
				"Cannot delete category while it is associated with posts.",
			);
		}

		await ctx.db.delete(id);
	},
});

export { create, list, remove, update };
