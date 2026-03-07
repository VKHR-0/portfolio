import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type * as React from "react";
import { AdminDataTable } from "#/components/admin-data-table";
import { CursorPagination } from "#/components/cursor-pagination";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { cn } from "#/lib/utils";

type PageCardProps<TData> = {
	title: string;
	description: string;
	createButton: React.ReactNode;
	loadingLabel: string;
	emptyLabel: string;
	columns: Array<ColumnDef<TData>>;
	data: Array<TData>;
	sorting: SortingState;
	onSortingChange: (sorting: SortingState) => void;
	isLoading: boolean;
	currentPage: number;
	pageCount: number;
	canGoPrevious: boolean;
	canGoNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSelectPage: (page: number) => void;
	getRowId?: (originalRow: TData, index: number) => string;
};

export function PageCard<TData>({
	title,
	description,
	createButton,
	loadingLabel,
	emptyLabel,
	columns,
	data,
	sorting,
	onSortingChange,
	isLoading,
	currentPage,
	pageCount,
	canGoPrevious,
	canGoNext,
	onPrevious,
	onNext,
	onSelectPage,
	getRowId,
}: PageCardProps<TData>) {
	return (
		<Card className="min-w-0 flex-1">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{createButton}
			</CardHeader>

			<CardContent className="min-w-0 flex-1">
				<AdminDataTable
					columns={columns}
					data={data}
					sorting={sorting}
					onSortingChange={onSortingChange}
					loadingLabel={loadingLabel}
					emptyLabel={emptyLabel}
					isLoading={isLoading}
					getRowId={getRowId}
				/>
			</CardContent>

			<CardFooter>
				<CursorPagination
					currentPage={currentPage}
					pageCount={pageCount}
					canGoPrevious={canGoPrevious}
					canGoNext={canGoNext}
					onPrevious={onPrevious}
					onSelectPage={onSelectPage}
					onNext={onNext}
				/>
			</CardFooter>
		</Card>
	);
}

type EditableCellProps = {
	isEditing: boolean;
	displayValue: string;
	onDoubleClick: () => void;
	className?: string;
	children: React.ReactNode;
};

export function EditableCell({
	isEditing,
	displayValue,
	onDoubleClick,
	className,
	children,
}: EditableCellProps) {
	if (isEditing) {
		return <>{children}</>;
	}

	return (
		<button
			type="button"
			className={cn(
				"w-full cursor-text select-none truncate text-left",
				className,
			)}
			title="Double-click to edit"
			onDoubleClick={onDoubleClick}
		>
			{displayValue}
		</button>
	);
}
