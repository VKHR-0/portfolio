import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_home")({
	component: HomeLayout,
});

function HomeLayout() {
	return (
		<main className="grid min-h-screen place-items-center">
			<Outlet />
		</main>
	);
}
