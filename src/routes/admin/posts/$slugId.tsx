import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	getEditablePostBySlugQuery,
	listCategoriesQuery,
	listProjectsQuery,
	listSeriesQuery,
	listTagsQuery,
} from "#/queries";
import { PostEditor, PostEditorSkeleton } from "./-post-editor";

export const Route = createFileRoute("/admin/posts/$slugId")({
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listProjectsQuery()),
			context.queryClient.ensureQueryData(listCategoriesQuery()),
			context.queryClient.ensureQueryData(listSeriesQuery()),
			context.queryClient.ensureQueryData(listTagsQuery()),
			context.queryClient.ensureQueryData(
				getEditablePostBySlugQuery(params.slugId),
			),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const { data: post } = useQuery(getEditablePostBySlugQuery(slugId));
	const { data: projectsResult } = useQuery(listProjectsQuery());
	const { data: categoriesResult } = useQuery(listCategoriesQuery());
	const { data: seriesResult } = useQuery(listSeriesQuery());
	const { data: tagsResult } = useQuery(listTagsQuery());

	if (
		post === undefined ||
		projectsResult === undefined ||
		categoriesResult === undefined ||
		seriesResult === undefined ||
		tagsResult === undefined
	) {
		return <PostEditorSkeleton />;
	}

	return (
		<PostEditor
			initialPost={post}
			projects={projectsResult.page.map((project) => ({
				id: project._id,
				label: project.title,
				description: project.slug,
			}))}
			categories={categoriesResult.page.map((category) => ({
				id: category._id,
				label: category.name,
				description: category.slug,
			}))}
			series={seriesResult.page.map((item) => ({
				id: item._id,
				label: item.name,
				description: item.slug,
			}))}
			tags={tagsResult.page.map((tag) => ({
				id: tag._id,
				label: tag.name,
				description: tag.slug,
			}))}
		/>
	);
}
