import { createFileRoute, Outlet } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createAdminTableSearchSchema } from "#/lib/admin-table-sorting";
import {
	getSeriesAdminQuery,
	SERIES_SORT_FIELDS,
	SeriesAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/series")({
	validateSearch: zodValidator(
		createAdminTableSearchSchema(SERIES_SORT_FIELDS),
	),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(getSeriesAdminQuery(deps.search));
	},
	component: SeriesRouteComponent,
});

export function SeriesRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<SeriesAdminResource
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
