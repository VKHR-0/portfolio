import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { listAllTechnologiesQuery } from "#/queries";
import { ProjectEditor, ProjectEditorSkeleton } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/new")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listAllTechnologiesQuery());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: technologies } = useQuery(listAllTechnologiesQuery());

	if (technologies === undefined) {
		return <ProjectEditorSkeleton />;
	}

	return <ProjectEditor technologies={technologies} />;
}
