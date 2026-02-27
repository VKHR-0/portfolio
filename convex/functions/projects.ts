import { v } from "convex/values";
import { query } from "../_generated/server";

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
