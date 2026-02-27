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

export const Route = createFileRoute("/admin/tags/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const currentCursor = cursors[cursors.length - 1];

	const result = useQuery(api.functions.tags.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const tags = result?.page ?? [];

	return (
		<section className="flex min-h-full w-full p-4">
			<Card className="flex-1">
				<CardHeader>
					<CardTitle>Tags</CardTitle>
					<CardDescription>Manage post tags.</CardDescription>
				</CardHeader>

				<CardContent className="flex-1">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{result === undefined && (
								<TableRow>
									<TableCell colSpan={3}>Loading tags...</TableCell>
								</TableRow>
							)}

							{result && tags.length === 0 && (
								<TableRow>
									<TableCell colSpan={3}>No tags found.</TableCell>
								</TableRow>
							)}

							{tags.map((tag) => (
								<TableRow key={tag._id}>
									<TableCell className="font-medium">{tag.name}</TableCell>
									<TableCell>{tag.slug}</TableCell>
									<TableCell>
										{new Date(tag._creationTime).toLocaleString()}
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
		</section>
	);
}
