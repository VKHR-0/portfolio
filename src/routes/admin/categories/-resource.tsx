import { Plus, Trash } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import {
	DataTable,
	EditingProvider,
	InlineInputCell,
} from "#/components/data-table";
import { ConfirmDeleteDialog } from "#/components/dialogs/confirm-delete";
import { Page } from "#/components/page";
import { Button } from "#/components/ui/button";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { getCursor, type TableSearchParams } from "#/lib/table-search-params";
import { listCategories } from "#/queries/admin";

const PAGE_SIZE = 10;

export const CATEGORY_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

export type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

type CategoryRow = {
	_id: Id<"categories">;
	name: string;
	slug: string;
	description?: string;
	_creationTime: number;
};

type CategoriesAdminResourceProps = {
	search: TableSearchParams<CategorySortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<CategorySortField>,
		) => TableSearchParams<CategorySortField>,
	) => void;
	extraOverlays?: React.ReactNode;
};

export function getCategoriesAdminQuery(
	search: TableSearchParams<CategorySortField>,
) {
	return listCategories({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function CategoriesAdminResource({
	search,
	onSearchChange,
	extraOverlays,
}: CategoriesAdminResourceProps) {
	const updateCategory = useMutation(api.functions.categories.update);
	const deleteCategory = useMutation(api.functions.categories.remove);
	const queryClient = useQueryClient();
	const { data: result } = useQuery(getCategoriesAdminQuery(search));
	const categories = result?.page ?? [];
	const [categoryToDelete, setCategoryToDelete] =
		React.useState<CategoryRow | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDeleteCategory = React.useCallback(async () => {
		if (!categoryToDelete) return;

		setIsDeleting(true);
		const deleteResult = await toAsyncResult(
			deleteCategory({ id: categoryToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: getCategoriesAdminQuery(search).queryKey,
				});
				toast.success("Category deleted.");
				setCategoryToDelete(null);
			}),
		);
		setIsDeleting(false);

		if (!deleteResult.ok) {
			toast.error(
				getErrorMessage(deleteResult.error, "Unable to delete category."),
			);
		}
	}, [categoryToDelete, deleteCategory, queryClient, search]);

	const columns = React.useMemo<Array<ColumnDef<CategoryRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-10",
					cellClassName: "px-1 py-2 grid place-items-center",
				},
				cell: ({ row }) => (
					<DataTable.ActionButton
						type="button"
						aria-label={`Delete ${row.original.name}`}
						title="Delete"
						onClick={() => setCategoryToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
					</DataTable.ActionButton>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					cellClassName: "font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.name}
						onSave={async (name) => {
							await updateCategory({
								id: row.original._id,
								name,
								slug: toSlug(name),
								description: row.original.description || undefined,
							});
						}}
					/>
				),
			},
			{
				accessorKey: "slug",
				header: "Slug",
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updateCategory({
								id: row.original._id,
								name: row.original.name,
								slug: toSlug(slug),
								description: row.original.description || undefined,
							});
						}}
					/>
				),
			},
			{
				accessorKey: "description",
				header: "Description",
				enableSorting: false,
				meta: {
					cellClassName: "text-muted-foreground",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.description || ""}
						onSave={async (description) => {
							await updateCategory({
								id: row.original._id,
								name: row.original.name,
								slug: row.original.slug,
								description: description || undefined,
							});
						}}
					/>
				),
			},
			{
				accessorKey: "_creationTime",
				header: "Created",
				cell: ({ row }) =>
					new Date(row.original._creationTime).toLocaleString(),
			},
		],
		[updateCategory],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={categories}
				loadingLabel="Loading categories..."
				emptyLabel="No categories found."
				isLoading={result === undefined}
				search={search}
				onSearchChange={onSearchChange}
				pagination={{
					continueCursor: result?.continueCursor ?? null,
					isDone: result?.isDone ?? true,
				}}
			>
				<Page.Root>
					<Page.Header>
						<Page.Title>Categories</Page.Title>
						<Page.Description>Manage post categories.</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/categories/new" />}
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
				<ConfirmDeleteDialog
					open={categoryToDelete !== null}
					title={
						categoryToDelete
							? `Delete category "${categoryToDelete.name}"?`
							: "Delete category?"
					}
					description="This action cannot be undone."
					isPending={isDeleting}
					onOpenChange={(open) => {
						if (!open) {
							setCategoryToDelete(null);
						}
					}}
					onConfirm={() => void handleDeleteCategory()}
				/>
				{extraOverlays}
			</DataTable.Root>
		</EditingProvider>
	);
}
