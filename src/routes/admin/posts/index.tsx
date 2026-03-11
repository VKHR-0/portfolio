import { convexQuery } from "@convex-dev/react-query";
import { Eye, EyeOff, Pencil, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { EditableCell, PageCard } from "#/components/page-card";
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
	createAdminTableSearchSchema,
	searchFromSortingState,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";

const PAGE_SIZE = 10;
const POST_SORT_FIELDS = ["title", "slug", "status"] as const;

type PostSortField = (typeof POST_SORT_FIELDS)[number];

type PostRow = {
	_id: Id<"posts">;
	title: string;
	slug: string;
	status: "draft" | "private" | "public";
};

function listPostsQuery(
	cursor: string | null,
	search: { sortField?: PostSortField; sortDirection?: "asc" | "desc" },
) {
	return convexQuery(api.functions.posts.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		sortField: search.sortField,
		sortDirection: search.sortDirection,
	});
}

export const Route = createFileRoute("/admin/posts/")({
	validateSearch: zodValidator(createAdminTableSearchSchema(POST_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			listPostsQuery(null, deps.search),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const [cursors, setCursors] = React.useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const sortKey = `${search.sortField ?? ""}:${search.sortDirection ?? ""}`;
	const previousSortKeyRef = React.useRef(sortKey);
	const sorting = React.useMemo(
		() => sortingStateFromSearch<PostSortField>(search),
		[search],
	);
	const updatePostSummary = useMutation(api.functions.posts.updatePostSummary);
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

			await updatePostSummary({
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

	React.useEffect(() => {
		if (previousSortKeyRef.current === sortKey) {
			return;
		}

		previousSortKeyRef.current = sortKey;
		setCursors([null]);
		setCurrentPage(1);
	}, [sortKey]);

	const { data: result } = useQuery(listPostsQuery(currentCursor, search));

	const posts = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

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
							<Button
								size="icon-xs"
								variant="outline"
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
							</Button>
						) : (
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											size="icon-xs"
											variant="outline"
											disabled
											aria-label="Preview unavailable"
										>
											<HugeiconsIcon icon={EyeOff} strokeWidth={2} />
										</Button>
									}
								/>
								<TooltipContent>Publish post to preview</TooltipContent>
							</Tooltip>
						)}
						<Button
							size="icon-xs"
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
						</Button>
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
						<EditableCell
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
						</EditableCell>
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
						<EditableCell
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
						</EditableCell>
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
		<PageCard
			title="Posts"
			description="Manage blog posts."
			createButton={
				<Button nativeButton={false} render={<Link to="/admin/posts/new" />}>
					<HugeiconsIcon icon={Plus} strokeWidth={2} />
					Create new
				</Button>
			}
			loadingLabel="Loading posts..."
			emptyLabel="No posts found."
			columns={columns}
			data={posts}
			sorting={sorting}
			onSortingChange={(nextSorting: SortingState) => {
				const nextSearch = searchFromSortingState<PostSortField>(nextSorting);

				void navigate({
					search: (prev) => ({
						...prev,
						sortField: nextSearch.sortField,
						sortDirection: nextSearch.sortDirection,
					}),
				});
			}}
			isLoading={result === undefined}
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
			getRowId={(row) => row._id}
		/>
	);
}
