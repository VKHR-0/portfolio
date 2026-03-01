import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function listCategoriesQuery() {
	return convexQuery(api.functions.categories.list, {
		paginationOpts: {
			numItems: 100,
			cursor: null,
		},
	});
}
