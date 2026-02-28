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

function listSeriesQuery(cursor: string | null) {
	return convexQuery(api.functions.series.list, {
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor,
		},
	});
}

export const Route = createFileRoute("/admin/series")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listSeriesQuery(null));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const updateSeries = useMutation(api.functions.series.updateSeries);

	const [editingSeriesId, setEditingSeriesId] = useState<Id<"series"> | null>(
		null,
	);
	const [editingDraft, setEditingDraft] = useState({
		name: "",
		slug: "",
		description: "",
	});
	const [initialDraft, setInitialDraft] = useState({
		name: "",
		slug: "",
		description: "",
	});
	const [focusField, setFocusField] = useState<"name" | "slug" | "description">(
		"name",
	);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const slugInputRef = useRef<HTMLInputElement>(null);
	const descriptionInputRef = useRef<HTMLInputElement>(null);

	const { data: result } = useQuery(listSeriesQuery(currentCursor));

	const series = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	useEffect(() => {
		if (!editingSeriesId) {
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
	}, [editingSeriesId, focusField]);

	const startEditing = (
		item: {
			_id: Id<"series">;
			name: string;
			slug: string;
			description?: string;
		},
		field: "name" | "slug" | "description",
	) => {
		setEditingSeriesId(item._id);
		setEditingDraft({
			name: item.name,
			slug: item.slug,
			description: item.description ?? "",
		});
		setInitialDraft({
			name: item.name,
			slug: item.slug,
			description: item.description ?? "",
		});
		setFocusField(field);
	};

	const cancelEditing = () => {
		if (isSavingEdit) {
			return;
		}

		setEditingSeriesId(null);
	};

	const saveEditing = async () => {
		if (!editingSeriesId || isSavingEdit) {
			return;
		}

		const name = editingDraft.name.trim();
		const slug = toSlug(editingDraft.slug);
		const description = editingDraft.description.trim();

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

		if (
			name === initialDraft.name &&
			slug === initialDraft.slug &&
			description === initialDraft.description
		) {
			setEditingSeriesId(null);
			return;
		}

		setIsSavingEdit(true);

		try {
			await updateSeries({
				id: editingSeriesId,
				name,
				slug,
				description: description || undefined,
			});
			setEditingSeriesId(null);
		} catch (mutationError: unknown) {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update series.",
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
						<CardTitle>Series</CardTitle>
						<CardDescription>Manage post series.</CardDescription>
					</div>
					<Button render={<Link to="/admin/series/new" />}>
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
										Loading series...
									</TableCell>
								</TableRow>
							)}

							{result && series.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-24 text-center text-muted-foreground"
									>
										No series found.
									</TableCell>
								</TableRow>
							)}

							{series.map((item) => (
								<TableRow key={item._id}>
									<TableCell
										className="truncate font-medium"
										onDoubleClick={() => {
											startEditing(item, "name");
										}}
									>
										{editingSeriesId === item._id ? (
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
											item.name
										)}
									</TableCell>
									<TableCell
										className="truncate"
										onDoubleClick={() => {
											startEditing(item, "slug");
										}}
									>
										{editingSeriesId === item._id ? (
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
											item.slug
										)}
									</TableCell>
									<TableCell
										className="truncate text-muted-foreground"
										onDoubleClick={() => {
											startEditing(item, "description");
										}}
									>
										{editingSeriesId === item._id ? (
											<Input
												ref={descriptionInputRef}
												data-editable-cell="true"
												value={editingDraft.description}
												disabled={isSavingEdit}
												onChange={(event) => {
													setEditingDraft((previous) => ({
														...previous,
														description: event.target.value,
													}));
												}}
												onBlur={handleInputBlur}
												onKeyDown={handleInputKeyDown}
											/>
										) : (
											item.description || "-"
										)}
									</TableCell>
									<TableCell>
										{new Date(item._creationTime).toLocaleString()}
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
