import { ChevronLeft, ChevronRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { shallow, useStore } from "@tanstack/react-store";
import { Button } from "#/components/ui/button";
import { getPageFromSearch } from "#/lib/admin-table-sorting";
import { useDataTableContext } from "./context";

function EllipsisButton() {
	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			disabled
			className="cursor-default"
		>
			...
		</Button>
	);
}

function calculateVisiblePages(
	knownPages: number,
	currentPage: number,
): Array<number | "ellipsis"> {
	if (knownPages <= 5) {
		return Array.from({ length: knownPages }, (_, i) => i + 1);
	}

	const visibleCount = 5;
	const half = Math.floor(visibleCount / 2);

	let pageWindowStart = currentPage - half;
	let pageWindowEnd = currentPage + half;

	if (pageWindowStart < 1) {
		pageWindowStart = 1;
		pageWindowEnd = Math.min(knownPages, visibleCount);
	} else if (pageWindowEnd > knownPages) {
		pageWindowEnd = knownPages;
		pageWindowStart = Math.max(1, knownPages - visibleCount + 1);
	}

	const result: Array<number | "ellipsis"> = [];

	if (pageWindowStart > 1) {
		result.push(1, 2, "ellipsis");
	}

	for (let i = pageWindowStart; i <= pageWindowEnd; i++) {
		result.push(i);
	}

	return result;
}

export function DataTablePagination() {
	const { actions, store } = useDataTableContext();
	const {
		canGoNext,
		canGoPrevious,
		page,
		cursorHistory,
		continueCursor,
		isDone,
	} = useStore(
		store,
		(state) => ({
			canGoNext:
				!state.isLoading &&
				state.isDone === false &&
				Boolean(state.continueCursor),
			canGoPrevious: state.cursorHistory.length > 0,
			page: getPageFromSearch(state.search),
			cursorHistory: state.cursorHistory,
			continueCursor: state.continueCursor,
			isDone: state.isDone,
		}),
		shallow,
	);

	const knownPages = cursorHistory.length + 1;
	const hasMorePages = continueCursor && !isDone;
	const visiblePages = calculateVisiblePages(knownPages, page);
	const showTrailingEllipsis = knownPages > 5 && hasMorePages;
	let ellipsisIndex = 0;

	return (
		<div className="flex w-full items-center justify-between gap-3">
			<Button
				type="button"
				variant="outline"
				size="icon"
				disabled={!canGoPrevious}
				onClick={actions.goToPreviousPage}
				aria-label="Go to previous page"
			>
				<HugeiconsIcon icon={ChevronLeft} strokeWidth={2} className="size-4" />
			</Button>

			<div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1">
				{visiblePages.map((item) =>
					item === "ellipsis" ? (
						<EllipsisButton key={`ellipsis-${ellipsisIndex++}`} />
					) : (
						<Button
							key={item}
							type="button"
							variant={item === page ? "default" : "outline"}
							size="sm"
							className="shrink-0"
							onClick={() => {
								actions.goToPage(item);
							}}
						>
							{item}
						</Button>
					),
				)}

				{showTrailingEllipsis && <EllipsisButton />}
			</div>

			<Button
				type="button"
				variant="outline"
				size="icon"
				disabled={!canGoNext}
				onClick={actions.goToNextPage}
				aria-label="Go to next page"
			>
				<HugeiconsIcon icon={ChevronRight} strokeWidth={2} className="size-4" />
			</Button>
		</div>
	);
}
