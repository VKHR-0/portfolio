import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import {
	mutation,
	query,
	type MutationCtx,
	type QueryCtx,
} from "../_generated/server";
import { authComponent } from "../auth";

async function requireCurrentUserId(ctx: QueryCtx | MutationCtx) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user?._id) {
		throw new Error("You must be signed in.");
	}

	return user._id;
}

function normalizeTitle(value: string) {
	const title = value.trim();

	if (!title) {
		throw new Error("Title is required.");
	}

	return title;
}

function normalizeSlug(value: string) {
	const slug = toSlug(value.trim());

	if (!slug) {
		throw new Error("Slug is required.");
	}

	return slug;
}

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

export const getEditableBySlug = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const post = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", normalizeSlug(args.slug)))
			.unique();

		if (!post || post.authorId !== authorId) {
			throw new Error("Post not found.");
		}

		return {
			_id: post._id,
			title: post.title,
			slug: post.slug,
			content: post.content,
			status: post.status,
			seriesId: post.seriesId,
			categoryId: post.categoryId,
			projectId: post.projectId,
			tagIds: post.tags,
		};
	},
});

export const createDraft = mutation({
	args: {
		title: v.string(),
		slug: v.string(),
		content: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("draft"), v.literal("private"), v.literal("public")),
		),
		seriesId: v.optional(v.id("series")),
		categoryId: v.optional(v.id("categories")),
		projectId: v.optional(v.id("projects")),
		tagIds: v.optional(v.array(v.id("tags"))),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);
		const content = args.content?.trim() ?? "";
		const status = args.status ?? "draft";
		const tagIds = args.tagIds ?? [];
		const existingPost = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existingPost) {
			throw new Error("Post with this slug already exists.");
		}

		const postId = await ctx.db.insert("posts", {
			title,
			slug,
			content,
			status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			authorId,
			tags: tagIds,
		});

		return {
			_id: postId,
			title,
			slug,
			content,
			status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			tagIds,
		};
	},
});

export const updateDraft = mutation({
	args: {
		id: v.id("posts"),
		title: v.string(),
		slug: v.string(),
		content: v.string(),
		status: v.union(
			v.literal("draft"),
			v.literal("private"),
			v.literal("public"),
		),
		seriesId: v.optional(v.id("series")),
		categoryId: v.optional(v.id("categories")),
		projectId: v.optional(v.id("projects")),
		tagIds: v.array(v.id("tags")),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const existingPost = await ctx.db.get(args.id);

		if (!existingPost || existingPost.authorId !== authorId) {
			throw new Error("Post not found.");
		}

		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);
		const content = args.content.trim();
		const conflictingPost = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflictingPost && conflictingPost._id !== args.id) {
			throw new Error("Post with this slug already exists.");
		}

		await ctx.db.patch(args.id, {
			title,
			slug,
			content,
			status: args.status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			tags: args.tagIds,
		});

		return {
			_id: args.id,
			title,
			slug,
			content,
			status: args.status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			tagIds: args.tagIds,
		};
	},
});
