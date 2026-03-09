import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function listTechnologiesQuery() {
	return convexQuery(api.functions.technologies.list, {
		paginationOpts: {
			numItems: 100,
			cursor: null,
		},
	});
}

export function listAllTechnologiesQuery() {
	return convexQuery(api.functions.technologies.listAll, {});
}
