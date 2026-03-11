import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
	collectTrackedMediaIds,
	deriveAttachmentIds,
	extractTrackedImageIdsFromJson,
	getUsedInPosts,
	getUsedInProjects,
	hasMediaUsage,
	syncPostMediaRelations,
	syncProjectMediaRelations,
} from "./mediaAttachments";

type PostMediaRow = {
	_id: Id<"postMedia">;
	postId: Id<"posts">;
	mediaId: Id<"media">;
};

type ProjectMediaRow = {
	_id: Id<"projectMedia">;
	projectId: Id<"projects">;
	mediaId: Id<"media">;
};

type PostRecord = {
	_id: Id<"posts">;
	title: string;
	slug: string;
};

type ProjectRecord = {
	_id: Id<"projects">;
	title: string;
	slug: string;
};

function asId<
	TTable extends "media" | "posts" | "projects" | "postMedia" | "projectMedia",
>(value: string): Id<TTable> {
	return value as Id<TTable>;
}

function createSyncCtx({
	postRows = [],
	projectRows = [],
}: {
	postRows?: PostMediaRow[];
	projectRows?: ProjectMediaRow[];
}) {
	const deletedIds: string[] = [];
	const insertedPostRows: Array<{ postId: Id<"posts">; mediaId: Id<"media"> }> =
		[];
	const insertedProjectRows: Array<{
		projectId: Id<"projects">;
		mediaId: Id<"media">;
	}> = [];

	const ctx = {
		db: {
			query(table: string) {
				if (table === "postMedia") {
					return {
						withIndex(
							index: string,
							callback: (query: {
								eq: (_field: string, value: Id<"posts">) => Id<"posts">;
							}) => Id<"posts">,
						) {
							if (index !== "by_post") {
								throw new Error(`Unexpected index: ${index}`);
							}

							const postId = callback({
								eq: (_field, value) => value,
							});

							return {
								collect: async () =>
									postRows.filter((row) => row.postId === postId),
							};
						},
					};
				}

				if (table === "projectMedia") {
					return {
						withIndex(
							index: string,
							callback: (query: {
								eq: (_field: string, value: Id<"projects">) => Id<"projects">;
							}) => Id<"projects">,
						) {
							if (index !== "by_project") {
								throw new Error(`Unexpected index: ${index}`);
							}

							const projectId = callback({
								eq: (_field, value) => value,
							});

							return {
								collect: async () =>
									projectRows.filter((row) => row.projectId === projectId),
							};
						},
					};
				}

				throw new Error(`Unexpected table: ${table}`);
			},
			delete: async (id: string) => {
				deletedIds.push(id);
			},
			insert: async (
				table: string,
				value:
					| { postId: Id<"posts">; mediaId: Id<"media"> }
					| { projectId: Id<"projects">; mediaId: Id<"media"> },
			) => {
				if (table === "postMedia" && "postId" in value) {
					insertedPostRows.push(value);
					return asId<"postMedia">(`inserted-post-${insertedPostRows.length}`);
				}

				if (table === "projectMedia" && "projectId" in value) {
					insertedProjectRows.push(value);
					return asId<"projectMedia">(
						`inserted-project-${insertedProjectRows.length}`,
					);
				}

				throw new Error(`Unexpected insert table: ${table}`);
			},
		},
	} as unknown as Parameters<typeof syncPostMediaRelations>[0];

	return {
		ctx,
		deletedIds,
		insertedPostRows,
		insertedProjectRows,
	};
}

function createUsageCtx({
	postRows = [],
	projectRows = [],
	posts = [],
	projects = [],
}: {
	postRows?: PostMediaRow[];
	projectRows?: ProjectMediaRow[];
	posts?: PostRecord[];
	projects?: ProjectRecord[];
}) {
	const postMap = new Map(posts.map((post) => [post._id, post]));
	const projectMap = new Map(projects.map((project) => [project._id, project]));

	return {
		db: {
			query(table: string) {
				if (table === "postMedia") {
					return {
						withIndex(
							index: string,
							callback: (query: {
								eq: (_field: string, value: Id<"media">) => Id<"media">;
							}) => Id<"media">,
						) {
							if (index !== "by_media") {
								throw new Error(`Unexpected index: ${index}`);
							}

							const mediaId = callback({
								eq: (_field, value) => value,
							});
							const matchingRows = postRows.filter(
								(row) => row.mediaId === mediaId,
							);

							return {
								collect: async () => matchingRows,
								first: async () => matchingRows[0] ?? null,
							};
						},
					};
				}

				if (table === "projectMedia") {
					return {
						withIndex(
							index: string,
							callback: (query: {
								eq: (_field: string, value: Id<"media">) => Id<"media">;
							}) => Id<"media">,
						) {
							if (index !== "by_media") {
								throw new Error(`Unexpected index: ${index}`);
							}

							const mediaId = callback({
								eq: (_field, value) => value,
							});
							const matchingRows = projectRows.filter(
								(row) => row.mediaId === mediaId,
							);

							return {
								collect: async () => matchingRows,
								first: async () => matchingRows[0] ?? null,
							};
						},
					};
				}

				throw new Error(`Unexpected table: ${table}`);
			},
			get: async (id: Id<"posts"> | Id<"projects">) =>
				postMap.get(id as Id<"posts">) ??
				projectMap.get(id as Id<"projects">) ??
				null,
		},
	} as unknown as Parameters<typeof getUsedInPosts>[0];
}

