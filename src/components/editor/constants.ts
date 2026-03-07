import type { ActiveState, BlockType } from "./types";

export const DEFAULT_MAX_IMAGE_BYTES = 1_000_000;
export const UPLOADED_IMAGE_PRELOAD_TIMEOUT_MS = 8_000;

const headingOptions: Record<1 | 2 | 3, { value: BlockType; label: string }> = {
	1: { value: "heading1", label: "Heading 1" },
	2: { value: "heading2", label: "Heading 2" },
	3: { value: "heading3", label: "Heading 3" },
};

export function getBlockOptions(
	headingLevels: Array<1 | 2 | 3>,
): Array<{ value: BlockType; label: string }> {
	return [
		{ value: "paragraph", label: "Text" },
		...headingLevels.map((level) => headingOptions[level]),
		{ value: "bulletList", label: "Bulleted list" },
		{ value: "orderedList", label: "Numbered list" },
		{ value: "blockquote", label: "Quote" },
		{ value: "codeBlock", label: "Code block" },
	];
}

export const defaultActiveState: ActiveState = {
	blockType: "paragraph",
	bold: false,
	italic: false,
	underline: false,
	strike: false,
	code: false,
	link: false,
};
