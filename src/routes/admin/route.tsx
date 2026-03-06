import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Sidebar } from "#/components/sidebar";
import { SidebarProvider } from "#/components/ui/sidebar";
import { getCurrentUserId } from "#/server/auth";
import { getSidebarOpenState } from "#/server/sidebar";

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
		if (!context.isAuthenticated) {
			return { authorId: null, isSidebarOpen: false };
		}

		const [id, isSidebarOpen] = await Promise.all([
			getCurrentUserId(),
			getSidebarOpenState(),
		]);

		await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.posts.listRecentPosts, {
					limit: 5,
					authorId: id,
				}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.projects.listRecentProjects, {
					limit: 5,
					authorId: id,
				}),
			),
		]);

		return {
			authorId: id,
			isSidebarOpen,
		};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { authorId, isSidebarOpen } = Route.useLoaderData();

	if (!authorId) {
		return (
			<main className="mx-auto flex min-h-screen w-full place-items-center py-2 pr-2 pl-2">
				<Outlet />
			</main>
		);
	}

	return (
		<SidebarProvider open={isSidebarOpen}>
			<Sidebar authorId={authorId} />

			<main className="mx-auto flex min-h-screen w-full py-2 pr-2 pl-2 md:pl-0">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
