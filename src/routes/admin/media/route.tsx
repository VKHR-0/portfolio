import { convexQuery } from "@convex-dev/react-query";
import { IconPhoto, IconUpload } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import * as React from "react";
import { toast } from "sonner";
import { CursorPagination } from "#/components/cursor-pagination";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Spinner } from "#/components/ui/spinner";
import { useConvexUpload } from "#/hooks/use-convex-upload";

const PAGE_SIZE = 20;

function listMediaQuery(cursor: string | null) {
	return convexQuery(api.functions.media.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
	});
}

export const Route = createFileRoute("/admin/media")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listMediaQuery(null));
	},
	component: RouteComponent,
});

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RouteComponent() {
	const [cursors, setCursors] = React.useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;

	const { data: result } = useQuery(listMediaQuery(currentCursor));

	const media = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	return (
		<>
			<Card className="min-w-0 flex-1">
				<CardHeader className="border-b">
					<CardTitle>Media</CardTitle>
					<CardDescription>Manage uploaded images.</CardDescription>
					<CardAction>
						<UploadButton />
					</CardAction>
				</CardHeader>

				<CardContent>
					{result === undefined ? (
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{Array.from({ length: 10 }).map((_, index) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
									key={index}
									className="aspect-square rounded-lg"
								/>
							))}
						</div>
					) : media.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<IconPhoto className="size-10 text-muted-foreground/40" />
							<p className="text-muted-foreground text-sm">
								No images uploaded yet.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{media.map((item) => (
								<Link
									key={item._id}
									to="/admin/media/$slugId"
									params={{ slugId: item.slug }}
									className="group flex flex-col gap-1.5 rounded-lg outline-none ring-ring/50 focus-visible:ring-2"
								>
									<div className="overflow-hidden rounded-lg border bg-muted/30">
										{item.url ? (
											<img
												src={item.url}
												alt={item.alt ?? item.filename}
												className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
											/>
										) : (
											<div className="flex aspect-square items-center justify-center">
												<IconPhoto className="size-8 text-muted-foreground/40" />
											</div>
										)}
									</div>
									<div className="flex min-w-0 flex-col px-0.5">
										<span className="truncate text-sm leading-tight">
											{item.filename}
										</span>
										<span className="text-muted-foreground text-xs">
											{formatFileSize(item.size)}
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</CardContent>

				{pageCount > 1 || canGoNext ? (
					<CardFooter>
						<CursorPagination
							currentPage={currentPage}
							pageCount={pageCount}
							canGoPrevious={canGoPrevious}
							canGoNext={canGoNext}
							onPrevious={() => {
								setCurrentPage((prev) => Math.max(1, prev - 1));
							}}
							onSelectPage={(page) => {
								setCurrentPage(page);
							}}
							onNext={() => {
								if (currentPage < pageCount) {
									setCurrentPage((prev) => prev + 1);
									return;
								}

								if (!result?.continueCursor) {
									return;
								}

								setCursors((prev) => [...prev, result.continueCursor]);
								setCurrentPage((prev) => prev + 1);
							}}
						/>
					</CardFooter>
				) : null}
			</Card>

			<Outlet />
		</>
	);
}

function UploadButton() {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const { uploadFile } = useConvexUpload();
	const [isUploading, setIsUploading] = React.useState(false);
	const queryClient = useQueryClient();

	const handleUpload = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are supported.");
			return;
		}

		setIsUploading(true);

		try {
			await uploadFile(file);
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.functions.media.list, {
					paginationOpts: { numItems: PAGE_SIZE, cursor: null },
				}).queryKey,
			});
			toast.success("Image uploaded.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Upload failed.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<Button
				disabled={isUploading}
				onClick={() => fileInputRef.current?.click()}
			>
				{isUploading ? <Spinner /> : <IconUpload />}
				{isUploading ? "Uploading..." : "Upload"}
			</Button>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) {
						void handleUpload(file);
					}
					event.target.value = "";
				}}
			/>
		</>
	);
}
