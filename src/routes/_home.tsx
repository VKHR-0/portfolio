import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_home")({
	component: HomeLayout,
});

function HomeLayout() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
			<Outlet />
		</main>
	);
}
