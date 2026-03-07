import { convexQuery } from "@convex-dev/react-query";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import * as React from "react";
import { PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { TableCell, TableHead, TableRow } from "#/components/ui/table";

const PAGE_SIZE = 10;

function listPostsQuery(cursor: string | null) {
	return convexQuery(api.functions.posts.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
	});
}

export const Route = createFileRoute("/admin/posts/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listPostsQuery(null));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = React.useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const { data: result } = useQuery(listPostsQuery(currentCursor));

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
								nativeButton={false}
								render={
									<Link to="/posts/$slugId" params={{ slugId: post.slug }} />
								}
							>
								Preview
							</Button>
							<Button
								size="xs"
								nativeButton={false}
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
