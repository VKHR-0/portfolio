import { convexQuery } from "@convex-dev/react-query";
import {
	Briefcase,
	Cpu,
	FileText,
	Photo,
	Plus,
	Settings,
	Sidebar as SidebarIcon,
	Tag,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { FunctionArgs } from "convex/server";
import * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarSeparator,
	SidebarTrigger,
} from "#/components/ui/sidebar";

type SidebarAuthorId = FunctionArgs<
	typeof api.functions.posts.listRecentPosts
>["authorId"];

function AdminSidebar({ authorId }: { authorId: SidebarAuthorId }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader>
				<div className="flex items-center justify-between px-2 py-1 transition-all duration-200 ease-linear group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
					<Link
						to="/admin"
						className="font-medium group-data-[collapsible=icon]:hidden"
					>
						Portfolio
					</Link>
					<SidebarTrigger
						size="icon-lg"
						variant="outline"
						className="transition-all duration-200 ease-linear group-data-[collapsible=icon]:ml-0"
					/>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Content</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/posts")}
									tooltip="Posts"
									render={<Link to="/admin/posts" />}
								>
									<HugeiconsIcon icon={FileText} strokeWidth={2} />
									<span>Posts</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/posts/new" />}
									title="Create post"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create post</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<React.Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentPostsMenu authorId={authorId} pathname={pathname} />
							</React.Suspense>

							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/projects")}
									tooltip="Projects"
									render={<Link to="/admin/projects" />}
								>
									<HugeiconsIcon icon={Briefcase} strokeWidth={2} />
									<span>Projects</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/projects/new" />}
									title="Create project"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create project</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<React.Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentProjectsMenu authorId={authorId} pathname={pathname} />
							</React.Suspense>

							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/media")}
									tooltip="Media"
									render={<Link to="/admin/media" />}
								>
									<HugeiconsIcon icon={Photo} strokeWidth={2} />
									<span>Media</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator className="w-auto!" />

				<SidebarGroup>
					<SidebarGroupLabel>Taxonomy</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/tags")}
									tooltip="Tags"
									render={<Link to="/admin/tags" />}
								>
									<HugeiconsIcon icon={Tag} strokeWidth={2} />
									<span>Tags</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/tags/new" />}
									title="Create tag"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create tag</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/series")}
									tooltip="Series"
									render={<Link to="/admin/series" />}
								>
									<HugeiconsIcon icon={SidebarIcon} strokeWidth={2} />
									<span>Series</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/series/new" />}
									title="Create series"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create series</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/categories")}
									tooltip="Categories"
									render={<Link to="/admin/categories" />}
								>
									<HugeiconsIcon icon={SidebarIcon} strokeWidth={2} />
									<span>Categories</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/categories/new" />}
									title="Create category"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create category</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/technologies")}
									tooltip="Technologies"
									render={<Link to="/admin/technologies" />}
								>
									<HugeiconsIcon icon={Cpu} strokeWidth={2} />
									<span>Technologies</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/technologies/new" />}
									title="Create technology"
								>
									<HugeiconsIcon icon={Plus} strokeWidth={2} />
									<span className="sr-only">Create technology</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							isActive={pathname.startsWith("/admin/settings")}
							tooltip="Settings"
							render={<Link to="/admin/settings" />}
						>
							<HugeiconsIcon icon={Settings} strokeWidth={2} />
							<span>Settings</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

function RecentPostsMenu({
	authorId,
	pathname,
}: {
	authorId: SidebarAuthorId;
	pathname: string;
}) {
	const { data: recentPosts } = useSuspenseQuery(
		convexQuery(api.functions.posts.listRecentPosts, { authorId, limit: 5 }),
	);

	if (recentPosts.length === 0) {
		return (
			<SidebarMenuSub>
				<SidebarMenuSubItem>
					<SidebarMenuSubButton>
						<span>No recent posts yet</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			</SidebarMenuSub>
		);
	}

	return (
		<SidebarMenuSub>
			{recentPosts.map((post) => (
				<SidebarMenuSubItem key={post._id}>
					<SidebarMenuSubButton
						isActive={pathname === `/admin/posts/${post.slug}`}
						render={
							<Link to="/admin/posts/$slugId" params={{ slugId: post.slug }} />
						}
					>
						<span>{post.title}</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			))}
		</SidebarMenuSub>
	);
}

function RecentProjectsMenu({
	authorId,
	pathname,
}: {
	authorId: SidebarAuthorId;
	pathname: string;
}) {
	const { data: recentProjects } = useSuspenseQuery(
		convexQuery(api.functions.projects.listRecentProjects, {
			authorId,
			limit: 5,
		}),
	);

	if (recentProjects.length === 0) {
		return (
			<SidebarMenuSub>
				<SidebarMenuSubItem>
					<SidebarMenuSubButton>
						<span>No recent projects yet</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			</SidebarMenuSub>
		);
	}

	return (
		<SidebarMenuSub>
			{recentProjects.map((project) => (
				<SidebarMenuSubItem key={project._id}>
					<SidebarMenuSubButton
						isActive={pathname === `/admin/projects/${project.slug}`}
						render={
							<Link
								to="/admin/projects/$slugId"
								params={{ slugId: project.slug }}
							/>
						}
					>
						<span>{project.title}</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			))}
		</SidebarMenuSub>
	);
}

export { AdminSidebar as Sidebar };
