import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function getEditablePostBySlugQuery(slug: string) {
	return convexQuery(api.functions.posts.getEditableBySlug, {
		slug,
	});
}

export function getPublicPostBySlugQuery(slug: string) {
	return convexQuery(api.functions.posts.getPublicBySlug, {
		slug,
	});
}
