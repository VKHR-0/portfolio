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
	const currentCursor = cursors[cursors.length - 1];

	const result = useQuery(api.functions.series.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const series = result?.page ?? [];
	const pageLabel = `Page ${cursors.length}`;

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

			<CardFooter className="justify-between">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setCursors((prev) => prev.slice(0, -1));
					}}
					disabled={cursors.length === 1 || result === undefined}
				>
					Previous
				</Button>

				<span className="text-muted-foreground text-sm">{pageLabel}</span>

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
