import { createFileRoute, Outlet } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createSearchParamsSchema } from "#/lib/table-search-params";
import {
	CATEGORY_SORT_FIELDS,
	CategoriesAdminResource,
	getCategoriesAdminQuery,
} from "./-resource";

export const Route = createFileRoute("/admin/categories")({
	validateSearch: zodValidator(createSearchParamsSchema(CATEGORY_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			getCategoriesAdminQuery(deps.search),
		);
	},
	component: CategoriesRouteComponent,
});

export function CategoriesRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<CategoriesAdminResource
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
