import type { SortingState } from "@tanstack/react-table";
import { z } from "zod";

export type AdminTableSortDirection = "asc" | "desc";

export type AdminTableSearch<TField extends string> = {
	sortField?: TField;
	sortDirection?: AdminTableSortDirection;
};

export function createAdminTableSearchSchema<
	const TFields extends readonly [string, ...Array<string>],
>(fields: TFields) {
	return z
		.object({
			sortField: z.enum(fields).optional(),
			sortDirection: z.enum(["asc", "desc"]).optional(),
		})
		.transform((value) =>
			value.sortField
				? {
						sortField: value.sortField,
						sortDirection: value.sortDirection ?? "desc",
					}
				: {},
		);
}

export function sortingStateFromSearch<TField extends string>(
	search: AdminTableSearch<TField>,
): SortingState {
	if (!search.sortField) {
		return [];
	}

	return [{ id: search.sortField, desc: search.sortDirection !== "asc" }];
}

export function searchFromSortingState<TField extends string>(
	sorting: SortingState,
): AdminTableSearch<TField> {
	const nextSort = sorting[0];

	if (!nextSort) {
		return {};
	}

	return {
		sortField: nextSort.id as TField,
		sortDirection: nextSort.desc ? "desc" : "asc",
	};
}
