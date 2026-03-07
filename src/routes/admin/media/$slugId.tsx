import { convexQuery } from "@convex-dev/react-query";
import {
	IconArrowsMaximize,
	IconEye,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Route = createFileRoute("/admin/media/$slugId")({
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.media.getBySlug, { slug: params.slugId }),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { slugId } = Route.useParams();
	const deleteMediaMutation = useMutation(api.functions.media.deleteMedia);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [isImageExpanded, setIsImageExpanded] = React.useState(false);

	const { data: media } = useSuspenseQuery(
		convexQuery(api.functions.media.getBySlug, { slug: slugId }),
	);

	const postUsageCount = media.usedInPosts.length;
	const projectUsageCount = media.usedInProjects.length;
	const usageCount = postUsageCount + projectUsageCount;
	const isInUse = usageCount > 0;
	const usageSections = [
		{
			key: "posts",
			title: "Posts",
			count: postUsageCount,
			items: media.usedInPosts,
			to: "/admin/posts/$slugId" as const,
		},
		{
			key: "projects",
			title: "Projects",
			count: projectUsageCount,
			items: media.usedInProjects,
			to: "/admin/projects/$slugId" as const,
		},
	].filter((section) => section.count > 0);

	const closeModal = () => {
		void navigate({ to: "/admin/media" });
	};

	const handleDelete = async () => {
		setIsDeleting(true);

		try {
			await deleteMediaMutation({ id: media._id });
			toast.success("Image deleted.");
			closeModal();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to delete image.",
			);
			setIsDeleting(false);
		}
	};

	return (
		<>
			<Dialog open onOpenChange={(open) => !open && closeModal()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="truncate">{media.filename}</DialogTitle>
						<DialogDescription>
							Image details and usage information.
						</DialogDescription>
					</DialogHeader>

					{/* Image preview */}
					{media.url && (
						<Card className="relative gap-0 overflow-hidden bg-muted/30 py-0">
							<Button
								type="button"
								variant="outline"
								size="icon-xs"
								className="absolute top-3 right-3 z-10 bg-background/90 supports-backdrop-filter:backdrop-blur-xs"
								onClick={() => setIsImageExpanded(true)}
								title="Expand image"
								aria-label="Expand image"
							>
								<IconArrowsMaximize />
							</Button>
							<img
								src={media.url}
								alt={media.alt ?? media.filename}
								className="max-h-64 w-full object-contain"
							/>
						</Card>
					)}

					{/* Metadata */}
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{media.mimeType}</Badge>
						<Badge variant="outline">{formatFileSize(media.size)}</Badge>
						<Badge variant="outline">{media.slug}</Badge>
					</div>

					{/* Alt text */}
					{media.alt && (
						<>
							<Separator />
							<div className="flex flex-col gap-1">
								<p className="font-medium text-muted-foreground text-xs">
									Alt text
								</p>
								<p className="text-sm">{media.alt}</p>
							</div>
						</>
					)}

					<Separator />

					{/* Usage */}
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between gap-3">
							<p className="font-medium text-sm">
								Usage{" "}
								<span className="text-muted-foreground">({usageCount})</span>
							</p>
							{isInUse && (
								<Badge variant="secondary">{usageCount} linked</Badge>
							)}
						</div>

						{!isInUse && (
							<div className="rounded-xl border border-dashed bg-muted/20 px-4 py-5 text-center text-muted-foreground text-sm">
								Not used in any posts or projects.
							</div>
						)}
						{isInUse && (
							<div className="overflow-hidden rounded-xl border bg-muted/20">
								{usageSections.map((section, sectionIndex) => (
									<div
										key={section.key}
										className={
											sectionIndex < usageSections.length - 1 ? "border-b" : ""
										}
									>
										<div className="flex items-center justify-between gap-3 border-b bg-background/80 px-3 py-2">
											<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
												{section.title}
											</p>
											<Badge variant="outline">{section.count}</Badge>
										</div>
										<ul className="divide-y divide-border/70">
											{section.items.map((item) => (
												<li key={item._id}>
													<Link
														to={section.to}
														params={{ slugId: item.slug }}
														className="group/usage flex items-center justify-between gap-3 px-3 py-1.5 outline-none transition-colors hover:bg-background/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
													>
														<div className="min-w-0">
															<span className="block truncate font-medium text-sm transition-colors group-hover/usage:text-foreground">
																{item.title}
															</span>
														</div>
														<Button
															nativeButton={false}
															render={<span />}
															variant="outline"
															size="icon-xs"
															className="pointer-events-none shrink-0 text-muted-foreground transition-colors group-hover/usage:text-foreground"
															aria-hidden="true"
														>
															<IconEye
																className="size-3.5"
																aria-hidden="true"
															/>
														</Button>
													</Link>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="destructive"
							disabled={isInUse || isDeleting}
							onClick={() => void handleDelete()}
							title={isInUse ? "Cannot delete while in use" : "Delete image"}
						>
							{isDeleting ? <Spinner /> : <IconTrash />}
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{media.url && (
				<Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
					<DialogContent
						showCloseButton={false}
						className="h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden border-0 bg-black/95 p-0 ring-0 sm:max-w-[calc(100vw-2rem)]"
					>
						<DialogTitle className="sr-only">{media.filename}</DialogTitle>
						<DialogClose
							render={
								<Button
									variant="outline"
									size="icon-sm"
									className="absolute top-3 right-3 z-10 bg-background/90 supports-backdrop-filter:backdrop-blur-xs"
								/>
							}
						>
							<IconX />
							<span className="sr-only">Close expanded image</span>
						</DialogClose>
						<div className="flex h-full w-full items-center justify-center p-6 sm:p-8">
							<img
								src={media.url}
								alt={media.alt ?? media.filename}
								className="max-h-full max-w-full object-contain"
							/>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
