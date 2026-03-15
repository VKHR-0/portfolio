import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { listTechnologies } from "#/queries/admin";
import { ProjectEditor, ProjectEditorSkeleton } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/new")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			listTechnologies({ sortField: "name", sortDirection: "asc" }),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: technologiesResult } = useQuery(
		listTechnologies({ sortField: "name", sortDirection: "asc" }),
	);

	if (technologiesResult === undefined) {
		return <ProjectEditorSkeleton />;
	}

	return <ProjectEditor technologies={technologiesResult.page} />;
}
