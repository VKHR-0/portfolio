import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as React from "react";
import { cn } from "#/lib/utils";

const viewerExtensions = [
	StarterKit.configure({
		heading: { levels: [1, 2, 3] },
		link: false,
		underline: false,
	}),
	Underline,
	Link.configure({
		openOnClick: true,
		HTMLAttributes: {
			rel: "noopener noreferrer",
			target: "_blank",
		},
	}),
	Image,
	Table,
	TableRow,
	TableHeader,
	TableCell,
	Markdown,
];

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
