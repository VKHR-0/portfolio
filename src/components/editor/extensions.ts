import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import SlashCommands from "./slash-command/commands";
import type { ImageFallbackMode, ImagePickerHandler } from "./types";

export const UploadableImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			uploadId: {
				default: null,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute("data-upload-id"),
				renderHTML: (attributes: { uploadId?: string | null }) =>
					attributes.uploadId ? { "data-upload-id": attributes.uploadId } : {},
			},
			uploading: {
				default: false,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute("data-uploading") === "true",
				renderHTML: (attributes: { uploading?: boolean }) =>
					attributes.uploading ? { "data-uploading": "true" } : {},
			},
			uploadError: {
				default: null,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute("data-upload-error"),
				renderHTML: (attributes: { uploadError?: string | null }) =>
					attributes.uploadError
						? { "data-upload-error": attributes.uploadError }
						: {},
			},
		};
	},
});

type BuildExtensionsOptions = {
	headingLevels: Array<1 | 2 | 3>;
	enableImages: boolean;
	onRequestImage: ImagePickerHandler | null | undefined;
	imageFallback: ImageFallbackMode;
	/** Stable callback wrapper so extensions always call the latest implementation. */
	insertLocalImageFile: (
		file: File,
		source: "paste" | "drop" | "slash",
		initialAttrs?: { alt?: string; title?: string },
	) => Promise<void>;
};

export const buildExtensions = ({
	headingLevels,
	enableImages,
	onRequestImage,
	imageFallback,
	insertLocalImageFile,
}: BuildExtensionsOptions) => [
	StarterKit.configure({
		heading: {
			levels: headingLevels,
		},
		link: false,
		underline: false,
	}),
	Underline,
	Link.configure({
		openOnClick: false,
		enableClickSelection: true,
		HTMLAttributes: {
			rel: null,
			target: null,
		},
	}),
	UploadableImage,
	Table,
	TableRow,
	TableHeader,
	TableCell,
	Placeholder.configure({
		placeholder: ({ node }: { node: ProseMirrorNode }): string =>
			node.type.name === "paragraph" ? "Press '/' for commands" : "",
		showOnlyCurrent: true,
		includeChildren: true,
	}),
	Markdown,
	SlashCommands.configure({
		onRequestImage: enableImages ? (onRequestImage ?? null) : null,
		onInsertLocalImageFile: ({ file, alt, title }) => {
			void insertLocalImageFile(file, "slash", {
				...(alt ? { alt } : {}),
				...(title ? { title } : {}),
			});
		},
		enableImages,
		imageSlashFallback: imageFallback === "prompt-url" ? "prompt-url" : "none",
	}),
];
