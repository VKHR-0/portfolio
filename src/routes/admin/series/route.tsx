import { convexQuery } from "@convex-dev/react-query";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
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

	const { data: result } = useQuery(listSeriesQuery(currentCursor));

	const series = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<>
			<Card className="min-w-0 flex-1">
				<CardHeader className="flex flex-row items-start justify-between gap-3">
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
									<TableCell className="truncate font-medium">
										{item.name}
									</TableCell>
									<TableCell className="truncate">{item.slug}</TableCell>
									<TableCell className="truncate text-muted-foreground">
										{item.description || "-"}
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
