import { convexQuery } from "@convex-dev/react-query";
import { Photo, Upload } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import * as React from "react";
import type { ImagePickerResult } from "#/components/editor";
import { useConvexUpload } from "#/hooks/use-convex-upload";
import { cn } from "#/lib/utils";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";

type MediaPickerDialogProps = {
	open: boolean;
	onSelect: (result: ImagePickerResult) => void;
	onCancel: () => void;
};

export function MediaPickerDialog({
	open,
	onSelect,
	onCancel,
}: MediaPickerDialogProps) {
	const { data: mediaItems, isPending } = useQuery(
		convexQuery(api.functions.media.listAll, {}),
	);

	const { uploadFile } = useConvexUpload();
	const [isUploading, setIsUploading] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleFileUpload = async (file: File) => {
		if (!file.type.startsWith("image/")) return;

		setIsUploading(true);

		try {
			const result = await uploadFile(file);
			onSelect({ kind: "url", src: result.url, mediaId: result.mediaId });
		} catch {
			setIsUploading(false);
		}
	};

	const handleFileInputChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			void handleFileUpload(file);
		}
	};

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);

		const file = Array.from(event.dataTransfer.files).find((f) =>
			f.type.startsWith("image/"),
		);

		if (file) {
			void handleFileUpload(file);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Insert image</DialogTitle>
					<DialogDescription>
						Select an image from your library or upload a new one.
					</DialogDescription>
				</DialogHeader>

				{/* Upload drop zone */}
				<button
					type="button"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => !isUploading && fileInputRef.current?.click()}
					className={cn(
						"flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
						isDragging
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25",
						isUploading && "pointer-events-none opacity-60",
					)}
				>
					{isUploading ? (
						<>
							<Spinner />
							<p className="text-muted-foreground text-sm">Uploading...</p>
						</>
					) : (
						<>
							<HugeiconsIcon
								icon={Upload}
								strokeWidth={2}
								className="size-6 text-muted-foreground"
							/>
							<p className="text-muted-foreground text-sm">
								Drag and drop an image, or{" "}
								<span className="font-medium text-foreground underline underline-offset-2">
									browse
								</span>
							</p>
						</>
					)}
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileInputChange}
				/>

				{/* Library grid */}
				<div className="flex flex-col gap-2">
					<p className="font-medium text-sm">Library</p>

					{isPending ? (
						<div className="grid grid-cols-4 gap-2">
							{Array.from({ length: 8 }).map((_, index) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
									key={index}
									className="aspect-square rounded-md"
								/>
							))}
						</div>
					) : !mediaItems || mediaItems.length === 0 ? (
						<div className="flex flex-col items-center gap-1 py-6 text-center">
							<HugeiconsIcon
								icon={Photo}
								strokeWidth={2}
								className="size-8 text-muted-foreground/50"
							/>
							<p className="text-muted-foreground text-sm">
								No images uploaded yet.
							</p>
						</div>
					) : (
						<ScrollArea className="max-h-64">
							<div className="grid grid-cols-4 gap-2">
								{mediaItems.map((item) =>
									item.url ? (
										<Button
											key={item._id}
											type="button"
											variant="ghost"
											className="h-auto p-0"
											onClick={() =>
												onSelect({
													kind: "url",
													src: item.url as string,
													mediaId: item._id,
													alt: item.alt,
												})
											}
										>
											<img
												src={item.url}
												alt={item.alt ?? item.filename}
												className="aspect-square w-full rounded-md object-cover"
											/>
										</Button>
									) : null,
								)}
							</div>
						</ScrollArea>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
