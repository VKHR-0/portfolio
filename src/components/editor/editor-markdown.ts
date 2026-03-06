import type { JSONContent } from "@tiptap/core";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import { mathFromMarkdown, mathToMarkdown } from "mdast-util-math";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfm } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";

type MarkdownNode = {
	type: string;
	[key: string]: unknown;
};

type MarkdownMark = {
	type: string;
	attrs?: Record<string, unknown>;
};

function normalizeMarkdown(value: string) {
	return value.replace(/\n+$/, "");
}

function asArray(value: unknown) {
	return Array.isArray(value) ? (value as Array<MarkdownNode>) : [];
}

function asString(value: unknown) {
	return typeof value === "string" ? value : "";
}

function createTextNode(text: string, marks: MarkdownMark[] = []) {
	if (!text) {
		return [];
	}

	return [
		{
			type: "text",
			text,
			...(marks.length > 0 ? { marks } : {}),
		} satisfies JSONContent,
	];
}

function toInlineMarks(
	node: MarkdownNode,
	activeMarks: MarkdownMark[],
): Array<MarkdownMark> {
	switch (node.type) {
		case "strong":
			return [...activeMarks, { type: "bold" }];
		case "emphasis":
			return [...activeMarks, { type: "italic" }];
		case "delete":
			return [...activeMarks, { type: "strike" }];
		case "link":
			return [
				...activeMarks,
				{
					type: "link",
					attrs: {
						href: asString(node.url),
					},
				},
			];
		default:
			return activeMarks;
	}
}

function mdastPhrasingToTiptap(
	nodes: Array<MarkdownNode>,
	activeMarks: MarkdownMark[] = [],
): Array<JSONContent> {
	return nodes.flatMap<JSONContent>((node) => {
		switch (node.type) {
			case "text":
				return createTextNode(asString(node.value), activeMarks);
			case "inlineCode":
				return createTextNode(asString(node.value), [
					...activeMarks,
					{ type: "code" },
				]);
			case "break":
				return [{ type: "hardBreak" } satisfies JSONContent];
			case "inlineMath":
				return [
					{
						type: "inlineMath",
						attrs: {
							latex: asString(node.value),
						},
					} satisfies JSONContent,
				];
			case "strong":
			case "emphasis":
			case "delete":
			case "link":
				return mdastPhrasingToTiptap(
					asArray(node.children),
					toInlineMarks(node, activeMarks),
				);
			case "html":
				return createTextNode(asString(node.value), activeMarks);
			default:
				return [];
		}
	});
}

function mdastTableToTiptap(table: MarkdownNode): JSONContent {
	return {
		type: "table",
		content: asArray(table.children).map((row, rowIndex) => ({
			type: "tableRow",
			content: asArray(row.children).map((cell) => ({
				type: rowIndex === 0 ? "tableHeader" : "tableCell",
				content: [
					{
						type: "paragraph",
						content: mdastPhrasingToTiptap(asArray(cell.children)),
					},
				],
			})),
		})),
	};
}

function mdastFlowToTiptap(nodes: Array<MarkdownNode>): Array<JSONContent> {
	return nodes.flatMap<JSONContent>((node) => {
		switch (node.type) {
			case "paragraph":
				return [
					{
						type: "paragraph",
						content: mdastPhrasingToTiptap(asArray(node.children)),
					} satisfies JSONContent,
				];
			case "heading":
				return [
					{
						type: "heading",
						attrs: {
							level: Math.min(Math.max(Number(node.depth) || 1, 1), 3),
						},
						content: mdastPhrasingToTiptap(asArray(node.children)),
					} satisfies JSONContent,
				];
			case "blockquote":
				return [
					{
						type: "blockquote",
						content: mdastFlowToTiptap(asArray(node.children)),
					} satisfies JSONContent,
				];
			case "list":
				return [
					{
						type: node.ordered ? "orderedList" : "bulletList",
						...(node.ordered && Number(node.start) > 1
							? { attrs: { start: Number(node.start) } }
							: {}),
						content: mdastFlowToTiptap(asArray(node.children)),
					} satisfies JSONContent,
				];
			case "listItem": {
				const listItemContent = mdastFlowToTiptap(asArray(node.children));

				return [
					{
						type: "listItem",
						content:
							listItemContent.length > 0
								? listItemContent
								: [{ type: "paragraph" }],
					} satisfies JSONContent,
				];
			}
			case "code":
				return [
					{
						type: "codeBlock",
						...(node.lang
							? {
									attrs: {
										language: asString(node.lang),
									},
								}
							: {}),
						content: createTextNode(asString(node.value)),
					} satisfies JSONContent,
				];
			case "thematicBreak":
				return [{ type: "horizontalRule" } satisfies JSONContent];
			case "table":
				return [mdastTableToTiptap(node)];
			case "math":
				return [
					{
						type: "blockMath",
						attrs: {
							latex: asString(node.value),
						},
					} satisfies JSONContent,
				];
			case "html":
				return [
					{
						type: "paragraph",
						content: createTextNode(asString(node.value)),
					} satisfies JSONContent,
				];
			default:
				return [];
		}
	});
}

