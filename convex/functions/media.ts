import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "../_generated/server";
import { authComponent } from "../auth";
import {
	getUsedInPosts,
	getUsedInProjects,
	hasMediaUsage,
} from "./attachments";

async function requireCurrentUserId(ctx: QueryCtx | MutationCtx) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user?._id) {
		throw new Error("You must be signed in.");
	}

	return user._id;
}

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireCurrentUserId(ctx);
		return await ctx.storage.generateUploadUrl();
	},
});

export const createMedia = mutation({
	args: {
		storageId: v.id("_storage"),
		filename: v.string(),
		alt: v.optional(v.string()),
		mimeType: v.string(),
		size: v.number(),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);

		const baseName = args.filename.replace(/\.[^.]+$/, "");
		const baseSlug = toSlug(baseName) || "image";
		let slug = baseSlug;
		let suffix = 0;

		while (true) {
			const existing = await ctx.db
				.query("media")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.unique();

			if (!existing) break;

			suffix++;
			slug = `${baseSlug}-${suffix}`;
		}

		const mediaId = await ctx.db.insert("media", {
			storageId: args.storageId,
			filename: args.filename,
			slug,
			alt: args.alt,
			mimeType: args.mimeType,
			size: args.size,
			authorId,
		});

		const url = await ctx.storage.getUrl(args.storageId);

		return { _id: mediaId, slug, url };
	},
});

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const result = await ctx.db
			.query("media")
			.withIndex("by_creation_time")
			.order("desc")
			.paginate(args.paginationOpts);

		const pageWithUrls = await Promise.all(
			result.page.map(async (item) => ({
				...item,
				url: await ctx.storage.getUrl(item.storageId),
			})),
		);

		return { ...result, page: pageWithUrls };
	},
});

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const items = await ctx.db
			.query("media")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();

		return Promise.all(
			items.map(async (item) => ({
				_id: item._id,
				filename: item.filename,
				slug: item.slug,
				alt: item.alt,
				url: await ctx.storage.getUrl(item.storageId),
			})),
		);
	},
});

export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const media = await ctx.db
			.query("media")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!media) {
			throw new Error("Media not found.");
		}

		const url = await ctx.storage.getUrl(media.storageId);
		const [usedInPosts, usedInProjects] = await Promise.all([
			getUsedInPosts(ctx, media._id),
			getUsedInProjects(ctx, media._id),
		]);

		return {
			...media,
			url,
			usedInPosts,
			usedInProjects,
		};
	},
});

export const deleteMedia = mutation({
	args: {
		id: v.id("media"),
	},
	handler: async (ctx, args) => {
		await requireCurrentUserId(ctx);

		const media = await ctx.db.get(args.id);

		if (!media) {
			throw new Error("Media not found.");
		}

		if (await hasMediaUsage(ctx, args.id)) {
			throw new Error(
				"Cannot delete media while it is in use by posts or projects.",
			);
		}

		await ctx.storage.delete(media.storageId);
		await ctx.db.delete(args.id);
	},
});
