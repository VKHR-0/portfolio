import { ChevronLeft, ChevronRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { shallow, useStore } from "@tanstack/react-store";
import { Button } from "#/components/ui/button";
import { getPageFromSearch } from "#/lib/admin-table-sorting";
import { useDataTableContext } from "./context";

export function DataTablePagination() {
	const { actions, store } = useDataTableContext();
	const { canGoNext, canGoPrevious, page } = useStore(
		store,
		(state) => ({
			canGoNext:
				!state.isLoading &&
				state.isDone === false &&
				Boolean(state.continueCursor),
			canGoPrevious: state.cursorHistory.length > 0,
			page: getPageFromSearch(state.search),
		}),
		shallow,
	);

	return (
		<div className="flex w-full items-center justify-between gap-3">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!canGoPrevious}
				onClick={actions.goToPreviousPage}
			>
				<HugeiconsIcon
					icon={ChevronLeft}
					strokeWidth={2}
					data-icon="inline-start"
				/>
				Previous
			</Button>
			<span className="text-muted-foreground text-sm">Page {page}</span>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!canGoNext}
				onClick={actions.goToNextPage}
			>
				Next
				<HugeiconsIcon
					icon={ChevronRight}
					strokeWidth={2}
					data-icon="inline-end"
				/>
			</Button>
		</div>
	);
}
