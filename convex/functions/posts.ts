import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("posts")
			.withIndex("by_creation_time")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const listRecentPosts = query({
	args: {
		limit: v.optional(v.number()),
		authorId: v.string(),
	},
	handler: async (ctx, args) => {
		const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
		const posts = await ctx.db
			.query("posts")
			.withIndex("by_creation_time")
			.filter((q) => q.eq(q.field("authorId"), args.authorId))
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
