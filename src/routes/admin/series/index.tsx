import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/series/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/series/"!</div>;
}
