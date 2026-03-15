import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	getPostBySlug,
	listCategories,
	listProjects,
	listSeries,
	listTags,
} from "#/queries/admin";
import { PostEditor, PostEditorSkeleton } from "./-post-editor";

export const Route = createFileRoute("/admin/posts/$slugId")({
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listProjects()),
			context.queryClient.ensureQueryData(listCategories()),
			context.queryClient.ensureQueryData(listSeries()),
			context.queryClient.ensureQueryData(listTags()),
			context.queryClient.ensureQueryData(getPostBySlug(params.slugId)),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { slugId } = Route.useParams();
	const { data: post } = useQuery(getPostBySlug(slugId));
	const { data: projectsResult } = useQuery(listProjects());
	const { data: categoriesResult } = useQuery(listCategories());
	const { data: seriesResult } = useQuery(listSeries());
	const { data: tagsResult } = useQuery(listTags());

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
