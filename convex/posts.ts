import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("posts")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();
	},
});
