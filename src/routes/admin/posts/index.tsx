import { IconPlus } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { TableCell, TableHead, TableRow } from "#/components/ui/table";

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
		<PageCard
			title="Posts"
			description="Manage blog posts."
			createButton={
				<Button nativeButton={false} render={<Link to="/admin/posts/new" />}>
					<IconPlus />
					Create new
				</Button>
			}
			loadingLabel="Loading posts..."
			emptyLabel="No posts found."
			columnHeaders={
				<>
					<TableHead className="w-[30%]">Title</TableHead>
					<TableHead className="w-[28%]">Slug</TableHead>
					<TableHead className="w-[16%]">Status</TableHead>
					<TableHead>Actions</TableHead>
				</>
			}
			columnCount={4}
			isLoading={result === undefined}
			isEmpty={posts.length === 0}
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
			{posts.map((post) => (
				<TableRow key={post._id}>
					<TableCell className="truncate font-medium">{post.title}</TableCell>
					<TableCell className="truncate">{post.slug}</TableCell>
					<TableCell className="text-muted-foreground capitalize">
						{post.status}
					</TableCell>
					<TableCell>
						<div className="flex items-center gap-2">
							<Button
								size="xs"
								variant="outline"
								render={
									<Link to="/posts/$slugId" params={{ slugId: post.slug }} />
								}
							>
								Preview
							</Button>
							<Button
								size="xs"
								render={
									<Link
										to="/admin/posts/$slugId"
										params={{ slugId: post.slug }}
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
