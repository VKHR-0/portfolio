import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import * as React from "react";
import { renderContentExtensions } from "#/lib/tiptap-extensions";
import { cn } from "#/lib/utils";

const viewerExtensions = [...renderContentExtensions, Markdown];

type ContentViewerProps = {
	content: string;
	format?: "markdown" | "html";
	className?: string;
};

export function ContentViewer({
	content,
	format = "markdown",
	className,
}: ContentViewerProps) {
	const editor = useEditor({
		extensions: viewerExtensions,
		content: content || "",
		contentType: format,
		editable: false,
		immediatelyRender: false,
	});

	React.useEffect(() => {
		if (!editor) return;
		const current =
			format === "markdown" ? editor.getMarkdown() : editor.getHTML();
		if (content !== current) {
			editor.commands.setContent(content || "", {
				emitUpdate: false,
				contentType: format,
			});
		}
	}, [editor, content, format]);

	if (!editor) {
		return null;
	}

	return (
		<EditorContent
			editor={editor}
			className={cn("[&_.ProseMirror]:outline-none", className)}
		/>
	);
}
