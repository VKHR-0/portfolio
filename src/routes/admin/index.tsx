import { convexQuery } from "@convex-dev/react-query";
import {
	IconDeviceDesktop,
	IconEye,
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
import { useTheme } from "#/components/theme-provider";
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
import { authClient } from "#/lib/auth-client";
import { isAuthError } from "#/lib/auth-errors";
import { cn } from "#/lib/utils";
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

function getThemeIcon(theme: Theme) {
	switch (theme) {
		case "light":
			return IconSun;
		case "dark":
			return IconMoon;
		default:
			return IconDeviceDesktop;
	}
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
	const { data: recentPosts } = useSuspenseQuery(recentPostsQuery(user._id));
	const { data: recentProjects } = useSuspenseQuery(
		recentProjectsQuery(user._id),
	);
	const nextTheme = getNextTheme(theme);
	const ThemeIcon = getThemeIcon(theme);

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
							<ThemeIcon />
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
				rows={recentPosts}
				viewAllLink="/admin/posts"
				createLink="/admin/posts/new"
				renderRowActions={(post) => (
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
				)}
			/>

			<RecentItemsCard
				title="Latest projects"
				description="The 10 most recently created projects."
				emptyLabel="No projects yet."
				rows={recentProjects}
				viewAllLink="/admin/projects"
				createLink="/admin/projects/new"
				renderRowActions={(project) => (
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
				)}
			/>
		</section>
	);
}

type RecentItem = {
	_id: string;
	title: string;
	slug: string;
	status?: string;
	_creationTime: number;
};

type RecentItemsCardProps<TItem extends RecentItem> = {
	title: string;
	description: string;
	emptyLabel: string;
	rows: Array<TItem>;
	viewAllLink: "/admin/posts" | "/admin/projects";
	createLink: "/admin/posts/new" | "/admin/projects/new";
	renderRowActions: (item: TItem) => React.ReactNode;
};

function RecentItemsCard<TItem extends RecentItem>({
	title,
	description,
	emptyLabel,
	rows,
	viewAllLink,
	createLink,
	renderRowActions,
}: RecentItemsCardProps<TItem>) {
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
							<TableHead className="w-[1%]" />
							<TableHead className="w-[36%]">Title</TableHead>
							<TableHead className="w-[28%]">Slug</TableHead>
							<TableHead className="w-[16%]">Status</TableHead>
							<TableHead className="w-[19%]">Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length > 0 ? (
							rows.map((item) => (
								<TableRow key={item._id}>
									<TableCell>
										<div className="flex items-center gap-2">
											{renderRowActions(item)}
										</div>
									</TableCell>
									<TableCell className="font-medium">{item.title}</TableCell>
									<TableCell className="text-muted-foreground">
										{item.slug}
									</TableCell>
									<TableCell
										className={cn(
											"text-muted-foreground capitalize",
											item.status ? undefined : "text-muted-foreground/60",
										)}
									>
										{item.status ?? "n/a"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatCreatedAt(item._creationTime)}
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
