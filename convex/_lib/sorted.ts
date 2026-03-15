import type {
	IndexNames,
	NamedTableInfo,
	PaginationOptions,
} from "convex/server";
import { paginator } from "convex-helpers/server/pagination";
import type { DataModel } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import schema from "../schema";

type TableNames = keyof DataModel;
type SortDirection = "asc" | "desc";

type SortIndexMap<T extends TableNames> = Record<
	string,
	IndexNames<NamedTableInfo<DataModel, T>>
>;

/**
 * Builds an ordered query stream for a table, using the paginator from
 * convex-helpers. The returned stream supports `.paginate()`, `.collect()`,
 * `.first()`, `.take(n)`, etc.
 *
 * Uses the `indexes` map to resolve the sort field to a Convex index.
 * Falls back to `by_creation_time` (descending) when no sort field is provided
 * or the field isn't in the map.
 *
 * @example
 * ```ts
 * const stream = sortedQuery(ctx.db, "tags", {
 *   name: "by_name",
 *   slug: "by_slug",
 * }, { sortField: "name", sortDirection: "asc" });
 *
 * const all = await stream.collect();
 * const first = await stream.first();
 * ```
 */
export function sortedQuery<T extends TableNames>(
	db: DatabaseReader,
	table: T,
	indexes: SortIndexMap<T>,
	options?: {
		sortField?: string;
		sortDirection?: SortDirection;
	},
) {
	const direction = options?.sortDirection ?? "desc";
	const index = options?.sortField ? indexes[options.sortField] : undefined;

	return paginator(db, schema)
		.query(table)
		.withIndex(index ?? "by_creation_time")
		.order(direction);
}

/**
 * Executes a sorted, paginated query using convex-helpers' paginator.
 * Combines sort field resolution with pagination in a single call.
 *
 * @example
 * ```ts
 * return sortedPaginate(ctx.db, "tags", {
 *   name: "by_name",
 *   slug: "by_slug",
 *   _creationTime: "by_creation_time",
 * }, {
 *   sortField: args.sortField,
 *   sortDirection: args.sortDirection,
 *   paginationOpts: args.paginationOpts,
 * });
 * ```
 */
export function sortedPaginate<T extends TableNames>(
	db: DatabaseReader,
	table: T,
	indexes: SortIndexMap<T>,
	options: {
		sortField?: string;
		sortDirection?: SortDirection;
		paginationOpts: PaginationOptions;
	},
) {
	return sortedQuery(db, table, indexes, options).paginate(
		options.paginationOpts,
	);
}
