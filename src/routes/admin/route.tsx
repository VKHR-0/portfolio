import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Sidebar } from "#/components/sidebar";
import { SidebarProvider } from "#/components/ui/sidebar";

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
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.posts.listRecentPosts, { limit: 5 }),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.projects.listRecentProjects, { limit: 5 }),
			),
		]);
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<SidebarProvider>
			<Sidebar />

			<main className="mx-auto flex min-h-screen w-full">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
