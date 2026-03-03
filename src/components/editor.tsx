import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ComponentProps } from "react";

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

	return (
		<div
			{...props}
			className={cn(
				"wysiwyg-editor rounded-xl border bg-card text-card-foreground",
				"transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20",
				className,
			)}
		>
			<EditorContent editor={editor} className="h-full" />
		</div>
	);
}
