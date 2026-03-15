import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { query } from "../_generated/server";
import { deriveAttachmentIds } from "../_lib/attachment";
import { resolveImageUrl } from "../_lib/media";
import { assertDocumentOwner } from "../_lib/owned";
import { sortedPaginate } from "../_lib/sorted";
import { syncProjectMedia } from "../_lib/sync";
import { zAuthedMutation, zAuthedQuery, zQuery } from "../_lib/validated";

const PROJECT_INDEXES = {
	title: "by_title",
	slug: "by_slug",
	_creationTime: "by_creation_time",
} as const;

const list = zQuery({
	args: {
		paginationOpts: z.object({
			cursor: z.union([z.string(), z.null()]),
			numItems: z.number(),
		}),
		sortField: z.enum(["title", "slug", "_creationTime"]).optional(),
		sortDirection: z.enum(["asc", "desc"]).optional(),
	},
	handler: async (ctx, args) => {
		return sortedPaginate(ctx.db, "projects", PROJECT_INDEXES, args);
	},
});

const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("projects")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();
	},
});

const listRecent = zAuthedQuery({
	args: {
		limit: z.number().min(1).max(20).optional(),
	},
	handler: async (ctx, args) => {
		const { userId } = ctx;
		const limit = args.limit ?? 5;

		const projects = await ctx.db
			.query("projects")
			.withIndex("by_creation_time")
			.filter((q) => q.eq(q.field("authorId"), userId))
			.order("desc")
			.take(limit);

		return projects.map(({ _id, title, slug, status, _creationTime }) => ({
			_id,
			title,
			slug,
			status,
			_creationTime,
		}));
	},
});

const projectStatus = z.union([
	z.literal("active"),
	z.literal("completed"),
	z.literal("archived"),
]);

const create = zAuthedMutation({
	args: {
		title: z.string(),
		slug: z.string(),
		description: z.string().optional(),
		content: z.string().optional(),
		status: projectStatus.optional(),
		imageId: zid("media").optional(),
		repositoryUrl: z.string().optional(),
		demoUrl: z.string().optional(),
		technologyIds: z.array(zid("technologies")).optional(),
	},
	handler: async (ctx, args) => {
		const { userId } = ctx;
		const { title, slug } = args;
		const content = args.content?.trim() ?? "";
		const technologyIds = args.technologyIds ?? [];

		const existing = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new ConvexError("Project with this slug already exists.");
		}

		const attachments = deriveAttachmentIds(content, [args.imageId]);
		const projectId = await ctx.db.insert("projects", {
			title,
			slug,
			description: args.description?.trim() ?? "",
			content,
			status: args.status ?? "active",
			imageId: args.imageId,
			attachments,
			repositoryUrl: args.repositoryUrl,
			demoUrl: args.demoUrl,
			technologyIds,
			authorId: userId,
		});

		await syncProjectMedia(ctx, projectId, attachments);

		return { _id: projectId, title, slug };
	},
});

const update = zAuthedMutation({
	args: {
		id: zid("projects"),
		title: z.string(),
		slug: z.string(),
		description: z.string(),
		content: z.string(),
		status: projectStatus,
		imageId: zid("media").optional(),
		repositoryUrl: z.string().optional(),
		demoUrl: z.string().optional(),
		technologyIds: z.array(zid("technologies")),
	},
	handler: async (ctx, args) => {
		const { id, title, slug, ...fields } = args;
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "projects",
		});

		const content = fields.content.trim();
		const description = fields.description.trim();

		const conflicting = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Project with this slug already exists.");
		}

		const attachments = deriveAttachmentIds(content, [fields.imageId]);

		await ctx.db.patch(id, {
			title,
			slug,
			...fields,
			content,
			description,
			attachments,
		});

		await syncProjectMedia(ctx, id, attachments);

		return { _id: id, title, slug };
	},
});

const remove = zAuthedMutation({
	args: {
		id: zid("projects"),
	},
	handler: async (ctx, args) => {
		const { id } = args;
		const { userId } = ctx;

		await assertDocumentOwner(ctx, {
			documentId: id,
			userId,
			documentType: "projects",
		});

		const projectMediaRows = await ctx.db
			.query("projectMedia")
			.withIndex("by_project", (q) => q.eq("projectId", id))
			.collect();

		for (const row of projectMediaRows) {
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
		const project = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (!project) {
			throw new Error("Project not found.");
		}

		await assertDocumentOwner(ctx, {
			documentId: project._id,
			userId,
			documentType: "projects",
		});

		const { _creationTime, authorId, attachments, ...rest } = project;

		return {
			...rest,
			imageUrl: await resolveImageUrl(ctx, project.imageId),
		};
	},
});

const getPublicBySlug = zQuery({
	args: {
		slug: z.string(),
	},
	handler: async (ctx, { slug }) => {
		const project = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (!project || project.status === "archived") {
			return null;
		}

		const [technologies, imageUrl] = await Promise.all([
			Promise.all(project.technologyIds.map((id) => ctx.db.get(id))),
			resolveImageUrl(ctx, project.imageId),
		]);

		const { _id, authorId, attachments, technologyIds, ...rest } = project;

		return {
			...rest,
			imageUrl,
			technologies: technologies
				.filter((tech): tech is NonNullable<typeof tech> => tech !== null)
				.map(({ name, color }) => ({ name, color })),
		};
	},
});

export {
	list,
	listAll,
	listRecent,
	create,
	update,
	remove,
	getEditableBySlug,
	getPublicBySlug,
};
