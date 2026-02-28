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

export const Route = createFileRoute("/admin/posts/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const result = useQuery(api.functions.posts.list, {
		paginationOpts: {
			numItems: 10,
			cursor: currentCursor,
		},
	});

	const posts = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<Card className="min-w-0 flex-1">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<div>
					<CardTitle>Posts</CardTitle>
					<CardDescription>Manage blog posts.</CardDescription>
				</div>
				<Button render={<Link to="/admin/posts/new" />}>
					<IconPlus />
					Create new
				</Button>
			</CardHeader>

			<CardContent className="min-w-0 flex-1">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[30%]">Title</TableHead>
							<TableHead className="w-[30%]">Slug</TableHead>
							<TableHead className="w-[20%]">Status</TableHead>
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
									Loading posts...
								</TableCell>
							</TableRow>
						)}

						{result && posts.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-24 text-center text-muted-foreground"
								>
									No posts found.
								</TableCell>
							</TableRow>
						)}

						{posts.map((post) => (
							<TableRow key={post._id}>
								<TableCell className="truncate font-medium">
									{post.title}
								</TableCell>
								<TableCell className="truncate">{post.slug}</TableCell>
								<TableCell className="text-muted-foreground capitalize">
									{post.status}
								</TableCell>
								<TableCell>
									{new Date(post._creationTime).toLocaleString()}
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
