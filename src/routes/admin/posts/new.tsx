import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	listCategoriesQuery,
	listProjectsQuery,
	listSeriesQuery,
	listTagsQuery,
} from "#/queries";
import { PostEditor, PostEditorSkeleton } from "./-post-editor";

export const Route = createFileRoute("/admin/posts/new")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listProjectsQuery()),
			context.queryClient.ensureQueryData(listCategoriesQuery()),
			context.queryClient.ensureQueryData(listSeriesQuery()),
			context.queryClient.ensureQueryData(listTagsQuery()),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: projectsResult } = useQuery(listProjectsQuery());
	const { data: categoriesResult } = useQuery(listCategoriesQuery());
	const { data: seriesResult } = useQuery(listSeriesQuery());
	const { data: tagsResult } = useQuery(listTagsQuery());

	if (
		projectsResult === undefined ||
		categoriesResult === undefined ||
		seriesResult === undefined ||
		tagsResult === undefined
	) {
		return <PostEditorSkeleton />;
	}

	return (
		<PostEditor
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
