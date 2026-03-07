"use client";

import { IconTrash } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Spinner } from "#/components/ui/spinner";

type ConfirmDeleteDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	isPending?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function ConfirmDeleteDialog({
	open,
	title,
	description,
	confirmLabel = "Delete",
	isPending = false,
	onOpenChange,
	onConfirm,
}: ConfirmDeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton>
					<Button
						type="button"
						variant="destructive"
						disabled={isPending}
						onClick={onConfirm}
					>
						{isPending ? <Spinner /> : <IconTrash data-icon="inline-start" />}
						{isPending ? "Deleting..." : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
