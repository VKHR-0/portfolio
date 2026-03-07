import type * as React from "react";
import { CursorPagination } from "#/components/cursor-pagination";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "#/components/ui/table";

type PageCardProps = {
	title: string;
	description: string;
	createButton: React.ReactNode;
	loadingLabel: string;
	emptyLabel: string;
	columnHeaders: React.ReactNode;
	columnCount: number;
	isLoading: boolean;
	isEmpty: boolean;
	currentPage: number;
	pageCount: number;
	canGoPrevious: boolean;
	canGoNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSelectPage: (page: number) => void;
	children: React.ReactNode;
};

export function PageCard({
	title,
	description,
	createButton,
	loadingLabel,
	emptyLabel,
	columnHeaders,
	columnCount,
	isLoading,
	isEmpty,
	currentPage,
	pageCount,
	canGoPrevious,
	canGoNext,
	onPrevious,
	onNext,
	onSelectPage,
	children,
}: PageCardProps) {
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
				<Table className="table-fixed">
					<TableHeader>
						<TableRow>{columnHeaders}</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="h-24 text-center text-muted-foreground"
								>
									{loadingLabel}
								</TableCell>
							</TableRow>
						)}

						{!isLoading && isEmpty && (
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyLabel}
								</TableCell>
							</TableRow>
						)}

						{children}
					</TableBody>
				</Table>
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
	return (
		<TableCell
			className={`cursor-text select-none truncate ${className ?? ""}`}
			title="Double-click to edit"
			onDoubleClick={onDoubleClick}
		>
			{isEditing ? children : displayValue}
		</TableCell>
	);
}
