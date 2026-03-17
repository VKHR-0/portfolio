import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { toSlug } from "../../shared/slug";
import { deriveAttachmentIds } from "../_lib/attachment";
import { resolveImageUrl } from "../_lib/media";
import { assertDocumentOwner } from "../_lib/owned";
import { sortedPaginate } from "../_lib/sorted";
import { syncProjectMedia, syncProjectTechnologies } from "../_lib/sync";
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

const listRecent = zAuthedQuery({
	args: {
		limit: z.number().min(1).max(20).optional(),
	},
	handler: async (ctx, args) => {
		const { userId } = ctx;
		const limit = args.limit ?? 5;

		const projects = await ctx.db
			.query("projects")
			.withIndex("by_author", (q) => q.eq("authorId", userId))
			.order("desc")
			.take(limit);

		return projects.map(
			({ _id, title, slug, status, isFeatured, _creationTime }) => ({
				_id,
				title,
				slug,
				status,
				isFeatured,
				_creationTime,
			}),
		);
	},
});

const listPublicRecent = zQuery({
	args: {
		limit: z.number().min(1).max(20).optional(),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 4;

		const projects = await ctx.db
			.query("projects")
			.filter((q) => q.neq(q.field("status"), "archived"))
			.order("desc")
			.take(limit);

		return await Promise.all(
			projects.map(async (project) => {
				const techRows = await ctx.db
					.query("projectTechnology")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.collect();

				const [technologies, imageUrl] = await Promise.all([
					Promise.all(techRows.map((row) => ctx.db.get(row.technologyId))),
					resolveImageUrl(ctx, project.imageId),
				]);

				return {
					_id: project._id,
					title: project.title,
					slug: project.slug,
					description: project.description,
					imageUrl,
					technologies: technologies
						.filter((tech): tech is NonNullable<typeof tech> => tech !== null)
						.map(({ name, color }) => ({ name, color })),
					repositoryUrl: project.repositoryUrl,
					demoUrl: project.demoUrl,
				};
			}),
		);
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
		const { title } = args;
		const slug = toSlug(args.slug);
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
			isFeatured: false,
			imageId: args.imageId,
			attachments,
			repositoryUrl: args.repositoryUrl,
			demoUrl: args.demoUrl,
			authorId: userId,
		});

		await Promise.all([
			syncProjectMedia(ctx, projectId, attachments),
			syncProjectTechnologies(ctx, projectId, technologyIds),
		]);

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
		isFeatured: z.boolean(),
		imageId: zid("media").optional(),
		repositoryUrl: z.string().optional(),
		demoUrl: z.string().optional(),
		technologyIds: z.array(zid("technologies")),
	},
	handler: async (ctx, args) => {
		const { id, title, slug: rawSlug, technologyIds, ...fields } = args;
		const slug = toSlug(rawSlug);
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

		await Promise.all([
			syncProjectMedia(ctx, id, attachments),
			syncProjectTechnologies(ctx, id, technologyIds),
		]);

		return { _id: id, title, slug };
	},
});

const updateSummary = zAuthedMutation({
	args: {
		id: zid("projects"),
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
			documentType: "projects",
		});

		const conflicting = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== id) {
			throw new ConvexError("Project with this slug already exists.");
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

		const [projectMediaRows, projectTechRows] = await Promise.all([
			ctx.db
				.query("projectMedia")
				.withIndex("by_project", (q) => q.eq("projectId", id))
				.collect(),
			ctx.db
				.query("projectTechnology")
				.withIndex("by_project", (q) => q.eq("projectId", id))
				.collect(),
		]);

		for (const row of projectMediaRows) {
			await ctx.db.delete(row._id);
		}

		for (const row of projectTechRows) {
			await ctx.db.delete(row._id);
		}

		await ctx.db.delete(id);
	},
});

const toggleFeatured = zAuthedMutation({
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

		const project = await ctx.db.get(id);
		if (!project) {
			throw new Error("Project not found.");
		}

		await ctx.db.patch(id, {
			isFeatured: !project.isFeatured,
		});

		return { _id: id, isFeatured: !project.isFeatured };
	},
});

const listPublicFeatured = zQuery({
	args: {
		limit: z.number().min(1).max(20).optional(),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 4;

		const projects = await ctx.db
			.query("projects")
			.filter((q) => q.neq(q.field("status"), "archived"))
			.filter((q) => q.eq(q.field("isFeatured"), true))
			.order("desc")
			.take(limit);

		return await Promise.all(
			projects.map(async (project) => {
				const techRows = await ctx.db
					.query("projectTechnology")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.collect();

				const [technologies, imageUrl] = await Promise.all([
					Promise.all(techRows.map((row) => ctx.db.get(row.technologyId))),
					resolveImageUrl(ctx, project.imageId),
				]);

				return {
					_id: project._id,
					title: project.title,
					slug: project.slug,
					description: project.description,
					imageUrl,
					technologies: technologies
						.filter((tech): tech is NonNullable<typeof tech> => tech !== null)
						.map(({ name, color }) => ({ name, color })),
					repositoryUrl: project.repositoryUrl,
					demoUrl: project.demoUrl,
				};
			}),
		);
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

		const techRows = await ctx.db
			.query("projectTechnology")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();

		const { _creationTime, authorId, attachments, ...rest } = project;

		return {
			...rest,
			technologyIds: techRows.map((row) => row.technologyId),
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

		const techRows = await ctx.db
			.query("projectTechnology")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();

		const [technologies, imageUrl] = await Promise.all([
			Promise.all(techRows.map((row) => ctx.db.get(row.technologyId))),
			resolveImageUrl(ctx, project.imageId),
		]);

		const { _id, authorId, attachments, ...rest } = project;

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
	create,
	getEditableBySlug,
	getPublicBySlug,
	list,
	listPublicFeatured,
	listPublicRecent,
	listRecent,
	remove,
	toggleFeatured,
	update,
	updateSummary,
};
