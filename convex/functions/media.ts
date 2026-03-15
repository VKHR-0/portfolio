import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { toSlug } from "../../shared/slug";
import { getMediaUsage, hasMediaUsage } from "../_lib/attachment";
import { authedMutation } from "../_lib/authed";
import { assertDocumentOwner } from "../_lib/owned";
import { sortedPaginate } from "../_lib/sorted";
import { zAuthedMutation, zQuery } from "../_lib/validated";

const list = zQuery({
	args: {
		paginationOpts: z.object({
			cursor: z.union([z.string(), z.null()]),
			numItems: z.number(),
		}),
	},
	handler: async (ctx, args) => {
		const result = await sortedPaginate(
			ctx.db,
			"media",
			{ _creationTime: "by_creation_time" },
			{ paginationOpts: args.paginationOpts },
		);

		const pageWithUrls = await Promise.all(
			result.page.map(async (item) => ({
				...item,
				url: await ctx.storage.getUrl(item.storageId),
			})),
		);

		return { ...result, page: pageWithUrls };
	},
});

const create = zAuthedMutation({
	args: {
		storageId: zid("_storage"),
		filename: z.string().trim().min(1, "Filename is required."),
		alt: z.string().trim().optional(),
		mimeType: z.string().min(1, "MIME type is required."),
		size: z.number().positive(),
	},
	handler: async (ctx, args) => {
		const { userId: authorId } = ctx;
		const { storageId, filename, alt, mimeType, size } = args;
		const baseName = filename.replace(/\.[^.]+$/, "");
		const baseSlug = toSlug(baseName);
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
			storageId,
			filename,
			slug,
			alt,
			mimeType,
			size,
			authorId,
		});

		const url = await ctx.storage.getUrl(storageId);

		return { _id: mediaId, slug, url };
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("media"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "media",
		});

		if (await hasMediaUsage(ctx, id)) {
			throw new ConvexError(
				"Cannot delete media while it is in use by posts or projects.",
			);
		}

		const media = await ctx.db.get(id);
		if (media) {
			await ctx.storage.delete(media.storageId);
		}
		await ctx.db.delete(id);
	},
});

const generateUploadUrl = authedMutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

const getBySlug = zQuery({
	args: {
		slug: z.string(),
	},
	handler: async (ctx, args) => {
		const media = await ctx.db
			.query("media")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!media) {
			throw new ConvexError("Media not found.");
		}

		const [url, usage] = await Promise.all([
			ctx.storage.getUrl(media.storageId),
			getMediaUsage(ctx, media._id),
		]);

		const { posts, projects } = usage;

		return {
			...media,
			url,
			posts,
			projects,
		};
	},
});

export { list, create, remove, generateUploadUrl, getBySlug };
