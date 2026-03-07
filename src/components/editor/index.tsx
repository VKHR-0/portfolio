import { IconGripVertical } from "@tabler/icons-react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { DOMSerializer } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { EditorBubbleMenu } from "./bubble-menu";
import { defaultActiveState } from "./constants";
import { buildExtensions } from "./extensions";
import type { ActiveState, BlockType, EditorProps } from "./types";
import { useBubbleMenu } from "./use-bubble-menu";
import { useImageUpload } from "./use-image-upload";

export type {
	EditorFormat,
	EditorProps,
	ImageFallbackMode,
	ImagePickerContext,
	ImagePickerFileResult,
	ImagePickerHandler,
	ImagePickerResult,
	ImagePickerUrlResult,
	ImageUploadContext,
	ImageUploadHandler,
	ImageUploadResult,
	SlashImageFallback,
} from "./types";

const getActiveBlockType = (editor: TiptapEditor): BlockType => {
	if (editor.isActive("heading", { level: 1 })) return "heading1";
	if (editor.isActive("heading", { level: 2 })) return "heading2";
	if (editor.isActive("heading", { level: 3 })) return "heading3";
	if (editor.isActive("bulletList")) return "bulletList";
	if (editor.isActive("orderedList")) return "orderedList";
	if (editor.isActive("blockquote")) return "blockquote";
	if (editor.isActive("codeBlock")) return "codeBlock";
	return "paragraph";
};

