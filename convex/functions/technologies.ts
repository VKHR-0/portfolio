import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import { TECHNOLOGY_COLOR_KEYS } from "../../shared/technology-colors";
import { mutation, query } from "../_generated/server";

export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		sortField: v.optional(
			v.union(v.literal("name"), v.literal("slug"), v.literal("_creationTime")),
		),
		sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		const direction = args.sortDirection ?? "desc";

		switch (args.sortField) {
			case "name":
				return await ctx.db
					.query("technologies")
					.withIndex("by_name")
					.order(direction)
					.paginate(args.paginationOpts);
			case "slug":
				return await ctx.db
					.query("technologies")
					.withIndex("by_slug")
					.order(direction)
					.paginate(args.paginationOpts);
			case "_creationTime":
				return await ctx.db
					.query("technologies")
					.withIndex("by_creation_time")
					.order(direction)
					.paginate(args.paginationOpts);
			default:
				return await ctx.db
					.query("technologies")
					.withIndex("by_creation_time")
					.order("desc")
					.paginate(args.paginationOpts);
		}
	},
});

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("technologies")
			.withIndex("by_name")
			.order("asc")
			.collect();
	},
});

export const createTechnology = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
		color: v.string(),
	},
	handler: async (ctx, args) => {
		const name = args.name.trim();
		const slug = toSlug(args.slug?.trim() || name);

		if (!name) {
			throw new Error("Name is required.");
		}

		if (!slug) {
			throw new Error("Slug is required.");
		}

		if (!TECHNOLOGY_COLOR_KEYS.includes(args.color as never)) {
			throw new Error("Invalid color.");
		}

		const existing = await ctx.db
			.query("technologies")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new Error("Technology with this slug already exists.");
		}

		return await ctx.db.insert("technologies", {
			name,
			slug,
			color: args.color,
		});
	},
});

export const updateTechnology = mutation({
	args: {
		id: v.id("technologies"),
		name: v.string(),
		slug: v.optional(v.string()),
		color: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.get(args.id);

		if (!existing) {
			throw new Error("Technology not found.");
		}

		const name = args.name.trim();
		const slug = toSlug(args.slug?.trim() || name);

		if (!name) {
			throw new Error("Name is required.");
		}

		if (!slug) {
			throw new Error("Slug is required.");
		}

		if (!TECHNOLOGY_COLOR_KEYS.includes(args.color as never)) {
			throw new Error("Invalid color.");
		}

		const conflicting = await ctx.db
			.query("technologies")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflicting && conflicting._id !== args.id) {
			throw new Error("Technology with this slug already exists.");
		}

		await ctx.db.patch(args.id, {
			name,
			slug,
			color: args.color,
		});
	},
});

export const deleteTechnology = mutation({
	args: {
		id: v.id("technologies"),
	},
	handler: async (ctx, args) => {
		const technology = await ctx.db.get(args.id);

		if (!technology) {
			throw new Error("Technology not found.");
		}

		const allProjects = await ctx.db.query("projects").collect();
		const isUsed = allProjects.some((project) =>
			project.technologyIds.includes(args.id),
		);

		if (isUsed) {
			throw new Error(
				"Cannot delete technology while it is assigned to projects.",
			);
		}

		await ctx.db.delete(args.id);
	},
});
