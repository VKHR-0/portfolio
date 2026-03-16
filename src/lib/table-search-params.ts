import type { SortingState } from "@tanstack/react-table";
import z from "zod";

export type TableSearchParams<TField extends string> = {
	sortField?: TField;
	sortDirection?: "asc" | "desc";
	cursor?: string;
	page?: number;
};

export function createSearchParamsSchema<
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
			const search: TableSearchParams<(typeof fields)[number]> = {};

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

export function toSortingState<TField extends string>(
	search: TableSearchParams<TField>,
): SortingState {
	if (!search.sortField) {
		return [];
	}

	return [{ id: search.sortField, desc: search.sortDirection !== "asc" }];
}

export function toSearchParams<TField extends string>(
	sorting: SortingState,
): TableSearchParams<TField> {
	const nextSort = sorting[0];

	if (!nextSort) {
		return {};
	}

	return {
		sortField: nextSort.id as TField,
		sortDirection: nextSort.desc ? "desc" : "asc",
	};
}

export function getCursor<TField extends string>(
	search: TableSearchParams<TField>,
): null | string {
	return search.cursor ?? null;
}

export function getPage<TField extends string>(
	search: TableSearchParams<TField>,
): number {
	return search.page ?? 1;
}

export function applySorting<TField extends string>(
	sorting: SortingState,
): TableSearchParams<TField> {
	const nextSorting = toSearchParams<TField>(sorting);

	return {
		sortField: nextSorting.sortField,
		sortDirection: nextSorting.sortDirection,
		cursor: undefined,
		page: undefined,
	};
}

export function getNextPage<TField extends string>(
	search: TableSearchParams<TField>,
	cursor: string,
): TableSearchParams<TField> {
	return {
		sortField: search.sortField,
		sortDirection: search.sortDirection,
		cursor,
		page: getPage(search) + 1,
	};
}

export function getPrevPage<TField extends string>(
	search: TableSearchParams<TField>,
	pageState: { cursor: null | string; page: number },
): TableSearchParams<TField> {
	return {
		sortField: search.sortField,
		sortDirection: search.sortDirection,
		cursor: pageState.cursor ?? undefined,
		page: pageState.page > 1 ? pageState.page : undefined,
	};
}
