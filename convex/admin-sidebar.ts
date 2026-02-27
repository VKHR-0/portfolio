import { v } from "convex/values";
import { query } from "./_generated/server";

export const getOverviewCounts = query({
	args: {},
	handler: async (ctx) => {
		const [posts, projects, tags, series, categories] = await Promise.all([
			ctx.db.query("posts").collect(),
			ctx.db.query("projects").collect(),
			ctx.db.query("tags").collect(),
			ctx.db.query("series").collect(),
			ctx.db.query("categories").collect(),
		]);

		return {
			posts: posts.length,
			projects: projects.length,
			tags: tags.length,
			series: series.length,
			categories: categories.length,
		};
	},
});

export const listRecentPosts = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
		const posts = await ctx.db
			.query("posts")
			.withIndex("by_creation_time")
			.order("desc")
			.take(limit);

		return posts.map((post) => ({
			_id: post._id,
			title: post.title,
			slug: post.slug,
			status: post.status,
			_creationTime: post._creationTime,
		}));
	},
});
