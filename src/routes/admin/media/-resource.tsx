import { Photo, Upload } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Id } from "convex/_generated/dataModel";
import * as React from "react";
import { toast } from "sonner";
import { DataTable, EditingProvider } from "#/components/data-table";
import { Page } from "#/components/page";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Spinner } from "#/components/ui/spinner";
import { useConvexUpload } from "#/hooks/use-convex-upload";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { getCursor, type TableSearchParams } from "#/lib/table-search-params";
import { listMedia } from "#/queries/admin";

const PAGE_SIZE = 20;

export const MEDIA_SORT_FIELDS = ["_creationTime"] as const;

export type MediaSortField = (typeof MEDIA_SORT_FIELDS)[number];

type MediaRow = {
	_id: Id<"media">;
	slug: string;
	filename: string;
	url: string | null;
	size: number;
	alt?: string;
	_creationTime: number;
};

type MediaAdminResourceProps = {
	search: TableSearchParams<MediaSortField>;
	onSearchChange: (
		updater: (
			prev: TableSearchParams<MediaSortField>,
		) => TableSearchParams<MediaSortField>,
	) => void;
	extraOverlays?: React.ReactNode;
};

export function getMediaAdminQuery(search: TableSearchParams<MediaSortField>) {
	return listMedia({
		paginationOpts: {
			numItems: PAGE_SIZE,
			cursor: getCursor(search),
		},
	});
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaAdminResource({
	search,
	onSearchChange,
	extraOverlays,
}: MediaAdminResourceProps) {
	const { data: result } = useQuery(getMediaAdminQuery(search));
	const media = result?.page ?? [];
	const columns = React.useMemo<Array<ColumnDef<MediaRow>>>(() => [], []);

	return (
		<EditingProvider>
			<DataTable.Root
				columns={columns}
				data={media}
				loadingLabel="Loading media..."
				emptyLabel="No images uploaded yet."
				isLoading={result === undefined}
				search={search}
				onSearchChange={onSearchChange}
				pagination={{
					continueCursor: result?.continueCursor ?? null,
					isDone: result?.isDone ?? true,
				}}
			>
				<Page.Root>
					<Page.Header>
						<Page.Title>Media</Page.Title>
						<Page.Description>Manage uploaded images.</Page.Description>
						<Page.Action>
							<UploadButton />
						</Page.Action>
					</Page.Header>

					<Page.Content>
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
								<HugeiconsIcon
									icon={Photo}
									strokeWidth={2}
									className="size-10 text-muted-foreground/40"
								/>
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
													<HugeiconsIcon
														icon={Photo}
														strokeWidth={2}
														className="size-8 text-muted-foreground/40"
													/>
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
					</Page.Content>

					<Page.Footer>
						<DataTable.Pagination />
					</Page.Footer>
				</Page.Root>

				{extraOverlays}
			</DataTable.Root>
		</EditingProvider>
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
		const result = await toAsyncResult(
			uploadFile(file).then(async () => {
				await queryClient.invalidateQueries({
					queryKey: listMedia({}).queryKey,
				});
				toast.success("Image uploaded.");
			}),
		);
		setIsUploading(false);

		if (!result.ok) {
			toast.error(getErrorMessage(result.error, "Upload failed."));
		}
	};

	return (
		<>
			<Button
				disabled={isUploading}
				onClick={() => fileInputRef.current?.click()}
			>
				{isUploading ? (
					<Spinner />
				) : (
					<HugeiconsIcon icon={Upload} strokeWidth={2} />
				)}
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
