import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import { mutation, query } from "../_generated/server";

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tags")
			.withIndex("by_creation_time")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const createTag = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const name = args.name.trim();
		const slug = toSlug(args.slug?.trim() || name);

		if (!name) {
			throw new Error("Name is required.");
		}

		if (!slug) {
			throw new Error("Slug is required.");
		}

		const existing = await ctx.db
			.query("tags")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new Error("Tag with this slug already exists.");
		}

		return await ctx.db.insert("tags", {
			name,
			slug,
		});
	},
});

export const deleteTag = mutation({
	args: {
		id: v.id("tags"),
	},
	handler: async (ctx, args) => {
		const tag = await ctx.db.get(args.id);

		if (!tag) {
			throw new Error("Tag not found.");
		}

		const posts = await ctx.db.query("posts").collect();
		const associatedPost = posts.find((post) =>
			post.tags.some((tagId) => tagId === args.id),
		);

		if (associatedPost) {
			throw new Error("Cannot delete tag while it is associated with posts.");
		}

		await ctx.db.delete(args.id);
	},
});
