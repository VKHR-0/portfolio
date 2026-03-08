import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getEditableProjectBySlugQuery } from "#/queries";
import { ProjectEditor, ProjectEditorSkeleton } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/$slugId")({
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			getEditableProjectBySlugQuery(params.slugId),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const { data: project } = useQuery(getEditableProjectBySlugQuery(slugId));

	if (project === undefined) {
		return <ProjectEditorSkeleton />;
	}

	return <ProjectEditor initialProject={project} />;
}
