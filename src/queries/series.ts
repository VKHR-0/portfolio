import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export function listSeriesQuery() {
	return convexQuery(api.functions.series.list, {
		paginationOpts: {
			numItems: 100,
			cursor: null,
		},
	});
}
