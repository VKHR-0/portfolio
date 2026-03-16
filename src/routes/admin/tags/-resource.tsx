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
import { listTags } from "#/queries/admin";

const PAGE_SIZE = 10;

export const TAG_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

export type TagSortField = (typeof TAG_SORT_FIELDS)[number];

type TagRow = {
	_id: Id<"tags">;
	name: string;
	slug: string;
	_creationTime: number;
};

type TagsAdminResourceProps = {
	search: TableSearchParams<TagSortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<TagSortField>,
		) => TableSearchParams<TagSortField>,
	) => void;
	extraOverlays?: React.ReactNode;
};

export function getTagsAdminQuery(search: TableSearchParams<TagSortField>) {
	return listTags({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function TagsAdminResource({
	search,
	onSearchChange,
	extraOverlays,
}: TagsAdminResourceProps) {
	const updateTag = useMutation(api.functions.tags.update);
	const deleteTag = useMutation(api.functions.tags.remove);
	const queryClient = useQueryClient();
	const { data: result } = useQuery(getTagsAdminQuery(search));
	const tags = result?.page ?? [];
	const [tagToDelete, setTagToDelete] = React.useState<TagRow | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDeleteTag = React.useCallback(async () => {
		if (!tagToDelete) return;

		setIsDeleting(true);
		const deleteResult = await toAsyncResult(
			deleteTag({ id: tagToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: getTagsAdminQuery(search).queryKey,
				});
				toast.success("Tag deleted.");
				setTagToDelete(null);
			}),
		);
		setIsDeleting(false);

		if (!deleteResult.ok) {
			toast.error(getErrorMessage(deleteResult.error, "Unable to delete tag."));
		}
	}, [deleteTag, queryClient, search, tagToDelete]);

	const columns = React.useMemo<Array<ColumnDef<TagRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-8",
					cellClassName: "px-1 py-2",
				},
				cell: ({ row }) => (
					<DataTable.ActionButton
						type="button"
						aria-label={`Delete ${row.original.name}`}
						title="Delete"
						onClick={() => setTagToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
					</DataTable.ActionButton>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[35%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.name}
						onSave={async (name) => {
							await updateTag({
								id: row.original._id,
								name,
								slug: toSlug(name),
							});
						}}
					/>
				),
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[35%]",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updateTag({
								id: row.original._id,
								name: row.original.name,
								slug: toSlug(slug),
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
		[updateTag],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={tags}
				loadingLabel="Loading tags..."
				emptyLabel="No tags found."
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
				<ConfirmDeleteDialog
					open={tagToDelete !== null}
					title={
						tagToDelete ? `Delete tag "${tagToDelete.name}"?` : "Delete tag?"
					}
					description="This action cannot be undone."
					isPending={isDeleting}
					onOpenChange={(open) => {
						if (!open) {
							setTagToDelete(null);
						}
					}}
					onConfirm={() => void handleDeleteTag()}
				/>
				{extraOverlays}
			</DataTable.Root>
		</EditingProvider>
	);
}
