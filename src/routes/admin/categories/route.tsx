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
import { CursorPagination } from "#/components/cursor-pagination";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";

const PAGE_SIZE = 10;

function listCategoriesQuery(cursor: string | null) {
	return convexQuery(api.functions.categories.list, {
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor,
		},
	});
}

export const Route = createFileRoute("/admin/categories")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listCategoriesQuery(null));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const updateCategory = useMutation(api.functions.categories.updateCategory);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const slugInputRef = useRef<HTMLInputElement>(null);
	const descriptionInputRef = useRef<HTMLInputElement>(null);

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
		emptyValues: {
			name: "",
			slug: "",
			description: "",
		},
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

	const { data: result } = useQuery(listCategoriesQuery(currentCursor));

	const categories = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	useEffect(() => {
		if (!editingCategoryId) {
			return;
		}

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

	return (
		<>
			<Card className="min-w-0 flex-1">
				<CardHeader className="flex flex-row items-center justify-between gap-3">
					<div>
						<CardTitle>Categories</CardTitle>
						<CardDescription>Manage post categories.</CardDescription>
					</div>
					<Button render={<Link to="/admin/categories/new" />}>
						<IconPlus />
						Create new
					</Button>
				</CardHeader>

				<CardContent className="min-w-0 flex-1">
					<Table className="table-fixed">
						<TableHeader>
							<TableRow>
								<TableHead className="w-[22%]">Name</TableHead>
								<TableHead className="w-[22%]">Slug</TableHead>
								<TableHead className="w-[36%]">Description</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{result === undefined && (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-24 text-center text-muted-foreground"
									>
										Loading categories...
									</TableCell>
								</TableRow>
							)}

							{result && categories.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-24 text-center text-muted-foreground"
									>
										No categories found.
									</TableCell>
								</TableRow>
							)}

							{categories.map((category) => (
								<TableRow key={category._id}>
									<TableCell
										className="cursor-text select-none truncate font-medium"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditing(
												category._id,
												{
													name: category.name,
													slug: category.slug,
													description: category.description ?? "",
												},
												"name",
											);
										}}
									>
										{editingCategoryId === category._id ? (
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
										) : (
											category.name
										)}
									</TableCell>
									<TableCell
										className="cursor-text select-none truncate"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditing(
												category._id,
												{
													name: category.name,
													slug: category.slug,
													description: category.description ?? "",
												},
												"slug",
											);
										}}
									>
										{editingCategoryId === category._id ? (
											<form.Field name="slug">
												{(field) => (
													<Input
														ref={slugInputRef}
														data-editable-cell="true"
														value={field.state.value}
														disabled={isSavingEdit}
														onChange={(event) => {
															field.handleChange(event.target.value);
														}}
														onBlur={(event) => {
															field.handleBlur();
															handleInputBlur(event);
														}}
														onKeyDown={handleInputKeyDown}
													/>
												)}
											</form.Field>
										) : (
											category.slug
										)}
									</TableCell>
									<TableCell
										className="cursor-text select-none truncate text-muted-foreground"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditing(
												category._id,
												{
													name: category.name,
													slug: category.slug,
													description: category.description ?? "",
												},
												"description",
											);
										}}
									>
										{editingCategoryId === category._id ? (
											<form.Field name="description">
												{(field) => (
													<Input
														ref={descriptionInputRef}
														data-editable-cell="true"
														value={field.state.value}
														disabled={isSavingEdit}
														onChange={(event) => {
															field.handleChange(event.target.value);
														}}
														onBlur={(event) => {
															field.handleBlur();
															handleInputBlur(event);
														}}
														onKeyDown={handleInputKeyDown}
													/>
												)}
											</form.Field>
										) : (
											category.description || "-"
										)}
									</TableCell>
									<TableCell>
										{new Date(category._creationTime).toLocaleString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>

				<CardFooter>
					<CursorPagination
						currentPage={currentPage}
						pageCount={pageCount}
						canGoPrevious={canGoPrevious}
						canGoNext={canGoNext}
						onPrevious={() => {
							setCurrentPage((prev) => Math.max(1, prev - 1));
						}}
						onSelectPage={(page) => {
							setCurrentPage(page);
						}}
						onNext={() => {
							if (currentPage < pageCount) {
								setCurrentPage((prev) => prev + 1);
								return;
							}

							if (!result?.continueCursor) {
								return;
							}

							setCursors((prev) => [...prev, result.continueCursor]);
							setCurrentPage((prev) => prev + 1);
						}}
					/>
				</CardFooter>
			</Card>
			<Outlet />
		</>
	);
}
