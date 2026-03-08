import { createFileRoute } from "@tanstack/react-router";
import { ProjectEditor } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <ProjectEditor />;
}
