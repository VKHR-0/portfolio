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
