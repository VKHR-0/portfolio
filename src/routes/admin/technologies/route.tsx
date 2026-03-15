import { Dice, Plus, Trash } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import {
	COLOR_KEYS,
	COLORS,
	type ColorKey,
	getRandomColorKey,
} from "shared/colors";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { DataTable } from "#/components/data-table";
import { ConfirmDeleteDialog } from "#/components/dialogs/confirm-delete";
import { Page } from "#/components/page";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	type AdminTableSearch,
	createAdminTableSearchSchema,
	getCursorFromSearch,
} from "#/lib/admin-table-sorting";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { cn } from "#/lib/utils";
import { listTechnologies } from "#/queries/admin";

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

function listTechQuery(search: AdminTableSearch<TechSortField>) {
	return listTechnologies({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

function ColorSwatch({ color }: { color: string }) {
	const palette = COLORS[color as ColorKey];

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
					{COLOR_KEYS.map((key) => {
						const palette = COLORS[key];
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
					<HugeiconsIcon icon={Dice} strokeWidth={2} data-icon="inline-start" />
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
		await context.queryClient.ensureQueryData(listTechQuery(deps.search));
	},
	component: TechnologiesRouteComponent,
});

export function TechnologiesRouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const updateTechnology = useMutation(api.functions.technologies.update);
	const deleteTechnology = useMutation(api.functions.technologies.remove);
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

			await updateTechnology({
				id,
				name,
				slug,
				color: value.color as ColorKey,
			});
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update technology.",
			);
		},
	});
	const { data: result } = useQuery(listTechQuery(search));
	const technologies = result?.page ?? [];

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
					queryKey: listTechQuery(search).queryKey,
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
					<DataTable.ActionButton
						type="button"
						aria-label={`Delete ${row.original.name}`}
						title="Delete"
						onClick={() => setTechToDelete(row.original)}
					>
						<HugeiconsIcon icon={Trash} strokeWidth={2} />
					</DataTable.ActionButton>
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
						<DataTable.EditableCell
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
						</DataTable.EditableCell>
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
						<DataTable.EditableCell
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
			<DataTable.Root
				columns={columns}
				data={technologies}
				loadingLabel="Loading technologies..."
				emptyLabel="No technologies found."
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
						<Page.Title>Technologies</Page.Title>
						<Page.Description>
							Manage technologies for project tech stacks.
						</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/technologies/new" />}
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
