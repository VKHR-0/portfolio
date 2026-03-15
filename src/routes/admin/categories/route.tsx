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
import { listCategories } from "#/queries/admin";

const PAGE_SIZE = 10;
const CATEGORY_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

type CategoryRow = {
	_id: Id<"categories">;
	name: string;
	slug: string;
	description?: string;
	_creationTime: number;
};

function listCategoriesQuery(search: AdminTableSearch<CategorySortField>) {
	return listCategories({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
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
		await context.queryClient.ensureQueryData(listCategoriesQuery(deps.search));
	},
	component: CategoriesRouteComponent,
});

export function CategoriesRouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const updateCategory = useMutation(api.functions.categories.update);
	const deleteCategory = useMutation(api.functions.categories.remove);
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
	const { data: result } = useQuery(listCategoriesQuery(search));
	const categories = result?.page ?? [];

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
		const result = await toAsyncResult(
			deleteCategory({ id: categoryToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: listCategoriesQuery(search).queryKey,
				});
				toast.success("Category deleted.");
				setCategoryToDelete(null);
			}),
		);
		setIsDeletingCategory(false);

		if (!result.ok) {
			toast.error(getErrorMessage(result.error, "Unable to delete category."));
		}
	};

	const columns = React.useMemo<Array<ColumnDef<CategoryRow>>>(
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
						onClick={() => setCategoryToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
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
					const category = row.original;

					return (
						<DataTable.EditableCell
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
						</DataTable.EditableCell>
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
						<DataTable.EditableCell
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
						</DataTable.EditableCell>
					);
				},
			},
			{
				accessorKey: "description",
				header: "Description",
				enableSorting: false,
				meta: {
					headerClassName: "w-[36%]",
					cellClassName: "text-muted-foreground",
				},
				cell: ({ row }) => {
					const category = row.original;

					return (
						<DataTable.EditableCell
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
			<DataTable.Root
				columns={columns}
				data={categories}
				loadingLabel="Loading categories..."
				emptyLabel="No categories found."
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
			</DataTable.Root>
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
