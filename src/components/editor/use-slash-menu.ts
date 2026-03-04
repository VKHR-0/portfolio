import type { Editor as TiptapEditor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

export type SlashRange = {
	from: number;
	to: number;
};

export type SlashMenuState = SlashRange & {
	query: string;
	top: number;
	left: number;
};

function getSlashMenuState(editor: TiptapEditor): SlashMenuState | null {
	const { selection } = editor.state;

	if (!selection.empty) {
		return null;
	}

	const { $from, from } = selection;
	if ($from.parent.type.name !== "paragraph") {
		return null;
	}

	const textBeforeCursor = $from.parent.textBetween(
		0,
		$from.parentOffset,
		undefined,
		"\0",
	);
	const slashMatch = textBeforeCursor.match(/^\/([a-zA-Z0-9-]*)$/);

	if (!slashMatch) {
		return null;
	}

	const fromOffset = from - slashMatch[0].length;
	const coords = editor.view.coordsAtPos(from);
	const maxLeft =
		typeof window !== "undefined" ? window.innerWidth - 320 : coords.left;
	const left = Math.max(12, Math.min(coords.left, maxLeft));

	return {
		query: slashMatch[1].toLowerCase(),
		from: fromOffset,
		to: from,
		top: coords.bottom + 8,
		left,
	};
}

export function useSlashMenu(editor: TiptapEditor | null) {
	const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

	const closeSlashMenu = useCallback(() => {
		setSlashMenu(null);
	}, []);

	useEffect(() => {
		if (!editor) {
			return;
		}

		const syncSlashMenu = () => {
			setSlashMenu(getSlashMenuState(editor));
		};

		syncSlashMenu();
		editor.on("selectionUpdate", syncSlashMenu);
		editor.on("update", syncSlashMenu);
		editor.on("focus", syncSlashMenu);
		editor.on("blur", closeSlashMenu);

		return () => {
			editor.off("selectionUpdate", syncSlashMenu);
			editor.off("update", syncSlashMenu);
			editor.off("focus", syncSlashMenu);
			editor.off("blur", closeSlashMenu);
		};
	}, [closeSlashMenu, editor]);

	return {
		slashMenu,
		closeSlashMenu,
	};
}
