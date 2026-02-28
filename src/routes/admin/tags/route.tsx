import { convexQuery } from "@convex-dev/react-query";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FocusEvent, KeyboardEvent } from "react";
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

	const [editingTagId, setEditingTagId] = useState<Id<"tags"> | null>(null);
	const [editingDraft, setEditingDraft] = useState({
		name: "",
		slug: "",
	});
	const [initialDraft, setInitialDraft] = useState({
		name: "",
		slug: "",
	});
	const [focusField, setFocusField] = useState<"name" | "slug">("name");
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const slugInputRef = useRef<HTMLInputElement>(null);

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

	const startEditing = (
		tag: { _id: Id<"tags">; name: string; slug: string },
		field: "name" | "slug",
	) => {
		if (isSavingEdit) {
			return;
		}

		if (editingTagId === tag._id) {
			setFocusField(field);
			return;
		}

		setEditingTagId(tag._id);
		setEditingDraft({
			name: tag.name,
			slug: tag.slug,
		});
		setInitialDraft({
			name: tag.name,
			slug: tag.slug,
		});
		setFocusField(field);
	};

	const cancelEditing = () => {
		if (isSavingEdit) {
			return;
		}

		setEditingTagId(null);
	};

	const saveEditing = async () => {
		if (!editingTagId || isSavingEdit) {
			return;
		}

		const name = editingDraft.name.trim();
		const slug = toSlug(editingDraft.slug);

		if (!name) {
			toast.error("Name is required.");
			nameInputRef.current?.focus();
			return;
		}

		if (!slug) {
			toast.error("Slug is required.");
			slugInputRef.current?.focus();
			return;
		}

		if (name === initialDraft.name && slug === initialDraft.slug) {
			setEditingTagId(null);
			return;
		}

		setIsSavingEdit(true);

		try {
			await updateTag({
				id: editingTagId,
				name,
				slug,
			});
			setEditingTagId(null);
		} catch (mutationError: unknown) {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update tag.",
			);
		} finally {
			setIsSavingEdit(false);
		}
	};

	const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
		const nextTarget = event.relatedTarget as HTMLElement | null;
		if (nextTarget?.dataset.editableCell === "true") {
			return;
		}

		void saveEditing();
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			void saveEditing();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			cancelEditing();
		}
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
											startEditing(tag, "name");
										}}
									>
										{editingTagId === tag._id ? (
											<Input
												ref={nameInputRef}
												data-editable-cell="true"
												value={editingDraft.name}
												disabled={isSavingEdit}
												onChange={(event) => {
													const nextName = event.target.value;
													setEditingDraft((previous) => ({
														...previous,
														name: nextName,
														slug: toSlug(nextName),
													}));
												}}
												onBlur={handleInputBlur}
												onKeyDown={handleInputKeyDown}
											/>
										) : (
											tag.name
										)}
									</TableCell>
									<TableCell
										className="cursor-text select-none truncate"
										title="Double-click to edit"
										onDoubleClick={() => {
											startEditing(tag, "slug");
										}}
									>
										{editingTagId === tag._id ? (
											<Input
												ref={slugInputRef}
												data-editable-cell="true"
												value={editingDraft.slug}
												disabled={isSavingEdit}
												onChange={(event) => {
													setEditingDraft((previous) => ({
														...previous,
														slug: event.target.value,
													}));
												}}
												onBlur={handleInputBlur}
												onKeyDown={handleInputKeyDown}
											/>
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
