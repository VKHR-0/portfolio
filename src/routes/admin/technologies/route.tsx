import { convexQuery } from "@convex-dev/react-query";
import { IconDice, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import {
	getRandomColorKey,
	TECHNOLOGY_COLOR_KEYS,
	TECHNOLOGY_COLORS,
	type TechnologyColorKey,
} from "shared/technology-colors";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "#/components/confirm-delete-dialog";
import { EditableCell, PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	createAdminTableSearchSchema,
	searchFromSortingState,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { cn } from "#/lib/utils";

const PAGE_SIZE = 10;
const TECH_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

type TechSortField = (typeof TECH_SORT_FIELDS)[number];

type TechRow = {
	_id: Id<"technologies">;
	name: string;
	slug: string;
	color: string;
	_creationTime: number;
};

function listTechQuery(
	cursor: string | null,
	search: { sortField?: TechSortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.technologies.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

function ColorSwatch({ color }: { color: string }) {
	const palette = TECHNOLOGY_COLORS[color as TechnologyColorKey];

	if (!palette) {
		return <span className="size-4 rounded-full bg-muted" />;
	}

	return (
		<span
			className={cn(
				"inline-block size-4 rounded-full border",
				palette.bg,
				palette.border,
			)}
		/>
	);
}

function ColorSwatchPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<button
						type="button"
						className="flex size-8 items-center justify-center rounded-md border border-input hover:bg-muted"
					>
						<ColorSwatch color={value} />
					</button>
				}
			/>
			<PopoverContent align="start" className="w-auto p-2">
				<div className="grid grid-cols-6 gap-x-1.5 gap-y-2.5">
					{TECHNOLOGY_COLOR_KEYS.map((key) => {
						const palette = TECHNOLOGY_COLORS[key];
						const isSelected = key === value;

						return (
							<button
								key={key}
								type="button"
								className={cn(
									"flex size-7 items-center justify-center rounded-md border transition-colors",
									palette.bg,
									palette.border,
									isSelected && "ring-2 ring-ring ring-offset-1",
								)}
								title={key}
								onClick={() => {
									onChange(key);
									setOpen(false);
								}}
							/>
						);
					})}
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="mt-2 w-full"
					onClick={() => {
						onChange(getRandomColorKey());
						setOpen(false);
					}}
				>
					<IconDice data-icon="inline-start" />
					Random
				</Button>
			</PopoverContent>
		</Popover>
	);
}

export const Route = createFileRoute("/admin/technologies")({
	validateSearch: zodValidator(createAdminTableSearchSchema(TECH_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(listTechQuery(null, deps.search));
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
		() => sortingStateFromSearch<TechSortField>(search),
		[search],
	);
	const updateTechnology = useMutation(
		api.functions.technologies.updateTechnology,
	);
	const deleteTechnology = useMutation(
		api.functions.technologies.deleteTechnology,
	);
	const queryClient = useQueryClient();
	const nameInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const [techToDelete, setTechToDelete] = React.useState<TechRow | null>(null);
	const [isDeletingTech, setIsDeletingTech] = React.useState(false);

	const {
		form,
		editingId: editingTechId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<
		Id<"technologies">,
		{ name: string; slug: string; color: string }
	>({
		emptyValues: { name: "", slug: "", color: "blue" },
		isUnchanged: ({ value, initialValue }) =>
			value.name.trim() === initialValue.name &&
			toSlug(value.slug) === initialValue.slug &&
			value.color === initialValue.color,
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

			await updateTechnology({ id, name, slug, color: value.color });
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update technology.",
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

	const { data: result } = useQuery(listTechQuery(currentCursor, search));
	const technologies = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	React.useEffect(() => {
		if (!editingTechId) return;

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingTechId, focusField]);

	const handleDeleteTech = async () => {
		if (!techToDelete) {
			return;
		}

		setIsDeletingTech(true);
		const result = await toAsyncResult(
			deleteTechnology({ id: techToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: listTechQuery(currentCursor, search).queryKey,
				});
				toast.success("Technology deleted.");
				setTechToDelete(null);
			}),
		);
		setIsDeletingTech(false);

		if (!result.ok) {
			toast.error(
				getErrorMessage(result.error, "Unable to delete technology."),
			);
		}
	};

	const columns = React.useMemo<Array<ColumnDef<TechRow>>>(
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
						onClick={() => setTechToDelete(row.original)}
					>
						<IconTrash />
					</Button>
				),
			},
			{
				id: "color",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-10",
					cellClassName: "py-2 px-1",
				},
				cell: ({ row }) => {
					const tech = row.original;

					if (editingTechId === tech._id) {
						return (
							<form.Field name="color">
								{(field) => (
									<ColorSwatchPicker
										value={field.state.value}
										onChange={(color) => field.handleChange(color)}
									/>
								)}
							</form.Field>
						);
					}

					return <ColorSwatch color={tech.color} />;
				},
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[30%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => {
					const tech = row.original;

					return (
						<EditableCell
							isEditing={editingTechId === tech._id}
							displayValue={tech.name}
							onDoubleClick={() =>
								startEditing(
									tech._id,
									{ name: tech.name, slug: tech.slug, color: tech.color },
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
					headerClassName: "w-[30%]",
				},
				cell: ({ row }) => {
					const tech = row.original;

					return (
						<EditableCell
							isEditing={editingTechId === tech._id}
							displayValue={tech.slug}
							onDoubleClick={() =>
								startEditing(
									tech._id,
									{ name: tech.name, slug: tech.slug, color: tech.color },
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
				accessorKey: "_creationTime",
				header: "Created",
				cell: ({ row }) =>
					new Date(row.original._creationTime).toLocaleString(),
			},
		],
		[
			editingTechId,
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
				title="Technologies"
				description="Manage technologies for project tech stacks."
				createButton={
					<Button
						nativeButton={false}
						render={<Link to="/admin/technologies/new" />}
					>
						<IconPlus />
						Create new
					</Button>
				}
				loadingLabel="Loading technologies..."
				emptyLabel="No technologies found."
				columns={columns}
				data={technologies}
				sorting={sorting}
				onSortingChange={(nextSorting: SortingState) => {
					const nextSearch = searchFromSortingState<TechSortField>(nextSorting);

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
				open={techToDelete !== null}
				title={
					techToDelete
						? `Delete technology "${techToDelete.name}"?`
						: "Delete technology?"
				}
				description="This action cannot be undone."
				isPending={isDeletingTech}
				onOpenChange={(open) => !open && setTechToDelete(null)}
				onConfirm={() => void handleDeleteTech()}
			/>
			<Outlet />
		</>
	);
}
