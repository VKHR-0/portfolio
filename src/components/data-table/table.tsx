import {
	ArrowUpDown,
	ChevronDown,
	ChevronUp,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { shallow, useStore } from "@tanstack/react-store";
import {
	flexRender,
	getCoreRowModel,
	type RowData,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";
import { useDataTableContext } from "./context";
import type { DataTableMeta } from "./types";

declare const columnMetaType: unique symbol;

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		headerClassName?: string;
		cellClassName?: string;
		[columnMetaType]?: {
			data: TData;
			value: TValue;
		};
	}
}

function getNextSortingState(
	columnId: string,
	currentSort: false | "asc" | "desc",
): SortingState {
	if (currentSort === false) {
		return [{ id: columnId, desc: true }];
	}

	if (currentSort === "desc") {
		return [{ id: columnId, desc: false }];
	}

	return [];
}

function useAdminReactTable({
	columns,
	data,
	getRowId,
	sorting,
}: Pick<DataTableMeta, "columns" | "data" | "getRowId"> & {
	sorting: SortingState;
}) {
	"use no memo";

	return useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		enableMultiSort: false,
		state: {
			sorting,
		},
		getRowId,
	});
}

export function DataTableTable() {
	const { actions, meta, store } = useDataTableContext();
	const { isLoading, sorting } = useStore(
		store,
		(state) => ({
			isLoading: state.isLoading,
			sorting: state.sorting,
		}),
		shallow,
	);
	const table = useAdminReactTable({
		columns: meta.columns,
		data: meta.data,
		getRowId: meta.getRowId,
		sorting,
	});

	return (
		<Table className={cn("table-fixed", meta.tableClassName)}>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							const canSort = header.column.getCanSort();
							const currentSort = header.column.getIsSorted();

							return (
								<TableHead
									key={header.id}
									className={header.column.columnDef.meta?.headerClassName}
								>
									{header.isPlaceholder ? null : canSort ? (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="-ml-2 h-8 px-2 hover:bg-muted/80"
											onClick={() =>
												actions.setSorting(
													getNextSortingState(header.column.id, currentSort),
												)
											}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
											{currentSort === "desc" ? (
												<HugeiconsIcon
													icon={ChevronDown}
													strokeWidth={2}
													data-icon="inline-end"
												/>
											) : currentSort === "asc" ? (
												<HugeiconsIcon
													icon={ChevronUp}
													strokeWidth={2}
													data-icon="inline-end"
												/>
											) : (
												<HugeiconsIcon
													icon={ArrowUpDown}
													strokeWidth={2}
													data-icon="inline-end"
													className="text-muted-foreground"
												/>
											)}
										</Button>
									) : (
										flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)
									)}
								</TableHead>
							);
						})}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{isLoading ? (
					<TableRow>
						<TableCell
							colSpan={table.getAllLeafColumns().length}
							className="h-24 text-center text-muted-foreground"
						>
							{meta.loadingLabel}
						</TableCell>
					</TableRow>
				) : table.getRowModel().rows.length > 0 ? (
					table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
							{...(meta.getRowProps?.(row.original, row.index) ?? {})}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cell.column.columnDef.meta?.cellClassName}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={table.getAllLeafColumns().length}
							className="h-24 text-center text-muted-foreground"
						>
							{meta.emptyLabel}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
