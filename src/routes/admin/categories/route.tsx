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
const CATEGORY_SORT_FIELDS = [
	"name",
	"slug",
	"description",
	"_creationTime",
] as const;

type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

type CategoryRow = {
	_id: Id<"categories">;
	name: string;
	slug: string;
	description?: string;
	_creationTime: number;
};

function listCategoriesQuery(
	cursor: string | null,
	search: { sortField?: CategorySortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.categories.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/categories")({
	validateSearch: zodValidator(
		createAdminTableSearchSchema(CATEGORY_SORT_FIELDS),
	),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			listCategoriesQuery(null, deps.search),
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
		() => sortingStateFromSearch<CategorySortField>(search),
		[search],
	);
	const updateCategory = useMutation(api.functions.categories.updateCategory);
	const deleteCategory = useMutation(api.functions.categories.deleteCategory);
	const queryClient = useQueryClient();
	const nameInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const descriptionInputRef = React.useRef<HTMLInputElement>(null);
	const [categoryToDelete, setCategoryToDelete] =
		React.useState<CategoryRow | null>(null);
	const [isDeletingCategory, setIsDeletingCategory] = React.useState(false);

	const {
		form,
		editingId: editingCategoryId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<
		Id<"categories">,
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

			await updateCategory({
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
					: "Unable to update category.",
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

	const { data: result } = useQuery(listCategoriesQuery(currentCursor, search));
	const categories = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	React.useEffect(() => {
		if (!editingCategoryId) return;

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
	}, [editingCategoryId, focusField]);

	const startEditingCategory = React.useCallback(
		(category: CategoryRow, field: "name" | "slug" | "description") => {
			startEditing(
				category._id,
				{
					name: category.name,
					slug: category.slug,
					description: category.description ?? "",
				},
				field,
			);
		},
		[startEditing],
	);

	const handleDeleteCategory = async () => {
		if (!categoryToDelete) {
			return;
		}

		setIsDeletingCategory(true);

		try {
			await deleteCategory({ id: categoryToDelete._id });
			await queryClient.invalidateQueries({
				queryKey: listCategoriesQuery(currentCursor, search).queryKey,
			});
			toast.success("Category deleted.");
			setCategoryToDelete(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to delete category.",
			);
		} finally {
			setIsDeletingCategory(false);
		}
	};

	const columns = React.useMemo<Array<ColumnDef<CategoryRow>>>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[22%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => {
					const category = row.original;

					return (
						<EditableCell
							isEditing={editingCategoryId === category._id}
							displayValue={category.name}
							onDoubleClick={() => startEditingCategory(category, "name")}
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
					const category = row.original;

					return (
						<EditableCell
							isEditing={editingCategoryId === category._id}
							displayValue={category.slug}
							onDoubleClick={() => startEditingCategory(category, "slug")}
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
					const category = row.original;

					return (
						<EditableCell
							isEditing={editingCategoryId === category._id}
							displayValue={category.description || "-"}
							onDoubleClick={() =>
								startEditingCategory(category, "description")
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
						onClick={() => setCategoryToDelete(row.original)}
					>
						<IconTrash />
					</Button>
				),
			},
		],
		[
			editingCategoryId,
			form,
			handleInputBlur,
			handleInputKeyDown,
			isSavingEdit,
			startEditingCategory,
		],
	);

	return (
		<>
			<PageCard
				title="Categories"
				description="Manage post categories."
				createButton={
					<Button
						nativeButton={false}
						render={<Link to="/admin/categories/new" />}
					>
						<IconPlus />
						Create new
					</Button>
				}
				loadingLabel="Loading categories..."
				emptyLabel="No categories found."
				columns={columns}
				data={categories}
				sorting={sorting}
				onSortingChange={(nextSorting: SortingState) => {
					const nextSearch =
						searchFromSortingState<CategorySortField>(nextSorting);

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
				open={categoryToDelete !== null}
				title={
					categoryToDelete
						? `Delete category "${categoryToDelete.name}"?`
						: "Delete category?"
				}
				description="This action cannot be undone."
				isPending={isDeletingCategory}
				onOpenChange={(open) => !open && setCategoryToDelete(null)}
				onConfirm={() => void handleDeleteCategory()}
			/>
			<Outlet />
		</>
	);
}
