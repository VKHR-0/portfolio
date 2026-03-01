import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/posts/$slugId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/posts/edit"!</div>;
}
