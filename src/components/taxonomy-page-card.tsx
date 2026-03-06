import type { ReactNode } from "react";
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

// ─── TaxonomyPageCard ────────────────────────────────────────────────────────
// Card shell shared by the categories, tags, and series management pages.
// Handles the header (title + create button), loading/empty state rows,
// the table wrapper, and the cursor-paginated footer.

type TaxonomyPageCardProps = {
	title: string;
	description: string;
	createButton: ReactNode;
	loadingLabel: string;
	emptyLabel: string;
	columnHeaders: ReactNode;
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
	children: ReactNode;
};

export function TaxonomyPageCard({
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
}: TaxonomyPageCardProps) {
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

// ─── EditableCell ─────────────────────────────────────────────────────────────
// A table cell that shows a plain value normally and swaps in the provided
// children (an Input wrapped in form.Field) when isEditing is true.
// Using children instead of an Input-props spread keeps TanStack Form's
// typed form.Field in the parent where it can stay fully type-safe.

type EditableCellProps = {
	isEditing: boolean;
	displayValue: string;
	onDoubleClick: () => void;
	className?: string;
	children: ReactNode;
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
