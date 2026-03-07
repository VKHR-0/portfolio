import type { Editor as TiptapEditor } from "@tiptap/core";
import { type RefObject, useEffect, useRef, useState } from "react";

type ActivePanel = "link" | "table" | "alt" | null;

type UseBubbleMenuOptions = {
	enableImages: boolean;
	disabled: boolean;
};

export type BubbleMenuState = {
	activePanel: ActivePanel;
	linkUrl: string;
	imageAltText: string;
	isInTable: boolean;
	isOnImage: boolean;
	bubbleMenuRef: RefObject<HTMLDivElement | null>;
	linkInputRef: RefObject<HTMLInputElement | null>;
	setLinkUrl: (url: string) => void;
	setImageAltText: (text: string) => void;
	openLinkInput: () => void;
	toggleTableActions: () => void;
	toggleAltInput: () => void;
	applyLink: () => void;
	removeLink: () => void;
	confirmOrRemoveLink: () => void;
	applyImageAlt: () => void;
	clearImageAlt: () => void;
	addRow: () => void;
	removeRow: () => void;
	addColumn: () => void;
	removeColumn: () => void;
};

export function useBubbleMenu(
	editor: TiptapEditor | null,
	{ enableImages, disabled: _disabled }: UseBubbleMenuOptions,
): BubbleMenuState {
	const [activePanel, setActivePanel] = useState<ActivePanel>(null);
	const [isInTable, setIsInTable] = useState(false);
	const [isOnImage, setIsOnImage] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [imageAltText, setImageAltText] = useState("");

	const bubbleMenuRef = useRef<HTMLDivElement | null>(null);
	const linkInputRef = useRef<HTMLInputElement | null>(null);

	// Close the active panel when clicking outside the bubble menu
	useEffect(() => {
		if (!activePanel || !editor) return;

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (!target) return;
			const insideBubble = bubbleMenuRef.current?.contains(target) ?? false;
			if (!insideBubble) setActivePanel(null);
		};

		document.addEventListener("pointerdown", onPointerDown, true);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
		};
	}, [activePanel, editor]);

	// Auto-focus the link input when it opens
	useEffect(() => {
		if (activePanel !== "link") return;
		const frameId = requestAnimationFrame(() => {
			linkInputRef.current?.focus();
			linkInputRef.current?.select();
		});
		return () => cancelAnimationFrame(frameId);
	}, [activePanel]);

	// Track whether the cursor is inside a table or on an image
	useEffect(() => {
		if (!editor) return;

		const update = () => {
			const nextIsInTable =
				editor.isActive("table") ||
				editor.isActive("tableRow") ||
				editor.isActive("tableHeader") ||
				editor.isActive("tableCell");
			const nextIsOnImage = enableImages && editor.isActive("image");

			setIsInTable(nextIsInTable);
			if (!nextIsInTable) setActivePanel((p) => (p === "table" ? null : p));
			setIsOnImage(nextIsOnImage);
			if (!nextIsOnImage) setActivePanel((p) => (p === "alt" ? null : p));
		};

		update();
		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
		};
	}, [editor, enableImages]);

	const openLinkInput = () => {
		if (activePanel === "link") {
			setActivePanel(null);
			return;
		}
		if (!editor) return;
		const linkAttrs = editor.getAttributes("link");
		const href = typeof linkAttrs.href === "string" ? linkAttrs.href : "";
		setLinkUrl(editor.isActive("link") ? href : "");
		setActivePanel("link");
	};

	const toggleTableActions = () => {
		if (!isInTable) return;
		setActivePanel((p) => (p === "table" ? null : "table"));
	};

	const toggleAltInput = () => {
		if (!enableImages || !isOnImage || !editor) return;
		if (activePanel === "alt") {
			setActivePanel(null);
			return;
		}
		const imageAttrs = editor.getAttributes("image");
		setImageAltText(typeof imageAttrs.alt === "string" ? imageAttrs.alt : "");
		setActivePanel("alt");
	};

	const applyLink = () => {
		if (!editor) return;
		const trimmed = linkUrl.trim();
		if (!trimmed) return;
		editor
			.chain()
			.focus()
			.extendMarkRange("link")
			.setLink({ href: trimmed })
			.run();
		setActivePanel(null);
	};

	const removeLink = () => {
		if (!editor) return;
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		setActivePanel(null);
		setLinkUrl("");
	};

	const confirmOrRemoveLink = () => {
		if (!editor) return;
		if (linkUrl.trim() || editor.isActive("link")) {
			removeLink();
			return;
		}
		setActivePanel(null);
	};

	const applyImageAlt = () => {
		if (!enableImages || !isOnImage || !editor) return;
		editor
			.chain()
			.focus()
			.updateAttributes("image", { alt: imageAltText.trim() || undefined })
			.run();
		setActivePanel(null);
	};

	const clearImageAlt = () => {
		if (!enableImages || !isOnImage || !editor) return;
		editor.chain().focus().updateAttributes("image", {}).run();
		setImageAltText("");
		setActivePanel(null);
	};

	const addRow = () => editor?.chain().focus().addRowAfter().run();
	const removeRow = () => editor?.chain().focus().deleteRow().run();
	const addColumn = () => editor?.chain().focus().addColumnAfter().run();
	const removeColumn = () => editor?.chain().focus().deleteColumn().run();

	return {
		activePanel,
		linkUrl,
		imageAltText,
		isInTable,
		isOnImage,
		bubbleMenuRef,
		linkInputRef,
		setLinkUrl,
		setImageAltText,
		openLinkInput,
		toggleTableActions,
		toggleAltInput,
		applyLink,
		removeLink,
		confirmOrRemoveLink,
		applyImageAlt,
		clearImageAlt,
		addRow,
		removeRow,
		addColumn,
		removeColumn,
	};
}
