import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toSlug } from "../../shared/slug";
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
					.query("tags")
					.withIndex("by_name")
					.order(direction)
					.paginate(args.paginationOpts);
			case "slug":
				return await ctx.db
					.query("tags")
					.withIndex("by_slug")
					.order(direction)
					.paginate(args.paginationOpts);
			case "_creationTime":
				return await ctx.db
					.query("tags")
					.withIndex("by_creation_time")
					.order(direction)
					.paginate(args.paginationOpts);
			default:
				return await ctx.db
					.query("tags")
					.withIndex("by_creation_time")
					.order("desc")
					.paginate(args.paginationOpts);
		}
	},
});

export const createTag = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
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

		const existing = await ctx.db
			.query("tags")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (existing) {
			throw new Error("Tag with this slug already exists.");
		}

		return await ctx.db.insert("tags", {
			name,
			slug,
		});
	},
});

export const updateTag = mutation({
	args: {
		id: v.id("tags"),
		name: v.string(),
		slug: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingTag = await ctx.db.get(args.id);

		if (!existingTag) {
			throw new Error("Tag not found.");
		}

		const name = args.name.trim();
		const slug = toSlug(args.slug?.trim() || name);

		if (!name) {
			throw new Error("Name is required.");
		}

		if (!slug) {
			throw new Error("Slug is required.");
		}

		const conflictingTag = await ctx.db
			.query("tags")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();

		if (conflictingTag && conflictingTag._id !== args.id) {
			throw new Error("Tag with this slug already exists.");
		}

		await ctx.db.patch(args.id, {
			name,
			slug,
		});
	},
});

export const deleteTag = mutation({
	args: {
		id: v.id("tags"),
	},
	handler: async (ctx, args) => {
		const tag = await ctx.db.get(args.id);

		if (!tag) {
			throw new Error("Tag not found.");
		}

		const associatedPost =
			(await ctx.db
				.query("postTag")
				.withIndex("by_tag", (q) => q.eq("tagId", args.id))
				.first()) !== null;

		if (associatedPost) {
			throw new Error("Cannot delete tag while it is associated with posts.");
		}

		await ctx.db.delete(args.id);
	},
});
