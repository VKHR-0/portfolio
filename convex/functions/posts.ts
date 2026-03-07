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

const MARKDOWN_IMAGE_REGEX =
	/!\[[^\]]*]\((?:<([^>]+)>|([^) \t]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\)/g;
const HTML_IMAGE_REGEX = /<img\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi;

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

function extractImageUrls(content: string): string[] {
	const urls = new Set<string>();

	for (const match of content.matchAll(MARKDOWN_IMAGE_REGEX)) {
		const url = match[1] ?? match[2];

		if (url && !url.startsWith("blob:") && !url.startsWith("data:")) {
			urls.add(url);
		}
	}

	for (const match of content.matchAll(HTML_IMAGE_REGEX)) {
		const url = match[2];

		if (url && !url.startsWith("blob:") && !url.startsWith("data:")) {
			urls.add(url);
		}
	}

	return [...urls];
}

function normalizeResolvableUrl(url: string): Array<string> {
	try {
		const parsed = new URL(url);

		return [parsed.href, `${parsed.origin}${parsed.pathname}`];
	} catch {
		return [url];
	}
}

function extractStorageIdFromUrl(url: string): Id<"_storage"> | null {
	try {
		const parsed = new URL(url);
		const storageIdFromQuery = parsed.searchParams.get("storageId");

		if (storageIdFromQuery) {
			return storageIdFromQuery as Id<"_storage">;
		}

		const storagePathMatch = parsed.pathname.match(
			/\/(?:api\/)?storage\/([^/?#]+)/,
		);

		if (!storagePathMatch) {
			return null;
		}

		return decodeURIComponent(storagePathMatch[1]) as Id<"_storage">;
	} catch {
		return null;
	}
}

type MediaUrlCache = Map<string, Id<"media">> | null;

async function resolveMediaIdFromUrl(
	ctx: QueryCtx | MutationCtx,
	url: string,
	cache: { current: MediaUrlCache },
): Promise<Id<"media"> | null> {
	const storageId = extractStorageIdFromUrl(url);

	if (storageId) {
		const media = await ctx.db
			.query("media")
			.withIndex("by_storage_id", (q) => q.eq("storageId", storageId))
			.unique();

		if (media) {
			return media._id;
		}
	}

	if (cache.current === null) {
		const mediaItems = await ctx.db.query("media").collect();
		const urlEntries = await Promise.all(
			mediaItems.map(async (media) => ({
				mediaId: media._id,
				url: await ctx.storage.getUrl(media.storageId),
			})),
		);

		const nextCache = new Map<string, Id<"media">>();

		for (const entry of urlEntries) {
			if (!entry.url) {
				continue;
			}

			for (const candidate of normalizeResolvableUrl(entry.url)) {
				nextCache.set(candidate, entry.mediaId);
			}
		}

		cache.current = nextCache;
	}

	for (const candidate of normalizeResolvableUrl(url)) {
		const mediaId = cache.current.get(candidate);

		if (mediaId) {
			return mediaId;
		}
	}

	return null;
}

async function derivePostAttachmentIds(
	ctx: QueryCtx | MutationCtx,
	content: string,
): Promise<Array<Id<"media">>> {
	const urls = extractImageUrls(content);
	const cache = { current: null as MediaUrlCache };
	const attachmentIds: Array<Id<"media">> = [];
	const seen = new Set<Id<"media">>();

	for (const url of urls) {
		const mediaId = await resolveMediaIdFromUrl(ctx, url, cache);

		if (!mediaId || seen.has(mediaId)) {
			continue;
		}

		seen.add(mediaId);
		attachmentIds.push(mediaId);
	}

	return attachmentIds;
}

async function syncPostMediaRelations(
	ctx: MutationCtx,
	postId: Id<"posts">,
	mediaIds: Array<Id<"media">>,
) {
	const existingRows = await ctx.db
		.query("postMedia")
		.withIndex("by_post", (q) => q.eq("postId", postId))
		.collect();

	const desiredMediaIds = new Set(mediaIds);
	const seenMediaIds = new Set<Id<"media">>();

	for (const row of existingRows) {
		if (!desiredMediaIds.has(row.mediaId) || seenMediaIds.has(row.mediaId)) {
			await ctx.db.delete(row._id);
			continue;
		}

		seenMediaIds.add(row.mediaId);
	}

	for (const mediaId of mediaIds) {
		if (seenMediaIds.has(mediaId)) {
			continue;
		}

		await ctx.db.insert("postMedia", { postId, mediaId });
	}
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

		const attachments = await derivePostAttachmentIds(ctx, content);
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

		const attachments = await derivePostAttachmentIds(ctx, content);

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
