import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

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
	component: () => <Outlet />,
});
