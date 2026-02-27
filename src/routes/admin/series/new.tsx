import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/series/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/series/new"!</div>;
}
