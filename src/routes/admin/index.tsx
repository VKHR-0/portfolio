import { convexQuery } from "@convex-dev/react-query";
import {
	IconDeviceDesktop,
	IconEye,
	IconEyeOff,
	IconMoon,
	IconPencil,
	IconPlus,
	IconStack2,
	IconSun,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { EditableCell } from "#/components/page-card";
import { useTheme } from "#/components/providers/theme-provider";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";
import { authClient } from "#/lib/auth-client";
import { isAuthError } from "#/lib/auth-errors";
import { getCurrentUser } from "#/server/auth";
import type { Theme } from "#/server/theme";

const DASHBOARD_LIMIT = 10;
const THEME_ORDER: Array<Theme> = ["system", "light", "dark"];

function recentPostsQuery(authorId: string) {
	return convexQuery(api.functions.posts.listRecentPosts, {
		authorId,
		limit: DASHBOARD_LIMIT,
	});
}

function recentProjectsQuery(authorId: string) {
	return convexQuery(api.functions.projects.listRecentProjects, {
		authorId,
		limit: DASHBOARD_LIMIT,
	});
}

function formatCreatedAt(timestamp: number) {
	return new Date(timestamp).toLocaleString();
}

function getNextTheme(theme: Theme): Theme {
	const currentIndex = THEME_ORDER.indexOf(theme);
	const nextIndex = (currentIndex + 1) % THEME_ORDER.length;

	return THEME_ORDER[nextIndex] ?? "system";
}

export const Route = createFileRoute("/admin/")({
	component: RouteComponent,
	loader: async ({ context, location }) => {
		try {
			const user = await getCurrentUser();

			await Promise.all([
				context.queryClient.ensureQueryData(recentPostsQuery(user._id)),
				context.queryClient.ensureQueryData(recentProjectsQuery(user._id)),
			]);

			return { user };
		} catch (error) {
			if (isAuthError(error)) {
				throw redirect({
					to: "/admin/login",
					search: {
						redirect: location.href,
					},
				});
			}

			throw error;
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { user } = Route.useLoaderData();
	const { theme, setTheme } = useTheme();
	const updatePostSummary = useMutation(api.functions.posts.updatePostSummary);
	const updateProjectSummary = useMutation(
		api.functions.projects.updateProjectSummary,
	);
	const { data: recentPosts } = useSuspenseQuery(recentPostsQuery(user._id));
	const { data: recentProjects } = useSuspenseQuery(
		recentProjectsQuery(user._id),
	);
	const postTitleInputRef = React.useRef<HTMLInputElement>(null);
	const postSlugInputRef = React.useRef<HTMLInputElement>(null);
	const projectTitleInputRef = React.useRef<HTMLInputElement>(null);
	const projectSlugInputRef = React.useRef<HTMLInputElement>(null);
	const {
		form: postForm,
		editingId: editingPostId,
		isSaving: isSavingPost,
		focusField: postFocusField,
		setFocusField: setPostFocusField,
		startEditing: startEditingPost,
		handleInputBlur: handlePostInputBlur,
		handleInputKeyDown: handlePostInputKeyDown,
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
				setPostFocusField("title");
				postTitleInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setPostFocusField("slug");
				postSlugInputRef.current?.focus();
				return false;
			}

			await updatePostSummary({ id, title, slug });
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update post.",
			);
		},
	});
	const {
		form: projectForm,
		editingId: editingProjectId,
		isSaving: isSavingProject,
		focusField: projectFocusField,
		setFocusField: setProjectFocusField,
		startEditing: startEditingProject,
		handleInputBlur: handleProjectInputBlur,
		handleInputKeyDown: handleProjectInputKeyDown,
	} = useInlineEditForm<Id<"projects">, { title: string; slug: string }>({
		emptyValues: { title: "", slug: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.title.trim() === initialValue.title &&
			toSlug(value.slug) === initialValue.slug,
		onSubmit: async ({ id, value }) => {
			const title = value.title.trim();
			const slug = toSlug(value.slug);

			if (!title) {
				toast.error("Title is required.");
				setProjectFocusField("title");
				projectTitleInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setProjectFocusField("slug");
				projectSlugInputRef.current?.focus();
				return false;
			}

			await updateProjectSummary({ id, title, slug });
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update project.",
			);
		},
	});
	const nextTheme = getNextTheme(theme);

	React.useEffect(() => {
		if (!editingPostId) {
			return;
		}

		if (postFocusField === "title") {
			postTitleInputRef.current?.focus();
			postTitleInputRef.current?.select();
			return;
		}

		postSlugInputRef.current?.focus();
		postSlugInputRef.current?.select();
	}, [editingPostId, postFocusField]);

	React.useEffect(() => {
		if (!editingProjectId) {
			return;
		}

		if (projectFocusField === "title") {
			projectTitleInputRef.current?.focus();
			projectTitleInputRef.current?.select();
			return;
		}

		projectSlugInputRef.current?.focus();
		projectSlugInputRef.current?.select();
	}, [editingProjectId, projectFocusField]);

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-2">
			<Card className="shrink-0" size="sm">
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<IconStack2 />
						Admin Overview
					</CardTitle>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="icon"
							aria-label={`Theme: ${theme}. Switch to ${nextTheme}.`}
							title={`Theme: ${theme}. Switch to ${nextTheme}.`}
							onClick={() => {
								setTheme(nextTheme);
							}}
						>
							{theme === "light" ? (
								<IconSun />
							) : theme === "dark" ? (
								<IconMoon />
							) : (
								<IconDeviceDesktop />
							)}
						</Button>
						<Button
							onClick={() => {
								void authClient.signOut({
									fetchOptions: {
										onSuccess: async () =>
											navigate({
												to: "/admin/login",
												search: { redirect: "/admin" },
											}),
									},
								});
							}}
							variant="outline"
						>
							Sign out
						</Button>
					</div>
				</CardHeader>
			</Card>

			<RecentItemsCard
				title="Latest posts"
				description="The 10 most recently created posts."
				emptyLabel="No posts yet."
				rows={recentPosts.map((post) => ({
					id: post._id,
					status: post.status,
					createdAt: post._creationTime,
					titleCell: (
						<EditableCell
							isEditing={editingPostId === post._id}
							displayValue={post.title}
							onDoubleClick={() =>
								startEditingPost(
									post._id,
									{ title: post.title, slug: post.slug },
									"title",
								)
							}
							className="font-medium"
						>
							<postForm.Field name="title">
								{(field) => (
									<Input
										ref={postTitleInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingPost}
										onChange={(event) => {
											const nextTitle = event.target.value;
											field.handleChange(nextTitle);
											postForm.setFieldValue("slug", toSlug(nextTitle));
										}}
										onBlur={(event) => {
											field.handleBlur();
											handlePostInputBlur(event);
										}}
										onKeyDown={handlePostInputKeyDown}
									/>
								)}
							</postForm.Field>
						</EditableCell>
					),
					slugCell: (
						<EditableCell
							isEditing={editingPostId === post._id}
							displayValue={post.slug}
							onDoubleClick={() =>
								startEditingPost(
									post._id,
									{ title: post.title, slug: post.slug },
									"slug",
								)
							}
						>
							<postForm.Field name="slug">
								{(field) => (
									<Input
										ref={postSlugInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingPost}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handlePostInputBlur(event);
										}}
										onKeyDown={handlePostInputKeyDown}
									/>
								)}
							</postForm.Field>
						</EditableCell>
					),
					actions:
						post.status !== "draft" ? (
							<>
								<Button
									size="icon-xs"
									variant="outline"
									nativeButton={false}
									render={
										<Link to="/posts/$slugId" params={{ slugId: post.slug }} />
									}
									aria-label="Preview post"
									title="Preview post"
								>
									<IconEye />
								</Button>
								<Button
									size="icon-xs"
									nativeButton={false}
									render={
										<Link
											to="/admin/posts/$slugId"
											params={{ slugId: post.slug }}
										/>
									}
									aria-label="Edit post"
									title="Edit post"
								>
									<IconPencil />
								</Button>
							</>
						) : (
							<>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												size="icon-xs"
												variant="outline"
												disabled
												aria-label="Preview unavailable"
											>
												<IconEyeOff />
											</Button>
										}
									/>
									<TooltipContent>Publish post to preview</TooltipContent>
								</Tooltip>
								<Button
									size="icon-xs"
									nativeButton={false}
									render={
										<Link
											to="/admin/posts/$slugId"
											params={{ slugId: post.slug }}
										/>
									}
									aria-label="Edit post"
									title="Edit post"
								>
									<IconPencil />
								</Button>
							</>
						),
				}))}
				viewAllLink="/admin/posts"
				createLink="/admin/posts/new"
			/>

			<RecentItemsCard
				title="Latest projects"
				description="The 10 most recently created projects."
				emptyLabel="No projects yet."
				rows={recentProjects.map((project) => ({
					id: project._id,
					status: project.status,
					createdAt: project._creationTime,
					titleCell: (
						<EditableCell
							isEditing={editingProjectId === project._id}
							displayValue={project.title}
							onDoubleClick={() =>
								startEditingProject(
									project._id,
									{ title: project.title, slug: project.slug },
									"title",
								)
							}
							className="font-medium"
						>
							<projectForm.Field name="title">
								{(field) => (
									<Input
										ref={projectTitleInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingProject}
										onChange={(event) => {
											const nextTitle = event.target.value;
											field.handleChange(nextTitle);
											projectForm.setFieldValue("slug", toSlug(nextTitle));
										}}
										onBlur={(event) => {
											field.handleBlur();
											handleProjectInputBlur(event);
										}}
										onKeyDown={handleProjectInputKeyDown}
									/>
								)}
							</projectForm.Field>
						</EditableCell>
					),
					slugCell: (
						<EditableCell
							isEditing={editingProjectId === project._id}
							displayValue={project.slug}
							onDoubleClick={() =>
								startEditingProject(
									project._id,
									{ title: project.title, slug: project.slug },
									"slug",
								)
							}
						>
							<projectForm.Field name="slug">
								{(field) => (
									<Input
										ref={projectSlugInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingProject}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handleProjectInputBlur(event);
										}}
										onKeyDown={handleProjectInputKeyDown}
									/>
								)}
							</projectForm.Field>
						</EditableCell>
					),
					actions: (
						<>
							<Button
								size="icon-xs"
								variant="outline"
								nativeButton={false}
								render={
									<Link
										to="/projects/$slugId"
										params={{ slugId: project.slug }}
									/>
								}
								aria-label="Preview project"
								title="Preview project"
							>
								<IconEye />
							</Button>
							<Button
								size="icon-xs"
								nativeButton={false}
								render={
									<Link
										to="/admin/projects/$slugId"
										params={{ slugId: project.slug }}
									/>
								}
								aria-label="Edit project"
								title="Edit project"
							>
								<IconPencil />
							</Button>
						</>
					),
				}))}
				viewAllLink="/admin/projects"
				createLink="/admin/projects/new"
			/>
		</section>
	);
}

