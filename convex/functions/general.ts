import { query } from "../_generated/server";

export const getOverviewCounts = query({
	args: {},
	handler: async (ctx) => {
		const [posts, projects, tags, series, categories, media] =
			await Promise.all([
				ctx.db.query("posts").collect(),
				ctx.db.query("projects").collect(),
				ctx.db.query("tags").collect(),
				ctx.db.query("series").collect(),
				ctx.db.query("categories").collect(),
				ctx.db.query("media").collect(),
			]);

		return {
			posts: posts.length,
			projects: projects.length,
			tags: tags.length,
			series: series.length,
			categories: categories.length,
			media: media.length,
		};
	},
});
