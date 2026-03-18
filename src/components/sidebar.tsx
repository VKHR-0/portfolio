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
import type { ComponentProps } from "react";
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
import { listRecentPosts, listRecentProjects } from "#/queries/admin";

type NavItem = {
	icon: ComponentProps<typeof HugeiconsIcon>["icon"];
	label: string;
	path: string;
	createPath?: string;
	createLabel?: string;
};

const TAXONOMY_ITEMS: Array<NavItem> = [
	{
		icon: Tag,
		label: "Tags",
		path: "/admin/tags",
		createPath: "/admin/tags/new",
		createLabel: "Create tag",
	},
	{
		icon: SidebarIcon,
		label: "Series",
		path: "/admin/series",
		createPath: "/admin/series/new",
		createLabel: "Create series",
	},
	{
		icon: SidebarIcon,
		label: "Categories",
		path: "/admin/categories",
		createPath: "/admin/categories/new",
		createLabel: "Create category",
	},
	{
		icon: Cpu,
		label: "Technologies",
		path: "/admin/technologies",
		createPath: "/admin/technologies/new",
		createLabel: "Create technology",
	},
];

function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={pathname.startsWith(item.path)}
				tooltip={item.label}
				render={<Link to={item.path} />}
			>
				<HugeiconsIcon icon={item.icon} strokeWidth={2} />
				<span>{item.label}</span>
			</SidebarMenuButton>
			{item.createPath && item.createLabel && (
				<SidebarMenuAction
					render={<Link to={item.createPath} />}
					title={item.createLabel}
				>
					<HugeiconsIcon icon={Plus} strokeWidth={2} />
					<span className="sr-only">{item.createLabel}</span>
				</SidebarMenuAction>
			)}
		</SidebarMenuItem>
	);
}

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
							<NavMenuItem
								item={{
									icon: FileText,
									label: "Posts",
									path: "/admin/posts",
									createPath: "/admin/posts/new",
									createLabel: "Create post",
								}}
								pathname={pathname}
							/>
							<React.Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentPostsMenu pathname={pathname} />
							</React.Suspense>

							<NavMenuItem
								item={{
									icon: Briefcase,
									label: "Projects",
									path: "/admin/projects",
									createPath: "/admin/projects/new",
									createLabel: "Create project",
								}}
								pathname={pathname}
							/>
							<React.Suspense
								fallback={<SidebarMenuSkeleton className="px-2" showIcon />}
							>
								<RecentProjectsMenu pathname={pathname} />
							</React.Suspense>

							<NavMenuItem
								item={{
									icon: Photo,
									label: "Media",
									path: "/admin/media",
								}}
								pathname={pathname}
							/>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator className="w-auto!" />

				<SidebarGroup>
					<SidebarGroupLabel>Taxonomy</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{TAXONOMY_ITEMS.map((item) => (
								<NavMenuItem key={item.path} item={item} pathname={pathname} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<NavMenuItem
						item={{
							icon: Settings,
							label: "Settings",
							path: "/admin/settings",
						}}
						pathname={pathname}
					/>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

function RecentPostsMenu({ pathname }: { pathname: string }) {
	const { data: recentPosts } = useSuspenseQuery(listRecentPosts({ limit: 5 }));

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

function RecentProjectsMenu({ pathname }: { pathname: string }) {
	const { data: recentProjects } = useSuspenseQuery(
		listRecentProjects({ limit: 5 }),
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
