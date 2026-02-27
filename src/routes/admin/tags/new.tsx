import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/tags/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/tags/new"!</div>;
}
