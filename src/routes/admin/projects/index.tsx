import { IconPlus } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";

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
		<Card className="min-w-0 flex-1">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<div>
					<CardTitle>Projects</CardTitle>
					<CardDescription>Manage portfolio projects.</CardDescription>
				</div>
				<Button render={<Link to="/admin/projects/new" />}>
					<IconPlus />
					Create new
				</Button>
			</CardHeader>

			<CardContent className="min-w-0 flex-1">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[26%]">Title</TableHead>
							<TableHead className="w-[24%]">Slug</TableHead>
							<TableHead className="w-[30%]">Description</TableHead>
							<TableHead className="w-[10%]">Status</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{result === undefined && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									Loading projects...
								</TableCell>
							</TableRow>
						)}

						{result && projects.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									No projects found.
								</TableCell>
							</TableRow>
						)}

						{projects.map((project) => (
							<TableRow key={project._id}>
								<TableCell className="truncate font-medium">
									{project.title}
								</TableCell>
								<TableCell className="truncate">{project.slug}</TableCell>
								<TableCell className="truncate text-muted-foreground">
									{project.description}
								</TableCell>
								<TableCell className="text-muted-foreground capitalize">
									{project.status}
								</TableCell>
								<TableCell>
									{new Date(project._creationTime).toLocaleString()}
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
	);
}
