import { convexQuery } from "@convex-dev/react-query";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "#/components/confirm-delete-dialog";
import { EditableCell, PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	createAdminTableSearchSchema,
	searchFromSortingState,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";

const PAGE_SIZE = 10;
const TAG_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

type TagSortField = (typeof TAG_SORT_FIELDS)[number];

type TagRow = {
	_id: Id<"tags">;
	name: string;
	slug: string;
	_creationTime: number;
};

function listTagsQuery(
	cursor: string | null,
	search: { sortField?: TagSortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.tags.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/tags")({
	validateSearch: zodValidator(createAdminTableSearchSchema(TAG_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(listTagsQuery(null, deps.search));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const [cursors, setCursors] = React.useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const sortKey = `${search.sortField ?? ""}:${search.sortDirection ?? ""}`;
	const previousSortKeyRef = React.useRef(sortKey);
	const sorting = React.useMemo(
		() => sortingStateFromSearch<TagSortField>(search),
		[search],
	);
	const updateTag = useMutation(api.functions.tags.updateTag);
	const deleteTag = useMutation(api.functions.tags.deleteTag);
	const queryClient = useQueryClient();
	const nameInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const [tagToDelete, setTagToDelete] = React.useState<TagRow | null>(null);
	const [isDeletingTag, setIsDeletingTag] = React.useState(false);

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

	React.useEffect(() => {
		if (previousSortKeyRef.current === sortKey) {
			return;
		}

		previousSortKeyRef.current = sortKey;
		setCursors([null]);
		setCurrentPage(1);
	}, [sortKey]);

	const { data: result } = useQuery(listTagsQuery(currentCursor, search));
	const tags = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	React.useEffect(() => {
		if (!editingTagId) return;

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingTagId, focusField]);

	const handleDeleteTag = async () => {
		if (!tagToDelete) {
			return;
		}

		setIsDeletingTag(true);

		try {
			await deleteTag({ id: tagToDelete._id });
			await queryClient.invalidateQueries({
				queryKey: listTagsQuery(currentCursor, search).queryKey,
			});
			toast.success("Tag deleted.");
			setTagToDelete(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to delete tag.",
			);
		} finally {
			setIsDeletingTag(false);
		}
	};

	const columns = React.useMemo<Array<ColumnDef<TagRow>>>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[35%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => {
					const tag = row.original;

					return (
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
					);
				},
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[35%]",
				},
				cell: ({ row }) => {
					const tag = row.original;

					return (
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
					);
				},
			},
			{
				accessorKey: "_creationTime",
				header: "Created",
				cell: ({ row }) =>
					new Date(row.original._creationTime).toLocaleString(),
			},
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					cellClassName: "w-[1%]",
				},
				cell: ({ row }) => (
					<Button
						type="button"
						size="icon-xs"
						variant="ghost"
						aria-label={`Delete ${row.original.name}`}
						title="Delete"
						onClick={() => setTagToDelete(row.original)}
					>
						<IconTrash />
					</Button>
				),
			},
		],
		[
			editingTagId,
			form,
			handleInputBlur,
			handleInputKeyDown,
			isSavingEdit,
			startEditing,
		],
	);

	return (
		<>
			<PageCard
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
				columns={columns}
				data={tags}
				sorting={sorting}
				onSortingChange={(nextSorting: SortingState) => {
					const nextSearch = searchFromSortingState<TagSortField>(nextSorting);

					void navigate({
						search: (prev) => ({
							...prev,
							sortField: nextSearch.sortField,
							sortDirection: nextSearch.sortDirection,
						}),
					});
				}}
				isLoading={result === undefined}
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
				getRowId={(row) => row._id}
			/>
			<ConfirmDeleteDialog
				open={tagToDelete !== null}
				title={
					tagToDelete ? `Delete tag "${tagToDelete.name}"?` : "Delete tag?"
				}
				description="This action cannot be undone."
				isPending={isDeletingTag}
				onOpenChange={(open) => !open && setTagToDelete(null)}
				onConfirm={() => void handleDeleteTag()}
			/>
			<Outlet />
		</>
	);
}
