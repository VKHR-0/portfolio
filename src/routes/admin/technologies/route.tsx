import { createFileRoute, Outlet } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createSearchParamsSchema } from "#/lib/table-search-params";
import {
	getTechnologiesAdminQuery,
	TECH_SORT_FIELDS,
	TechnologiesAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/technologies")({
	validateSearch: zodValidator(createSearchParamsSchema(TECH_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			getTechnologiesAdminQuery(deps.search),
		);
	},
	component: TechnologiesRouteComponent,
});

export function TechnologiesRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<TechnologiesAdminResource
			search={Route.useSearch()}
			onSearchChange={(updater) => {
				void navigate({
					search: (previousSearch) => updater(previousSearch),
				});
			}}
			extraOverlays={<Outlet />}
		/>
	);
}
