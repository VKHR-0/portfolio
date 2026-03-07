import type { ActiveState, BlockType } from "./types";

export const DEFAULT_MAX_IMAGE_BYTES = 1_000_000;
export const UPLOADED_IMAGE_PRELOAD_TIMEOUT_MS = 8_000;

export const blockOptions: Array<{ value: BlockType; label: string }> = [
	{ value: "paragraph", label: "Text" },
	{ value: "heading1", label: "Heading 1" },
	{ value: "heading2", label: "Heading 2" },
	{ value: "heading3", label: "Heading 3" },
	{ value: "bulletList", label: "Bulleted list" },
	{ value: "orderedList", label: "Numbered list" },
	{ value: "blockquote", label: "Quote" },
	{ value: "codeBlock", label: "Code block" },
];

export const defaultActiveState: ActiveState = {
	blockType: "paragraph",
	bold: false,
	italic: false,
	underline: false,
	strike: false,
	code: false,
	link: false,
};

export const toolbarButtonClass =
	"inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
export const toolbarToggleButtonClass = `${toolbarButtonClass} aria-pressed:bg-accent aria-pressed:text-accent-foreground`;
export const toolbarInputClass =
	"border-input bg-background text-foreground h-7 rounded-md border px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
