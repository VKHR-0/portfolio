import type { Store } from "@tanstack/react-store";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type * as React from "react";
import type { AdminTableSearch } from "#/lib/admin-table-sorting";

export type CursorHistoryEntry = {
	cursor: null | string;
	page: number;
};

export type DataTableStoreState = {
	search: AdminTableSearch<string>;
	sorting: SortingState;
	continueCursor: null | string;
	isDone: boolean;
	isLoading: boolean;
	cursorHistory: Array<CursorHistoryEntry>;
};

export type DataTableMeta = {
	columns: Array<ColumnDef<object>>;
	data: Array<object>;
	loadingLabel: string;
	emptyLabel: string;
	getRowId?: (originalRow: object, index: number) => string;
	getRowProps?: (
		originalRow: object,
		index: number,
	) => React.ComponentPropsWithoutRef<"tr"> & Record<string, unknown>;
	tableClassName?: string;
};

export type DataTableActions = {
	goToNextPage: () => void;
	goToPreviousPage: () => void;
	goToPage: (page: number) => void;
	setSorting: (sorting: SortingState) => void;
};

export type DataTableContextValue = {
	actions: DataTableActions;
	meta: DataTableMeta;
	store: Store<DataTableStoreState>;
};

export type DataTableRootProps<TData extends object, TField extends string> = {
	children: React.ReactNode;
	columns: Array<ColumnDef<TData>>;
	data: Array<TData>;
	loadingLabel: string;
	emptyLabel: string;
	isLoading: boolean;
	search: AdminTableSearch<TField>;
	onSearchChange: (
		updater: (prev: AdminTableSearch<TField>) => AdminTableSearch<TField>,
	) => void;
	pagination: {
		continueCursor: null | string;
		isDone: boolean;
	};
	getRowId?: (originalRow: TData, index: number) => string;
	getRowProps?: (
		originalRow: TData,
		index: number,
	) => React.ComponentPropsWithoutRef<"tr"> & Record<string, unknown>;
	tableClassName?: string;
};

export type EditableCellProps = {
	isEditing: boolean;
	displayValue: string;
	onDoubleClick: () => void;
	className?: string;
	children: React.ReactNode;
};
