import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function getPostBySlug(slug: string) {
	return convexQuery(api.functions.posts.getPublicBySlug, { slug });
}

export function getProjectBySlug(slug: string) {
	return convexQuery(api.functions.projects.getPublicBySlug, { slug });
}
