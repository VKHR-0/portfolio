import type { Editor as TiptapEditor } from "@tiptap/core";
import type { HTMLAttributes } from "react";
import type {
	ImagePickerContext,
	ImagePickerFileResult,
	ImagePickerHandler,
	ImagePickerResult,
	ImagePickerUrlResult,
	SlashImageFallback,
} from "./slash-command/suggestion";

// ── Public types ────────────────────────────────────────────────────

export type EditorFormat = "html" | "markdown" | "json";
export type ImageFallbackMode = "data-url" | "prompt-url" | "none";

export type ImageUploadContext = {
	editor: TiptapEditor;
	source: "paste" | "drop" | "slash";
};

export type ImageUploadResult = {
	src: string;
	alt?: string;
	title?: string;
};

export type ImageUploadHandler = (
	file: File,
	context: ImageUploadContext,
) => ImageUploadResult | null | Promise<ImageUploadResult | null>;

export type EditorProps = {
	value?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	format?: EditorFormat;
	headingLevels?: Array<1 | 2 | 3>;
	enableImages?: boolean;
	enableImagePasteDrop?: boolean;
	onUploadImage?: ImageUploadHandler;
	imageFallback?: ImageFallbackMode;
	maxImageBytes?: number;
	onRequestImage?: ImagePickerHandler;
	onPendingUploadsChange?: (count: number) => void;
	className?: string;
	editorClassName?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "className">;

// Re-export picker types so consumers can import them from the editor
export type {
	ImagePickerContext,
	ImagePickerFileResult,
	ImagePickerHandler,
	ImagePickerResult,
	ImagePickerUrlResult,
	SlashImageFallback,
};

// ── Internal types ──────────────────────────────────────────────────

export type BlockType =
	| "paragraph"
	| "heading1"
	| "heading2"
	| "heading3"
	| "bulletList"
	| "orderedList"
	| "blockquote"
	| "codeBlock";

export type ActiveState = {
	blockType: BlockType;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
	code: boolean;
	link: boolean;
};

export type UploadableImageAttrs = {
	src?: unknown;
	alt?: unknown;
	title?: unknown;
	uploadId?: unknown;
	uploading?: unknown;
	uploadError?: unknown;
	[key: string]: unknown;
};
