import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
import { mutation, query } from "../_generated/server";

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("series")
			.withIndex("by_creation_time")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const createSeries = mutation({
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
			.query("series")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new Error("Series with this slug already exists.");
		}

		return await ctx.db.insert("series", {
			name,
			slug,
			description,
		});
	},
});

export const deleteSeries = mutation({
	args: {
		id: v.id("series"),
	},
	handler: async (ctx, args) => {
		const series = await ctx.db.get(args.id);

		if (!series) {
			throw new Error("Series not found.");
		}

		const associatedPost = await ctx.db
			.query("posts")
			.withIndex("by_series", (q) => q.eq("seriesId", args.id))
			.first();

		if (associatedPost) {
			throw new Error(
				"Cannot delete series while it is associated with posts.",
			);
		}

		await ctx.db.delete(args.id);
	},
});
