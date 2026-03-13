import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import type { Id } from "../_generated/dataModel";
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "../_generated/server";
import { authComponent } from "../auth";
import { deriveAttachmentIds, syncPostMediaRelations } from "./attachments";

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

async function syncPostTagRelations(
	ctx: MutationCtx,
	postId: Id<"posts">,
	tagIds: Array<Id<"tags">>,
) {
	const existingRows = await ctx.db
		.query("postTag")
		.withIndex("by_post", (q) => q.eq("postId", postId))
		.collect();

	const desiredTagIds = new Set(tagIds);
	const seenTagIds = new Set<Id<"tags">>();

	for (const row of existingRows) {
		if (!desiredTagIds.has(row.tagId) || seenTagIds.has(row.tagId)) {
			await ctx.db.delete(row._id);
			continue;
		}

		seenTagIds.add(row.tagId);
	}

	for (const tagId of tagIds) {
		if (seenTagIds.has(tagId)) {
			continue;
		}

		await ctx.db.insert("postTag", { postId, tagId });
	}
}

export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		sortField: v.optional(
			v.union(v.literal("title"), v.literal("slug"), v.literal("status")),
		),
		sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		const direction = args.sortDirection ?? "desc";

		switch (args.sortField) {
			case "title":
				return await ctx.db
					.query("posts")
					.withIndex("by_title")
					.order(direction)
					.paginate(args.paginationOpts);
			case "slug":
				return await ctx.db
					.query("posts")
					.withIndex("by_slug")
					.order(direction)
					.paginate(args.paginationOpts);
			case "status":
				return await ctx.db
					.query("posts")
					.withIndex("by_status")
					.order(direction)
					.paginate(args.paginationOpts);
			default:
				return await ctx.db
					.query("posts")
					.withIndex("by_creation_time")
					.order("desc")
					.paginate(args.paginationOpts);
		}
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
			attachments: post.attachments,
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

		const attachments = deriveAttachmentIds({ content });
		const postId = await ctx.db.insert("posts", {
			title,
			slug,
			content,
			attachments,
			status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			authorId,
			tags: tagIds,
		});

		await syncPostMediaRelations(ctx, postId, attachments);
		await syncPostTagRelations(ctx, postId, tagIds);

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
			attachments,
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

		const attachments = deriveAttachmentIds({ content });

		await ctx.db.patch(args.id, {
			title,
			slug,
			content,
			attachments,
			status: args.status,
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			tags: args.tagIds,
		});

		await syncPostMediaRelations(ctx, args.id, attachments);
		await syncPostTagRelations(ctx, args.id, args.tagIds);

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
			attachments,
		};
	},
});

export const updatePostSummary = mutation({
	args: {
		id: v.id("posts"),
		title: v.string(),
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const existingPost = await ctx.db.get(args.id);

		if (!existingPost || existingPost.authorId !== authorId) {
			throw new Error("Post not found.");
		}

		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);
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
		});

		return {
			_id: args.id,
			title,
			slug,
		};
	},
});

export const getPublicBySlug = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const post = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!post) {
			return null;
		}

		if (post.status === "draft") {
			return null;
		}

		if (post.status === "private") {
			const user = await authComponent.getAuthUser(ctx);

			if (!user || post.authorId !== user._id) {
				return null;
			}
		}

		const [category, tags] = await Promise.all([
			post.categoryId ? ctx.db.get(post.categoryId) : null,
			Promise.all(post.tags.map((tagId) => ctx.db.get(tagId))),
		]);

		return {
			title: post.title,
			slug: post.slug,
			content: post.content,
			_creationTime: post._creationTime,
			category: category ? { name: category.name, slug: category.slug } : null,
			tags: tags
				.filter((tag): tag is NonNullable<typeof tag> => tag !== null)
				.map((tag) => ({ name: tag.name, slug: tag.slug })),
		};
	},
});

export const deletePost = mutation({
	args: {
		id: v.id("posts"),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const post = await ctx.db.get(args.id);

		if (!post || post.authorId !== authorId) {
			throw new Error("Post not found.");
		}

		const [postMediaRows, postTagRows] = await Promise.all([
			ctx.db
				.query("postMedia")
				.withIndex("by_post", (q) => q.eq("postId", args.id))
				.collect(),
			ctx.db
				.query("postTag")
				.withIndex("by_post", (q) => q.eq("postId", args.id))
				.collect(),
		]);

		for (const row of postMediaRows) {
			await ctx.db.delete(row._id);
		}

		for (const row of postTagRows) {
			await ctx.db.delete(row._id);
		}

		await ctx.db.delete(args.id);
	},
});
