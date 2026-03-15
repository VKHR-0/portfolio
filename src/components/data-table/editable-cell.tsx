import { cn } from "#/lib/utils";
import type { EditableCellProps } from "./types";

export function DataTableEditableCell({
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
