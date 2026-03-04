import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	listCategoriesQuery,
	listProjectsQuery,
	listSeriesQuery,
	listTagsQuery,
} from "#/queries";
import {
	createEmptyPostEditorValue,
	isPostMetadataValid,
	PostEditorForm,
	type PostEditorValue,
} from "./-post-editor-form";

function toCreateDraftInput(value: PostEditorValue) {
	return {
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
	return error instanceof Error ? error.message : "Unable to create the draft.";
}

export const Route = createFileRoute("/admin/posts/new")({
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
	const navigate = useNavigate();
	const createDraft = useMutation(api.functions.posts.createDraft);
	const [draft, setDraft] = useState(createEmptyPostEditorValue);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
	const [isCreatingDraft, setIsCreatingDraft] = useState(false);
	const [hasCreatedDraft, setHasCreatedDraft] = useState(false);
	const [saveState, setSaveState] = useState<"saving" | "unsaved" | undefined>();
	const [formError, setFormError] = useState<string | null>(null);
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
		if (hasCreatedDraft) {
			return;
		}

		if (!isPostMetadataValid(draft)) {
			setSaveState(
				draft.title || draft.slug || draft.content ? "unsaved" : undefined,
			);
			return;
		}

		if (isCreatingDraft) {
			setSaveState("saving");
			return;
		}

		setSaveState("unsaved");

		const snapshot = draft;
		const timer = window.setTimeout(() => {
			setIsCreatingDraft(true);
			setSaveState("saving");

			void createDraft(toCreateDraftInput(snapshot))
				.then((createdDraft) => {
					setHasCreatedDraft(true);
					setFormError(null);
					void navigate({
						to: "/admin/posts/$slugId",
						params: {
							slugId: createdDraft.slug,
						},
						replace: true,
					});
				})
				.catch((error: unknown) => {
					setIsCreatingDraft(false);
					setSaveState("unsaved");
					setFormError(toErrorMessage(error));
					toast.error(toErrorMessage(error));
				});
		}, 800);

		return () => {
			window.clearTimeout(timer);
		};
	}, [createDraft, draft, hasCreatedDraft, isCreatingDraft, navigate]);

	return (
		<PostEditorForm
			value={draft}
			onChange={(nextDraft) => {
				setDraft(nextDraft);
				setFormError(null);
			}}
			isSlugManuallyEdited={isSlugManuallyEdited}
			onSlugManualEditChange={setIsSlugManuallyEdited}
			seriesOptions={seriesOptions}
			categoryOptions={categoryOptions}
			projectOptions={projectOptions}
			tagOptions={tagOptions}
			saveState={saveState}
			formError={formError}
			titleAutoFocus
		/>
	);
}
