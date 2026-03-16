import { Dice, Edit, Plus, Trash } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
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
import {
	DataTable,
	EditingProvider,
	InlineInputCell,
} from "#/components/data-table";
import { useEditing } from "#/components/data-table/editing-context";
import { ConfirmDeleteDialog } from "#/components/dialogs/confirm-delete";
import { Page } from "#/components/page";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { getCursor, type TableSearchParams } from "#/lib/table-search-params";
import { cn } from "#/lib/utils";
import { listTechnologies } from "#/queries/admin";

const PAGE_SIZE = 10;

export const TECH_SORT_FIELDS = ["name", "slug", "_creationTime"] as const;

export type TechSortField = (typeof TECH_SORT_FIELDS)[number];

type TechRow = {
	_id: Id<"technologies">;
	name: string;
	slug: string;
	color: string;
	_creationTime: number;
};

type TechnologiesAdminResourceProps = {
	search: TableSearchParams<TechSortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<TechSortField>,
		) => TableSearchParams<TechSortField>,
	) => void;
	extraOverlays?: React.ReactNode;
};

function ColorSwatch({ color }: { color: string }) {
	const palette = COLORS[color as ColorKey];

	if (!palette) {
		return <span className="size-6 rounded-full bg-muted" />;
	}

	return (
		<span
			className={cn("size-6 rounded-full border", palette.bg, palette.border)}
		/>
	);
}

type ColorPickerProps = {
	value: string;
	onChange: (color: string) => void;
	isSaving: boolean;
};

function ColorPicker({ value, onChange, isSaving }: ColorPickerProps) {
	const { editingId, startEditing, stopEditing } = useEditing();
	const id = `color-${Math.random().toString(36).slice(2, 9)}`;
	const isEditing = editingId === id;
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		if (isEditing) {
			setOpen(true);
		}
	}, [isEditing]);

	const handleColorChange = React.useCallback(
		(color: string) => {
			onChange(color);
			stopEditing();
		},
		[onChange, stopEditing],
	);

	if (isEditing && !isSaving) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button variant="ghost" size="icon-xs" type="button">
							<ColorSwatch color={value} />
						</Button>
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
									onClick={() => handleColorChange(key)}
								/>
							);
						})}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="mt-2 w-full"
						onClick={() => handleColorChange(getRandomColorKey())}
					>
						<HugeiconsIcon
							icon={Dice}
							strokeWidth={2}
							data-icon="inline-start"
						/>
						Random
					</Button>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon-xs"
			type="button"
			className="group relative"
			onClick={() => startEditing(id)}
			disabled={isSaving}
		>
			<ColorSwatch color={value} />
			<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/button:opacity-100">
				<HugeiconsIcon icon={Edit} strokeWidth={2} className="size-3" />
			</div>
		</Button>
	);
}

export function getTechnologiesAdminQuery(
	search: TableSearchParams<TechSortField>,
) {
	return listTechnologies({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function TechnologiesAdminResource({
	search,
	onSearchChange,
	extraOverlays,
}: TechnologiesAdminResourceProps) {
	const updateTechnology = useMutation(api.functions.technologies.update);
	const deleteTechnology = useMutation(api.functions.technologies.remove);
	const queryClient = useQueryClient();
	const { data: result } = useQuery(getTechnologiesAdminQuery(search));
	const technologies = result?.page ?? [];
	const [techToDelete, setTechToDelete] = React.useState<TechRow | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [updatingTechId, setUpdatingTechId] =
		React.useState<null | Id<"technologies">>(null);

	const handleDeleteTech = React.useCallback(async () => {
		if (!techToDelete) return;

		setIsDeleting(true);
		const deleteResult = await toAsyncResult(
			deleteTechnology({ id: techToDelete._id }).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: getTechnologiesAdminQuery(search).queryKey,
				});
				toast.success("Technology deleted.");
				setTechToDelete(null);
			}),
		);
		setIsDeleting(false);

		if (!deleteResult.ok) {
			toast.error(
				getErrorMessage(deleteResult.error, "Unable to delete technology."),
			);
		}
	}, [deleteTechnology, queryClient, search, techToDelete]);

	const columns = React.useMemo<Array<ColumnDef<TechRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-9",
					cellClassName: "px-1.5 py-2",
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
					headerClassName: "w-9",
					cellClassName: "px-1 py-2 grid place-items-center",
				},
				cell: ({ row }) => (
					<ColorPicker
						value={row.original.color}
						isSaving={updatingTechId === row.original._id}
						onChange={async (color) => {
							setUpdatingTechId(row.original._id);
							try {
								await updateTechnology({
									id: row.original._id,
									name: row.original.name,
									slug: row.original.slug,
									color: color as ColorKey,
								});
							} catch {
								// Error handled by toast from mutation
							} finally {
								setUpdatingTechId(null);
							}
						}}
					/>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				meta: {
					headerClassName: "w-[30%]",
					cellClassName: "font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.name}
						onSave={async (name) => {
							await updateTechnology({
								id: row.original._id,
								name,
								slug: toSlug(name),
								color: row.original.color as ColorKey,
							});
						}}
					/>
				),
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[30%]",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updateTechnology({
								id: row.original._id,
								name: row.original.name,
								slug: toSlug(slug),
								color: row.original.color as ColorKey,
							});
						}}
					/>
				),
			},
			{
				accessorKey: "_creationTime",
				header: "Created",
				meta: {
					headerClassName: "w-[20%]",
				},
				cell: ({ row }) =>
					new Date(row.original._creationTime).toLocaleString(),
			},
		],
		[updateTechnology, updatingTechId],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={technologies}
				loadingLabel="Loading technologies..."
				emptyLabel="No technologies found."
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
				<ConfirmDeleteDialog
					open={techToDelete !== null}
					title={
						techToDelete
							? `Delete technology "${techToDelete.name}"?`
							: "Delete technology?"
					}
					description="This action cannot be undone."
					isPending={isDeleting}
					onOpenChange={(open) => {
						if (!open) {
							setTechToDelete(null);
						}
					}}
					onConfirm={() => void handleDeleteTech()}
				/>
				{extraOverlays}
			</DataTable.Root>
		</EditingProvider>
	);
}
