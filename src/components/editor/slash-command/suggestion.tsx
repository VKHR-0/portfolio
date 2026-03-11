import {
	IconCode,
	IconH1,
	IconH2,
	IconH3,
	IconList,
	IconListNumbers,
	IconPhoto,
	IconPilcrow,
	IconQuote,
	IconTable,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions as TiptapSuggestionOptions } from "@tiptap/suggestion";
import type { Id } from "convex/_generated/dataModel";
import CommandsList, {
	type CommandsListHandle,
	type SlashItem,
} from "./commands-list";

export type ImagePickerUrlResult = {
	kind: "url";
	src: string;
	mediaId?: Id<"media">;
	alt?: string;
	title?: string;
};

export type ImagePickerFileResult = {
	kind: "file";
	file: File;
	alt?: string;
	title?: string;
};

export type ImagePickerResult = ImagePickerUrlResult | ImagePickerFileResult;

export type ImagePickerContext = {
	editor: Editor;
	range: { from: number; to: number };
};

export type ImagePickerHandler = (
	context: ImagePickerContext,
) => ImagePickerResult | null | Promise<ImagePickerResult | null>;

export type SlashImageFallback = "prompt-url" | "none";

type SuggestionOptions = {
	onRequestImage?: ImagePickerHandler | null;
	onInsertLocalImageFile?:
		| ((
				context: ImagePickerContext & Omit<ImagePickerFileResult, "kind">,
		  ) => void | Promise<void>)
		| null;
	enableImages?: boolean;
	imageSlashFallback?: SlashImageFallback;
};

type RequestImageAndInsertArgs = ImagePickerContext & {
	onRequestImage: ImagePickerHandler | null;
	onInsertLocalImageFile:
		| ((
				context: ImagePickerContext & Omit<ImagePickerFileResult, "kind">,
		  ) => void | Promise<void>)
		| null;
	imageSlashFallback: SlashImageFallback;
};

const requestImageAndInsert = async ({
	editor,
	range,
	onRequestImage,
	onInsertLocalImageFile,
	imageSlashFallback = "prompt-url",
}: RequestImageAndInsertArgs): Promise<void> => {
	let result: ImagePickerResult | null = null;
	if (onRequestImage) {
		result = await onRequestImage({ editor, range });
	} else if (imageSlashFallback === "prompt-url") {
		const src = window.prompt("Image URL")?.trim();
		result = src ? { kind: "url", src } : null;
	}

	if (!result) return;

	if (result.kind === "file") {
		if (!onInsertLocalImageFile) return;
		editor.chain().focus().deleteRange(range).run();
		const fileInsertContext: ImagePickerContext &
			Omit<ImagePickerFileResult, "kind"> = {
			editor,
			range,
			file: result.file,
			...(result.alt ? { alt: result.alt } : {}),
			...(result.title ? { title: result.title } : {}),
		};
		await onInsertLocalImageFile(fileInsertContext);
		return;
	}

	const imageAttrs = {
		src: result.src,
		...(result.mediaId ? { mediaId: result.mediaId } : {}),
		...(result.alt ? { alt: result.alt } : {}),
		...(result.title ? { title: result.title } : {}),
	};

	editor.chain().focus().deleteRange(range).setImage(imageAttrs).run();
};

const getAllItems = (options: SuggestionOptions): SlashItem[] => [
	{
		title: "Text",
		icon: IconPilcrow,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).setParagraph().run(),
	},
	{
		title: "Heading 1",
		icon: IconH1,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
	},
	{
		title: "Heading 2",
		icon: IconH2,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
	},
	{
		title: "Heading 3",
		icon: IconH3,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
	},
	{
		title: "Bulleted list",
		icon: IconList,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).toggleBulletList().run(),
	},
	{
		title: "Numbered list",
		icon: IconListNumbers,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
	},
	{
		title: "Image",
		icon: IconPhoto,
		command: ({ editor, range }) => {
			void requestImageAndInsert({
				editor,
				range,
				onRequestImage: options.onRequestImage ?? null,
				onInsertLocalImageFile: options.onInsertLocalImageFile ?? null,
				imageSlashFallback: options.imageSlashFallback ?? "prompt-url",
			});
		},
	},
	{
		title: "Table",
		icon: IconTable,
		command: ({ editor, range }) =>
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
				.run(),
	},
	{
		title: "Quote",
		icon: IconQuote,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
	},
	{
		title: "Code block",
		icon: IconCode,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
	},
];

type SlashSuggestion = Pick<TiptapSuggestionOptions, "items" | "render">;
type SuggestionRenderLifecycle = NonNullable<
	ReturnType<NonNullable<SlashSuggestion["render"]>>
>;
type SuggestionKeyDownProps = Parameters<
	NonNullable<SuggestionRenderLifecycle["onKeyDown"]>
>[0];

const updatePosition = (el: HTMLElement, rect: DOMRect): void => {
	el.style.top = `${rect.bottom + 4}px`;
	el.style.left = `${rect.left}px`;
};

const createSuggestion = (
	options: SuggestionOptions = {},
): SlashSuggestion => ({
	items: ({ query }: { query: string }) =>
		getAllItems(options)
			.filter(
				(item) => options.enableImages !== false || item.title !== "Image",
			)
			.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
			.slice(0, 10),

	render: (): SuggestionRenderLifecycle => {
		let component: ReactRenderer<CommandsListHandle> | null = null;
		let el: HTMLElement | null = null;

		return {
			onStart: (props) => {
				component = new ReactRenderer(CommandsList, {
					props,
					editor: props.editor,
				});

				if (!props.clientRect) return;
				const referenceRect = () =>
					props.clientRect?.() ?? new DOMRect(0, 0, 0, 0);

				el = component.element as HTMLElement;
				Object.assign(el.style, { position: "fixed", zIndex: "50" });
				document.body.appendChild(el);
				updatePosition(el, referenceRect());
			},

			onUpdate: (props) => {
				if (!component) return;
				component.updateProps(props);
				if (!props.clientRect || !el) return;
				const referenceRect = () =>
					props.clientRect?.() ?? new DOMRect(0, 0, 0, 0);
				updatePosition(el, referenceRect());
			},

			onKeyDown: ({ event }: SuggestionKeyDownProps): boolean => {
				if (event.key === "Escape" && el) {
					el.remove();
					el = null;
					component?.destroy();
					component = null;
					return true;
				}

				return component?.ref?.onKeyDown(event) ?? false;
			},

			onExit: (): void => {
				el?.remove();
				component?.destroy();
				el = null;
				component = null;
			},
		};
	},
});

export default createSuggestion;
