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

function listTagsQuery(cursor: string | null) {
	return convexQuery(api.functions.tags.list, {
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor,
		},
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
		emptyValues: {
			name: "",
			slug: "",
		},
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

			await updateTag({
				id,
				name,
				slug,
			});
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
		if (!editingTagId) {
			return;
		}

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingTagId, focusField]);

	const toEditableValues = (tag: { name: string; slug: string }) => ({
		name: tag.name,
		slug: tag.slug,
	});

	const startEditingTag = (
		tag: { _id: Id<"tags">; name: string; slug: string },
		field: "name" | "slug",
	) => {
		startEditing(tag._id, toEditableValues(tag), field);
	};

	return (
		<>
			<Card className="min-w-0 flex-1">
				<CardHeader className="flex flex-row items-center justify-between gap-3">
					<div>
						<CardTitle>Tags</CardTitle>
						<CardDescription>Manage post tags.</CardDescription>
					</div>
					<Button render={<Link to="/admin/tags/new" />}>
						<IconPlus />
						Create new
					</Button>
				</CardHeader>

				<CardContent className="min-w-0 flex-1">
					<Table className="table-fixed">
						<TableHeader>
							<TableRow>
								<TableHead className="w-[35%]">Name</TableHead>
								<TableHead className="w-[35%]">Slug</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{result === undefined && (
								<TableRow>
									<TableCell
										colSpan={3}
										className="h-24 text-center text-muted-foreground"
									>
										Loading tags...
									</TableCell>
								</TableRow>
							)}

							{result && tags.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={3}
										className="h-24 text-center text-muted-foreground"
									>
										No tags found.
									</TableCell>
								</TableRow>
							)}

							{tags.map((tag) => (
								<TableRow key={tag._id}>
									<TableCell
										className="cursor-text select-none truncate font-medium"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditingTag(tag, "name");
										}}
									>
										{editingTagId === tag._id ? (
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
											tag.name
										)}
									</TableCell>
									<TableCell
										className="cursor-text select-none truncate"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditingTag(tag, "slug");
										}}
									>
										{editingTagId === tag._id ? (
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
											tag.slug
										)}
									</TableCell>
									<TableCell>
										{new Date(tag._creationTime).toLocaleString()}
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
