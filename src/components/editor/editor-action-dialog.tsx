import type { Editor as TiptapEditor } from "@tiptap/core";
import katex from "katex";
import {
	type SubmitEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "#/lib/utils";

import type { SlashRange } from "./use-slash-menu";

export type ActionDialogMode = "link" | "inlineMath" | "blockMath";

export type ActionDialogState = {
	mode: ActionDialogMode;
	value: string;
	selectionRange?: SlashRange;
	replaceRange?: SlashRange;
};

const ACTION_DIALOG_META: Record<
	ActionDialogMode,
	{
		title: string;
		description: string;
		label: string;
		placeholder: string;
		submitLabel: string;
		allowEmpty: boolean;
	}
> = {
	link: {
		title: "Edit Link",
		description: "Enter a URL. Leave it empty to remove the link.",
		label: "URL",
		placeholder: "https://example.com",
		submitLabel: "Apply Link",
		allowEmpty: true,
	},
	inlineMath: {
		title: "Insert Inline Math",
		description: "Enter a LaTeX expression for inline rendering.",
		label: "LaTeX",
		placeholder: "E = mc^2",
		submitLabel: "Insert Math",
		allowEmpty: false,
	},
	blockMath: {
		title: "Insert Block Math",
		description: "Enter a LaTeX expression for block rendering.",
		label: "LaTeX",
		placeholder: "\\int_0^1 x^2 \\, dx",
		submitLabel: "Insert Block",
		allowEmpty: false,
	},
};

const DEFAULT_INLINE_MATH_LATEX = "E = mc^2";
const DEFAULT_BLOCK_MATH_LATEX = "\\\\int_0^1 x^2 \\\\, dx";

type UseEditorActionDialogOptions = {
	editor: TiptapEditor | null;
	onOpen?: () => void;
};

export function useEditorActionDialog({
	editor,
	onOpen,
}: UseEditorActionDialogOptions) {
	const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(
		null,
	);
	const [actionDialogValue, setActionDialogValue] = useState("");
	const [actionDialogError, setActionDialogError] = useState<string | null>(
		null,
	);

	const openActionDialog = useCallback(
		(nextDialog: ActionDialogState) => {
			setActionDialog(nextDialog);
			setActionDialogValue(nextDialog.value);
			setActionDialogError(null);
			onOpen?.();
		},
		[onOpen],
	);

	const closeActionDialog = useCallback(() => {
		setActionDialog(null);
		setActionDialogValue("");
		setActionDialogError(null);
	}, []);

	const openLinkDialog = useCallback(() => {
		if (!editor) {
			return;
		}

		const activeLink = editor.getAttributes("link").href as string | undefined;
		const { from, to } = editor.state.selection;
		openActionDialog({
			mode: "link",
			value: activeLink ?? "https://",
			selectionRange: { from, to },
		});
	}, [editor, openActionDialog]);

	const openInlineMathDialog = useCallback(
		(replaceRange?: SlashRange) => {
			openActionDialog({
				mode: "inlineMath",
				value: DEFAULT_INLINE_MATH_LATEX,
				replaceRange,
			});
		},
		[openActionDialog],
	);

	const openBlockMathDialog = useCallback(
		(replaceRange?: SlashRange) => {
			openActionDialog({
				mode: "blockMath",
				value: DEFAULT_BLOCK_MATH_LATEX,
				replaceRange,
			});
		},
		[openActionDialog],
	);

	const handleActionDialogValueChange = useCallback((nextValue: string) => {
		setActionDialogError(null);
		setActionDialogValue(nextValue);
	}, []);

	const handleActionDialogSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault();

			if (!editor || !actionDialog) {
				return;
			}

			const value = actionDialogValue.trim();
			setActionDialogError(null);
			const chain = editor.chain().focus();

			if (actionDialog.mode === "link") {
				if (actionDialog.selectionRange) {
					chain.setTextSelection(actionDialog.selectionRange);
				}

				if (!value) {
					chain.extendMarkRange("link").unsetLink().run();
					closeActionDialog();
					return;
				}

				chain.extendMarkRange("link").setLink({ href: value }).run();
				closeActionDialog();
				return;
			}

			if (!value) {
				setActionDialogError("Enter a LaTeX expression.");
				return;
			}

			if (actionDialog.replaceRange) {
				chain.deleteRange(actionDialog.replaceRange);
			}

			if (actionDialog.mode === "inlineMath") {
				chain.insertInlineMath({ latex: value }).run();
			} else {
				chain.insertBlockMath({ latex: value }).run();
			}

			closeActionDialog();
		},
		[actionDialog, actionDialogValue, closeActionDialog, editor],
	);

	return {
		actionDialog,
		actionDialogValue,
		actionDialogError,
		openLinkDialog,
		openInlineMathDialog,
		openBlockMathDialog,
		closeActionDialog,
		handleActionDialogSubmit,
		handleActionDialogValueChange,
	};
}

