"use client";

import {
	IconArrowsSort,
	IconChevronDown,
	IconChevronUp,
} from "@tabler/icons-react";
import {
	type ColumnDef,
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

type AdminDataTableProps<TData> = {
	columns: Array<ColumnDef<TData>>;
	data: Array<TData>;
	sorting: SortingState;
	onSortingChange: (sorting: SortingState) => void;
	loadingLabel: string;
	emptyLabel: string;
	isLoading: boolean;
	getRowId?: (originalRow: TData, index: number) => string;
	className?: string;
};

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

export function AdminDataTable<TData>({
	columns,
	data,
	sorting,
	onSortingChange,
	loadingLabel,
	emptyLabel,
	isLoading,
	getRowId,
	className,
}: AdminDataTableProps<TData>) {
	const table = useReactTable({
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

	return (
		<Table className={cn("table-fixed", className)}>
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
												onSortingChange(
													getNextSortingState(header.column.id, currentSort),
												)
											}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
											{currentSort === "desc" ? (
												<IconChevronDown data-icon="inline-end" />
											) : currentSort === "asc" ? (
												<IconChevronUp data-icon="inline-end" />
											) : (
												<IconArrowsSort
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
							{loadingLabel}
						</TableCell>
					</TableRow>
				) : table.getRowModel().rows.length > 0 ? (
					table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
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
							{emptyLabel}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
