import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
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

export const Route = createFileRoute("/admin/series/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const result = useQuery(api.functions.series.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const series = result?.page ?? [];
	const pageCount = cursors.length;
	const pageWindowStart = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
	const pageWindowEnd = Math.min(pageCount, pageWindowStart + 4);
	const visiblePages = Array.from(
		{ length: pageWindowEnd - pageWindowStart + 1 },
		(_, index) => pageWindowStart + index,
	);
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<Card className="min-w-0 flex-1">
			<CardHeader>
				<CardTitle>Series</CardTitle>
				<CardDescription>Manage post series.</CardDescription>
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

			<CardFooter className="justify-between gap-2">
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => {
						setCurrentPage((prev) => Math.max(1, prev - 1));
					}}
					disabled={!canGoPrevious}
					aria-label="Go to previous page"
				>
					<IconChevronLeft className="size-4" />
				</Button>

				<div className="flex items-center gap-1">
					{pageWindowStart > 1 ? (
						<span className="px-2 text-muted-foreground text-sm">...</span>
					) : null}

					{visiblePages.map((page) => (
						<Button
							key={page}
							type="button"
							variant={page === currentPage ? "default" : "outline"}
							size="sm"
							onClick={() => {
								setCurrentPage(page);
							}}
						>
							{page}
						</Button>
					))}

					{pageWindowEnd < pageCount ? (
						<span className="px-2 text-muted-foreground text-sm">...</span>
					) : null}
				</div>

				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => {
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
					disabled={!canGoNext}
					aria-label="Go to next page"
				>
					<IconChevronRight className="size-4" />
				</Button>
			</CardFooter>
		</Card>
	);
}
