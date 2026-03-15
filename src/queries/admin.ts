import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

type PaginationOpts = {
	numItems?: number;
	cursor?: string | null;
};

type SortDirection = "asc" | "desc";

type ListParams<TSort extends string> = {
	paginationOpts?: PaginationOpts;
	sortField?: TSort;
	sortDirection?: SortDirection;
};

const DEFAULT_PAGINATION: Required<PaginationOpts> = {
	numItems: 20,
	cursor: null,
};

type NameSlugCreationSort = "name" | "slug" | "_creationTime";
type TitleSlugCreationSort = "title" | "slug" | "_creationTime";
type PostSort = "title" | "slug" | "status" | "_creationTime";

function buildPayload<T extends string>(
	params?: ListParams<T>,
	defaultSortField?: T,
	defaultSortDirection?: SortDirection,
) {
	return {
		paginationOpts: {
			...DEFAULT_PAGINATION,
			...(params?.paginationOpts ?? {}),
		},
		sortField: params?.sortField ?? defaultSortField,
		sortDirection: params?.sortDirection ?? defaultSortDirection,
	};
}

export function getPostBySlug(slug: string) {
	return convexQuery(api.functions.posts.getEditableBySlug, { slug });
}

export function getProjectBySlug(slug: string) {
	return convexQuery(api.functions.projects.getEditableBySlug, { slug });
}

export function getMediaBySlug(slug: string) {
	return convexQuery(api.functions.media.getBySlug, { slug });
}

export function listPosts(params?: ListParams<PostSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.posts.list, payload);
}

export function listTechnologies(params?: ListParams<NameSlugCreationSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.technologies.list, payload);
}

export function listCategories(params?: ListParams<NameSlugCreationSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.categories.list, payload);
}

export function listProjects(params?: ListParams<TitleSlugCreationSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.projects.list, payload);
}

export function listSeries(params?: ListParams<NameSlugCreationSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.series.list, payload);
}

export function listTags(params?: ListParams<NameSlugCreationSort>) {
	const payload = buildPayload(params);
	return convexQuery(api.functions.tags.list, payload);
}

export function listMedia(params?: { paginationOpts?: PaginationOpts }) {
	return convexQuery(api.functions.media.list, {
		paginationOpts: {
			...DEFAULT_PAGINATION,
			...(params?.paginationOpts ?? {}),
		},
	});
}

export function listRecentPosts(params?: { limit?: number }) {
	return convexQuery(api.functions.posts.listRecent, {
		limit: params?.limit,
	});
}

export function listRecentProjects(params?: { limit?: number }) {
	return convexQuery(api.functions.projects.listRecent, {
		limit: params?.limit,
	});
}
