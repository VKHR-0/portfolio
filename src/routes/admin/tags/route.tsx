import { convexQuery } from "@convex-dev/react-query";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import {
	EditableCell,
	TaxonomyPageCard,
} from "#/components/taxonomy-page-card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { TableCell, TableHead, TableRow } from "#/components/ui/table";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";

const PAGE_SIZE = 10;

function listTagsQuery(cursor: string | null) {
	return convexQuery(api.functions.tags.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
	});
}

export const Route = createFileRoute("/admin/tags")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listTagsQuery(null));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const updateTag = useMutation(api.functions.tags.updateTag);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const slugInputRef = useRef<HTMLInputElement>(null);

	const {
		form,
		editingId: editingTagId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<Id<"tags">, { name: string; slug: string }>({
		emptyValues: { name: "", slug: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.name.trim() === initialValue.name &&
			toSlug(value.slug) === initialValue.slug,
		onSubmit: async ({ id, value }) => {
			const name = value.name.trim();
			const slug = toSlug(value.slug);

			if (!name) {
				toast.error("Name is required.");
				setFocusField("name");
				nameInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setFocusField("slug");
				slugInputRef.current?.focus();
				return false;
			}

			await updateTag({ id, name, slug });
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update tag.",
			);
		},
	});

	const { data: result } = useQuery(listTagsQuery(currentCursor));
	const tags = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	useEffect(() => {
		if (!editingTagId) return;

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingTagId, focusField]);

	return (
		<>
			<TaxonomyPageCard
				title="Tags"
				description="Manage post tags."
				createButton={
					<Button nativeButton={false} render={<Link to="/admin/tags/new" />}>
						<IconPlus />
						Create new
					</Button>
				}
				loadingLabel="Loading tags..."
				emptyLabel="No tags found."
				columnCount={3}
				isLoading={result === undefined}
				isEmpty={tags.length === 0}
				columnHeaders={
					<>
						<TableHead className="w-[35%]">Name</TableHead>
						<TableHead className="w-[35%]">Slug</TableHead>
						<TableHead>Created</TableHead>
					</>
				}
				currentPage={currentPage}
				pageCount={pageCount}
				canGoPrevious={canGoPrevious}
				canGoNext={canGoNext}
				onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
				onSelectPage={(page) => setCurrentPage(page)}
				onNext={() => {
					if (currentPage < pageCount) {
						setCurrentPage((prev) => prev + 1);
						return;
					}

					if (!result?.continueCursor) return;

					setCursors((prev) => [...prev, result.continueCursor]);
					setCurrentPage((prev) => prev + 1);
				}}
			>
				{tags.map((tag) => (
					<TableRow key={tag._id}>
						<EditableCell
							isEditing={editingTagId === tag._id}
							displayValue={tag.name}
							onDoubleClick={() =>
								startEditing(
									tag._id,
									{ name: tag.name, slug: tag.slug },
									"name",
								)
							}
							className="font-medium"
						>
							<form.Field name="name">
								{(field) => (
									<Input
										ref={nameInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => {
											const nextName = event.target.value;
											field.handleChange(nextName);
											form.setFieldValue("slug", toSlug(nextName));
										}}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</EditableCell>

						<EditableCell
							isEditing={editingTagId === tag._id}
							displayValue={tag.slug}
							onDoubleClick={() =>
								startEditing(
									tag._id,
									{ name: tag.name, slug: tag.slug },
									"slug",
								)
							}
						>
							<form.Field name="slug">
								{(field) => (
									<Input
										ref={slugInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</EditableCell>

						<TableCell>
							{new Date(tag._creationTime).toLocaleString()}
						</TableCell>
					</TableRow>
				))}
			</TaxonomyPageCard>
			<Outlet />
		</>
	);
}
