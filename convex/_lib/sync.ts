import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function syncPostMedia(
	ctx: MutationCtx,
	postId: Id<"posts">,
	mediaIds: Array<Id<"media">>,
) {
	const existing = await ctx.db
		.query("postMedia")
		.withIndex("by_post", (q) => q.eq("postId", postId))
		.collect();

	const desired = new Set(mediaIds);
	const seen = new Set<Id<"media">>();

	for (const row of existing) {
		if (!desired.has(row.mediaId) || seen.has(row.mediaId)) {
			await ctx.db.delete(row._id);
		} else {
			seen.add(row.mediaId);
		}
	}

	for (const mediaId of mediaIds) {
		if (!seen.has(mediaId)) {
			await ctx.db.insert("postMedia", { postId, mediaId });
		}
	}
}

export async function syncProjectMedia(
	ctx: MutationCtx,
	projectId: Id<"projects">,
	mediaIds: Array<Id<"media">>,
) {
	const existing = await ctx.db
		.query("projectMedia")
		.withIndex("by_project", (q) => q.eq("projectId", projectId))
		.collect();

	const desired = new Set(mediaIds);
	const seen = new Set<Id<"media">>();

	for (const row of existing) {
		if (!desired.has(row.mediaId) || seen.has(row.mediaId)) {
			await ctx.db.delete(row._id);
		} else {
			seen.add(row.mediaId);
		}
	}

	for (const mediaId of mediaIds) {
		if (!seen.has(mediaId)) {
			await ctx.db.insert("projectMedia", { projectId, mediaId });
		}
	}
}

export async function syncProjectTechnologies(
	ctx: MutationCtx,
	projectId: Id<"projects">,
	technologyIds: Array<Id<"technologies">>,
) {
	const existing = await ctx.db
		.query("projectTechnology")
		.withIndex("by_project", (q) => q.eq("projectId", projectId))
		.collect();

	const desired = new Set(technologyIds);
	const seen = new Set<Id<"technologies">>();

	for (const row of existing) {
		if (!desired.has(row.technologyId) || seen.has(row.technologyId)) {
			await ctx.db.delete(row._id);
		} else {
			seen.add(row.technologyId);
		}
	}

	for (const technologyId of technologyIds) {
		if (!seen.has(technologyId)) {
			await ctx.db.insert("projectTechnology", { projectId, technologyId });
		}
	}
}

export async function syncPostTags(
	ctx: MutationCtx,
	postId: Id<"posts">,
	tagIds: Array<Id<"tags">>,
) {
	const existing = await ctx.db
		.query("postTag")
		.withIndex("by_post", (q) => q.eq("postId", postId))
		.collect();

	const desired = new Set(tagIds);
	const seen = new Set<Id<"tags">>();

	for (const row of existing) {
		if (!desired.has(row.tagId) || seen.has(row.tagId)) {
			await ctx.db.delete(row._id);
		} else {
			seen.add(row.tagId);
		}
	}

	for (const tagId of tagIds) {
		if (!seen.has(tagId)) {
			await ctx.db.insert("postTag", { postId, tagId });
		}
	}
}
