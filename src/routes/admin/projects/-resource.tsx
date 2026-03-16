import { Eye, Pencil, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import {
	DataTable,
	EditingProvider,
	InlineInputCell,
} from "#/components/data-table";
import { Page } from "#/components/page";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { getCursor, type TableSearchParams } from "#/lib/table-search-params";
import { listProjects } from "#/queries/admin";

const PAGE_SIZE = 10;

export const PROJECT_SORT_FIELDS = ["title", "slug"] as const;

export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

type ProjectRow = {
	_id: Id<"projects">;
	title: string;
	slug: string;
	status: "active" | "completed" | "archived";
};

type ProjectsAdminResourceProps = {
	search: TableSearchParams<ProjectSortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<ProjectSortField>,
		) => TableSearchParams<ProjectSortField>,
	) => void;
};

export function getProjectsAdminQuery(
	search: TableSearchParams<ProjectSortField>,
) {
	return listProjects({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function ProjectsAdminResource({
	search,
	onSearchChange,
}: ProjectsAdminResourceProps) {
	const updateProject = useMutation(api.functions.projects.updateSummary);
	const { data: result } = useQuery(getProjectsAdminQuery(search));
	const projects = result?.page ?? [];

	const columns = React.useMemo<Array<ColumnDef<ProjectRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-8",
					cellClassName: "px-1 py-2",
				},
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<DataTable.ActionButton
							nativeButton={false}
							render={
								<Link
									to="/projects/$slugId"
									params={{ slugId: row.original.slug }}
								/>
							}
							aria-label="Preview"
							title="Preview"
						>
							<HugeiconsIcon icon={Eye} strokeWidth={2} />
						</DataTable.ActionButton>
						<DataTable.ActionButton
							nativeButton={false}
							render={
								<Link
									to="/admin/projects/$slugId"
									params={{ slugId: row.original.slug }}
								/>
							}
							aria-label="Edit"
							title="Edit"
						>
							<HugeiconsIcon icon={Pencil} strokeWidth={2} />
						</DataTable.ActionButton>
					</div>
				),
			},
			{
				accessorKey: "title",
				header: "Title",
				meta: {
					headerClassName: "w-[30%]",
					cellClassName: "truncate font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.title}
						onSave={async (title) => {
							await updateProject({
								id: row.original._id,
								title,
								slug: toSlug(title),
							});
						}}
					/>
				),
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[28%]",
					cellClassName: "truncate",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updateProject({
								id: row.original._id,
								title: row.original.title,
								slug: toSlug(slug),
							});
						}}
					/>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				meta: {
					headerClassName: "w-[16%]",
				},
				cell: ({ row }) => {
					const variant =
						row.original.status === "active"
							? "default"
							: row.original.status === "completed"
								? "secondary"
								: "outline";

					return (
						<Badge variant={variant} className="capitalize">
							{row.original.status}
						</Badge>
					);
				},
			},
		],
		[updateProject],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={projects}
				loadingLabel="Loading projects..."
				emptyLabel="No projects found."
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
						<Page.Title>Projects</Page.Title>
						<Page.Description>Manage portfolio projects.</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/projects/new" />}
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
		</EditingProvider>
	);
}
