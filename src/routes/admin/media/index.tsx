import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/media/")({
	component: RouteComponent,
});

function RouteComponent() {
	return null;
}
