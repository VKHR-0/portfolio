import { Eye, EyeOff, Pencil, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { DataTable } from "#/components/data-table";
import { Page } from "#/components/page";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import {
	type AdminTableSearch,
	createAdminTableSearchSchema,
	getCursorFromSearch,
} from "#/lib/admin-table-sorting";
import { listPosts } from "#/queries/admin";

const PAGE_SIZE = 10;
const POST_SORT_FIELDS = ["title", "slug", "status"] as const;

type PostSortField = (typeof POST_SORT_FIELDS)[number];

type PostRow = {
	_id: Id<"posts">;
	title: string;
	slug: string;
	status: "draft" | "private" | "public";
};

function listPostsQuery(search: AdminTableSearch<PostSortField>) {
	return listPosts({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursorFromSearch(search),
		},
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/posts/")({
	validateSearch: zodValidator(createAdminTableSearchSchema(POST_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(listPostsQuery(deps.search));
	},
	component: PostsRouteComponent,
});

export function PostsRouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const updatePost = useMutation(api.functions.posts.updateSummary);
	const titleInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const {
		form,
		editingId: editingPostId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<Id<"posts">, { title: string; slug: string }>({
		emptyValues: { title: "", slug: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.title.trim() === initialValue.title &&
			toSlug(value.slug) === initialValue.slug,
		onSubmit: async ({ id, value }) => {
			const title = value.title.trim();
			const slug = toSlug(value.slug);

			if (!title) {
				toast.error("Title is required.");
				setFocusField("title");
				titleInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setFocusField("slug");
				slugInputRef.current?.focus();
				return false;
			}

			await updatePost({
				id,
				title,
				slug,
			});
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update post.",
			);
		},
	});
	const { data: result } = useQuery(listPostsQuery(search));

	const posts = result?.page ?? [];

	React.useEffect(() => {
		if (!editingPostId) {
			return;
		}

		if (focusField === "title") {
			titleInputRef.current?.focus();
			titleInputRef.current?.select();
			return;
		}

		slugInputRef.current?.focus();
		slugInputRef.current?.select();
	}, [editingPostId, focusField]);

	const startEditingPost = React.useCallback(
		(post: PostRow, field: "title" | "slug") => {
			startEditing(
				post._id,
				{
					title: post.title,
					slug: post.slug,
				},
				field,
			);
		},
		[startEditing],
	);

	const columns = React.useMemo<Array<ColumnDef<PostRow>>>(
		() => [
			{
				id: "actions",
				enableSorting: false,
				header: "",
				meta: {
					headerClassName: "w-8",
					cellClassName: "py-2 px-1",
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
				cell: ({ row }) => {
					const post = row.original;

					return (
						<DataTable.EditableCell
							isEditing={editingPostId === post._id}
							displayValue={post.title}
							onDoubleClick={() => startEditingPost(post, "title")}
							className="font-medium"
						>
							<form.Field name="title">
								{(field) => (
									<Input
										ref={titleInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => {
											const nextTitle = event.target.value;
											field.handleChange(nextTitle);
											form.setFieldValue("slug", toSlug(nextTitle));
										}}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</DataTable.EditableCell>
					);
				},
			},
			{
				accessorKey: "slug",
				header: "Slug",
				meta: {
					headerClassName: "w-[28%]",
					cellClassName: "truncate",
				},
				cell: ({ row }) => {
					const post = row.original;

					return (
						<DataTable.EditableCell
							isEditing={editingPostId === post._id}
							displayValue={post.slug}
							onDoubleClick={() => startEditingPost(post, "slug")}
						>
							<form.Field name="slug">
								{(field) => (
									<Input
										ref={slugInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</DataTable.EditableCell>
					);
				},
			},
			{
				accessorKey: "status",
				header: "Status",
				meta: {
					headerClassName: "w-[16%]",
				},
				cell: ({ row }) => {
					const status = row.original.status;
					const variant =
						status === "public"
							? "default"
							: status === "private"
								? "secondary"
								: "outline";

					return (
						<Badge variant={variant} className="capitalize">
							{status}
						</Badge>
					);
				},
			},
		],
		[
			editingPostId,
			form,
			handleInputBlur,
			handleInputKeyDown,
			isSavingEdit,
			startEditingPost,
		],
	);

	return (
		<DataTable.Root
			columns={columns}
			data={posts}
			loadingLabel="Loading posts..."
			emptyLabel="No posts found."
			isLoading={result === undefined}
			search={search}
			onSearchChange={(updater) => {
				void navigate({
					search: (previousSearch) => updater(previousSearch),
				});
			}}
			pagination={{
				continueCursor: result?.continueCursor ?? null,
				isDone: result?.isDone ?? true,
			}}
			getRowId={(row) => row._id}
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
	);
}