function applyMarksToText(text: string, marks: Array<MarkdownMark>) {
	const codeMark = marks.find((mark) => mark.type === "code");

	if (codeMark) {
		return {
			type: "inlineCode",
			value: text,
		};
	}

	let current: MarkdownNode = {
		type: "text",
		value: text,
	};

	for (const mark of marks) {
		switch (mark.type) {
			case "bold":
				current = { type: "strong", children: [current] };
				break;
			case "italic":
				current = { type: "emphasis", children: [current] };
				break;
			case "strike":
				current = { type: "delete", children: [current] };
				break;
			case "link":
				current = {
					type: "link",
					url: asString(mark.attrs?.href),
					title: null,
					children: [current],
				};
				break;
			default:
				break;
		}
	}

	return current;
}

function tiptapInlineToMdast(nodes: Array<JSONContent>): Array<MarkdownNode> {
	return nodes.flatMap<MarkdownNode>((node) => {
		switch (node.type) {
			case "text":
				return node.text
					? [
							applyMarksToText(
								node.text,
								(node.marks as Array<MarkdownMark> | undefined) ?? [],
							),
						]
					: [];
			case "hardBreak":
				return [{ type: "break" }];
			case "inlineMath":
				return [
					{
						type: "inlineMath",
						value: asString(node.attrs?.latex),
					},
				];
			default:
				return [];
		}
	});
}

function flattenTableCell(nodes: Array<JSONContent>): Array<MarkdownNode> {
	return nodes.flatMap<MarkdownNode>((node, index) => {
		if (node.type === "paragraph" || node.type === "heading") {
			const prefix =
				index > 0 ? [{ type: "break" } satisfies MarkdownNode] : [];
			return [...prefix, ...tiptapInlineToMdast(node.content ?? [])];
		}

		return [];
	});
}

function extractText(nodes: Array<JSONContent>) {
	return nodes
		.flatMap((node) => {
			if (node.type === "text") {
				return [node.text ?? ""];
			}

			if (node.type === "hardBreak") {
				return ["\n"];
			}

			return [];
		})
		.join("");
}

function tiptapFlowToMdast(nodes: Array<JSONContent>): Array<MarkdownNode> {
	return nodes.flatMap<MarkdownNode>((node) => {
		switch (node.type) {
			case "paragraph":
				return [
					{
						type: "paragraph",
						children: tiptapInlineToMdast(node.content ?? []),
					},
				];
			case "heading":
				return [
					{
						type: "heading",
						depth: Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6),
						children: tiptapInlineToMdast(node.content ?? []),
					},
				];
			case "blockquote":
				return [
					{
						type: "blockquote",
						children: tiptapFlowToMdast(node.content ?? []),
					},
				];
			case "bulletList":
				return [
					{
						type: "list",
						ordered: false,
						spread: false,
						children: tiptapFlowToMdast(node.content ?? []),
					},
				];
			case "orderedList":
				return [
					{
						type: "list",
						ordered: true,
						start: Number(node.attrs?.start) || 1,
						spread: false,
						children: tiptapFlowToMdast(node.content ?? []),
					},
				];
			case "listItem":
				return [
					{
						type: "listItem",
						spread: false,
						children:
							tiptapFlowToMdast(node.content ?? []).length > 0
								? tiptapFlowToMdast(node.content ?? [])
								: [
										{
											type: "paragraph",
											children: [],
										},
									],
					},
				];
			case "codeBlock":
				return [
					{
						type: "code",
						lang: asString(node.attrs?.language) || null,
						meta: null,
						value: extractText(node.content ?? []),
					},
				];
			case "horizontalRule":
				return [{ type: "thematicBreak" }];
			case "table":
				return [
					{
						type: "table",
						align: [],
						children: tiptapFlowToMdast(node.content ?? []),
					},
				];
			case "tableRow":
				return [
					{
						type: "tableRow",
						children: tiptapFlowToMdast(node.content ?? []),
					},
				];
			case "tableHeader":
			case "tableCell":
				return [
					{
						type: "tableCell",
						children: flattenTableCell(node.content ?? []),
					},
				];
			case "blockMath":
				return [
					{
						type: "math",
						meta: null,
						value: asString(node.attrs?.latex),
					},
				];
			default:
				return [];
		}
	});
}

export function markdownToTiptapDocument(markdown: string): JSONContent {
	const normalizedMarkdown = normalizeMarkdown(markdown);

	if (!normalizedMarkdown) {
		return {
			type: "doc",
			content: [{ type: "paragraph" }],
		};
	}

	const tree = fromMarkdown(normalizedMarkdown, {
		extensions: [gfm(), math()],
		mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
	}) as unknown as MarkdownNode;
	const content = mdastFlowToTiptap(asArray(tree.children));

	return {
		type: "doc",
		content: content.length > 0 ? content : [{ type: "paragraph" }],
	};
}

export function tiptapDocumentToMarkdown(document: JSONContent): string {
	const tree = {
		type: "root",
		children: tiptapFlowToMdast(document.content ?? []),
	} as unknown as Parameters<typeof toMarkdown>[0];

	return normalizeMarkdown(
		toMarkdown(tree, {
			bullet: "-",
			fences: true,
			emphasis: "*",
			extensions: [gfmToMarkdown(), mathToMarkdown()],
		}),
	);
}
