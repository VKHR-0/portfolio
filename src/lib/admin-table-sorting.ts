import type { SortingState } from "@tanstack/react-table";
import z from "zod";

export type AdminTableSortDirection = "asc" | "desc";

export type AdminTableSearch<TField extends string> = {
	sortField?: TField;
	sortDirection?: AdminTableSortDirection;
	cursor?: string;
	page?: number;
};

export function createAdminTableSearchSchema<
	const TFields extends readonly [string, ...Array<string>],
>(fields: TFields) {
	return z
		.object({
			sortField: z.enum(fields).optional(),
			sortDirection: z.enum(["asc", "desc"]).optional(),
			cursor: z.string().min(1).optional(),
			page: z.coerce.number().int().positive().optional(),
		})
		.transform((value) => {
			const search: AdminTableSearch<(typeof fields)[number]> = {};

			if (value.sortField) {
				search.sortField = value.sortField;
				search.sortDirection = value.sortDirection ?? "desc";
			}

			if (value.cursor) {
				search.cursor = value.cursor;
			}

			if (value.page && value.page > 1) {
				search.page = value.page;
			}

			return search;
		});
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

export function getCursorFromSearch<TField extends string>(
	search: AdminTableSearch<TField>,
): null | string {
	return search.cursor ?? null;
}

export function getPageFromSearch<TField extends string>(
	search: AdminTableSearch<TField>,
): number {
	return search.page ?? 1;
}

export function applySortingToSearch<TField extends string>(
	sorting: SortingState,
): AdminTableSearch<TField> {
	const nextSorting = searchFromSortingState<TField>(sorting);

	return {
		sortField: nextSorting.sortField,
		sortDirection: nextSorting.sortDirection,
		cursor: undefined,
		page: undefined,
	};
}

export function getNextPageSearch<TField extends string>(
	search: AdminTableSearch<TField>,
	cursor: string,
): AdminTableSearch<TField> {
	return {
		sortField: search.sortField,
		sortDirection: search.sortDirection,
		cursor,
		page: getPageFromSearch(search) + 1,
	};
}

export function getPreviousPageSearch<TField extends string>(
	search: AdminTableSearch<TField>,
	pageState: { cursor: null | string; page: number },
): AdminTableSearch<TField> {
	return {
		sortField: search.sortField,
		sortDirection: search.sortDirection,
		cursor: pageState.cursor ?? undefined,
		page: pageState.page > 1 ? pageState.page : undefined,
	};
}
