import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ErrorPage, LoadingPage, NotFoundPage } from "#/components/shell";
import { AuthedPage } from "#/components/shell/authed";
import { MobileSidebarTrigger, Sidebar } from "#/components/sidebar";
import { SidebarProvider } from "#/components/ui/sidebar";
import { getSidebarOpenState } from "#/functions/sidebar";
import { listRecentPosts, listRecentProjects } from "#/queries/admin";

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
			return { isSidebarOpen: false };
		}

		const isSidebarOpen = await getSidebarOpenState();

		await Promise.all([
			context.queryClient.ensureQueryData(listRecentPosts({ limit: 5 })),
			context.queryClient.ensureQueryData(listRecentProjects({ limit: 5 })),
		]);

		return {
			isSidebarOpen,
		};
	},
	component: AdminLayout,
	pendingComponent: LoadingPage,
	errorComponent: ErrorPage,
	notFoundComponent: NotFoundPage,
});

export function AdminLayout() {
	const { isSidebarOpen } = Route.useLoaderData();

	if (!Route.useRouteContext().isAuthenticated) {
		return (
			<main className="mx-auto flex min-h-screen w-full place-items-center py-2 pr-2 pl-2">
				<Outlet />
			</main>
		);
	}

	return (
		<AuthedPage>
			<SidebarProvider defaultOpen={isSidebarOpen}>
				<MobileSidebarTrigger />
				<Sidebar />

				<main className="mx-auto flex min-h-screen w-full py-2 pr-2 pl-2 md:pl-0">
					<Outlet />
				</main>
			</SidebarProvider>
		</AuthedPage>
	);
}
