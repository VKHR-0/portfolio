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
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Mathematics from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import { common, createLowlight } from "lowlight";
import {
	type ComponentProps,
	type ComponentType,
	type MouseEvent,
	type SubmitEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Button } from "#/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Toggle } from "#/components/ui/toggle";
import { cn } from "#/lib/utils";

const lowlight = createLowlight(common);

type EditorProps = {
	className?: string;
	placeholder?: string;
} & Omit<ComponentProps<"div">, "children">;

type SlashRange = {
	from: number;
	to: number;
};

type SlashMenuState = SlashRange & {
	query: string;
	top: number;
	left: number;
};

type SlashCommandItem = {
	id: string;
	label: string;
	description: string;
	keywords: string[];
	icon: ComponentType<{ className?: string }>;
	run: (range: SlashRange) => void;
};

type ActionDialogMode = "link" | "inlineMath" | "blockMath";

type ActionDialogState = {
	mode: ActionDialogMode;
	value: string;
	selectionRange?: SlashRange;
	replaceRange?: SlashRange;
};

const ACTION_DIALOG_META: Record<
	ActionDialogMode,
	{
		title: string;
		description: string;
		label: string;
		placeholder: string;
		submitLabel: string;
		allowEmpty: boolean;
	}
> = {
	link: {
		title: "Edit Link",
		description: "Enter a URL. Leave it empty to remove the link.",
		label: "URL",
		placeholder: "https://example.com",
		submitLabel: "Apply Link",
		allowEmpty: true,
	},
	inlineMath: {
		title: "Insert Inline Math",
		description: "Enter a LaTeX expression for inline rendering.",
		label: "LaTeX",
		placeholder: "E = mc^2",
		submitLabel: "Insert Math",
		allowEmpty: false,
	},
	blockMath: {
		title: "Insert Block Math",
		description: "Enter a LaTeX expression for block rendering.",
		label: "LaTeX",
		placeholder: "\\int_0^1 x^2 \\, dx",
		submitLabel: "Insert Block",
		allowEmpty: false,
	},
};

function getSlashMenuState(editor: TiptapEditor): SlashMenuState | null {
	const { selection } = editor.state;

	if (!selection.empty) {
		return null;
	}

	const { $from, from } = selection;
	if ($from.parent.type.name !== "paragraph") {
		return null;
	}

	const textBeforeCursor = $from.parent.textBetween(
		0,
		$from.parentOffset,
		undefined,
		"\0",
	);
	const slashMatch = textBeforeCursor.match(/^\/([a-zA-Z0-9-]*)$/);

	if (!slashMatch) {
		return null;
	}

	const fromOffset = from - slashMatch[0].length;
	const coords = editor.view.coordsAtPos(from);
	const maxLeft =
		typeof window !== "undefined" ? window.innerWidth - 320 : coords.left;
	const left = Math.max(12, Math.min(coords.left, maxLeft));

	return {
		query: slashMatch[1].toLowerCase(),
		from: fromOffset,
		to: from,
		top: coords.bottom + 8,
		left,
	};
}