describe("media attachment helpers", () => {
	it("extracts tracked media ids from Tiptap JSON image nodes", () => {
		const mediaA = asId<"media">("media-a");
		const mediaB = asId<"media">("media-b");
		const content = JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "image",
							attrs: { src: "https://cdn.example.com/a.png", mediaId: mediaA },
						},
						{
							type: "image",
							attrs: { src: "https://cdn.example.com/b.png", mediaId: mediaB },
						},
						{
							type: "image",
							attrs: { src: "https://cdn.example.com/external.png" },
						},
					],
				},
			],
		});

		expect(extractTrackedImageIdsFromJson(content)).toEqual([mediaA, mediaB]);
	});

	it("collects tracked ids from content and project hero image", () => {
		const mediaA = asId<"media">("media-a");
		const mediaB = asId<"media">("media-b");
		const content = JSON.stringify({
			type: "doc",
			content: [
				{
					type: "image",
					attrs: { src: "https://cdn.example.com/a.png", mediaId: mediaA },
				},
			],
		});

		expect(collectTrackedMediaIds(content, [mediaB, mediaA])).toEqual([
			mediaA,
			mediaB,
		]);
	});

	it("derives attachment ids as a pure ID-based operation", () => {
		const mediaA = asId<"media">("media-a");
		const mediaB = asId<"media">("media-b");
		const content = JSON.stringify({
			type: "doc",
			content: [
				{
					type: "image",
					attrs: { src: "https://cdn.example.com/a.png", mediaId: mediaA },
				},
				{
					type: "image",
					attrs: {
						src: "https://cdn.example.com/a-duplicate.png",
						mediaId: mediaA,
					},
				},
			],
		});

		expect(
			deriveAttachmentIds({
				content,
				extraMediaIds: [mediaB],
			}),
		).toEqual([mediaA, mediaB]);
	});

	it("syncs post media relations by deleting stale rows and inserting new ones", async () => {
		const postId = asId<"posts">("post-1");
		const mediaA = asId<"media">("media-a");
		const mediaB = asId<"media">("media-b");
		const mediaC = asId<"media">("media-c");
		const { ctx, deletedIds, insertedPostRows } = createSyncCtx({
			postRows: [
				{ _id: asId<"postMedia">("row-1"), postId, mediaId: mediaA },
				{ _id: asId<"postMedia">("row-2"), postId, mediaId: mediaA },
				{ _id: asId<"postMedia">("row-3"), postId, mediaId: mediaB },
			],
		});

		await syncPostMediaRelations(ctx, postId, [mediaA, mediaC]);

		expect(deletedIds).toEqual(["row-2", "row-3"]);
		expect(insertedPostRows).toEqual([{ postId, mediaId: mediaC }]);
	});

	it("syncs project media relations for body images and hero images", async () => {
		const projectId = asId<"projects">("project-1");
		const mediaA = asId<"media">("media-a");
		const mediaB = asId<"media">("media-b");
		const { ctx, deletedIds, insertedProjectRows } = createSyncCtx({
			projectRows: [
				{ _id: asId<"projectMedia">("row-1"), projectId, mediaId: mediaA },
			],
		});

		await syncProjectMediaRelations(ctx, projectId, [mediaA, mediaB]);

		expect(deletedIds).toEqual([]);
		expect(insertedProjectRows).toEqual([{ projectId, mediaId: mediaB }]);
	});

	it("returns reverse usage for posts and projects", async () => {
		const mediaId = asId<"media">("media-a");
		const postId = asId<"posts">("post-1");
		const projectId = asId<"projects">("project-1");
		const ctx = createUsageCtx({
			postRows: [{ _id: asId<"postMedia">("pm-1"), postId, mediaId }],
			projectRows: [{ _id: asId<"projectMedia">("prm-1"), projectId, mediaId }],
			posts: [{ _id: postId, title: "Post", slug: "post" }],
			projects: [{ _id: projectId, title: "Project", slug: "project" }],
		});

		await expect(getUsedInPosts(ctx, mediaId)).resolves.toEqual([
			{ _id: postId, title: "Post", slug: "post" },
		]);
		await expect(getUsedInProjects(ctx, mediaId)).resolves.toEqual([
			{ _id: projectId, title: "Project", slug: "project" },
		]);
	});

	it("detects when media is still in use or safe to delete", async () => {
		const mediaId = asId<"media">("media-a");
		const heroOnlyCtx = createUsageCtx({
			projectRows: [
				{
					_id: asId<"projectMedia">("prm-hero"),
					projectId: asId<"projects">("project-hero"),
					mediaId,
				},
			],
		});
		const unusedCtx = createUsageCtx({});

		await expect(hasMediaUsage(heroOnlyCtx, mediaId)).resolves.toBe(true);
		await expect(hasMediaUsage(unusedCtx, mediaId)).resolves.toBe(false);
	});
});
