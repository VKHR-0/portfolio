import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function listTagsQuery() {
	return convexQuery(api.functions.tags.list, {
		paginationOpts: {
			numItems: 200,
			cursor: null,
		},
	});
}
