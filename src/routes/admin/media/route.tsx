import { createFileRoute, Outlet } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createAdminTableSearchSchema } from "#/lib/admin-table-sorting";
import {
	getMediaAdminQuery,
	MEDIA_SORT_FIELDS,
	MediaAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/media")({
	validateSearch: zodValidator(createAdminTableSearchSchema(MEDIA_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(getMediaAdminQuery(deps.search));
	},
	component: MediaRouteComponent,
});

export function MediaRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<MediaAdminResource
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
