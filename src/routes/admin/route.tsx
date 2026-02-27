import { IconSettings } from "@tabler/icons-react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
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
				<SidebarContent>Content</SidebarContent>
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
