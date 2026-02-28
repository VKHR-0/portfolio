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

export const Route = createFileRoute("/admin/categories/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const currentCursor = cursors[cursors.length - 1];

	const result = useQuery(api.functions.categories.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const categories = result?.page ?? [];

	return (
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
								<TableCell colSpan={4}>Loading categories...</TableCell>
							</TableRow>
						)}

						{result && categories.length === 0 && (
							<TableRow>
								<TableCell colSpan={4}>No categories found.</TableCell>
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

			<CardFooter className="justify-between">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setCursors((prev) => prev.slice(0, -1));
					}}
					disabled={cursors.length === 1}
				>
					Previous
				</Button>

				<Button
					type="button"
					variant="outline"
					onClick={() => {
						if (!result?.continueCursor) {
							return;
						}

						setCursors((prev) => [...prev, result.continueCursor]);
					}}
					disabled={result === undefined || result.isDone}
				>
					Next
				</Button>
			</CardFooter>
		</Card>
	);
}
