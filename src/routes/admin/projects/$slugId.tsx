import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getProjectBySlug, listTechnologies } from "#/queries/admin";
import { ProjectEditor, ProjectEditorSkeleton } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/$slugId")({
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(getProjectBySlug(params.slugId)),
			context.queryClient.ensureQueryData(
				listTechnologies({ sortField: "name", sortDirection: "asc" }),
			),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const { data: project } = useQuery(getProjectBySlug(slugId));
	const { data: technologiesResult } = useQuery(
		listTechnologies({ sortField: "name", sortDirection: "asc" }),
	);

	if (project === undefined || technologiesResult === undefined) {
		return <ProjectEditorSkeleton />;
	}

	return (
		<ProjectEditor
			initialProject={project}
			technologies={technologiesResult.page}
		/>
	);
}
