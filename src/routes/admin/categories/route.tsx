import { createFileRoute, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CursorPagination } from "#/components/cursor-pagination";
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

export const Route = createFileRoute("/admin/categories")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const result = useQuery(api.functions.categories.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const categories = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<>
			<Card className="min-w-0 flex-1">
				<CardHeader>
					<CardTitle>Categories</CardTitle>
					<CardDescription>Manage post categories.</CardDescription>
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
										Loading categories...
									</TableCell>
								</TableRow>
							)}

							{result && categories.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-24 text-center text-muted-foreground"
									>
										No categories found.
									</TableCell>
								</TableRow>
							)}

							{categories.map((category) => (
								<TableRow key={category._id}>
									<TableCell className="truncate font-medium">
										{category.name}
									</TableCell>
									<TableCell className="truncate">{category.slug}</TableCell>
									<TableCell className="truncate text-muted-foreground">
										{category.description || "-"}
									</TableCell>
									<TableCell>
										{new Date(category._creationTime).toLocaleString()}
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
