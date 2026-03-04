import {
	IconBlockquote,
	IconBold,
	IconCode,
	IconH1,
	IconH2,
	IconH3,
	IconItalic,
	IconLink,
	IconList,
	IconListNumbers,
	IconMath,
	IconMathFunction,
	IconMinus,
	IconPilcrow,
	IconStrikethrough,
	IconTable,
} from "@tabler/icons-react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
	type ComponentProps,
	type ComponentType,
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";

import { Button } from "#/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import { Toggle } from "#/components/ui/toggle";
import { cn } from "#/lib/utils";
import {
	EditorActionDialog,
	useEditorActionDialog,
} from "./editor/editor-action-dialog";
import { createEditorExtensions } from "./editor/editor-extensions";
import {
	markdownToTiptapDocument,
	tiptapDocumentToMarkdown,
} from "./editor/editor-markdown";
import { type SlashRange, useSlashMenu } from "./editor/use-slash-menu";

type EditorProps = {
	className?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
} & Omit<ComponentProps<"div">, "children" | "onChange">;

type ToolbarCommandKind = "toggle" | "button";

type BlockCommandItem = {
	id: string;
	label: string;
	description: string;
	keywords: string[];
	icon: ComponentType<{ className?: string }>;
	ariaLabel: string;
	kind: ToolbarCommandKind;
	isActive: (editor: TiptapEditor) => boolean;
	canRun: (editor: TiptapEditor) => boolean;
	run: (editor: TiptapEditor) => void;
	runFromSlash: (editor: TiptapEditor, range: SlashRange) => void;
};

const DEFAULT_TABLE_OPTIONS = { rows: 3, cols: 3, withHeaderRow: true };

const HEADING_COMMANDS: Array<{
	id: string;
	label: string;
	description: string;
	keywords: string[];
	icon: ComponentType<{ className?: string }>;
	level: 1 | 2 | 3;
}> = [
	{
		id: "heading-1",
		label: "Heading 1",
		description: "Large section title",
		keywords: ["h1", "title", "heading"],
		icon: IconH1,
		level: 1,
	},
	{
		id: "heading-2",
		label: "Heading 2",
		description: "Medium section title",
		keywords: ["h2", "subtitle", "heading"],
		icon: IconH2,
		level: 2,
	},
	{
		id: "heading-3",
		label: "Heading 3",
		description: "Small section title",
		keywords: ["h3", "subheading", "heading"],
		icon: IconH3,
		level: 3,
	},
];

