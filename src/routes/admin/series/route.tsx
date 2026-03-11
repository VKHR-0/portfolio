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
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";

const PAGE_SIZE = 10;
const SERIES_SORT_FIELDS = [
	"name",
	"slug",
	"description",
	"_creationTime",
] as const;

type SeriesSortField = (typeof SERIES_SORT_FIELDS)[number];

type SeriesRow = {
	_id: Id<"series">;
	name: string;
	slug: string;
	description?: string;
	_creationTime: number;
};

function listSeriesQuery(
	cursor: string | null,
	search: { sortField?: SeriesSortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.series.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/series")({
	validateSearch: zodValidator(
		createAdminTableSearchSchema(SERIES_SORT_FIELDS),
	),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			listSeriesQuery(null, deps.search),
		);
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
		() => sortingStateFromSearch<SeriesSortField>(search),
		[search],
	);
	const updateSeries = useMutation(api.functions.series.updateSeries);
	const deleteSeries = useMutation(api.functions.series.deleteSeries);
	const queryClient = useQueryClient();
	const nameInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const descriptionInputRef = React.useRef<HTMLInputElement>(null);
	const [seriesToDelete, setSeriesToDelete] = React.useState<SeriesRow | null>(
		null,
	);
	const [isDeletingSeries, setIsDeletingSeries] = React.useState(false);

	const {
		form,
		editingId: editingSeriesId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<
		Id<"series">,
		{ name: string; slug: string; description: string }
	>({
		emptyValues: { name: "", slug: "", description: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.name.trim() === initialValue.name &&
			toSlug(value.slug) === initialValue.slug &&
			value.description.trim() === initialValue.description,
		onSubmit: async ({ id, value }) => {
			const name = value.name.trim();
			const slug = toSlug(value.slug);
			const description = value.description.trim();

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

			await updateSeries({
				id,
				name,
				slug,
				description: description || undefined,
			});
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update series.",
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

	const { data: result } = useQuery(listSeriesQuery(currentCursor, search));
	const seriesList = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	React.useEffect(() => {
		if (!editingSeriesId) return;

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		if (focusField === "slug") {
			slugInputRef.current?.focus();
			slugInputRef.current?.select();
			return;
		}

		descriptionInputRef.current?.focus();
		descriptionInputRef.current?.select();
	}, [editingSeriesId, focusField]);

	const handleDeleteSeries = async () => {
		if (!seriesToDelete) {
			return;
		}

		setIsDeletingSeries(true);
		const result = await toAsyncResult(
			deleteSeries({ id: seriesToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: listSeriesQuery(currentCursor, search).queryKey,
				});
				toast.success("Series deleted.");
				setSeriesToDelete(null);
			}),
		);
		setIsDeletingSeries(false);

		if (!result.ok) {
			toast.error(getErrorMessage(result.error, "Unable to delete series."));
		}
	};

	const columns = React.useMemo<Array<ColumnDef<SeriesRow>>>(
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
						onClick={() => setSeriesToDelete(row.original)}
					>
						<IconTrash />
					</Button>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[22%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => {
					const item = row.original;

					return (
						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.name}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
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
					headerClassName: "w-[22%]",
				},
				cell: ({ row }) => {
					const item = row.original;

					return (
						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.slug}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
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
				accessorKey: "description",
				header: "Description",
				meta: {
					headerClassName: "w-[36%]",
					cellClassName: "text-muted-foreground",
				},
				cell: ({ row }) => {
					const item = row.original;

					return (
						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.description || "-"}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
									"description",
								)
							}
							className="text-muted-foreground"
						>
							<form.Field name="description">
								{(field) => (
									<Input
										ref={descriptionInputRef}
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
		],
		[
			editingSeriesId,
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
				title="Series"
				description="Manage post series."
				createButton={
					<Button nativeButton={false} render={<Link to="/admin/series/new" />}>
						<IconPlus />
						Create new
					</Button>
				}
				loadingLabel="Loading series..."
				emptyLabel="No series found."
				columns={columns}
				data={seriesList}
				sorting={sorting}
				onSortingChange={(nextSorting: SortingState) => {
					const nextSearch =
						searchFromSortingState<SeriesSortField>(nextSorting);

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
				open={seriesToDelete !== null}
				title={
					seriesToDelete
						? `Delete series "${seriesToDelete.name}"?`
						: "Delete series?"
				}
				description="This action cannot be undone."
				isPending={isDeletingSeries}
				onOpenChange={(open) => !open && setSeriesToDelete(null)}
				onConfirm={() => void handleDeleteSeries()}
			/>
			<Outlet />
		</>
	);
}
