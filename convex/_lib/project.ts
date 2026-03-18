import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { resolveImageUrl } from "./media";

export function filterNonNull<T>(items: Array<T | null>): Array<T> {
	return items.filter((item): item is T => item !== null);
}

export async function resolveProjectTechnologies(
	ctx: QueryCtx,
	projectId: Id<"projects">,
) {
	const techRows = await ctx.db
		.query("projectTechnology")
		.withIndex("by_project", (q) => q.eq("projectId", projectId))
		.collect();

	const technologies = await Promise.all(
		techRows.map((row) => ctx.db.get(row.technologyId)),
	);

	return filterNonNull(technologies).map(({ name, color }) => ({
		name,
		color,
	}));
}

export async function resolveProjectRelations(
	ctx: QueryCtx,
	project: { _id: Id<"projects">; imageId?: Id<"media"> },
) {
	const [technologies, imageUrl] = await Promise.all([
		resolveProjectTechnologies(ctx, project._id),
		resolveImageUrl(ctx, project.imageId),
	]);

	return { technologies, imageUrl };
}
