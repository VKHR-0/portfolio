import { Eye, EyeOff, Pencil, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import {
	DataTable,
	EditingProvider,
	InlineInputCell,
} from "#/components/data-table";
import { Page } from "#/components/page";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { getCursor, type TableSearchParams } from "#/lib/table-search-params";
import { listPosts } from "#/queries/admin";

const PAGE_SIZE = 10;

export const POST_SORT_FIELDS = ["title", "slug", "status"] as const;

export type PostSortField = (typeof POST_SORT_FIELDS)[number];

type PostRow = {
	_id: Id<"posts">;
	title: string;
	slug: string;
	status: "draft" | "private" | "public";
};

type PostsAdminResourceProps = {
	search: TableSearchParams<PostSortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<PostSortField>,
		) => TableSearchParams<PostSortField>,
	) => void;
};

export function getPostsAdminQuery(search: TableSearchParams<PostSortField>) {
	return listPosts({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export function PostsAdminResource({
	search,
	onSearchChange,
}: PostsAdminResourceProps) {
	const updatePost = useMutation(api.functions.posts.updateSummary);
	const { data: result } = useQuery(getPostsAdminQuery(search));
	const posts = result?.page ?? [];

	const columns = React.useMemo<Array<ColumnDef<PostRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-8",
					cellClassName: "px-1 py-2",
				},
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						{row.original.status !== "draft" ? (
							<DataTable.ActionButton
								nativeButton={false}
								render={
									<Link
										to="/posts/$slugId"
										params={{ slugId: row.original.slug }}
									/>
								}
								aria-label="Preview"
								title="Preview"
							>
								<HugeiconsIcon icon={Eye} strokeWidth={2} />
							</DataTable.ActionButton>
						) : (
							<Tooltip>
								<TooltipTrigger
									render={
										<DataTable.ActionButton
											disabled
											aria-label="Preview unavailable"
										>
											<HugeiconsIcon icon={EyeOff} strokeWidth={2} />
										</DataTable.ActionButton>
									}
								/>
								<TooltipContent>Publish post to preview</TooltipContent>
							</Tooltip>
						)}
						<DataTable.ActionButton
							nativeButton={false}
							render={
								<Link
									to="/admin/posts/$slugId"
									params={{ slugId: row.original.slug }}
								/>
							}
							aria-label="Edit"
							title="Edit"
						>
							<HugeiconsIcon icon={Pencil} strokeWidth={2} />
						</DataTable.ActionButton>
					</div>
				),
			},
			{
				accessorKey: "title",
				header: "Title",
				meta: {
					headerClassName: "w-[30%]",
					cellClassName: "truncate font-medium",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.title}
						onSave={async (title) => {
							await updatePost({
								id: row.original._id,
								title,
								slug: toSlug(title),
							});
						}}
					/>
				),
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[28%]",
					cellClassName: "truncate",
				},
				cell: ({ row }) => (
					<InlineInputCell
						value={row.original.slug}
						onSave={async (slug) => {
							await updatePost({
								id: row.original._id,
								title: row.original.title,
								slug: toSlug(slug),
							});
						}}
					/>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				meta: {
					headerClassName: "w-[16%]",
				},
				cell: ({ row }) => {
					const variant =
						row.original.status === "public"
							? "default"
							: row.original.status === "private"
								? "secondary"
								: "outline";

					return (
						<Badge variant={variant} className="capitalize">
							{row.original.status}
						</Badge>
					);
				},
			},
		],
		[updatePost],
	);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={posts}
				loadingLabel="Loading posts..."
				emptyLabel="No posts found."
				isLoading={result === undefined}
				search={search}
				onSearchChange={onSearchChange}
				pagination={{
					continueCursor: result?.continueCursor ?? null,
					isDone: result?.isDone ?? true,
				}}
			>
				<Page.Root>
					<Page.Header>
						<Page.Title>Posts</Page.Title>
						<Page.Description>Manage blog posts.</Page.Description>
						<Page.Action>
							<Button
								nativeButton={false}
								render={<Link to="/admin/posts/new" />}
							>
								<HugeiconsIcon icon={Plus} strokeWidth={2} />
								Create new
							</Button>
						</Page.Action>
					</Page.Header>
					<Page.Content>
						<DataTable.Table />
					</Page.Content>
					<Page.Footer>
						<DataTable.Pagination />
					</Page.Footer>
				</Page.Root>
			</DataTable.Root>
		</EditingProvider>
	);
}
