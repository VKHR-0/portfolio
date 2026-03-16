import { Store } from "@tanstack/react-store";
import * as React from "react";
import {
	type AdminTableSearch,
	applySortingToSearch,
	getCursorFromSearch,
	getNextPageSearch,
	getPageFromSearch,
	getPreviousPageSearch,
	sortingStateFromSearch,
} from "#/lib/admin-table-sorting";
import { DataTableContext } from "./context";
import type {
	DataTableActions,
	DataTableContextValue,
	DataTableMeta,
	DataTableRootProps,
	DataTableStoreState,
} from "./types";

function getSortKey(search: AdminTableSearch<string>) {
	return `${search.sortField ?? ""}:${search.sortDirection ?? ""}`;
}

export function DataTableRoot<TData extends object, TField extends string>({
	children,
	columns,
	data,
	loadingLabel,
	emptyLabel,
	isLoading,
	search,
	onSearchChange,
	pagination,
	getRowId,
	getRowProps,
	tableClassName,
}: DataTableRootProps<TData, TField>) {
	const internalNavigationRef = React.useRef(false);
	const widenedSearch = search as AdminTableSearch<string>;
	const store = React.useState(
		() =>
			new Store<DataTableStoreState>({
				search: widenedSearch,
				sorting: sortingStateFromSearch(widenedSearch),
				continueCursor: pagination.continueCursor,
				isDone: pagination.isDone,
				isLoading,
				cursorHistory: [],
			}),
	)[0];

	React.useEffect(() => {
		store.setState((previousState) => {
			const sortChanged =
				getSortKey(previousState.search) !== getSortKey(widenedSearch);
			const pageChanged =
				getCursorFromSearch(previousState.search) !==
					getCursorFromSearch(widenedSearch) ||
				getPageFromSearch(previousState.search) !==
					getPageFromSearch(widenedSearch);
			const shouldResetHistory =
				sortChanged || (!internalNavigationRef.current && pageChanged);

			return {
				...previousState,
				search: widenedSearch,
				sorting: sortingStateFromSearch(widenedSearch),
				continueCursor: pagination.continueCursor,
				isDone: pagination.isDone,
				isLoading,
				cursorHistory: shouldResetHistory ? [] : previousState.cursorHistory,
			};
		});
		internalNavigationRef.current = false;
	}, [
		isLoading,
		pagination.continueCursor,
		pagination.isDone,
		store,
		widenedSearch,
	]);

	const updateSearch = React.useCallback(
		(updater: (prev: AdminTableSearch<string>) => AdminTableSearch<string>) => {
			internalNavigationRef.current = true;
			onSearchChange(
				(previousSearch) =>
					updater(
						previousSearch as unknown as AdminTableSearch<string>,
					) as AdminTableSearch<TField>,
			);
		},
		[onSearchChange],
	);

	const actions = React.useMemo<DataTableActions>(
		() => ({
			setSorting: (nextSorting) => {
				store.setState((previousState) => ({
					...previousState,
					cursorHistory: [],
					sorting: nextSorting,
				}));
				updateSearch(() => applySortingToSearch(nextSorting));
			},
			goToNextPage: () => {
				const currentState = store.state;
				const nextCursor = currentState.continueCursor;

				if (!nextCursor || currentState.isLoading || currentState.isDone) {
					return;
				}

				store.setState((previousState) => ({
					...previousState,
					cursorHistory: [
						...previousState.cursorHistory,
						{
							cursor: getCursorFromSearch(previousState.search),
							page: getPageFromSearch(previousState.search),
						},
					],
				}));
				updateSearch((previousSearch) =>
					getNextPageSearch(previousSearch, nextCursor),
				);
			},
			goToPreviousPage: () => {
				const previousPage =
					store.state.cursorHistory[store.state.cursorHistory.length - 1];

				if (!previousPage) {
					return;
				}

				store.setState((previousState) => ({
					...previousState,
					cursorHistory: previousState.cursorHistory.slice(0, -1),
				}));
				updateSearch((previousSearch) =>
					getPreviousPageSearch(previousSearch, previousPage),
				);
			},
			goToPage: (targetPage: number) => {
				const targetIndex = targetPage - 1;

				if (targetIndex < 0 || targetIndex > store.state.cursorHistory.length) {
					return;
				}

				if (targetIndex < store.state.cursorHistory.length) {
					const pageEntry = store.state.cursorHistory[targetIndex];
					store.setState((previousState) => ({
						...previousState,
						cursorHistory: previousState.cursorHistory.slice(0, targetIndex),
					}));
					updateSearch((previousSearch) => ({
						...previousSearch,
						cursor: pageEntry.cursor ?? undefined,
						page: pageEntry.page,
					}));
					return;
				}

				actions.goToNextPage();
			},
		}),
		[store, updateSearch],
	);

	const meta = React.useMemo<DataTableMeta>(
		() => ({
			columns: columns as unknown as DataTableMeta["columns"],
			data: data as DataTableMeta["data"],
			loadingLabel,
			emptyLabel,
			getRowId: getRowId
				? (originalRow, index) => getRowId(originalRow as TData, index)
				: undefined,
			getRowProps: getRowProps
				? (originalRow, index) => getRowProps(originalRow as TData, index)
				: undefined,
			tableClassName,
		}),
		[
			columns,
			data,
			emptyLabel,
			getRowId,
			getRowProps,
			loadingLabel,
			tableClassName,
		],
	);

	const value = React.useMemo<DataTableContextValue>(
		() => ({
			actions,
			meta,
			store,
		}),
		[actions, meta, store],
	);

	return (
		<DataTableContext.Provider value={value}>
			{children}
		</DataTableContext.Provider>
	);
}