export function Editor({
	value = "",
	onChange = () => undefined,
	disabled = false,
	format = "html",
	enableImages = true,
	enableImagePasteDrop = false,
	onUploadImage,
	imageFallback = "prompt-url",
	maxImageBytes,
	onRequestImage,
	onPendingUploadsChange,
	className,
	editorClassName,
	...props
}: EditorProps) {
	const [menuBoundary, setMenuBoundary] = useState<HTMLDivElement | null>(null);

	// Stable callback ref so the extension always calls the latest insertLocalImageFile,
	// regardless of which render created the extension config.
	const insertLocalImageFileRef = useRef<
		(
			file: File,
			source: "paste" | "drop" | "slash",
			initialAttrs?: { alt?: string; title?: string },
		) => Promise<void>
	>(async () => undefined);

	const lastEmittedValueRef = useRef<string>(value);

	const tiptapSurfaceClass = cn(
		"min-h-16 w-full rounded-md border border-input bg-transparent px-8 py-2 text-base shadow-xs outline-none transition-[color,box-shadow]",
		"selection:bg-primary placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
		"[&_.ProseMirror-selectednode]:bg-primary/15 [&_.ProseMirror-selectednode]:outline-none [&_li.ProseMirror-selectednode::after]:border-0 [&_li.ProseMirror-selectednode::after]:bg-primary/15",
		"[&_img[data-upload-error]]:ring-2 [&_img[data-upload-error]]:ring-destructive [&_img[data-upload-error]]:ring-offset-2 [&_img[data-upload-error]]:ring-offset-background [&_img[data-uploading=true]]:animate-pulse [&_img[data-uploading=true]]:opacity-70",
		"[&_p.is-empty::before]:pointer-events-none [&_p.is-empty::before]:float-left [&_p.is-empty::before]:h-0 [&_p.is-empty::before]:text-muted-foreground [&_p.is-empty::before]:content-[attr(data-placeholder)]",
		editorClassName,
	);

	const editor = useEditor({
		extensions: buildExtensions({
			enableImages,
			onRequestImage,
			imageFallback,
			// Indirection via ref so the extension closure always calls the
			// latest insertLocalImageFile without recreating extensions.
			insertLocalImageFile: (file, source, initialAttrs) =>
				insertLocalImageFileRef.current(file, source, initialAttrs),
		}),
		content: value || (format === "markdown" ? "" : "<p></p>"),
		contentType: format,
		editorProps: {
			attributes: {
				class: tiptapSurfaceClass,
			},
			handleDOMEvents: {
				copy: (_view, event) => {
					if (!editor) return false;

					const copyEvent = event as ClipboardEvent;
					if (!copyEvent.clipboardData || editor.state.selection.empty)
						return false;

					const selectionFragment = editor.state.selection.content().content;

					if (format === "markdown") {
						const markdown =
							editor.storage.markdown?.manager?.serialize(
								selectionFragment.toJSON(),
							) ?? "";
						copyEvent.clipboardData.setData("text/plain", markdown);
						copyEvent.preventDefault();
						return true;
					}

					const serializer = DOMSerializer.fromSchema(editor.state.schema);
					const container = document.createElement("div");
					container.append(serializer.serializeFragment(selectionFragment));
					const html = container.innerHTML;

					copyEvent.clipboardData.setData("text/html", html);
					copyEvent.clipboardData.setData("text/plain", html);
					copyEvent.preventDefault();
					return true;
				},
			},
			handlePaste: (_view, event) => {
				if (!enableImages || !enableImagePasteDrop) return false;
				const files = Array.from(event.clipboardData?.files ?? []).filter(
					(file) => file.type.startsWith("image/"),
				);
				if (!files.length) return false;
				void insertImagesFromFiles(files, "paste");
				return true;
			},
			handleDrop: (view, event, _slice, moved) => {
				if (moved || !enableImages || !enableImagePasteDrop) return false;
				const files = Array.from(event.dataTransfer?.files ?? []).filter(
					(file) => file.type.startsWith("image/"),
				);
				if (!files.length) return false;

				const coords = view.posAtCoords({
					left: event.clientX,
					top: event.clientY,
				});
				if (coords?.pos != null) {
					view.dispatch(
						view.state.tr.setSelection(
							TextSelection.create(view.state.doc, coords.pos),
						),
					);
				}

				void insertImagesFromFiles(files, "drop");
				return true;
			},
		},
		editable: !disabled,
		immediatelyRender: false,
		onUpdate: ({ editor: nextEditor }) => {
			const nextValue =
				format === "markdown"
					? nextEditor.getMarkdown()
					: nextEditor
							.getHTML()
							.replace(/\sdata-upload-id="[^"]*"/g, "")
							.replace(/\sdata-uploading="[^"]*"/g, "")
							.replace(/\sdata-upload-error="[^"]*"/g, "");
			lastEmittedValueRef.current = nextValue;
			onChange(nextValue);
		},
	});

	const activeState =
		(useEditorState({
			editor,
			selector: ({ editor: currentEditor }) => {
				if (!currentEditor) return defaultActiveState;
				return {
					blockType: getActiveBlockType(currentEditor),
					bold: currentEditor.isActive("bold"),
					italic: currentEditor.isActive("italic"),
					underline: currentEditor.isActive("underline"),
					strike: currentEditor.isActive("strike"),
					code: currentEditor.isActive("code"),
					link: currentEditor.isActive("link"),
				};
			},
		}) as ActiveState | null) ?? defaultActiveState;

	// Sync external value changes into the editor
	useEffect(() => {
		if (!editor) return;
		if (value === lastEmittedValueRef.current) return;

		const current =
			format === "markdown" ? editor.getMarkdown() : editor.getHTML();
		const hasChanged =
			format === "markdown"
				? value.trimEnd() !== current.trimEnd()
				: value !== current;

		if (hasChanged) {
			editor.commands.setContent(
				value || (format === "markdown" ? "" : "<p></p>"),
				{ emitUpdate: false, contentType: format },
			);
			lastEmittedValueRef.current = value;
		}
	}, [editor, value, format]);

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(!disabled);
	}, [editor, disabled]);

	useEffect(() => {
		if (!editor) return;
		editor.setOptions({
			editorProps: { attributes: { class: tiptapSurfaceClass } },
		});
	}, [editor, tiptapSurfaceClass]);

	const { insertLocalImageFile, insertImagesFromFiles } = useImageUpload(
		editor,
		{
			onUploadImage,
			imageFallback,
			maxImageBytes: maxImageBytes ?? 1_000_000,
			onPendingUploadsChange,
		},
	);

	// Keep the ref in sync so the extension always calls the latest function
	insertLocalImageFileRef.current = insertLocalImageFile;

	const menu = useBubbleMenu(editor, { enableImages, disabled });

	const setBlockType = (next: BlockType): void => {
		if (!editor) return;
		const chain = editor.chain().focus();
		switch (next) {
			case "paragraph":
				chain.setParagraph().run();
				break;
			case "heading1":
				chain.setHeading({ level: 1 }).run();
				break;
			case "heading2":
				chain.setHeading({ level: 2 }).run();
				break;
			case "heading3":
				chain.setHeading({ level: 3 }).run();
				break;
			case "bulletList":
				chain.toggleBulletList().run();
				break;
			case "orderedList":
				chain.toggleOrderedList().run();
				break;
			case "blockquote":
				chain.toggleBlockquote().run();
				break;
			case "codeBlock":
				chain.toggleCodeBlock().run();
				break;
		}
	};

	if (!editor) {
		return (
			<div
				{...props}
				ref={setMenuBoundary}
				className={cn("min-w-0", className)}
			>
				<div className="flex h-full flex-col gap-1">
					<div className="rounded-md border border-border bg-popover p-1 shadow-sm">
						<Skeleton className="h-7 w-full rounded-sm" />
					</div>
					<div className={tiptapSurfaceClass}>
						<Skeleton className="h-full min-h-[70vh] w-full rounded-sm" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div {...props} ref={setMenuBoundary} className={cn("min-w-0", className)}>
			<EditorBubbleMenu
				editor={editor}
				menuBoundary={menuBoundary}
				disabled={disabled}
				activeState={activeState}
				onSetBlockType={setBlockType}
				menu={menu}
			/>
			{disabled ? null : (
				<DragHandle
					editor={editor}
					className="z-40 grid -translate-x-1 place-items-center"
					nested
				>
					<Button variant="outline" size="icon-xs">
						<IconGripVertical size={16} />
					</Button>
				</DragHandle>
			)}
			<EditorContent editor={editor} className="h-full" />
		</div>
	);
}