export function Editor({
	className,
	placeholder = "Please Type Here...",
	...props
}: EditorProps) {
	const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
	const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(
		null,
	);
	const [actionDialogValue, setActionDialogValue] = useState("");
	const [actionDialogError, setActionDialogError] = useState<string | null>(
		null,
	);
	const mathPreviewRef = useRef<HTMLDivElement | null>(null);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				link: false,
				codeBlock: false,
				heading: {
					levels: [1, 2, 3, 4],
				},
			}),
			CodeBlockLowlight.configure({
				lowlight,
				defaultLanguage: "ts",
				HTMLAttributes: {
					class: "rounded-lg bg-muted px-3 py-2 font-mono text-sm",
				},
			}),
			Link.configure({
				autolink: true,
				defaultProtocol: "https",
				linkOnPaste: true,
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline underline-offset-4",
				},
			}),
			TableKit.configure({
				table: {
					HTMLAttributes: {
						class: "my-4 w-full table-auto border-collapse text-sm",
					},
					resizable: true,
				},
				tableHeader: {
					HTMLAttributes: {
						class: "border bg-muted/50 px-3 py-2 text-left font-medium",
					},
				},
				tableCell: {
					HTMLAttributes: {
						class: "border px-3 py-2 align-top",
					},
				},
				tableRow: {},
			}),
			Mathematics.configure({
				katexOptions: {
					throwOnError: false,
				},
			}),
			Placeholder.configure({
				placeholder,
				emptyNodeClass: "is-editor-empty",
			}),
		],
		editorProps: {
			attributes: {
				class:
					"tiptap prose prose-neutral dark:prose-invert h-full min-h-[240px] max-w-none cursor-text py-4 text-base leading-7 outline-none",
			},
		},
		content: "",
	});

	const preventMenuFocusLoss = (event: MouseEvent) => {
		event.preventDefault();
	};

	const openActionDialog = useCallback((nextDialog: ActionDialogState) => {
		setActionDialog(nextDialog);
		setActionDialogValue(nextDialog.value);
		setActionDialogError(null);
		setSlashMenu(null);
	}, []);

	const closeActionDialog = useCallback(() => {
		setActionDialog(null);
		setActionDialogValue("");
		setActionDialogError(null);
	}, []);

	const openLinkDialog = useCallback(() => {
		if (!editor) {
			return;
		}

		const activeLink = editor.getAttributes("link").href as string | undefined;
		const { from, to } = editor.state.selection;
		openActionDialog({
			mode: "link",
			value: activeLink ?? "https://",
			selectionRange: { from, to },
		});
	}, [editor, openActionDialog]);

	const openInlineMathDialog = useCallback(
		(replaceRange?: SlashRange) => {
			openActionDialog({
				mode: "inlineMath",
				value: "E = mc^2",
				replaceRange,
			});
		},
		[openActionDialog],
	);

	const openBlockMathDialog = useCallback(
		(replaceRange?: SlashRange) => {
			openActionDialog({
				mode: "blockMath",
				value: "\\\\int_0^1 x^2 \\\\, dx",
				replaceRange,
			});
		},
		[openActionDialog],
	);

	const handleActionDialogSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!editor || !actionDialog) {
			return;
		}

		const value = actionDialogValue.trim();
		setActionDialogError(null);
		const chain = editor.chain().focus();

		if (actionDialog.mode === "link") {
			if (actionDialog.selectionRange) {
				chain.setTextSelection(actionDialog.selectionRange);
			}

			if (!value) {
				chain.extendMarkRange("link").unsetLink().run();
				closeActionDialog();
				return;
			}

			chain.extendMarkRange("link").setLink({ href: value }).run();
			closeActionDialog();
			return;
		}

		if (!value) {
			setActionDialogError("Enter a LaTeX expression.");
			return;
		}

		if (actionDialog.replaceRange) {
			chain.deleteRange(actionDialog.replaceRange);
		}

		if (actionDialog.mode === "inlineMath") {
			chain.insertInlineMath({ latex: value }).run();
		} else {
			chain.insertBlockMath({ latex: value }).run();
		}

		closeActionDialog();
	};

	const slashCommands = useMemo<SlashCommandItem[]>(() => {
		if (!editor) {
			return [];
		}

		return [
			{
				id: "paragraph",
				label: "Paragraph",
				description: "Normal body text",
				keywords: ["text", "p", "paragraph"],
				icon: IconPilcrow,
				run: (range) => {
					editor.chain().focus().deleteRange(range).setParagraph().run();
				},
			},
			{
				id: "heading-1",
				label: "Heading 1",
				description: "Large section title",
				keywords: ["h1", "title", "heading"],
				icon: IconH1,
				run: (range) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleHeading({ level: 1 })
						.run();
				},
			},
			{
				id: "heading-2",
				label: "Heading 2",
				description: "Medium section title",
				keywords: ["h2", "subtitle", "heading"],
				icon: IconH2,
				run: (range) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleHeading({ level: 2 })
						.run();
				},
			},
			{
				id: "heading-3",
				label: "Heading 3",
				description: "Small section title",
				keywords: ["h3", "subheading", "heading"],
				icon: IconH3,
				run: (range) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.toggleHeading({ level: 3 })
						.run();
				},
			},
			{
				id: "bullet-list",
				label: "Bullet List",
				description: "Unordered list",
				keywords: ["list", "ul", "bullet"],
				icon: IconList,
				run: (range) => {
					editor.chain().focus().deleteRange(range).toggleBulletList().run();
				},
			},
			{
				id: "ordered-list",
				label: "Ordered List",
				description: "Numbered list",
				keywords: ["list", "ol", "number"],
				icon: IconListNumbers,
				run: (range) => {
					editor.chain().focus().deleteRange(range).toggleOrderedList().run();
				},
			},
			{
				id: "blockquote",
				label: "Blockquote",
				description: "Quoted text",
				keywords: ["quote", "blockquote"],
				icon: IconBlockquote,
				run: (range) => {
					editor.chain().focus().deleteRange(range).toggleBlockquote().run();
				},
			},
			{
				id: "code-block",
				label: "Code Block",
				description: "Monospace code section",
				keywords: ["code", "snippet", "pre"],
				icon: IconCode,
				run: (range) => {
					editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
				},
			},
			{
				id: "inline-math",
				label: "Inline Math",
				description: "Insert inline LaTeX expression",
				keywords: ["latex", "math", "equation", "inline"],
				icon: IconMath,
				run: (range) => {
					openInlineMathDialog(range);
				},
			},
			{
				id: "block-math",
				label: "Block Math",
				description: "Insert block LaTeX equation",
				keywords: ["latex", "math", "equation", "block"],
				icon: IconMathFunction,
				run: (range) => {
					openBlockMathDialog(range);
				},
			},
			{
				id: "table",
				label: "Table",
				description: "Insert 3 x 3 table",
				keywords: ["table", "grid"],
				icon: IconTable,
				run: (range) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
						.run();
				},
			},
			{
				id: "divider",
				label: "Divider",
				description: "Horizontal separator",
				keywords: ["divider", "hr", "line"],
				icon: IconMinus,
				run: (range) => {
					editor.chain().focus().deleteRange(range).setHorizontalRule().run();
				},
			},
		];
	}, [editor, openBlockMathDialog, openInlineMathDialog]);

	const filteredSlashCommands = useMemo(() => {
		if (!slashMenu) {
			return [];
		}

		if (!slashMenu.query) {
			return slashCommands;
		}

		return slashCommands.filter((command) => {
			const searchableText =
				`${command.label} ${command.description} ${command.keywords.join(" ")}`.toLowerCase();
			return searchableText.includes(slashMenu.query);
		});
	}, [slashCommands, slashMenu]);

	const runSlashCommand = useCallback(
		(command: SlashCommandItem) => {
			if (!slashMenu) {
				return;
			}

			command.run({ from: slashMenu.from, to: slashMenu.to });
			setSlashMenu(null);
		},
		[slashMenu],
	);

	useEffect(() => {
		if (!editor) {
			return;
		}

		const syncSlashMenu = () => {
			setSlashMenu(getSlashMenuState(editor));
		};

		const closeSlashMenu = () => {
			setSlashMenu(null);
		};

		syncSlashMenu();
		editor.on("selectionUpdate", syncSlashMenu);
		editor.on("update", syncSlashMenu);
		editor.on("focus", syncSlashMenu);
		editor.on("blur", closeSlashMenu);

		return () => {
			editor.off("selectionUpdate", syncSlashMenu);
			editor.off("update", syncSlashMenu);
			editor.off("focus", syncSlashMenu);
			editor.off("blur", closeSlashMenu);
		};
	}, [editor]);

	const actionDialogMeta = actionDialog
		? ACTION_DIALOG_META[actionDialog.mode]
		: null;
	const mathPreviewMode =
		actionDialog?.mode === "inlineMath" || actionDialog?.mode === "blockMath"
			? actionDialog.mode
			: null;
	const mathPreviewLatex = mathPreviewMode ? actionDialogValue.trim() : "";

	useEffect(() => {
		if (!mathPreviewRef.current || !mathPreviewMode || !mathPreviewLatex) {
			return;
		}

		const displayMode = mathPreviewMode === "blockMath";
		try {
			katex.render(mathPreviewLatex, mathPreviewRef.current, {
				displayMode,
				throwOnError: false,
			});
		} catch {
			mathPreviewRef.current.textContent = mathPreviewLatex;
		}
	}, [mathPreviewLatex, mathPreviewMode]);

	return (
		<div {...props} className={cn("wysiwyg-editor", className)}>
			{editor && (
				<div
					className="sticky top-4 z-20 flex flex-wrap items-center gap-1 rounded-xl border bg-muted/50 px-3 py-2 shadow-xs backdrop-blur"
					role="toolbar"
					aria-label="Block formatting"
					onMouseDown={preventMenuFocusLoss}
				>
					<Toggle
						size="sm"
						aria-label="Paragraph"
						pressed={editor.isActive("paragraph")}
						disabled={!editor.can().chain().focus().setParagraph().run()}
						onPressedChange={() => {
							editor.chain().focus().setParagraph().run();
						}}
					>
						<IconPilcrow />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Heading 1"
						pressed={editor.isActive("heading", { level: 1 })}
						disabled={
							!editor.can().chain().focus().toggleHeading({ level: 1 }).run()
						}
						onPressedChange={() => {
							editor.chain().focus().toggleHeading({ level: 1 }).run();
						}}
					>
						<IconH1 />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Heading 2"
						pressed={editor.isActive("heading", { level: 2 })}
						disabled={
							!editor.can().chain().focus().toggleHeading({ level: 2 }).run()
						}
						onPressedChange={() => {
							editor.chain().focus().toggleHeading({ level: 2 }).run();
						}}
					>
						<IconH2 />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Heading 3"
						pressed={editor.isActive("heading", { level: 3 })}
						disabled={
							!editor.can().chain().focus().toggleHeading({ level: 3 }).run()
						}
						onPressedChange={() => {
							editor.chain().focus().toggleHeading({ level: 3 }).run();
						}}
					>
						<IconH3 />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Bullet list"
						pressed={editor.isActive("bulletList")}
						disabled={!editor.can().chain().focus().toggleBulletList().run()}
						onPressedChange={() => {
							editor.chain().focus().toggleBulletList().run();
						}}
					>
						<IconList />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Ordered list"
						pressed={editor.isActive("orderedList")}
						disabled={!editor.can().chain().focus().toggleOrderedList().run()}
						onPressedChange={() => {
							editor.chain().focus().toggleOrderedList().run();
						}}
					>
						<IconListNumbers />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Blockquote"
						pressed={editor.isActive("blockquote")}
						disabled={!editor.can().chain().focus().toggleBlockquote().run()}
						onPressedChange={() => {
							editor.chain().focus().toggleBlockquote().run();
						}}
					>
						<IconBlockquote />
					</Toggle>
					<Toggle
						size="sm"
						aria-label="Code block"
						pressed={editor.isActive("codeBlock")}
						disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
						onPressedChange={() => {
							editor.chain().focus().toggleCodeBlock().run();
						}}
					>
						<IconCode />
					</Toggle>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => {
							openInlineMathDialog();
						}}
					>
						<IconMath />
						Inline Math
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => {
							openBlockMathDialog();
						}}
					>
						<IconMathFunction />
						Block Math
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={
							!editor
								.can()
								.chain()
								.focus()
								.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
								.run()
						}
						onClick={() => {
							editor
								.chain()
								.focus()
								.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
								.run();
						}}
					>
						<IconTable />
						Table
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={!editor.can().chain().focus().setHorizontalRule().run()}
						onClick={() => {
							editor.chain().focus().setHorizontalRule().run();
						}}
					>
						<IconMinus />
						Divider
					</Button>
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

			<Dialog
				open={Boolean(actionDialog)}
				onOpenChange={(open) => {
					if (!open) {
						closeActionDialog();
					}
				}}
			>
				<DialogContent showCloseButton className="sm:max-w-md">
					<form className="grid gap-4" onSubmit={handleActionDialogSubmit}>
						<DialogHeader>
							<DialogTitle className="text-balance">
								{actionDialogMeta?.title}
							</DialogTitle>
							<DialogDescription className="text-pretty">
								{actionDialogMeta?.description}
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-2">
							<Label htmlFor="editor-action-input">
								{actionDialogMeta?.label}
							</Label>
							<Input
								id="editor-action-input"
								autoFocus
								value={actionDialogValue}
								placeholder={actionDialogMeta?.placeholder}
								aria-invalid={Boolean(actionDialogError)}
								aria-describedby={
									actionDialogError ? "editor-action-error" : undefined
								}
								required={
									actionDialogMeta ? !actionDialogMeta.allowEmpty : false
								}
								onChange={(event) => {
									setActionDialogError(null);
									setActionDialogValue(event.currentTarget.value);
								}}
							/>
							{actionDialogError && (
								<p
									id="editor-action-error"
									role="alert"
									className="text-pretty text-destructive text-sm"
								>
									{actionDialogError}
								</p>
							)}
						</div>

						{actionDialog && actionDialog.mode !== "link" && (
							<div className="grid gap-2">
								<Label>Preview</Label>
								<div
									className={cn(
										"rounded-lg border bg-muted/30 px-3 py-2 text-sm",
										actionDialog.mode === "blockMath" && "overflow-x-auto",
									)}
								>
									{!mathPreviewLatex ? (
										<span className="text-muted-foreground">
											Type LaTeX to preview equation
										</span>
									) : (
										<div ref={mathPreviewRef} />
									)}
								</div>
							</div>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={closeActionDialog}
							>
								Cancel
							</Button>
							<Button type="submit">
								{actionDialogMeta?.submitLabel ?? "Apply"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
