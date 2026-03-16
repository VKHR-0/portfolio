import { Edit, Loader } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";
import { useEditing } from "./editing-context";

type InlineInputCellProps = {
	value: string;
	onSave: (newValue: string) => Promise<void>;
	cellId?: string;
	className?: string;
};

export function InlineInputCell({
	value,
	onSave,
	cellId,
	className,
}: InlineInputCellProps) {
	const { editingId, startEditing, stopEditing } = useEditing();
	const generatedId = React.useId();
	const id = cellId ?? generatedId;
	const isEditing = editingId === id;
	const [localValue, setLocalValue] = React.useState(value);
	const [isSaving, setIsSaving] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (isEditing) {
			setLocalValue(value);
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing, value]);

	React.useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const handleSave = React.useCallback(async () => {
		if (!isEditing || isSaving) return;

		const trimmed = localValue.trim();
		if (trimmed === value.trim()) {
			stopEditing();
			return;
		}

		setIsSaving(true);
		try {
			await onSave(trimmed);
			stopEditing();
		} catch {
			// Error is handled by the caller (toast notifications)
		} finally {
			setIsSaving(false);
		}
	}, [isEditing, isSaving, localValue, value, onSave, stopEditing]);

	const handleKeyDown = React.useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter") {
				event.preventDefault();
				void handleSave();
			}
			if (event.key === "Escape") {
				event.preventDefault();
				stopEditing();
			}
		},
		[handleSave, stopEditing],
	);

	if (isEditing) {
		return (
			<div className="relative flex items-center">
				<Input
					ref={inputRef}
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					className={cn("h-7 pr-8 text-sm", className)}
				/>
				{isSaving && (
					<HugeiconsIcon
						icon={Loader}
						strokeWidth={2}
						className="absolute right-2 size-4 animate-spin text-muted-foreground"
					/>
				)}
			</div>
		);
	}

	return (
		<button
			type="button"
			className={cn("group/cell relative flex items-center gap-2", className)}
			onDoubleClick={() => startEditing(id)}
		>
			<span className="truncate">{value || "-"}</span>
			<HugeiconsIcon
				icon={Edit}
				strokeWidth={2}
				className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/cell:opacity-50"
			/>
		</button>
	);
}
