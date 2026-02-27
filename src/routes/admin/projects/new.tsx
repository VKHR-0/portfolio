import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/projects/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/projects/new"!</div>;
}