type RecentItemRow = {
	id: Id<"posts"> | Id<"projects">;
	titleCell: React.ReactNode;
	slugCell: React.ReactNode;
	actions: React.ReactNode;
	status?: string;
	createdAt: number;
};

type RecentItemsCardProps = {
	title: string;
	description: string;
	emptyLabel: string;
	rows: Array<RecentItemRow>;
	viewAllLink: "/admin/posts" | "/admin/projects";
	createLink: "/admin/posts/new" | "/admin/projects/new";
};

function RecentItemsCard({
	title,
	description,
	emptyLabel,
	rows,
	viewAllLink,
	createLink,
}: RecentItemsCardProps) {
	return (
		<Card className="flex min-h-0 flex-1 flex-col">
			<CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						nativeButton={false}
						render={<Link to={viewAllLink} />}
					>
						View all
					</Button>
					<Button nativeButton={false} render={<Link to={createLink} />}>
						<IconPlus />
						Create new
					</Button>
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 overflow-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8" />
							<TableHead className="w-[35%]">Title</TableHead>
							<TableHead className="w-[30%]">Slug</TableHead>
							<TableHead className="w-[15%]">Status</TableHead>
							<TableHead className="w-[20%]">Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length > 0 ? (
							rows.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="px-1 py-2">
										<div className="flex items-center gap-2">{row.actions}</div>
									</TableCell>
									<TableCell className="font-medium">{row.titleCell}</TableCell>
									<TableCell className="text-muted-foreground">
										{row.slugCell}
									</TableCell>
									<TableCell>
										{row.status ? (
											<Badge
												variant={
													row.status === "public" || row.status === "active"
														? "default"
														: row.status === "private" ||
																row.status === "completed"
															? "secondary"
															: "outline"
												}
												className="capitalize"
											>
												{row.status}
											</Badge>
										) : (
											<span className="text-muted-foreground/60">n/a</span>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatCreatedAt(row.createdAt)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyLabel}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
