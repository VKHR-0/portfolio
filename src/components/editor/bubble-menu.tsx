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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	blockOptions,
	toolbarButtonClass,
	toolbarInputClass,
	toolbarToggleButtonClass,
} from "./constants";
import type { ActiveState, BlockType, IconButtonOptions } from "./types";
import type { BubbleMenuState } from "./use-bubble-menu";

type EditorBubbleMenuProps = {
	editor: TiptapEditor;
	menuBoundary: HTMLDivElement | null;
	disabled: boolean;
	activeState: ActiveState;
	onSetBlockType: (next: BlockType) => void;
	menu: BubbleMenuState;
};

const renderIconButton = ({
	label,
	icon: IconComponent,
	onClick,
	disabled,
	toggle = false,
	pressed = false,
	className,
}: IconButtonOptions) => (
	<button
		key={label}
		type="button"
		onClick={onClick}
		disabled={disabled}
		aria-label={label}
		aria-pressed={toggle ? pressed : undefined}
		className={`${toggle ? toolbarToggleButtonClass : toolbarButtonClass}${className ? ` ${className}` : ""}`}
		title={label}
	>
		<IconComponent className="size-4" />
	</button>
);

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

	const inlineActions = [
		{
			label: "Bold",
			icon: IconBold,
			isActive: () => activeState.bold,
			run: () => editor.chain().focus().toggleBold().run(),
			toggle: true as const,
		},
		{
			label: "Italic",
			icon: IconItalic,
			isActive: () => activeState.italic,
			run: () => editor.chain().focus().toggleItalic().run(),
			toggle: true as const,
		},
		{
			label: "Underline",
			icon: IconUnderline,
			isActive: () => activeState.underline,
			run: () => editor.chain().focus().toggleUnderline().run(),
			toggle: true as const,
		},
		{
			label: "Strikethrough",
			icon: IconStrikethrough,
			isActive: () => activeState.strike,
			run: () => editor.chain().focus().toggleStrike().run(),
			toggle: true as const,
		},
		{
			label: "Code",
			icon: IconCode,
			isActive: () => activeState.code,
			run: () => editor.chain().focus().toggleCode().run(),
			toggle: true as const,
		},
		{
			label: "Remove formatting",
			icon: IconClearFormatting,
			run: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
		},
	];

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

					{inlineActions.map((action) =>
						renderIconButton({
							label: action.label,
							icon: action.icon,
							onClick: action.run,
							disabled,
							toggle: Boolean(action.toggle),
							pressed: action.toggle ? action.isActive() : false,
						}),
					)}

					{renderIconButton({
						label: "Link",
						icon: IconLink,
						onClick: openLinkInput,
						disabled,
						toggle: true,
						pressed: showLinkInput || activeState.link,
					})}

					{isOnImage ? (
						<button
							type="button"
							aria-label="Image alt text"
							title="Image alt text"
							aria-pressed={showAltInput}
							onClick={toggleAltInput}
							disabled={disabled}
							className={`${toolbarToggleButtonClass} size-7 text-xs`}
						>
							ALT
						</button>
					) : null}

					{isInTable
						? renderIconButton({
								label: "Table",
								icon: IconTable,
								onClick: toggleTableActions,
								disabled,
								toggle: true,
								pressed: showTableActions,
							})
						: null}
				</div>

				{/* Link panel */}
				{showLinkInput ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
					>
						<input
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
							className={`${toolbarInputClass} min-w-56 flex-1`}
						/>
						{renderIconButton({
							label: "Set link",
							icon: IconCheck,
							onClick: applyLink,
							disabled: disabled || !linkUrl.trim(),
						})}
						{renderIconButton({
							label: "Remove link",
							icon: IconX,
							onClick: confirmOrRemoveLink,
							disabled,
							className: "ml-auto",
						})}
					</div>
				) : null}

				{/* Alt text panel */}
				{showAltInput && isOnImage ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 flex flex-nowrap items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
					>
						<input
							id="image-alt"
							type="text"
							placeholder="Describe image"
							value={imageAltText}
							onChange={(event) => setImageAltText(event.target.value)}
							disabled={disabled}
							className={`${toolbarInputClass} min-w-56 flex-1`}
						/>
						{renderIconButton({
							label: "Save alt text",
							icon: IconCheck,
							onClick: applyImageAlt,
							disabled,
						})}
						{renderIconButton({
							label: "Remove alt text",
							icon: IconX,
							onClick: clearImageAlt,
							disabled,
							className: "ml-auto",
						})}
					</div>
				) : null}

				{/* Table actions panel */}
				{showTableActions && isInTable ? (
					<div
						data-state="open"
						className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 inline-flex w-fit flex-nowrap items-center gap-1 self-end overflow-x-auto whitespace-nowrap rounded-md border border-border bg-popover p-1 shadow-sm duration-200 data-[state=open]:animate-in"
					>
						<span className="ml-1 text-muted-foreground text-sm">Rows:</span>
						{renderIconButton({
							label: "Add row",
							icon: IconPlus,
							onClick: addRow,
							disabled,
						})}
						{renderIconButton({
							label: "Remove row",
							icon: IconMinus,
							onClick: removeRow,
							disabled,
						})}
						<span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
						<span className="text-muted-foreground text-sm">Columns:</span>
						{renderIconButton({
							label: "Add column",
							icon: IconPlus,
							onClick: addColumn,
							disabled,
						})}
						{renderIconButton({
							label: "Remove column",
							icon: IconMinus,
							onClick: removeColumn,
							disabled,
						})}
					</div>
				) : null}
			</div>
		</TiptapBubbleMenu>
	);
}
