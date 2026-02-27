import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Sidebar } from "#/components/sidebar";
import { SidebarProvider } from "#/components/ui/sidebar";
import { getCurrentUser } from "#/functions/auth";

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
		const user = await getCurrentUser();

		await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.posts.listRecentPosts, {
					limit: 5,
					authorId: user._id,
				}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.functions.projects.listRecentProjects, {
					limit: 5,
					authorId: user._id,
				}),
			),
		]);

		return {
			authorId: user._id,
		};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { authorId } = Route.useLoaderData();

	return (
		<SidebarProvider>
			<Sidebar authorId={authorId} />

			<main className="mx-auto flex min-h-screen w-full py-2 pr-2">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
