import { Eye, Pencil, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { DataTable } from "#/components/data-table";
import { Page } from "#/components/page";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	type AdminTableSearch,
	createAdminTableSearchSchema,
	getCursorFromSearch,
} from "#/lib/admin-table-sorting";
import { listProjects } from "#/queries/admin";

const PAGE_SIZE = 10;
const PROJECT_SORT_FIELDS = ["title", "slug"] as const;

type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

type ProjectRow = {
	_id: Id<"projects">;
	title: string;
	slug: string;
	status: "active" | "completed" | "archived";
};

function listProjectsQuery(search: AdminTableSearch<ProjectSortField>) {
	return listProjects({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/projects/")({
	validateSearch: zodValidator(
		createAdminTableSearchSchema(PROJECT_SORT_FIELDS),
	),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(listProjectsQuery(deps.search));
	},
	component: ProjectsRouteComponent,
});

export function ProjectsRouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const updateProject = useMutation(api.functions.projects.updateSummary);
	const titleInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const {
		form,
		editingId: editingProjectId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<Id<"projects">, { title: string; slug: string }>({
		emptyValues: { title: "", slug: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.title.trim() === initialValue.title &&
			toSlug(value.slug) === initialValue.slug,
		onSubmit: async ({ id, value }) => {
			const title = value.title.trim();
			const slug = toSlug(value.slug);

			if (!title) {
				toast.error("Title is required.");
				setFocusField("title");
				titleInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setFocusField("slug");
				slugInputRef.current?.focus();
				return false;
			}

			await updateProject({
				id,
				title,
				slug,
			});
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update project.",
			);
		},
	});
	const { data: result } = useQuery(listProjectsQuery(search));

	const projects = result?.page ?? [];

	React.useEffect(() => {
		if (!editingProjectId) {
			return;
		}

		if (focusField === "title") {
			titleInputRef.current?.focus();
			titleInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingProjectId, focusField]);

	const startEditingProject = React.useCallback(
		(project: ProjectRow, field: "title" | "slug") => {
			startEditing(
				project._id,
				{
					title: project.title,
					slug: project.slug,
				},
				field,
			);
		},
		[startEditing],
	);

	const columns = React.useMemo<Array<ColumnDef<ProjectRow>>>(
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
				cell: ({ row }) => {
					const project = row.original;

					return (
						<DataTable.EditableCell
							isEditing={editingProjectId === project._id}
							displayValue={project.title}
							onDoubleClick={() => startEditingProject(project, "title")}
							className="font-medium"
						>
							<form.Field name="title">
								{(field) => (
									<Input
										ref={titleInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => {
											const nextTitle = event.target.value;
											field.handleChange(nextTitle);
											form.setFieldValue("slug", toSlug(nextTitle));
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
					headerClassName: "w-[28%]",
					cellClassName: "truncate",
				},
				cell: ({ row }) => {
					const project = row.original;

					return (
						<DataTable.EditableCell
							isEditing={editingProjectId === project._id}
							displayValue={project.slug}
							onDoubleClick={() => startEditingProject(project, "slug")}
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
				accessorKey: "status",
				enableSorting: false,
				header: "Status",
				meta: {
					headerClassName: "w-[16%]",
				},
				cell: ({ row }) => {
					const status = row.original.status;
					const variant =
						status === "active"
							? "default"
							: status === "completed"
								? "secondary"
								: "outline";

					return (
						<Badge variant={variant} className="capitalize">
							{status}
						</Badge>
					);
				},
			},
		],
		[
			editingProjectId,
			form,
			handleInputBlur,
			handleInputKeyDown,
			isSavingEdit,
			startEditingProject,
		],
	);

	return (
		<DataTable.Root
			columns={columns}
			data={projects}
			loadingLabel="Loading projects..."
			emptyLabel="No projects found."
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
	);
}
