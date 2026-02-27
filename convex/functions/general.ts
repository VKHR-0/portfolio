import { query } from "../_generated/server";

export const getOverviewCounts = query({
	args: {},
	handler: async (ctx) => {
		const [posts, projects, tags, series, categories] = await Promise.all([
			ctx.db.query("posts").collect(),
			ctx.db.query("projects").collect(),
			ctx.db.query("tags").collect(),
			ctx.db.query("series").collect(),
			ctx.db.query("categories").collect(),
		]);

		return {
			posts: posts.length,
			projects: projects.length,
			tags: tags.length,
			series: series.length,
			categories: categories.length,
		};
	},
});
