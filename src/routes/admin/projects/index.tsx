import { IconPlus } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { TableCell, TableHead, TableRow } from "#/components/ui/table";

export const Route = createFileRoute("/admin/projects/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const result = useQuery(api.functions.projects.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const projects = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<PageCard
			title="Projects"
			description="Manage portfolio projects."
			createButton={
				<Button render={<Link to="/admin/projects/new" />}>
					<IconPlus />
					Create new
				</Button>
			}
			loadingLabel="Loading projects..."
			emptyLabel="No projects found."
			columnHeaders={
				<>
					<TableHead className="w-[40%]">Title</TableHead>
					<TableHead className="w-[35%]">Slug</TableHead>
					<TableHead>Actions</TableHead>
				</>
			}
			columnCount={3}
			isLoading={result === undefined}
			isEmpty={projects.length === 0}
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
		>
			{projects.map((project) => (
				<TableRow key={project._id}>
					<TableCell className="truncate font-medium">
						{project.title}
					</TableCell>
					<TableCell className="truncate">{project.slug}</TableCell>
					<TableCell>
						<div className="flex items-center gap-2">
							<Button
								size="xs"
								variant="outline"
								render={
									<Link
										to="/projects/$slugId"
										params={{ slugId: project.slug }}
									/>
								}
							>
								Preview
							</Button>
							<Button
								size="xs"
								render={
									<Link
										to="/admin/projects/$slugId"
										params={{ slugId: project.slug }}
									/>
								}
							>
								Edit
							</Button>
						</div>
					</TableCell>
				</TableRow>
			))}
		</PageCard>
	);
}
