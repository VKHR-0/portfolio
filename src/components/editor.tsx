import {
	IconBold,
	IconCode,
	IconItalic,
	IconLink,
	IconStrikethrough,
} from "@tabler/icons-react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import type { ComponentProps, MouseEvent } from "react";

import { Toggle } from "#/components/ui/toggle";
import { cn } from "#/lib/utils";

type EditorProps = {
	className?: string;
	placeholder?: string;
} & Omit<ComponentProps<"div">, "children">;

export function Editor({
	className,
	placeholder = "Please Type Here...",
	...props
}: EditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4],
				},
				codeBlock: {
					HTMLAttributes: {
						class: "rounded-lg bg-muted px-3 py-2 font-mono text-sm",
					},
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
			Placeholder.configure({
				placeholder,
				emptyNodeClass: "is-editor-empty",
			}),
		],
		editorProps: {
			attributes: {
				class:
					"tiptap prose prose-neutral dark:prose-invert h-full min-h-[240px] max-w-none cursor-text px-6 py-5 text-base leading-7 outline-none",
			},
		},
		content: "",
	});

	const preventMenuFocusLoss = (event: MouseEvent) => {
		event.preventDefault();
	};

	const toggleLink = () => {
		if (!editor) {
			return;
		}

		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			return;
		}

		const activeLink = editor.getAttributes("link").href as string | undefined;
		const nextLink = window.prompt("Enter URL", activeLink ?? "https://");

		if (nextLink === null) {
			return;
		}

		const href = nextLink.trim();
		if (!href) {
			editor.chain().focus().unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
	};

	return (
		<div
			{...props}
			className={cn(
				"wysiwyg-editor rounded-xl border bg-card text-card-foreground",
				"transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20",
				className,
			)}
		>
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
							onPressedChange={toggleLink}
						>
							<IconLink />
						</Toggle>
					</div>
				</BubbleMenu>
			)}
			<EditorContent editor={editor} className="h-full" />
		</div>
	);
}
