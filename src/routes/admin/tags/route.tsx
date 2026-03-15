import { Plus, Trash } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { DataTable } from "#/components/data-table";
import { ConfirmDeleteDialog } from "#/components/dialogs/confirm-delete";
import { Page } from "#/components/page";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	type AdminTableSearch,
	createAdminTableSearchSchema,
	getCursorFromSearch,
} from "#/lib/admin-table-sorting";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { listTags } from "#/queries/admin";

const PAGE_SIZE = 10;
const TAG_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

type TagSortField = (typeof TAG_SORT_FIELDS)[number];

type TagRow = {
	_id: Id<"tags">;
	name: string;
	slug: string;
	_creationTime: number;
};

function listTagsQuery(search: AdminTableSearch<TagSortField>) {
	return listTags({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/tags")({
	validateSearch: zodValidator(createAdminTableSearchSchema(TAG_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(listTagsQuery(deps.search));
	},
	component: TagsRouteComponent,
});

export function TagsRouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const updateTag = useMutation(api.functions.tags.update);
	const deleteTag = useMutation(api.functions.tags.remove);
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
	const { data: result } = useQuery(listTagsQuery(search));
	const tags = result?.page ?? [];

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
		const result = await toAsyncResult(
			deleteTag({ id: tagToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: listTagsQuery(search).queryKey,
				});
				toast.success("Tag deleted.");
				setTagToDelete(null);
			}),
		);
		setIsDeletingTag(false);

		if (!result.ok) {
			toast.error(getErrorMessage(result.error, "Unable to delete tag."));
		}
	};

	const columns = React.useMemo<Array<ColumnDef<TagRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-8",
					cellClassName: "py-2 px-1",
				},
				cell: ({ row }) => (
					<Button
						type="button"
						size="icon-xs"
						variant="outline"
						aria-label={`Delete ${row.original.name}`}
						title="Delete"
						onClick={() => setTagToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
					</Button>
				),
			},
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
						<DataTable.EditableCell
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
						</DataTable.EditableCell>
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
						<DataTable.EditableCell
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
						</DataTable.EditableCell>
					);
				},
			},
			{
				accessorKey: "_creationTime",
				header: "Created",
				cell: ({ row }) =>
					new Date(row.original._creationTime).toLocaleString(),
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
			<DataTable.Root
				columns={columns}
				data={tags}
				loadingLabel="Loading tags..."
				emptyLabel="No tags found."
				isLoading={result === undefined}
				search={search}
				onSearchChange={(updater) => {
					void navigate({
						search: (previousSearch) => updater(previousSearch),
					});
				}}
				pagination={{
					continueCursor: result?.continueCursor ?? null,
					isDone: result?.isDone ?? true,
				}}
				getRowId={(row) => row._id}
			>
				<Page.Root>
					<Page.Header>
						<Page.Title>Tags</Page.Title>
						<Page.Description>Manage post tags.</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/tags/new" />}
							>
								<HugeiconsIcon icon={Plus} strokeWidth={2} />
								Create new
							</Button>
						</Page.Action>
					</Page.Header>
					<Page.Content>
						<DataTable.Table />
					</Page.Content>
					<Page.Footer>
						<DataTable.Pagination />
					</Page.Footer>
				</Page.Root>
			</DataTable.Root>
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