export function Editor({
	className,
	value,
	onChange,
	placeholder = "Please Type Here...",
	...props
}: EditorProps) {
	const editorExtensions = useMemo(
		() => createEditorExtensions(placeholder),
		[placeholder],
	);
	const onChangeRef = useRef(onChange);
	const lastSyncedMarkdownRef = useRef(value);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: editorExtensions,
		editorProps: {
			attributes: {
				class:
					"tiptap prose prose-neutral dark:prose-invert h-full min-h-[240px] max-w-none cursor-text p-4 text-base leading-7 outline-none",
			},
		},
		content: markdownToTiptapDocument(value),
		onUpdate: ({ editor: currentEditor }) => {
			const nextMarkdown = tiptapDocumentToMarkdown(currentEditor.getJSON());
			lastSyncedMarkdownRef.current = nextMarkdown;
			onChangeRef.current(nextMarkdown);
		},
	});

	useEffect(() => {
		if (!editor || value === lastSyncedMarkdownRef.current) {
			return;
		}

		editor.commands.setContent(markdownToTiptapDocument(value), {
			emitUpdate: false,
		});
		lastSyncedMarkdownRef.current = value;
	}, [editor, value]);

	const { slashMenu, closeSlashMenu } = useSlashMenu(editor);
	const {
		actionDialog,
		actionDialogValue,
		actionDialogError,
		openLinkDialog,
		openInlineMathDialog,
		openBlockMathDialog,
		closeActionDialog,
		handleActionDialogSubmit,
		handleActionDialogValueChange,
	} = useEditorActionDialog({
		editor,
		onOpen: closeSlashMenu,
	});

	const preventMenuFocusLoss = (event: MouseEvent) => {
		event.preventDefault();
	};

	const blockCommands = useMemo<BlockCommandItem[]>(() => {
		return [
			{
				id: "paragraph",
				label: "Paragraph",
				description: "Normal body text",
				keywords: ["text", "p", "paragraph"],
				icon: IconPilcrow,
				ariaLabel: "Paragraph",
				kind: "toggle",
				isActive: (currentEditor) => currentEditor.isActive("paragraph"),
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().setParagraph().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().setParagraph().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor.chain().focus().deleteRange(range).setParagraph().run();
				},
			},
			...HEADING_COMMANDS.map((headingCommand) => ({
				id: headingCommand.id,
				label: headingCommand.label,
				description: headingCommand.description,
				keywords: headingCommand.keywords,
				icon: headingCommand.icon,
				ariaLabel: headingCommand.label,
				kind: "toggle" as const,
				isActive: (currentEditor: TiptapEditor) =>
					currentEditor.isActive("heading", { level: headingCommand.level }),
				canRun: (currentEditor: TiptapEditor) =>
					currentEditor
						.can()
						.chain()
						.focus()
						.toggleHeading({ level: headingCommand.level })
						.run(),
				run: (currentEditor: TiptapEditor) => {
					currentEditor
						.chain()
						.focus()
						.toggleHeading({ level: headingCommand.level })
						.run();
				},
				runFromSlash: (currentEditor: TiptapEditor, range: SlashRange) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleHeading({ level: headingCommand.level })
						.run();
				},
			})),
			{
				id: "bullet-list",
				label: "Bullet List",
				description: "Unordered list",
				keywords: ["list", "ul", "bullet"],
				icon: IconList,
				ariaLabel: "Bullet list",
				kind: "toggle",
				isActive: (currentEditor) => currentEditor.isActive("bulletList"),
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().toggleBulletList().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().toggleBulletList().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleBulletList()
						.run();
				},
			},
			{
				id: "ordered-list",
				label: "Ordered List",
				description: "Numbered list",
				keywords: ["list", "ol", "number"],
				icon: IconListNumbers,
				ariaLabel: "Ordered list",
				kind: "toggle",
				isActive: (currentEditor) => currentEditor.isActive("orderedList"),
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().toggleOrderedList().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().toggleOrderedList().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleOrderedList()
						.run();
				},
			},
			{
				id: "blockquote",
				label: "Blockquote",
				description: "Quoted text",
				keywords: ["quote", "blockquote"],
				icon: IconBlockquote,
				ariaLabel: "Blockquote",
				kind: "toggle",
				isActive: (currentEditor) => currentEditor.isActive("blockquote"),
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().toggleBlockquote().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().toggleBlockquote().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleBlockquote()
						.run();
				},
			},
			{
				id: "code-block",
				label: "Code Block",
				description: "Monospace code section",
				keywords: ["code", "snippet", "pre"],
				icon: IconCode,
				ariaLabel: "Code block",
				kind: "toggle",
				isActive: (currentEditor) => currentEditor.isActive("codeBlock"),
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().toggleCodeBlock().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().toggleCodeBlock().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleCodeBlock()
						.run();
				},
			},
			{
				id: "inline-math",
				label: "Inline Math",
				description: "Insert inline LaTeX expression",
				keywords: ["latex", "math", "equation", "inline"],
				icon: IconMath,
				ariaLabel: "Inline math",
				kind: "button",
				isActive: () => false,
				canRun: () => true,
				run: () => {
					openInlineMathDialog();
				},
				runFromSlash: (_, range) => {
					openInlineMathDialog(range);
				},
			},
			{
				id: "block-math",
				label: "Block Math",
				description: "Insert block LaTeX equation",
				keywords: ["latex", "math", "equation", "block"],
				icon: IconMathFunction,
				ariaLabel: "Block math",
				kind: "button",
				isActive: () => false,
				canRun: () => true,
				run: () => {
					openBlockMathDialog();
				},
				runFromSlash: (_, range) => {
					openBlockMathDialog(range);
				},
			},
			{
				id: "table",
				label: "Table",
				description: "Insert 3 x 3 table",
				keywords: ["table", "grid"],
				icon: IconTable,
				ariaLabel: "Table",
				kind: "button",
				isActive: () => false,
				canRun: (currentEditor) =>
					currentEditor
						.can()
						.chain()
						.focus()
						.insertTable(DEFAULT_TABLE_OPTIONS)
						.run(),
				run: (currentEditor) => {
					currentEditor
						.chain()
						.focus()
						.insertTable(DEFAULT_TABLE_OPTIONS)
						.run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.insertTable(DEFAULT_TABLE_OPTIONS)
						.run();
				},
			},
			{
				id: "divider",
				label: "Divider",
				description: "Horizontal separator",
				keywords: ["divider", "hr", "line"],
				icon: IconMinus,
				ariaLabel: "Divider",
				kind: "button",
				isActive: () => false,
				canRun: (currentEditor) =>
					currentEditor.can().chain().focus().setHorizontalRule().run(),
				run: (currentEditor) => {
					currentEditor.chain().focus().setHorizontalRule().run();
				},
				runFromSlash: (currentEditor, range) => {
					currentEditor
						.chain()
						.focus()
						.deleteRange(range)
						.setHorizontalRule()
						.run();
				},
			},
		];
	}, [openBlockMathDialog, openInlineMathDialog]);

	const filteredSlashCommands = useMemo(() => {
		if (!slashMenu) {
			return [];
		}

		if (!slashMenu.query) {
			return blockCommands;
		}

		return blockCommands.filter((command) => {
			const searchableText =
				`${command.label} ${command.description} ${command.keywords.join(" ")}`.toLowerCase();
			return searchableText.includes(slashMenu.query);
		});
	}, [blockCommands, slashMenu]);

	const runSlashCommand = useCallback(
		(command: BlockCommandItem) => {
			if (!editor || !slashMenu) {
				return;
			}

			command.runFromSlash(editor, { from: slashMenu.from, to: slashMenu.to });
			closeSlashMenu();
		},
		[closeSlashMenu, editor, slashMenu],
	);

	return (
		<div {...props} className={cn("wysiwyg-editor", className)}>
			{editor && (
				<div
					className="sticky top-4 z-20 flex flex-wrap items-center gap-1 rounded-xl border bg-muted/50 px-3 py-2 shadow-xs backdrop-blur"
					role="toolbar"
					aria-label="Block formatting"
					onMouseDown={preventMenuFocusLoss}
				>
					{blockCommands.map((command) => {
						const Icon = command.icon;

						if (command.kind === "toggle") {
							return (
								<Toggle
									key={command.id}
									size="sm"
									aria-label={command.ariaLabel}
									pressed={command.isActive(editor)}
									disabled={!command.canRun(editor)}
									onPressedChange={() => {
										command.run(editor);
									}}
								>
									<Icon />
								</Toggle>
							);
						}

						return (
							<Button
								key={command.id}
								type="button"
								size="sm"
								variant="outline"
								disabled={!command.canRun(editor)}
								onClick={() => {
									command.run(editor);
								}}
							>
								<Icon />
								{command.label}
							</Button>
						);
					})}
					<span className="ml-auto hidden text-muted-foreground text-xs md:inline">
						Type `/` for block commands
					</span>
				</div>
			)}

			{editor && (
				<BubbleMenu
					editor={editor}
					shouldShow={({ editor: currentEditor, state }) => {
						if (!currentEditor.isEditable) {
							return false;
						}

						if (state.selection.empty) {
							return false;
						}

						return currentEditor.view.hasFocus();
					}}
					className="z-50"
				>
					<div
						className={cn(
							"flex items-center gap-1 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md",
						)}
						role="toolbar"
						aria-label="Text formatting"
						onMouseDown={preventMenuFocusLoss}
					>
						<Toggle
							size="sm"
							aria-label="Bold"
							pressed={editor.isActive("bold")}
							disabled={!editor.can().chain().focus().toggleBold().run()}
							onPressedChange={() => {
								editor.chain().focus().toggleBold().run();
							}}
						>
							<IconBold />
						</Toggle>
						<Toggle
							size="sm"
							aria-label="Italic"
							pressed={editor.isActive("italic")}
							disabled={!editor.can().chain().focus().toggleItalic().run()}
							onPressedChange={() => {
								editor.chain().focus().toggleItalic().run();
							}}
						>
							<IconItalic />
						</Toggle>
						<Toggle
							size="sm"
							aria-label="Strike"
							pressed={editor.isActive("strike")}
							disabled={!editor.can().chain().focus().toggleStrike().run()}
							onPressedChange={() => {
								editor.chain().focus().toggleStrike().run();
							}}
						>
							<IconStrikethrough />
						</Toggle>
						<Toggle
							size="sm"
							aria-label="Code"
							pressed={editor.isActive("code")}
							disabled={!editor.can().chain().focus().toggleCode().run()}
							onPressedChange={() => {
								editor.chain().focus().toggleCode().run();
							}}
						>
							<IconCode />
						</Toggle>
						<Toggle
							size="sm"
							aria-label="Link"
							pressed={editor.isActive("link")}
							onPressedChange={openLinkDialog}
						>
							<IconLink />
						</Toggle>
					</div>
				</BubbleMenu>
			)}

			<EditorContent editor={editor} />

			{slashMenu && (
				<div
					className="fixed z-50 w-[min(20rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-24px))]"
					style={{
						left: `max(${slashMenu.left}px, calc(env(safe-area-inset-left) + 12px))`,
						top: `max(${slashMenu.top}px, calc(env(safe-area-inset-top) + 12px))`,
					}}
				>
					<Command
						shouldFilter={false}
						aria-label="Slash commands"
						className="overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md"
						onMouseDown={preventMenuFocusLoss}
					>
						<CommandList>
							<CommandEmpty className="text-pretty py-1.5 text-muted-foreground text-sm">
								No matching commands
							</CommandEmpty>
							{filteredSlashCommands.map((command) => {
								const Icon = command.icon;

								return (
									<CommandItem
										key={command.id}
										value={`${command.label} ${command.description} ${command.keywords.join(" ")}`}
										className="items-start gap-2 rounded-lg px-2 py-1.5"
										onSelect={() => {
											runSlashCommand(command);
										}}
									>
										<Icon className="mt-0.5 size-4 shrink-0" />
										<span className="flex min-w-0 flex-col">
											<span className="truncate font-medium text-sm">
												{command.label}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												{command.description}
											</span>
										</span>
									</CommandItem>
								);
							})}
						</CommandList>
					</Command>
				</div>
			)}

			<EditorActionDialog
				actionDialog={actionDialog}
				actionDialogValue={actionDialogValue}
				actionDialogError={actionDialogError}
				onActionDialogValueChange={handleActionDialogValueChange}
				onActionDialogSubmit={handleActionDialogSubmit}
				onCloseActionDialog={closeActionDialog}
			/>
		</div>
	);
}
