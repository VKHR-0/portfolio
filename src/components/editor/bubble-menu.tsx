import {
	IconBold,
	IconCheck,
	IconClearFormatting,
	IconCode,
	IconItalic,
	IconLink,
	IconMinus,
	IconPlus,
	IconStrikethrough,
	IconTable,
	IconUnderline,
	IconX,
} from "@tabler/icons-react";
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
import { blockOptions } from "./constants";
import type { ActiveState, BlockType } from "./types";
import type { BubbleMenuState } from "./use-bubble-menu";

type EditorBubbleMenuProps = {
	editor: TiptapEditor;
	menuBoundary: HTMLDivElement | null;
	disabled: boolean;
	activeState: ActiveState;
	onSetBlockType: (next: BlockType) => void;
	menu: BubbleMenuState;
};

export function EditorBubbleMenu({
	editor,
	menuBoundary,
	disabled,
	activeState,
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
				{/* Toolbar row */}
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
								className="min-w-29 border-transparent bg-transparent py-0 pr-1.5 pl-2 shadow-none hover:bg-accent focus-visible:border-transparent focus-visible:ring-0"
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

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Bold"
						title="Bold"
						onClick={() => editor.chain().focus().toggleBold().run()}
						disabled={disabled}
						aria-pressed={activeState.bold}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconBold className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Italic"
						title="Italic"
						onClick={() => editor.chain().focus().toggleItalic().run()}
						disabled={disabled}
						aria-pressed={activeState.italic}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconItalic className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Underline"
						title="Underline"
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						disabled={disabled}
						aria-pressed={activeState.underline}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconUnderline className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Strikethrough"
						title="Strikethrough"
						onClick={() => editor.chain().focus().toggleStrike().run()}
						disabled={disabled}
						aria-pressed={activeState.strike}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconStrikethrough className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Code"
						title="Code"
						onClick={() => editor.chain().focus().toggleCode().run()}
						disabled={disabled}
						aria-pressed={activeState.code}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconCode className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Remove formatting"
						title="Remove formatting"
						onClick={() =>
							editor.chain().focus().unsetAllMarks().clearNodes().run()
						}
						disabled={disabled}
					>
						<IconClearFormatting className="size-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Link"
						title="Link"
						onClick={openLinkInput}
						disabled={disabled}
						aria-pressed={showLinkInput || activeState.link}
						className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
					>
						<IconLink className="size-4" />
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
							className="text-xs aria-pressed:bg-accent aria-pressed:text-accent-foreground"
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
							className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
						>
							<IconTable className="size-4" />
						</Button>
					) : null}
				</div>

				{/* Link panel */}
				{showLinkInput ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
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
							<IconCheck className="size-4" />
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
							<IconX className="size-4" />
						</Button>
					</div>
				) : null}

				{/* Alt text panel */}
				{showAltInput && isOnImage ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
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
							<IconCheck className="size-4" />
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
							<IconX className="size-4" />
						</Button>
					</div>
				) : null}

				{/* Table actions panel */}
				{showTableActions && isInTable ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 inline-flex w-fit flex-nowrap items-center gap-1 self-end overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
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
							<IconPlus className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove row"
							title="Remove row"
							onClick={removeRow}
							disabled={disabled}
						>
							<IconMinus className="size-4" />
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
							<IconPlus className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remove column"
							title="Remove column"
							onClick={removeColumn}
							disabled={disabled}
						>
							<IconMinus className="size-4" />
						</Button>
					</div>
				) : null}
			</div>
		</TiptapBubbleMenu>
	);
}
