import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function listProjectsQuery() {
	return convexQuery(api.functions.projects.list, {
		paginationOpts: {
			numItems: 100,
			cursor: null,
		},
	});
}
