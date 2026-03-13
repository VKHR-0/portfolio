import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type JsonNode = {
	type?: string;
	attrs?: {
		mediaId?: unknown;
		src?: unknown;
	} & Record<string, unknown>;
	content?: JsonNode[];
};

type PostUsageItem = {
	_id: Id<"posts">;
	title: string;
	slug: string;
};

type ProjectUsageItem = {
	_id: Id<"projects">;
	title: string;
	slug: string;
};

type QueryOrMutationCtx = QueryCtx | MutationCtx;

export function extractTrackedImageIdsFromJson(
	content: string,
): Array<Id<"media">> {
	const mediaIds = new Set<Id<"media">>();
	let doc: JsonNode;

	try {
		doc = JSON.parse(content);
	} catch {
		return [];
	}

	function walk(node: JsonNode) {
		if (node.type === "image" && typeof node.attrs?.mediaId === "string") {
			mediaIds.add(node.attrs.mediaId as Id<"media">);
		}

		if (!Array.isArray(node.content)) {
			return;
		}

		for (const child of node.content) {
			walk(child);
		}
	}

	walk(doc);
	return [...mediaIds];
}

export function collectTrackedMediaIds(
	content: string,
	extraMediaIds: Array<Id<"media">> = [],
): Array<Id<"media">> {
	const mediaIds = new Set<Id<"media">>(
		extractTrackedImageIdsFromJson(content),
	);

	for (const mediaId of extraMediaIds) {
		if (!mediaId) {
			continue;
		}

		mediaIds.add(mediaId);
	}

	return [...mediaIds];
}

export function deriveAttachmentIds({
	content,
	extraMediaIds = [],
}: {
	content: string;
	extraMediaIds?: Array<Id<"media">>;
}): Array<Id<"media">> {
	return collectTrackedMediaIds(content, extraMediaIds);
}

async function syncMediaRelations(
	ctx: MutationCtx,
	{
		table,
		ownerField,
		ownerId,
		mediaIds,
	}: {
		table: "postMedia" | "projectMedia";
		ownerField: "postId" | "projectId";
		ownerId: Id<"posts"> | Id<"projects">;
		mediaIds: Array<Id<"media">>;
	},
) {
	const existingRows =
		table === "postMedia"
			? await ctx.db
					.query("postMedia")
					.withIndex("by_post", (q) => q.eq("postId", ownerId as Id<"posts">))
					.collect()
			: await ctx.db
					.query("projectMedia")
					.withIndex("by_project", (q) =>
						q.eq("projectId", ownerId as Id<"projects">),
					)
					.collect();

	const desiredMediaIds = new Set(mediaIds);
	const seenMediaIds = new Set<Id<"media">>();

	for (const row of existingRows) {
		if (!desiredMediaIds.has(row.mediaId) || seenMediaIds.has(row.mediaId)) {
			await ctx.db.delete(row._id);
			continue;
		}

		seenMediaIds.add(row.mediaId);
	}

	for (const mediaId of mediaIds) {
		if (seenMediaIds.has(mediaId)) {
			continue;
		}

		if (table === "postMedia") {
			await ctx.db.insert("postMedia", {
				[ownerField]: ownerId,
				mediaId,
			} as { postId: Id<"posts">; mediaId: Id<"media"> });
			continue;
		}

		await ctx.db.insert("projectMedia", {
			[ownerField]: ownerId,
			mediaId,
		} as { projectId: Id<"projects">; mediaId: Id<"media"> });
	}
}

export async function syncPostMediaRelations(
	ctx: MutationCtx,
	postId: Id<"posts">,
	mediaIds: Array<Id<"media">>,
) {
	await syncMediaRelations(ctx, {
		table: "postMedia",
		ownerField: "postId",
		ownerId: postId,
		mediaIds,
	});
}

export async function syncProjectMediaRelations(
	ctx: MutationCtx,
	projectId: Id<"projects">,
	mediaIds: Array<Id<"media">>,
) {
	await syncMediaRelations(ctx, {
		table: "projectMedia",
		ownerField: "projectId",
		ownerId: projectId,
		mediaIds,
	});
}

export async function getUsedInPosts(
	ctx: QueryOrMutationCtx,
	mediaId: Id<"media">,
): Promise<PostUsageItem[]> {
	const postRelations = await ctx.db
		.query("postMedia")
		.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
		.collect();
	const relatedPosts = await Promise.all(
		postRelations.map((relation) => ctx.db.get(relation.postId)),
	);

	return relatedPosts.flatMap((post) =>
		post
			? [
					{
						_id: post._id,
						title: post.title,
						slug: post.slug,
					},
				]
			: [],
	);
}

export async function getUsedInProjects(
	ctx: QueryOrMutationCtx,
	mediaId: Id<"media">,
): Promise<ProjectUsageItem[]> {
	const projectRelations = await ctx.db
		.query("projectMedia")
		.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
		.collect();
	const relatedProjects = await Promise.all(
		projectRelations.map((relation) => ctx.db.get(relation.projectId)),
	);

	return relatedProjects.flatMap((project) =>
		project
			? [
					{
						_id: project._id,
						title: project.title,
						slug: project.slug,
					},
				]
			: [],
	);
}

export async function hasMediaUsage(
	ctx: QueryOrMutationCtx,
	mediaId: Id<"media">,
): Promise<boolean> {
	const [usedInPost, usedInProject] = await Promise.all([
		ctx.db
			.query("postMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.first(),
		ctx.db
			.query("projectMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.first(),
	]);

	return usedInPost !== null || usedInProject !== null;
}
