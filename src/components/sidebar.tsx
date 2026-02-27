import { convexQuery } from "@convex-dev/react-query";
import {
	IconBriefcase,
	IconFileText,
	IconLayoutSidebar,
	IconPlus,
	IconSettings,
	IconTag,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Suspense } from "react";
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
	SidebarTrigger,
} from "#/components/ui/sidebar";

function AdminSidebar() {
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
									<IconFileText />
									<span>Posts</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/posts/new" />}
									title="Create post"
								>
									<IconPlus />
									<span className="sr-only">Create post</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentPostsMenu
									isActive={pathname.startsWith("/admin/posts")}
								/>
							</Suspense>

							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/projects")}
									tooltip="Projects"
									render={<Link to="/admin/projects" />}
								>
									<IconBriefcase />
									<span>Projects</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/projects/new" />}
									title="Create project"
								>
									<IconPlus />
									<span className="sr-only">Create project</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentProjectsMenu
									isActive={pathname.startsWith("/admin/projects")}
								/>
							</Suspense>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

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
									<IconTag />
									<span>Tags</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/tags/new" />}
									title="Create tag"
								>
									<IconPlus />
									<span className="sr-only">Create tag</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/series")}
									tooltip="Series"
									render={<Link to="/admin/series" />}
								>
									<IconLayoutSidebar />
									<span>Series</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/series/new" />}
									title="Create series"
								>
									<IconPlus />
									<span className="sr-only">Create series</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname.startsWith("/admin/categories")}
									tooltip="Categories"
									render={<Link to="/admin/categories" />}
								>
									<IconLayoutSidebar />
									<span>Categories</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									render={<Link to="/admin/categories/new" />}
									title="Create category"
								>
									<IconPlus />
									<span className="sr-only">Create category</span>
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
							<IconSettings />
							<span>Settings</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

function RecentPostsMenu({ isActive }: { isActive: boolean }) {
	const { data: recentPosts } = useSuspenseQuery(
		convexQuery(api.functions.posts.listRecentPosts, { limit: 5 }),
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
						isActive={isActive}
						render={<Link to="/admin/posts" />}
					>
						<span>{post.title}</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			))}
		</SidebarMenuSub>
	);
}

function RecentProjectsMenu({ isActive }: { isActive: boolean }) {
	const { data: recentProjects } = useSuspenseQuery(
		convexQuery(api.functions.projects.listRecentProjects, { limit: 5 }),
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
						isActive={isActive}
						render={<Link to="/admin/projects" />}
					>
						<span>{project.title}</span>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			))}
		</SidebarMenuSub>
	);
}

export { AdminSidebar as Sidebar };
