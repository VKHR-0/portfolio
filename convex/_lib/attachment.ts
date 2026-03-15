import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type JsonNode = {
	type?: string;
	attrs?: { mediaId?: unknown } & Record<string, unknown>;
	content?: JsonNode[];
};

type UsageItem<T extends "posts" | "projects"> = {
	_id: Id<T>;
	title: string;
	slug: string;
};

function extractImageIdsFromContent(content: string): Array<Id<"media">> {
	let doc: JsonNode;

	try {
		doc = JSON.parse(content);
	} catch {
		return [];
	}

	const ids = new Set<Id<"media">>();

	function walk(node: JsonNode) {
		if (node.type === "image" && typeof node.attrs?.mediaId === "string") {
			ids.add(node.attrs.mediaId as Id<"media">);
		}

		if (node.content) {
			for (const child of node.content) {
				walk(child);
			}
		}
	}

	walk(doc);
	return [...ids];
}

export function deriveAttachmentIds(
	content: string,
	extraMediaIds: Array<Id<"media"> | undefined> = [],
): Array<Id<"media">> {
	const ids = new Set(extractImageIdsFromContent(content));

	for (const id of extraMediaIds) {
		if (id) {
			ids.add(id);
		}
	}

	return [...ids];
}

export async function getMediaUsage(
	ctx: QueryCtx | MutationCtx,
	mediaId: Id<"media">,
): Promise<{
	posts: UsageItem<"posts">[];
	projects: UsageItem<"projects">[];
}> {
	const [postRelations, projectRelations] = await Promise.all([
		ctx.db
			.query("postMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.collect(),
		ctx.db
			.query("projectMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.collect(),
	]);

	const [posts, projects] = await Promise.all([
		Promise.all(postRelations.map((r) => ctx.db.get(r.postId))),
		Promise.all(projectRelations.map((r) => ctx.db.get(r.projectId))),
	]);

	return {
		posts: posts.flatMap((p) =>
			p ? [{ _id: p._id, title: p.title, slug: p.slug }] : [],
		),
		projects: projects.flatMap((p) =>
			p ? [{ _id: p._id, title: p.title, slug: p.slug }] : [],
		),
	};
}

export async function hasMediaUsage(
	ctx: QueryCtx | MutationCtx,
	mediaId: Id<"media">,
): Promise<boolean> {
	const [postRow, projectRow] = await Promise.all([
		ctx.db
			.query("postMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.first(),
		ctx.db
			.query("projectMedia")
			.withIndex("by_media", (q) => q.eq("mediaId", mediaId))
			.first(),
	]);

	return postRow !== null || projectRow !== null;
}
