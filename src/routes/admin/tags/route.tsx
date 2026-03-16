import { createFileRoute, Outlet } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createAdminTableSearchSchema } from "#/lib/admin-table-sorting";
import {
	getTagsAdminQuery,
	TAG_SORT_FIELDS,
	TagsAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/tags")({
	validateSearch: zodValidator(createAdminTableSearchSchema(TAG_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(getTagsAdminQuery(deps.search));
	},
	component: TagsRouteComponent,
});

export function TagsRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<TagsAdminResource
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
