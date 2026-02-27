import { v } from "convex/values";
import { mutation } from "../_generated/server";

function normalizeSlug(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

export const createSeries = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const name = args.name.trim();
		const slug = normalizeSlug(args.slug?.trim() || name);
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
