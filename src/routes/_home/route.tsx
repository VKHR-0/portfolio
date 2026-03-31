import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loading } from "./-loading";
import { NotFound } from "./-not-found";

export const Route = createFileRoute("/_home")({
	component: HomeLayout,

	pendingMinMs: 0,

	pendingComponent: Loading,
	notFoundComponent: NotFound,
});

function HomeLayout() {
	return (
		<div className="flex min-h-screen flex-col">
			<Outlet />
		</div>
	);
}
