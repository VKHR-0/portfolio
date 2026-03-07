import { convexQuery } from "@convex-dev/react-query";
import { IconEye, IconPencil, IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import * as React from "react";
import { PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import {
	createAdminTableSearchSchema,
	searchFromSortingState,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";

const PAGE_SIZE = 10;
const PROJECT_SORT_FIELDS = ["title", "slug"] as const;

type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

type ProjectRow = {
	_id: string;
	title: string;
	slug: string;
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
					headerClassName: "w-[40%]",
					cellClassName: "truncate font-medium",
				},
				cell: ({ row }) => row.original.title,
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[35%]",
					cellClassName: "truncate",
				},
				cell: ({ row }) => row.original.slug,
			},
		],
		[],
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
