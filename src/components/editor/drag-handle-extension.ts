import { Extension, type Editor as TiptapEditor } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const DRAG_HANDLE_PLUGIN_KEY = new PluginKey("editor-drag-handle");
const DRAGGABLE_BLOCK_NAMES = new Set([
	"paragraph",
	"heading",
	"bulletList",
	"orderedList",
	"taskList",
	"codeBlock",
	"blockquote",
	"table",
	"blockMath",
	"horizontalRule",
]);

function createDragHandleDecorations(
	editor: TiptapEditor,
	doc: TiptapEditor["state"]["doc"],
) {
	const decorations: Decoration[] = [];

	doc.forEach((node, offset) => {
		if (!DRAGGABLE_BLOCK_NAMES.has(node.type.name)) {
			return;
		}

		const pos = offset + 1;
		if (!NodeSelection.isSelectable(node)) {
			return;
		}

		const anchor = document.createElement("span");
		anchor.className = "editor-drag-handle-anchor";
		anchor.setAttribute("contenteditable", "false");

		const button = document.createElement("button");
		button.type = "button";
		button.className = "editor-drag-handle";
		button.draggable = true;
		button.setAttribute("data-drag-handle", "");
		button.setAttribute("aria-label", "Drag block");
		button.textContent = "⋮⋮";

		const selectNode = () => {
			const currentNode = editor.state.doc.nodeAt(pos);
			if (!currentNode || !NodeSelection.isSelectable(currentNode)) {
				return;
			}

			const selection = NodeSelection.create(editor.state.doc, pos);
			editor.view.dispatch(editor.state.tr.setSelection(selection));
			editor.view.focus();
		};

		button.addEventListener("mousedown", (event) => {
			event.stopPropagation();
			selectNode();
		});
		button.addEventListener("dragstart", (event) => {
			selectNode();
			if (!event.dataTransfer) {
				return;
			}

			event.dataTransfer.setData("text/plain", " ");
			event.dataTransfer.effectAllowed = "copyMove";
		});

		anchor.appendChild(button);
		decorations.push(
			Decoration.widget(pos, anchor, {
				key: `drag-handle-${pos}`,
				side: -1,
			}),
		);
	});

	return DecorationSet.create(doc, decorations);
}

export const DragHandleExtension = Extension.create({
	name: "dragHandle",
	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: DRAG_HANDLE_PLUGIN_KEY,
				state: {
					init: (_, state) =>
						createDragHandleDecorations(this.editor, state.doc),
					apply: (tr, old, _, newState) => {
						if (!tr.docChanged) {
							return old;
						}

						return createDragHandleDecorations(this.editor, newState.doc);
					},
				},
				props: {
					decorations: (state) =>
						DRAG_HANDLE_PLUGIN_KEY.getState(state) as DecorationSet,
				},
			}),
		];
	},
});
