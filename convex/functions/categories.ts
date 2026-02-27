import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import { mutation, query } from "../_generated/server";

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("categories")
			.withIndex("by_creation_time")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const createCategory = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const name = args.name.trim();
		const slug = toSlug(args.slug?.trim() || name);
		const description = args.description?.trim() || undefined;

		if (!name) {
			throw new Error("Name is required.");
		}

		if (!slug) {
			throw new Error("Slug is required.");
		}

		const existing = await ctx.db
			.query("categories")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new Error("Category with this slug already exists.");
		}

		return await ctx.db.insert("categories", {
			name,
			slug,
			description,
		});
	},
});
