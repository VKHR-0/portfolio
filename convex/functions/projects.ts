import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		sortField: v.optional(v.union(v.literal("title"), v.literal("slug"))),
		sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		const direction = args.sortDirection ?? "desc";

		switch (args.sortField) {
			case "title":
				return await ctx.db
					.query("projects")
					.withIndex("by_title")
					.order(direction)
					.paginate(args.paginationOpts);
			case "slug":
				return await ctx.db
					.query("projects")
					.withIndex("by_slug")
					.order(direction)
					.paginate(args.paginationOpts);
			default:
				return await ctx.db
					.query("projects")
					.withIndex("by_creation_time")
					.order("desc")
					.paginate(args.paginationOpts);
		}
	},
});

export const listRecentProjects = query({
	args: {
		limit: v.optional(v.number()),
		authorId: v.string(),
	},
	handler: async (ctx, args) => {
		const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_creation_time")
			.filter((q) => q.eq(q.field("authorId"), args.authorId))
			.order("desc")
			.take(limit);

		return projects.map((project) => ({
			_id: project._id,
			title: project.title,
			slug: project.slug,
			status: project.status,
			_creationTime: project._creationTime,
		}));
	},
});
