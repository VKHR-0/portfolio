import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { colorSchema } from "../../shared/colors";
import { toSlug } from "../../shared/slug";
import { sortedPaginate } from "../_lib/sorted";
import { zAuthedMutation, zQuery } from "../_lib/validated";

const TECHNOLOGY_INDEXES = {
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
		return sortedPaginate(ctx.db, "technologies", TECHNOLOGY_INDEXES, args);
	},
});

const create = zAuthedMutation({
	args: {
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
		color: colorSchema,
	},
	handler: async (ctx, args) => {
		const { name, color } = args;
		const slug = toSlug(args.slug);

		const existing = await ctx.db
			.query("technologies")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new ConvexError("Technology with this slug already exists.");
		}

		return await ctx.db.insert("technologies", { name, slug, color });
	},
});

const update = zAuthedMutation({
	args: {
		id: zid("technologies"),
		name: z.string().trim().min(1, "Name is required."),
		slug: z.string().trim().min(1, "Slug is required."),
		color: colorSchema,
	},
	handler: async (ctx, args) => {
		const { id, name, color } = args;
		const existing = await ctx.db.get(id);

		if (!existing) {
			throw new ConvexError("Technology not found.");
		}

		const slug = toSlug(args.slug);

		const conflicting = await ctx.db
			.query("technologies")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Technology with this slug already exists.");
		}

		await ctx.db.patch(id, { name, slug, color });
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("technologies"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const technology = await ctx.db.get(id);

		if (!technology) {
			throw new ConvexError("Technology not found.");
		}

		const associatedProject = await ctx.db
			.query("projectTechnology")
			.withIndex("by_technology", (q) => q.eq("technologyId", id))
			.first();

		if (associatedProject) {
			throw new ConvexError(
				"Cannot delete technology while it is assigned to projects.",
			);
		}

		await ctx.db.delete(id);
	},
});

export { list, create, update, remove };
