import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createAdminTableSearchSchema } from "#/lib/admin-table-sorting";
import {
	getProjectsAdminQuery,
	PROJECT_SORT_FIELDS,
	ProjectsAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/projects/")({
	validateSearch: zodValidator(
		createAdminTableSearchSchema(PROJECT_SORT_FIELDS),
	),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			getProjectsAdminQuery(deps.search),
		);
	},
	component: ProjectsRouteComponent,
});

export function ProjectsRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<ProjectsAdminResource
			search={Route.useSearch()}
			onSearchChange={(updater) => {
				void navigate({
					search: (previousSearch) => updater(previousSearch),
				});
			}}
		/>
	);
}
