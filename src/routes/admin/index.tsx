import {
	Desktop,
	Eye,
	EyeOff,
	Layers,
	Moon,
	Pencil,
	Plus,
	Sun,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import {
	DataTable,
	EditingProvider,
	InlineInputCell,
} from "#/components/data-table";
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
import { getCurrentUser } from "#/functions/auth";
import type { Theme } from "#/functions/theme";
import { authClient } from "#/lib/auth-client";
import { isAuthError } from "#/lib/auth-errors";
import { listRecentPosts, listRecentProjects } from "#/queries/admin";

const DASHBOARD_LIMIT = 11;
const THEME_ORDER: Array<Theme> = ["system", "light", "dark"];

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

function recentPostsQuery() {
	return listRecentPosts({ limit: DASHBOARD_LIMIT });
}

function recentProjectsQuery() {
	return listRecentProjects({ limit: DASHBOARD_LIMIT });
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
				context.queryClient.ensureQueryData(recentPostsQuery()),
				context.queryClient.ensureQueryData(recentProjectsQuery()),
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

export function RouteComponent() {
	const navigate = useNavigate();
	const { theme, setTheme } = useTheme();
	const updatePost = useMutation(api.functions.posts.updateSummary);
	const updateProject = useMutation(api.functions.projects.updateSummary);
	const { data: recentPosts } = useSuspenseQuery(recentPostsQuery());
	const { data: recentProjects } = useSuspenseQuery(recentProjectsQuery());
	const nextTheme = getNextTheme(theme);

	const recentPostRows = React.useMemo<Array<RecentItemRow>>(
		() =>
			recentPosts.map((post) => ({
				id: post._id,
				status: post.status,
				createdAt: post._creationTime,
				titleCell: (
					<InlineInputCell
						value={post.title}
						onSave={async (title: string) => {
							await updatePost({
								id: post._id,
								title,
								slug: toSlug(title),
							});
						}}
					/>
				),
				slugCell: (
					<InlineInputCell
						value={post.slug}
						onSave={async (slug: string) => {
							await updatePost({
								id: post._id,
								title: post.title,
								slug: toSlug(slug),
							});
						}}
					/>
				),
				actions:
					post.status !== "draft" ? (
						<>
							<DataTable.ActionButton
								variant="outline"
								nativeButton={false}
								render={
									<Link to="/posts/$slugId" params={{ slugId: post.slug }} />
								}
								aria-label="Preview post"
								title="Preview post"
							>
								<HugeiconsIcon icon={Eye} strokeWidth={2} />
							</DataTable.ActionButton>
							<DataTable.ActionButton
								variant="outline"
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
								<HugeiconsIcon icon={Pencil} strokeWidth={2} />
							</DataTable.ActionButton>
						</>
					) : (
						<>
							<Tooltip>
								<TooltipTrigger
									render={
										<DataTable.ActionButton
											variant="outline"
											disabled
											aria-label="Preview unavailable"
										>
											<HugeiconsIcon icon={EyeOff} strokeWidth={2} />
										</DataTable.ActionButton>
									}
								/>
								<TooltipContent>Publish post to preview</TooltipContent>
							</Tooltip>
							<DataTable.ActionButton
								variant="outline"
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
								<HugeiconsIcon icon={Pencil} strokeWidth={2} />
							</DataTable.ActionButton>
						</>
					),
			})),
		[recentPosts, updatePost],
	);

	const recentProjectRows = React.useMemo<Array<RecentItemRow>>(
		() =>
			recentProjects.map((project) => ({
				id: project._id,
				status: project.status,
				createdAt: project._creationTime,
				titleCell: (
					<InlineInputCell
						value={project.title}
						onSave={async (title: string) => {
							await updateProject({
								id: project._id,
								title,
								slug: toSlug(title),
							});
						}}
					/>
				),
				slugCell: (
					<InlineInputCell
						value={project.slug}
						onSave={async (slug: string) => {
							await updateProject({
								id: project._id,
								title: project.title,
								slug: toSlug(slug),
							});
						}}
					/>
				),
				actions: (
					<>
						<DataTable.ActionButton
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
							<HugeiconsIcon icon={Eye} strokeWidth={2} />
						</DataTable.ActionButton>
						<DataTable.ActionButton
							variant="outline"
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
							<HugeiconsIcon icon={Pencil} strokeWidth={2} />
						</DataTable.ActionButton>
					</>
				),
			})),
		[recentProjects, updateProject],
	);

	return (
		<EditingProvider>
			<section className="flex min-h-0 flex-1 flex-col gap-2">
				<Card className="shrink-0" size="sm">
					<CardHeader className="flex flex-row items-center justify-between gap-4">
						<CardTitle className="flex items-center gap-2">
							<HugeiconsIcon icon={Layers} strokeWidth={2} />
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
									<HugeiconsIcon icon={Sun} strokeWidth={2} />
								) : theme === "dark" ? (
									<HugeiconsIcon icon={Moon} strokeWidth={2} />
								) : (
									<HugeiconsIcon icon={Desktop} strokeWidth={2} />
								)}
							</Button>
							<Button
								variant="outline"
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
					rows={recentPostRows}
					viewAllLink="/admin/posts"
					createLink="/admin/posts/new"
				/>

				<RecentItemsCard
					title="Latest projects"
					description="The 10 most recently created projects."
					emptyLabel="No projects yet."
					rows={recentProjectRows}
					viewAllLink="/admin/projects"
					createLink="/admin/projects/new"
				/>
			</section>
		</EditingProvider>
	);
}

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
						<HugeiconsIcon icon={Plus} strokeWidth={2} />
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
