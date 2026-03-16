import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createSearchParamsSchema } from "#/lib/table-search-params";
import {
	getPostsAdminQuery,
	POST_SORT_FIELDS,
	PostsAdminResource,
} from "./-resource";

export const Route = createFileRoute("/admin/posts/")({
	validateSearch: zodValidator(createSearchParamsSchema(POST_SORT_FIELDS)),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(getPostsAdminQuery(deps.search));
	},
	component: PostsRouteComponent,
});

export function PostsRouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<PostsAdminResource
			search={Route.useSearch()}
			onSearchChange={(updater) => {
				void navigate({
					search: (previousSearch) => updater(previousSearch),
				});
			}}
		/>
	);
}