type EditorActionDialogProps = {
	actionDialog: ActionDialogState | null;
	actionDialogValue: string;
	actionDialogError: string | null;
	onActionDialogValueChange: (value: string) => void;
	onActionDialogSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
	onCloseActionDialog: () => void;
};

export function EditorActionDialog({
	actionDialog,
	actionDialogValue,
	actionDialogError,
	onActionDialogValueChange,
	onActionDialogSubmit,
	onCloseActionDialog,
}: EditorActionDialogProps) {
	const mathPreviewRef = useRef<HTMLDivElement | null>(null);
	const actionDialogMeta = actionDialog
		? ACTION_DIALOG_META[actionDialog.mode]
		: null;
	const mathPreviewMode =
		actionDialog?.mode === "inlineMath" || actionDialog?.mode === "blockMath"
			? actionDialog.mode
			: null;
	const mathPreviewLatex = mathPreviewMode ? actionDialogValue.trim() : "";

	useEffect(() => {
		if (!mathPreviewRef.current || !mathPreviewMode || !mathPreviewLatex) {
			return;
		}

		const displayMode = mathPreviewMode === "blockMath";
		try {
			katex.render(mathPreviewLatex, mathPreviewRef.current, {
				displayMode,
				throwOnError: false,
			});
		} catch {
			mathPreviewRef.current.textContent = mathPreviewLatex;
		}
	}, [mathPreviewLatex, mathPreviewMode]);

	return (
		<Dialog
			open={Boolean(actionDialog)}
			onOpenChange={(open) => {
				if (!open) {
					onCloseActionDialog();
				}
			}}
		>
			<DialogContent showCloseButton className="sm:max-w-md">
				<form className="grid gap-4" onSubmit={onActionDialogSubmit}>
					<DialogHeader>
						<DialogTitle className="text-balance">
							{actionDialogMeta?.title}
						</DialogTitle>
						<DialogDescription className="text-pretty">
							{actionDialogMeta?.description}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<Label htmlFor="editor-action-input">
							{actionDialogMeta?.label}
						</Label>
						<Input
							id="editor-action-input"
							autoFocus
							value={actionDialogValue}
							placeholder={actionDialogMeta?.placeholder}
							aria-invalid={Boolean(actionDialogError)}
							aria-describedby={
								actionDialogError ? "editor-action-error" : undefined
							}
							required={actionDialogMeta ? !actionDialogMeta.allowEmpty : false}
							onChange={(event) => {
								onActionDialogValueChange(event.currentTarget.value);
							}}
						/>
						{actionDialogError && (
							<p
								id="editor-action-error"
								role="alert"
								className="text-pretty text-destructive text-sm"
							>
								{actionDialogError}
							</p>
						)}
					</div>

					{actionDialog && actionDialog.mode !== "link" && (
						<div className="grid gap-2">
							<Label>Preview</Label>
							<div
								className={cn(
									"rounded-lg border bg-muted/30 px-3 py-2 text-sm",
									actionDialog.mode === "blockMath" && "overflow-x-auto",
								)}
							>
								{!mathPreviewLatex ? (
									<span className="text-muted-foreground">
										Type LaTeX to preview equation
									</span>
								) : (
									<div ref={mathPreviewRef} />
								)}
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onCloseActionDialog}
						>
							Cancel
						</Button>
						<Button type="submit">
							{actionDialogMeta?.submitLabel ?? "Apply"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
