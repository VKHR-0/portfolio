import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	projects: defineTable({
		title: v.string(),
		slug: v.string(),
		description: v.string(),
		imageId: v.optional(v.string()),

		status: v.union(
			v.literal("active"),
			v.literal("completed"),
			v.literal("archived"),
		),

		authorId: v.string(),

		repositoryUrl: v.optional(v.string()),
		demoUrl: v.optional(v.string()),

		techStack: v.array(v.string()),
	}).index("by_slug", ["slug"]),

	posts: defineTable({
		title: v.string(),
		slug: v.string(),
		content: v.string(),
		attachments: v.array(v.id("media")),

		status: v.union(
			v.literal("draft"),
			v.literal("private"),
			v.literal("public"),
		),

		projectId: v.optional(v.id("projects")),
		categoryId: v.optional(v.id("categories")),
		seriesId: v.optional(v.id("series")),

		authorId: v.string(),

		tags: v.array(v.id("tags")),
	})
		.index("by_slug", ["slug"])
		.index("by_status", ["status"])
		.index("by_category", ["categoryId"])
		.index("by_series", ["seriesId"])
		.index("by_status_and_category", ["status", "categoryId"]),

	categories: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
	}).index("by_slug", ["slug"]),

	series: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
	}).index("by_slug", ["slug"]),

	tags: defineTable({
		name: v.string(),
		slug: v.string(),
	}).index("by_slug", ["slug"]),

	media: defineTable({
		storageId: v.id("_storage"),
		filename: v.string(),
		slug: v.string(),
		alt: v.optional(v.string()),
		mimeType: v.string(),
		size: v.number(),
		authorId: v.string(),
	})
		.index("by_slug", ["slug"])
		.index("by_storage_id", ["storageId"]),

	postMedia: defineTable({
		postId: v.id("posts"),
		mediaId: v.id("media"),
	})
		.index("by_post", ["postId"])
		.index("by_media", ["mediaId"])
		.index("by_post_and_media", ["postId", "mediaId"]),
});
