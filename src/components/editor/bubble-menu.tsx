import {
	Bold,
	Check,
	Code,
	Italic,
	Link,
	Minus,
	Plus,
	RemoveFormatting,
	Strikethrough,
	Table,
	Underline,
	X,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { cn } from "#/lib/utils";
import type { ActiveState, BlockType } from "./types";
import type { BubbleMenuState } from "./use-bubble-menu";

const MARK_BUTTONS: Array<{
	icon: typeof Bold;
	label: string;
	stateKey?: Exclude<keyof ActiveState, "blockType">;
	run: (editor: TiptapEditor) => void;
}> = [
	{
		icon: Bold,
		label: "Bold",
		stateKey: "bold",
		run: (e) => e.chain().focus().toggleBold().run(),
	},
	{
		icon: Italic,
		label: "Italic",
		stateKey: "italic",
		run: (e) => e.chain().focus().toggleItalic().run(),
	},
	{
		icon: Underline,
		label: "Underline",
		stateKey: "underline",
		run: (e) => e.chain().focus().toggleUnderline().run(),
	},
	{
		icon: Strikethrough,
		label: "Strikethrough",
		stateKey: "strike",
		run: (e) => e.chain().focus().toggleStrike().run(),
	},
	{
		icon: Code,
		label: "Code",
		stateKey: "code",
		run: (e) => e.chain().focus().toggleCode().run(),
	},
	{
		icon: RemoveFormatting,
		label: "Remove formatting",
		run: (e) => e.chain().focus().unsetAllMarks().clearNodes().run(),
	},
];

const animatedPanelClass =
	"rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 data-[state=open]:animate-in";

type EditorBubbleMenuProps = {
	editor: TiptapEditor;
	menuBoundary: HTMLDivElement | null;
	disabled: boolean;
	activeState: ActiveState;
	blockOptions: Array<{ value: BlockType; label: string }>;
	onSetBlockType: (next: BlockType) => void;
	menu: BubbleMenuState;
};

export function EditorBubbleMenu({
	editor,
	menuBoundary,
	disabled,
	activeState,
	blockOptions,
	onSetBlockType,
	menu,
}: EditorBubbleMenuProps) {
	const {
		activePanel,
		linkUrl,
		imageAltText,
		isInTable,
		isOnImage,
		bubbleMenuRef,
		linkInputRef,
		setLinkUrl,
		setImageAltText,
		openLinkInput,
		toggleTableActions,
		toggleAltInput,
		applyLink,
		confirmOrRemoveLink,
		applyImageAlt,
		clearImageAlt,
		addRow,
		removeRow,
		addColumn,
		removeColumn,
	} = menu;

	const showLinkInput = activePanel === "link";
	const showTableActions = activePanel === "table";
	const showAltInput = activePanel === "alt";

	return (
		<TiptapBubbleMenu
			pluginKey="editor-bubble"
			ref={bubbleMenuRef}
			editor={editor}
			appendTo={menuBoundary ? () => menuBoundary : undefined}
			className="z-50 w-fit max-w-[95vw] text-popover-foreground outline-hidden"
			options={{
				placement: "top-end",
				offset: 10,
				flip: {
					padding: 8,
					boundary: menuBoundary ?? undefined,
				},
				shift: {
					padding: 8,
					crossAxis: true,
					boundary: menuBoundary ?? undefined,
				},
				inline: true,
			}}
			shouldShow={({ editor: bubbleEditor, view, element }) => {
				const hasEditorFocus =
					view.hasFocus() || element.contains(document.activeElement);
				if (!hasEditorFocus) return false;

				const selection = bubbleEditor.state.selection;
				const hasTextSelection =
					selection instanceof TextSelection && !selection.empty;

				return (
					showLinkInput || showTableActions || showAltInput || hasTextSelection
				);
			}}
		>
			<div className="flex flex-col gap-1">
				<div className="flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm">
					<div className="w-fit">
						<Select
							value={activeState.blockType}
							onValueChange={(nextValue) => {
								if (!nextValue) return;
								onSetBlockType(nextValue as BlockType);
							}}
							disabled={disabled}
						>
							<SelectTrigger
								size="sm"
								aria-label="Block style"
								className="h-9 min-w-29 border-transparent bg-transparent py-0 pr-1.5 pl-2 shadow-none hover:bg-accent focus-visible:border-transparent focus-visible:ring-0 sm:h-8"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								alignItemWithTrigger
								align="start"
								className="w-44"
							>
								<SelectGroup>
									<SelectLabel>Block type</SelectLabel>
									{blockOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					{MARK_BUTTONS.map((btn) => (
						<Button
							key={btn.label}
							variant="ghost"
							size="icon-sm"
							aria-label={btn.label}
							title={btn.label}
							onClick={() => btn.run(editor)}
							disabled={disabled}
							aria-pressed={
								btn.stateKey ? activeState[btn.stateKey] : undefined
							}
							className="h-9 w-9 aria-pressed:bg-accent aria-pressed:text-accent-foreground sm:h-8 sm:w-8"
						>
							<HugeiconsIcon
								icon={btn.icon}
								strokeWidth={2}
								className="size-5 sm:size-4"
							/>
						</Button>
					))}

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Link"
						title="Link"
						onClick={openLinkInput}
						disabled={disabled}
						aria-pressed={showLinkInput || activeState.link}
						className="h-9 w-9 aria-pressed:bg-accent aria-pressed:text-accent-foreground sm:h-8 sm:w-8"
					>
						<HugeiconsIcon
							icon={Link}
							strokeWidth={2}
							className="size-5 sm:size-4"
						/>
					</Button>

					{isOnImage ? (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Image alt text"
							title="Image alt text"
							aria-pressed={showAltInput}
							onClick={toggleAltInput}
							disabled={disabled}
							className="h-9 text-xs aria-pressed:bg-accent aria-pressed:text-accent-foreground sm:h-8"
						>
							ALT
						</Button>
					) : null}

					{isInTable ? (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Table"
							title="Table"
							onClick={toggleTableActions}
							disabled={disabled}
							aria-pressed={showTableActions}
							className="h-9 w-9 aria-pressed:bg-accent aria-pressed:text-accent-foreground sm:h-8 sm:w-8"
						>
							<HugeiconsIcon
								icon={Table}
								strokeWidth={2}
								className="size-5 sm:size-4"
							/>
						</Button>
					) : null}
				</div>

				{showLinkInput ? (
					<div
						data-state="open"
						className={cn(
							animatedPanelClass,
							"flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap",
						)}
					>
						<Input
							id="link-url"
							ref={linkInputRef}
							type="url"
							placeholder="https://example.com"
							value={linkUrl}
							onChange={(event) => setLinkUrl(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									applyLink();
								}
							}}
							disabled={disabled}
							className="h-7 min-w-56 flex-1"
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Set link"
							title="Set link"
							onClick={applyLink}
							disabled={disabled || !linkUrl.trim()}
						>
							<HugeiconsIcon icon={Check} strokeWidth={2} className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove link"
							title="Remove link"
							onClick={confirmOrRemoveLink}
							disabled={disabled}
							className="ml-auto"
						>
							<HugeiconsIcon icon={X} strokeWidth={2} className="size-4" />
						</Button>
					</div>
				) : null}

				{showAltInput && isOnImage ? (
					<div
						data-state="open"
						className={cn(
							animatedPanelClass,
							"flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap",
						)}
					>
						<Input
							id="image-alt"
							type="text"
							placeholder="Describe image"
							value={imageAltText}
							onChange={(event) => setImageAltText(event.target.value)}
							disabled={disabled}
							className="h-7 min-w-56 flex-1"
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Save alt text"
							title="Save alt text"
							onClick={applyImageAlt}
							disabled={disabled}
						>
							<HugeiconsIcon icon={Check} strokeWidth={2} className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove alt text"
							title="Remove alt text"
							onClick={clearImageAlt}
							disabled={disabled}
							className="ml-auto"
						>
							<HugeiconsIcon icon={X} strokeWidth={2} className="size-4" />
						</Button>
					</div>
				) : null}

				{showTableActions && isInTable ? (
					<div
						data-state="open"
						className={cn(
							animatedPanelClass,
							"inline-flex w-fit flex-nowrap items-center gap-1 self-end overflow-x-auto whitespace-nowrap",
						)}
					>
						<span className="ml-1 text-muted-foreground text-sm">Rows:</span>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Add row"
							title="Add row"
							onClick={addRow}
							disabled={disabled}
						>
							<HugeiconsIcon icon={Plus} strokeWidth={2} className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove row"
							title="Remove row"
							onClick={removeRow}
							disabled={disabled}
						>
							<HugeiconsIcon icon={Minus} strokeWidth={2} className="size-4" />
						</Button>
						<span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
						<span className="text-muted-foreground text-sm">Columns:</span>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Add column"
							title="Add column"
							onClick={addColumn}
							disabled={disabled}
						>
							<HugeiconsIcon icon={Plus} strokeWidth={2} className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove column"
							title="Remove column"
							onClick={removeColumn}
							disabled={disabled}
						>
							<HugeiconsIcon icon={Minus} strokeWidth={2} className="size-4" />
						</Button>
					</div>
				) : null}
			</div>
		</TiptapBubbleMenu>
	);
}
