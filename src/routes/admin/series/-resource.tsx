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
import {
	type AdminTableSearch,
	getCursorFromSearch,
} from "#/lib/admin-table-sorting";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { listSeries } from "#/queries/admin";

const PAGE_SIZE = 10;

export const SERIES_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

export type SeriesSortField = (typeof SERIES_SORT_FIELDS)[number];

type SeriesRow = {
	_id: Id<"series">;
	name: string;
	slug: string;
	description?: string;
	_creationTime: number;
};

type SeriesAdminResourceProps = {
	search: AdminTableSearch<SeriesSortField>;
	onSearchChange: (
		updater: (
			prev: AdminTableSearch<SeriesSortField>,
		) => AdminTableSearch<SeriesSortField>,
	) => void;
	extraOverlays?: React.ReactNode;
};

export function getSeriesAdminQuery(search: AdminTableSearch<SeriesSortField>) {
	return listSeries({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function SeriesAdminResource({
	search,
	onSearchChange,
	extraOverlays,
}: SeriesAdminResourceProps) {
	const updateSeries = useMutation(api.functions.series.update);
	const deleteSeries = useMutation(api.functions.series.remove);
	const queryClient = useQueryClient();
	const { data: result } = useQuery(getSeriesAdminQuery(search));
	const seriesList = result?.page ?? [];
	const [seriesToDelete, setSeriesToDelete] = React.useState<SeriesRow | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDeleteSeries = React.useCallback(async () => {
		if (!seriesToDelete) return;

		setIsDeleting(true);
		const deleteResult = await toAsyncResult(
			deleteSeries({ id: seriesToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: getSeriesAdminQuery(search).queryKey,
				});
				toast.success("Series deleted.");
				setSeriesToDelete(null);
			}),
		);
		setIsDeleting(false);

		if (!deleteResult.ok) {
			toast.error(
				getErrorMessage(deleteResult.error, "Unable to delete series."),
			);
		}
	}, [deleteSeries, queryClient, search, seriesToDelete]);

	const columns = React.useMemo<Array<ColumnDef<SeriesRow>>>(
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
						onClick={() => setSeriesToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
					</DataTable.ActionButton>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[22%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.name}
						onSave={async (name) => {
							await updateSeries({
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
				meta: {
					headerClassName: "w-[22%]",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updateSeries({
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
					headerClassName: "w-[36%]",
					cellClassName: "text-muted-foreground",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.description || ""}
						onSave={async (description) => {
							await updateSeries({
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
		[updateSeries],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={seriesList}
				loadingLabel="Loading series..."
				emptyLabel="No series found."
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
						<Page.Title>Series</Page.Title>
						<Page.Description>Manage post series.</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/series/new" />}
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
					open={seriesToDelete !== null}
					title={
						seriesToDelete
							? `Delete series "${seriesToDelete.name}"?`
							: "Delete series?"
					}
					description="This action cannot be undone."
					isPending={isDeleting}
					onOpenChange={(open) => {
						if (!open) {
							setSeriesToDelete(null);
						}
					}}
					onConfirm={() => void handleDeleteSeries()}
				/>
				{extraOverlays}
			</DataTable.Root>
		</EditingProvider>
	);
}
