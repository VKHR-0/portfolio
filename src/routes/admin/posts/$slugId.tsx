import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	listCategoriesQuery,
	listProjectsQuery,
	listSeriesQuery,
	listTagsQuery,
} from "#/queries";
import {
	isPostMetadataValid,
	PostEditorForm,
	type PostEditorValue,
} from "./-post-editor-form";

type EditablePost = FunctionReturnType<typeof api.functions.posts.getEditableBySlug>;
type SavedDraft = FunctionReturnType<typeof api.functions.posts.updateDraft>;

type PostDraftState = PostEditorValue & {
	id: Id<"posts">;
};

function toPostDraftState(post: EditablePost | SavedDraft): PostDraftState {
	return {
		id: post._id,
		title: post.title,
		slug: post.slug,
		content: post.content,
		status: post.status,
		seriesId: post.seriesId ?? "",
		categoryId: post.categoryId ?? "",
		projectId: post.projectId ?? "",
		tagIds: post.tagIds,
	};
}

function arePostDraftStatesEqual(
	left: PostDraftState | null,
	right: PostDraftState | null,
) {
	if (!left || !right) {
		return left === right;
	}

	return (
		left.id === right.id &&
		left.title === right.title &&
		left.slug === right.slug &&
		left.content === right.content &&
		left.status === right.status &&
		left.seriesId === right.seriesId &&
		left.categoryId === right.categoryId &&
		left.projectId === right.projectId &&
		left.tagIds.length === right.tagIds.length &&
		left.tagIds.every((tagId, index) => tagId === right.tagIds[index])
	);
}

function toUpdateDraftInput(value: PostDraftState) {
	return {
		id: value.id,
		title: value.title,
		slug: value.slug,
		content: value.content,
		status: value.status,
		seriesId: value.seriesId ? (value.seriesId as Id<"series">) : undefined,
		categoryId: value.categoryId
			? (value.categoryId as Id<"categories">)
			: undefined,
		projectId: value.projectId ? (value.projectId as Id<"projects">) : undefined,
		tagIds: value.tagIds as Array<Id<"tags">>,
	};
}

function toErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unable to save post changes.";
}

export const Route = createFileRoute("/admin/posts/$slugId")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listSeriesQuery()),
			context.queryClient.ensureQueryData(listCategoriesQuery()),
			context.queryClient.ensureQueryData(listProjectsQuery()),
			context.queryClient.ensureQueryData(listTagsQuery()),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const navigate = useNavigate();
	const updateDraft = useMutation(api.functions.posts.updateDraft);
	const post = useQuery(api.functions.posts.getEditableBySlug, {
		slug: slugId,
	});
	const [draft, setDraft] = useState<PostDraftState | null>(null);
	const [lastSavedDraft, setLastSavedDraft] = useState<PostDraftState | null>(null);
	const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">(
		"saved",
	);
	const [formError, setFormError] = useState<string | null>(null);
	const latestDraftRef = useRef<PostDraftState | null>(null);
	const initializedPostIdRef = useRef<Id<"posts"> | null>(null);
	const { data: seriesResult } = useSuspenseQuery(listSeriesQuery());
	const { data: categoriesResult } = useSuspenseQuery(listCategoriesQuery());
	const { data: projectsResult } = useSuspenseQuery(listProjectsQuery());
	const { data: tagsResult } = useSuspenseQuery(listTagsQuery());

	const seriesOptions = useMemo(
		() =>
			seriesResult.page.map((series) => ({
				value: series._id,
				label: series.name,
			})),
		[seriesResult.page],
	);
	const categoryOptions = useMemo(
		() =>
			categoriesResult.page.map((category) => ({
				value: category._id,
				label: category.name,
			})),
		[categoriesResult.page],
	);
	const projectOptions = useMemo(
		() =>
			projectsResult.page.map((project) => ({
				value: project._id,
				label: project.title,
			})),
		[projectsResult.page],
	);
	const tagOptions = useMemo(
		() =>
			tagsResult.page.map((tag) => ({
				value: tag._id,
				label: tag.name,
			})),
		[tagsResult.page],
	);

	useEffect(() => {
		if (!post || initializedPostIdRef.current === post._id) {
			return;
		}

		const nextDraft = toPostDraftState(post);
		initializedPostIdRef.current = post._id;
		latestDraftRef.current = nextDraft;
		setDraft(nextDraft);
		setLastSavedDraft(nextDraft);
		setSaveState("saved");
		setFormError(null);
	}, [post]);

	useEffect(() => {
		latestDraftRef.current = draft;
	}, [draft]);

	useEffect(() => {
		if (!draft || !lastSavedDraft) {
			return;
		}

		if (arePostDraftStatesEqual(draft, lastSavedDraft)) {
			setSaveState("saved");
			return;
		}

		setSaveState("unsaved");

		if (!isPostMetadataValid(draft)) {
			return;
		}

		const snapshot = draft;
		const timer = window.setTimeout(() => {
			setSaveState("saving");

			void updateDraft(toUpdateDraftInput(snapshot))
				.then((savedDraft) => {
					const nextSavedDraft = toPostDraftState(savedDraft);
					const latestDraft = latestDraftRef.current;
					const shouldApplySavedDraft = arePostDraftStatesEqual(
						latestDraft,
						snapshot,
					);

					setLastSavedDraft(nextSavedDraft);
					setFormError(null);

					if (shouldApplySavedDraft) {
						latestDraftRef.current = nextSavedDraft;
						setDraft(nextSavedDraft);
						setSaveState("saved");
					} else {
						setSaveState("unsaved");
					}

					if (shouldApplySavedDraft && savedDraft.slug !== slugId) {
						void navigate({
							to: "/admin/posts/$slugId",
							params: {
								slugId: savedDraft.slug,
							},
							replace: true,
						});
					}
				})
				.catch((error: unknown) => {
					setSaveState("unsaved");
					setFormError(toErrorMessage(error));
					toast.error(toErrorMessage(error));
				});
		}, 800);

		return () => {
			window.clearTimeout(timer);
		};
	}, [draft, lastSavedDraft, navigate, slugId, updateDraft]);

	if (post === undefined || !draft) {
		return (
			<div className="flex min-w-0 flex-1 items-center justify-center text-muted-foreground text-sm">
				Loading post...
			</div>
		);
	}

	return (
		<PostEditorForm
			value={draft}
			onChange={(nextDraft) => {
				setDraft({
					...draft,
					...nextDraft,
				});
			}}
			isSlugManuallyEdited
			onSlugManualEditChange={() => {}}
			seriesOptions={seriesOptions}
			categoryOptions={categoryOptions}
			projectOptions={projectOptions}
			tagOptions={tagOptions}
			saveState={saveState}
			formError={formError}
		/>
	);
}
