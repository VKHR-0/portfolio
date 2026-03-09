import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	getEditableProjectBySlugQuery,
	listAllTechnologiesQuery,
} from "#/queries";
import { ProjectEditor, ProjectEditorSkeleton } from "./-project-editor";

export const Route = createFileRoute("/admin/projects/$slugId")({
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				getEditableProjectBySlugQuery(params.slugId),
			),
			context.queryClient.ensureQueryData(listAllTechnologiesQuery()),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const { data: project } = useQuery(getEditableProjectBySlugQuery(slugId));
	const { data: technologies } = useQuery(listAllTechnologiesQuery());

	if (project === undefined || technologies === undefined) {
		return <ProjectEditorSkeleton />;
	}

	return <ProjectEditor initialProject={project} technologies={technologies} />;
}
