import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/technologies/")({
	component: RouteComponent,
});

function RouteComponent() {
	return null;
}
