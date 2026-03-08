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
	args: {
		paginationOpts: paginationOptsValidator,
		sortField: v.optional(v.union(v.literal("title"), v.literal("slug"))),
		sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		const direction = args.sortDirection ?? "desc";

		switch (args.sortField) {
			case "title":
				return await ctx.db
					.query("projects")
					.withIndex("by_title")
					.order(direction)
					.paginate(args.paginationOpts);
			case "slug":
				return await ctx.db
					.query("projects")
					.withIndex("by_slug")
					.order(direction)
					.paginate(args.paginationOpts);
			default:
				return await ctx.db
					.query("projects")
					.withIndex("by_creation_time")
					.order("desc")
					.paginate(args.paginationOpts);
		}
	},
});

export const listRecentProjects = query({
	args: {
		limit: v.optional(v.number()),
		authorId: v.string(),
	},
	handler: async (ctx, args) => {
		const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_creation_time")
			.filter((q) => q.eq(q.field("authorId"), args.authorId))
			.order("desc")
			.take(limit);

		return projects.map((project) => ({
			_id: project._id,
			title: project.title,
			slug: project.slug,
			status: project.status,
			_creationTime: project._creationTime,
		}));
	},
});

export const updateProjectSummary = mutation({
	args: {
		id: v.id("projects"),
		title: v.string(),
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const existingProject = await ctx.db.get(args.id);

		if (!existingProject || existingProject.authorId !== authorId) {
			throw new Error("Project not found.");
		}

		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);
		const conflictingProject = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflictingProject && conflictingProject._id !== args.id) {
			throw new Error("Project with this slug already exists.");
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

export const getEditableBySlug = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const project = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", normalizeSlug(args.slug)))
			.unique();

		if (!project || project.authorId !== authorId) {
			throw new Error("Project not found.");
		}

		return {
			_id: project._id,
			title: project.title,
			slug: project.slug,
			description: project.description,
			content: project.content,
			status: project.status,
			imageId: project.imageId,
			repositoryUrl: project.repositoryUrl,
			demoUrl: project.demoUrl,
			techStack: project.techStack,
		};
	},
});

export const createDraft = mutation({
	args: {
		title: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
		content: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("active"),
				v.literal("completed"),
				v.literal("archived"),
			),
		),
		imageId: v.optional(v.string()),
		repositoryUrl: v.optional(v.string()),
		demoUrl: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);

		const existingProject = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existingProject) {
			throw new Error("Project with this slug already exists.");
		}

		const projectId = await ctx.db.insert("projects", {
			title,
			slug,
			description: args.description?.trim() ?? "",
			content: args.content?.trim() ?? "",
			status: args.status ?? "active",
			imageId: args.imageId,
			repositoryUrl: args.repositoryUrl,
			demoUrl: args.demoUrl,
			techStack: args.techStack ?? [],
			authorId,
		});

		return { _id: projectId, title, slug };
	},
});

export const updateDraft = mutation({
	args: {
		id: v.id("projects"),
		title: v.string(),
		slug: v.string(),
		description: v.string(),
		content: v.string(),
		status: v.union(
			v.literal("active"),
			v.literal("completed"),
			v.literal("archived"),
		),
		imageId: v.optional(v.string()),
		repositoryUrl: v.optional(v.string()),
		demoUrl: v.optional(v.string()),
		techStack: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const existingProject = await ctx.db.get(args.id);

		if (!existingProject || existingProject.authorId !== authorId) {
			throw new Error("Project not found.");
		}

		const title = normalizeTitle(args.title);
		const slug = normalizeSlug(args.slug);

		const conflictingProject = await ctx.db
			.query("projects")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflictingProject && conflictingProject._id !== args.id) {
			throw new Error("Project with this slug already exists.");
		}

		await ctx.db.patch(args.id, {
			title,
			slug,
			description: args.description.trim(),
			content: args.content.trim(),
			status: args.status,
			imageId: args.imageId,
			repositoryUrl: args.repositoryUrl,
			demoUrl: args.demoUrl,
			techStack: args.techStack,
		});

		return { _id: args.id, title, slug };
	},
});

export const deleteProject = mutation({
	args: {
		id: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const authorId = await requireCurrentUserId(ctx);
		const project = await ctx.db.get(args.id);

		if (!project || project.authorId !== authorId) {
			throw new Error("Project not found.");
		}

		await ctx.db.delete(args.id);
	},
});
