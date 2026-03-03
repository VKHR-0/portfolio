import Placeholder from "@tiptap/extension-placeholder";
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
			StarterKit,
			Placeholder.configure({
				placeholder,
				emptyNodeClass: "is-editor-empty",
			}),
		],
		editorProps: {
			attributes: {
				class:
					"tiptap h-full min-h-[240px] cursor-text px-6 py-5 text-base leading-7 outline-none",
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
