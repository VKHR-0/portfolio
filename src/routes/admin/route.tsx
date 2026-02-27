import {
	IconBriefcase,
	IconFileText,
	IconLayoutSidebar,
	IconPlus,
	IconSettings,
	IconTag,
} from "@tabler/icons-react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
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
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context, location }) => {
		if (location.pathname === "/admin/login") {
			return;
		}
		if (!context.isAuthenticated) {
			throw redirect({
				to: "/admin/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	const recentPosts = useQuery(api.adminSidebar.listRecentPosts, { limit: 5 });
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<SidebarProvider>
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
								{recentPosts === undefined && (
									<SidebarMenuSkeleton className="px-2" showIcon />
								)}
								{recentPosts?.length === 0 && (
									<SidebarMenuSub>
										<SidebarMenuSubItem>
											<SidebarMenuSubButton>
												<span>No recent posts yet</span>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									</SidebarMenuSub>
								)}
								{recentPosts && recentPosts.length > 0 && (
									<SidebarMenuSub>
										{recentPosts.map((post) => (
											<SidebarMenuSubItem key={post._id}>
												<SidebarMenuSubButton
													isActive={pathname.startsWith("/admin/posts")}
													render={<Link to="/admin/posts" />}
												>
													<span>{post.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								)}
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

			<main className="mx-auto flex min-h-screen w-full">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
