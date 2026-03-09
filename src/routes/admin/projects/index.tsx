import { convexQuery } from "@convex-dev/react-query";
import { IconEye, IconPencil, IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { EditableCell, PageCard } from "#/components/page-card";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	createAdminTableSearchSchema,
	searchFromSortingState,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";

const PAGE_SIZE = 10;
const PROJECT_SORT_FIELDS = ["title", "slug"] as const;

type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

type ProjectRow = {
	_id: Id<"projects">;
	title: string;
	slug: string;
	status: "active" | "completed" | "archived";
};

function listProjectsQuery(
	cursor: string | null,
	search: { sortField?: ProjectSortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.projects.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
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
		await context.queryClient.ensureQueryData(
			listProjectsQuery(null, deps.search),
		);
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
		() => sortingStateFromSearch<ProjectSortField>(search),
		[search],
	);
	const updateProjectSummary = useMutation(
		api.functions.projects.updateProjectSummary,
	);
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

			await updateProjectSummary({
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

	React.useEffect(() => {
		if (previousSortKeyRef.current === sortKey) {
			return;
		}

		previousSortKeyRef.current = sortKey;
		setCursors([null]);
		setCurrentPage(1);
	}, [sortKey]);

	const { data: result } = useQuery(listProjectsQuery(currentCursor, search));

	const projects = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

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
					cellClassName: "w-[1%]",
				},
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button
							size="icon-xs"
							variant="outline"
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
							<IconEye />
						</Button>
						<Button
							size="icon-xs"
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
							<IconPencil />
						</Button>
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
						<EditableCell
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
						</EditableCell>
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
						<EditableCell
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
						</EditableCell>
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
		<PageCard
			title="Projects"
			description="Manage portfolio projects."
			createButton={
				<Button nativeButton={false} render={<Link to="/admin/projects/new" />}>
					<IconPlus />
					Create new
				</Button>
			}
			loadingLabel="Loading projects..."
			emptyLabel="No projects found."
			columns={columns}
			data={projects}
			sorting={sorting}
			onSortingChange={(nextSorting: SortingState) => {
				const nextSearch =
					searchFromSortingState<ProjectSortField>(nextSorting);

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
			getRowId={(row) => row._id}
		/>
	);
}
