import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";

type CursorPaginationProps = {
	currentPage: number;
	pageCount: number;
	canGoPrevious: boolean;
	canGoNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSelectPage: (page: number) => void;
	maxVisiblePages?: number;
};

export function CursorPagination({
	currentPage,
	pageCount,
	canGoPrevious,
	canGoNext,
	onPrevious,
	onNext,
	onSelectPage,
	maxVisiblePages = 5,
}: CursorPaginationProps) {
	const visibleCount = Math.max(1, maxVisiblePages);
	const maxStart = Math.max(1, pageCount - visibleCount + 1);
	const pageWindowStart = Math.max(
		1,
		Math.min(currentPage - Math.floor(visibleCount / 2), maxStart),
	);
	const pageWindowEnd = Math.min(pageCount, pageWindowStart + visibleCount - 1);
	const visiblePages = Array.from(
		{ length: Math.max(0, pageWindowEnd - pageWindowStart + 1) },
		(_, index) => pageWindowStart + index,
	);

	return (
		<div className="flex w-full items-center justify-between gap-2">
			<Button
				type="button"
				variant="outline"
				size="icon"
				onClick={onPrevious}
				disabled={!canGoPrevious}
				aria-label="Go to previous page"
			>
				<IconChevronLeft className="size-4" />
			</Button>

			<div className="flex items-center gap-1">
				{pageWindowStart > 1 ? (
					<span className="px-2 text-muted-foreground text-sm">...</span>
				) : null}

				{visiblePages.map((page) => (
					<Button
						key={page}
						type="button"
						variant={page === currentPage ? "default" : "outline"}
						size="sm"
						onClick={() => {
							onSelectPage(page);
						}}
					>
						{page}
					</Button>
				))}

				{pageWindowEnd < pageCount ? (
					<span className="px-2 text-muted-foreground text-sm">...</span>
				) : null}
			</div>

			<Button
				type="button"
				variant="outline"
				size="icon"
				onClick={onNext}
				disabled={!canGoNext}
				aria-label="Go to next page"
			>
				<IconChevronRight className="size-4" />
			</Button>
		</div>
	);
}
