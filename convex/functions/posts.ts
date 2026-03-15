import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { toSlug } from "../../shared/slug";
import { deriveAttachmentIds } from "../_lib/attachment";
import { assertDocumentOwner } from "../_lib/owned";
import { sortedPaginate } from "../_lib/sorted";
import { syncPostMedia, syncPostTags } from "../_lib/sync";
import { zAuthedMutation, zAuthedQuery, zQuery } from "../_lib/validated";
import { authComponent } from "../auth";

const POST_INDEXES = {
	title: "by_title",
	slug: "by_slug",
	status: "by_status",
	_creationTime: "by_creation_time",
} as const;

const list = zQuery({
	args: {
		paginationOpts: z.object({
			cursor: z.union([z.string(), z.null()]),
			numItems: z.number(),
		}),
		sortField: z.enum(["title", "slug", "status", "_creationTime"]).optional(),
		sortDirection: z.enum(["asc", "desc"]).optional(),
	},
	handler: async (ctx, args) => {
		return sortedPaginate(ctx.db, "posts", POST_INDEXES, args);
	},
});

const listRecent = zAuthedQuery({
	args: {
		limit: z.number().min(1).max(20).optional(),
	},
	handler: async (ctx, args) => {
		const { userId } = ctx;
		const limit = args.limit ?? 5;

		const posts = await ctx.db
			.query("posts")
			.withIndex("by_author", (q) => q.eq("authorId", userId))
			.order("desc")
			.take(limit);

		return posts.map(({ _id, title, slug, status, _creationTime }) => ({
			_id,
			title,
			slug,
			status,
			_creationTime,
		}));
	},
});

const postStatus = z.union([
	z.literal("draft"),
	z.literal("private"),
	z.literal("public"),
]);

const create = zAuthedMutation({
	args: {
		title: z.string(),
		slug: z.string(),
		content: z.string().optional(),
		status: postStatus.optional(),
		seriesId: zid("series").optional(),
		categoryId: zid("categories").optional(),
		projectId: zid("projects").optional(),
		tagIds: z.array(zid("tags")).optional(),
	},
	handler: async (ctx, args) => {
		const { userId } = ctx;
		const { title } = args;
		const slug = toSlug(args.slug);
		const content = args.content?.trim() ?? "";
		const tagIds = args.tagIds ?? [];

		const existing = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new ConvexError("Post with this slug already exists.");
		}

		const attachments = deriveAttachmentIds(content);
		const postId = await ctx.db.insert("posts", {
			title,
			slug,
			content,
			attachments,
			status: args.status ?? "draft",
			seriesId: args.seriesId,
			categoryId: args.categoryId,
			projectId: args.projectId,
			authorId: userId,
		});

		await Promise.all([
			syncPostMedia(ctx, postId, attachments),
			syncPostTags(ctx, postId, tagIds),
		]);

		return { _id: postId, title, slug };
	},
});

const update = zAuthedMutation({
	args: {
		id: zid("posts"),
		title: z.string(),
		slug: z.string(),
		content: z.string(),
		status: postStatus,
		seriesId: zid("series").optional(),
		categoryId: zid("categories").optional(),
		projectId: zid("projects").optional(),
		tagIds: z.array(zid("tags")),
	},
	handler: async (ctx, args) => {
		const { id, title, slug: rawSlug, tagIds, ...fields } = args;
		const slug = toSlug(rawSlug);
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "posts",
		});

		const content = fields.content.trim();

		const conflicting = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Post with this slug already exists.");
		}

		const attachments = deriveAttachmentIds(content);

		await ctx.db.patch(id, {
			title,
			slug,
			...fields,
			content,
			attachments,
		});

		await Promise.all([
			syncPostMedia(ctx, id, attachments),
			syncPostTags(ctx, id, tagIds),
		]);

		return { _id: id, title, slug };
	},
});

const updateSummary = zAuthedMutation({
	args: {
		id: zid("posts"),
		title: z.string(),
		slug: z.string(),
	},
	handler: async (ctx, args) => {
		const { id, title, slug: rawSlug } = args;
		const slug = toSlug(rawSlug);
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "posts",
		});

		const conflicting = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Post with this slug already exists.");
		}

		await ctx.db.patch(id, {
			title,
			slug,
		});

		return { _id: id, title, slug };
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("posts"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "posts",
		});

		const [postMediaRows, postTagRows] = await Promise.all([
			ctx.db
				.query("postMedia")
				.withIndex("by_post", (q) => q.eq("postId", id))
				.collect(),
			ctx.db
				.query("postTag")
				.withIndex("by_post", (q) => q.eq("postId", id))
				.collect(),
		]);

		for (const row of postMediaRows) {
			await ctx.db.delete(row._id);
		}

		for (const row of postTagRows) {
			await ctx.db.delete(row._id);
		}

		await ctx.db.delete(id);
	},
});

const getEditableBySlug = zAuthedQuery({
	args: {
		slug: z.string(),
	},
	handler: async (ctx, { slug }) => {
		const { userId } = ctx;
		const post = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (!post) {
			throw new Error("Post not found.");
		}

		await assertDocumentOwner(ctx, {
			documentId: post._id,
			userId,
			documentType: "posts",
		});

		const tagRows = await ctx.db
			.query("postTag")
			.withIndex("by_post", (q) => q.eq("postId", post._id))
			.collect();

		const { _creationTime, authorId, ...rest } = post;

		return { ...rest, tagIds: tagRows.map((row) => row.tagId) };
	},
});

const getPublicBySlug = zQuery({
	args: {
		slug: z.string(),
	},
	handler: async (ctx, { slug }) => {
		const post = await ctx.db
			.query("posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
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

		const tagRows = await ctx.db
			.query("postTag")
			.withIndex("by_post", (q) => q.eq("postId", post._id))
			.collect();

		const [category, tags] = await Promise.all([
			post.categoryId ? ctx.db.get(post.categoryId) : null,
			Promise.all(tagRows.map((row) => ctx.db.get(row.tagId))),
		]);

		return {
			title: post.title,
			slug: post.slug,
			content: post.content,
			_creationTime: post._creationTime,
			category: category ? { name: category.name, slug: category.slug } : null,
			tags: tags
				.filter((tag): tag is NonNullable<typeof tag> => tag !== null)
				.map(({ name, slug }) => ({ name, slug })),
		};
	},
});

export {
	list,
	listRecent,
	create,
	update,
	updateSummary,
	remove,
	getEditableBySlug,
	getPublicBySlug,
};
