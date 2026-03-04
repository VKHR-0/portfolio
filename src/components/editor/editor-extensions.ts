import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Mathematics from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export function createEditorExtensions(placeholder: string) {
	return [
		StarterKit.configure({
			link: false,
			codeBlock: false,
			heading: {
				levels: [1, 2, 3],
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
	];
}
