import { IconLink, IconPlus, IconX } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import {
	Editor,
	type ImagePickerHandler,
	type ImagePickerResult,
	type ImageUploadHandler,
} from "#/components/editor";
import { MediaPickerDialog } from "#/components/media-picker-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { ButtonGroup } from "#/components/ui/button-group";
import { Card, CardContent } from "#/components/ui/card";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "#/components/ui/combobox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import { Input } from "#/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Spinner } from "#/components/ui/spinner";
import { useConvexUpload } from "#/hooks/use-convex-upload";
import { cn } from "#/lib/utils";

type PostStatus = "draft" | "private" | "public";

type EditablePost = {
	_id: Id<"posts">;
	title: string;
	slug: string;
	content: string;
	status: PostStatus;
	projectId?: Id<"projects">;
	categoryId?: Id<"categories">;
	seriesId?: Id<"series">;
	tagIds: Array<Id<"tags">>;
};

type LookupOption<TId extends string> = {
	id: TId;
	label: string;
	description?: string;
};

type PostEditorProps = {
	initialPost?: EditablePost;
	projects: Array<LookupOption<Id<"projects">>>;
	categories: Array<LookupOption<Id<"categories">>>;
	series: Array<LookupOption<Id<"series">>>;
	tags: Array<LookupOption<Id<"tags">>>;
};

type EditorFormState = {
	title: string;
	slug: string;
	content: string;
	status: PostStatus;
	projectId?: Id<"projects">;
	categoryId?: Id<"categories">;
	seriesId?: Id<"series">;
	tagIds: Array<Id<"tags">>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1_000;

const STATUS_OPTIONS: Array<{ value: PostStatus; label: string }> = [
	{ value: "draft", label: "Draft" },
	{ value: "private", label: "Private" },
	{ value: "public", label: "Public" },
];

function createFormState(initialPost?: EditablePost): EditorFormState {
	return {
		title: initialPost?.title ?? "",
		slug: initialPost?.slug ?? "",
		content: initialPost?.content ?? "",
		status: initialPost?.status ?? "draft",
		projectId: initialPost?.projectId,
		categoryId: initialPost?.categoryId,
		seriesId: initialPost?.seriesId,
		tagIds: initialPost?.tagIds ?? [],
	};
}

function getNormalizedDraft(state: EditorFormState) {
	return {
		title: state.title.trim(),
		slug: toSlug(state.slug.trim()),
		content: state.content,
		status: state.status,
		projectId: state.projectId,
		categoryId: state.categoryId,
		seriesId: state.seriesId,
		tagIds: state.tagIds,
	};
}

function serializeDraft(state: EditorFormState) {
	return JSON.stringify(getNormalizedDraft(state));
}

function OptionalSelect<TId extends string>({
	label,
	value,
	placeholder,
	options,
	onChange,
	className,
}: {
	label: string;
	value: TId | undefined;
	placeholder: string;
	options: Array<LookupOption<TId>>;
	onChange: (value: TId | undefined) => void;
	className?: string;
}) {
	const selectedOption = options.find((option) => option.id === value) ?? null;

	return (
		<Combobox<LookupOption<TId>>
			items={options}
			value={selectedOption}
			itemToStringLabel={(option) => option.label}
			itemToStringValue={(option) => option.id}
			isItemEqualToValue={(option, selectedValue) =>
				option.id === selectedValue.id
			}
			onValueChange={(nextValue) => onChange(nextValue?.id)}
		>
			<ComboboxInput
				aria-label={label}
				placeholder={placeholder}
				className={cn("min-w-32", className)}
				showClear
			/>
			<ComboboxContent align="start">
				<ComboboxEmpty>No {label} found.</ComboboxEmpty>
				<ComboboxList>
					{(option: LookupOption<TId>) => (
						<ComboboxItem key={option.id} value={option}>
							<div className="flex min-w-0 flex-col">
								<span>{option.label}</span>
								{option.description ? (
									<span className="text-muted-foreground text-xs">
										{option.description}
									</span>
								) : null}
							</div>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

function PostTagBadge({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<Badge
			variant="secondary"
			className="group/tag h-7 gap-0 overflow-hidden rounded-full px-3 text-xs"
		>
			<span>{label}</span>
			<span className="w-0 overflow-hidden transition-[width,margin] duration-150 group-focus-within/tag:-mr-2 group-focus-within/tag:ml-1 group-focus-within/tag:w-5 group-hover/tag:-mr-2 group-hover/tag:ml-1 group-hover/tag:w-5">
				<Button
					variant="ghost"
					size="icon-xs"
					className="size-5 rounded-full opacity-0 transition-opacity duration-100 group-focus-within/tag:opacity-100 group-hover/tag:opacity-100"
					onClick={onRemove}
					aria-label={`Remove ${label}`}
					title={`Remove ${label}`}
				>
					<IconX />
				</Button>
			</span>
		</Badge>
	);
}

export function PostEditorSkeleton() {
	return (
		<Card size="sm" className="w-full min-w-0 flex-1">
			<CardContent className="flex h-full min-w-0 flex-col gap-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-8 w-32" />
					</div>
					<Skeleton className="h-8 w-44" />
				</div>
				<div className="flex flex-wrap items-start gap-3">
					<Skeleton className="h-14 w-96 max-w-full" />
					<Skeleton className="h-9 w-44" />
				</div>
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-7" />
				</div>
				<Skeleton className="min-h-[70vh] w-full" />
			</CardContent>
		</Card>
	);
}

export function PostEditor({
	initialPost,
	projects,
	categories,
	series,
	tags,
}: PostEditorProps) {
	const navigate = useNavigate();
	const createDraft = useMutation(api.functions.posts.createDraft);
	const updateDraft = useMutation(api.functions.posts.updateDraft);

	const [formState, setFormState] = React.useState<EditorFormState>(() =>
		createFormState(initialPost),
	);
	const [draftId, setDraftId] = React.useState<Id<"posts"> | undefined>(
		initialPost?._id,
	);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
	const [saveState, setSaveState] = React.useState<SaveState>(
		initialPost ? "saved" : "idle",
	);
	const [isTagPickerOpen, setIsTagPickerOpen] = React.useState(false);
	const [pickerResolver, setPickerResolver] = React.useState<{
		resolve: (result: ImagePickerResult | null) => void;
	} | null>(null);

	const { uploadFile } = useConvexUpload();

	const handleRequestImage: ImagePickerHandler = React.useCallback(() => {
		return new Promise<ImagePickerResult | null>((resolve) => {
			setPickerResolver({ resolve });
		});
	}, []);

	const handleUploadImage: ImageUploadHandler = React.useCallback(
		async (file) => {
			const result = await uploadFile(file);
			return { src: result.url };
		},
		[uploadFile],
	);

	const autosaveTimerRef = React.useRef<number | null>(null);
	const lastPersistedSnapshotRef = React.useRef(
		serializeDraft(createFormState(initialPost)),
	);
	const hydratedPostIdRef = React.useRef<Id<"posts"> | undefined>(
		initialPost?._id,
	);

	React.useEffect(() => {
		if (hydratedPostIdRef.current === initialPost?._id) return;

		const nextState = createFormState(initialPost);

		hydratedPostIdRef.current = initialPost?._id;
		setFormState(nextState);
		setDraftId(initialPost?._id);
		setIsSlugManuallyEdited(false);
		setSaveState(initialPost ? "saved" : "idle");
		lastPersistedSnapshotRef.current = serializeDraft(nextState);
	}, [initialPost]);

	const normalizedDraft = getNormalizedDraft(formState);
	const isDirty =
		serializeDraft(formState) !== lastPersistedSnapshotRef.current;
	const canSave =
		normalizedDraft.title.length > 0 && normalizedDraft.slug.length > 0;
	const availableTags = tags.filter(
		(tag) => !formState.tagIds.includes(tag.id),
	);
	const selectedTags = formState.tagIds
		.map((tagId) => tags.find((tag) => tag.id === tagId))
		.filter((tag): tag is LookupOption<Id<"tags">> => Boolean(tag));

	const clearAutosaveTimer = React.useEffectEvent(() => {
		if (autosaveTimerRef.current === null) return;
		window.clearTimeout(autosaveTimerRef.current);
		autosaveTimerRef.current = null;
	});

	const persistDraft = React.useEffectEvent(async () => {
		if (!canSave || saveState === "saving") return;

		const snapshotState = formState;
		const nextDraft = getNormalizedDraft(snapshotState);

		setSaveState("saving");

		try {
			if (!draftId) {
				const createdDraft = await createDraft({
					title: nextDraft.title,
					slug: nextDraft.slug,
					content: nextDraft.content,
					status: nextDraft.status,
					projectId: nextDraft.projectId,
					categoryId: nextDraft.categoryId,
					seriesId: nextDraft.seriesId,
					tagIds: nextDraft.tagIds,
				});

				setDraftId(createdDraft._id);
				hydratedPostIdRef.current = createdDraft._id;

				if (nextDraft.slug) {
					void navigate({
						to: "/admin/posts/$slugId",
						params: { slugId: nextDraft.slug },
						replace: true,
					});
				}
			} else {
				await updateDraft({
					id: draftId,
					title: nextDraft.title,
					slug: nextDraft.slug,
					content: nextDraft.content,
					status: nextDraft.status,
					projectId: nextDraft.projectId,
					categoryId: nextDraft.categoryId,
					seriesId: nextDraft.seriesId,
					tagIds: nextDraft.tagIds,
				});

				if (initialPost && nextDraft.slug !== initialPost.slug) {
					void navigate({
						to: "/admin/posts/$slugId",
						params: { slugId: nextDraft.slug },
						replace: true,
					});
				}
			}

			setFormState((current) => ({
				...current,
				title:
					current.title === snapshotState.title
						? nextDraft.title
						: current.title,
				slug:
					current.slug === snapshotState.slug ? nextDraft.slug : current.slug,
			}));
			lastPersistedSnapshotRef.current = JSON.stringify(nextDraft);
			setSaveState("saved");
		} catch (error) {
			setSaveState("error");
			toast.error(
				error instanceof Error ? error.message : "Unable to save post.",
			);
		}
	});

	React.useEffect(() => {
		clearAutosaveTimer();

		if (!canSave || !isDirty || saveState === "saving") {
			return;
		}

		autosaveTimerRef.current = window.setTimeout(() => {
			void persistDraft();
		}, AUTOSAVE_DELAY_MS);

		return clearAutosaveTimer;
	}, [canSave, isDirty, saveState]);

	React.useEffect(
		() => () => {
			clearAutosaveTimer();
		},
		[],
	);

	const saveButtonLabel = (() => {
		if (saveState === "saving") return "Saving...";
		if (!canSave) return "Not saved";
		if (saveState === "error") return "Save failed";
		if (isDirty) return "Save";
		return "Saved";
	})();
	const isSaveButtonDisabled =
		saveState === "saving" || !canSave || (!isDirty && saveState !== "error");

	return (
		<Card size="sm" className="w-full min-w-0 flex-1">
			<CardContent className="flex h-full min-w-0 flex-col gap-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						<OptionalSelect
							label="project"
							value={formState.projectId}
							placeholder="Project"
							options={projects}
							onChange={(projectId) =>
								setFormState((current) => ({ ...current, projectId }))
							}
						/>
						<OptionalSelect
							label="category"
							value={formState.categoryId}
							placeholder="Category"
							options={categories}
							onChange={(categoryId) =>
								setFormState((current) => ({ ...current, categoryId }))
							}
						/>
						<OptionalSelect
							label="series"
							value={formState.seriesId}
							placeholder="Series"
							options={series}
							onChange={(seriesId) =>
								setFormState((current) => ({ ...current, seriesId }))
							}
						/>
					</div>

					<ButtonGroup className="rounded-lg border border-input bg-background dark:bg-input/30">
						<Select
							value={formState.status}
							onValueChange={(nextValue) => {
								if (!nextValue) return;
								setFormState((current) => ({
									...current,
									status: nextValue as PostStatus,
								}));
							}}
						>
							<SelectTrigger
								size="sm"
								className="rounded-r-none! border-transparent bg-transparent shadow-none hover:bg-muted focus-visible:border-transparent focus-visible:ring-0"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								<SelectGroup>
									{STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Button
							size="sm"
							className="border-none"
							disabled={isSaveButtonDisabled}
							onClick={() => {
								clearAutosaveTimer();
								void persistDraft();
							}}
						>
							{saveState === "saving" && <Spinner />}
							{saveButtonLabel}
						</Button>
					</ButtonGroup>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Input
						id="post-title"
						value={formState.title}
						placeholder="Untitled"
						onChange={(event) => {
							const nextTitle = event.target.value;

							setFormState((current) => ({
								...current,
								title: nextTitle,
								slug: isSlugManuallyEdited ? current.slug : toSlug(nextTitle),
							}));
						}}
						className="h-auto min-w-[18rem] flex-1 border-0 bg-transparent px-0 py-0 font-semibold text-4xl leading-tight shadow-none ring-0 placeholder:text-muted-foreground/70 focus-visible:ring-0 md:text-5xl"
					/>

					<InputGroup className="h-9 max-w-xs rounded-full border-dashed bg-muted/30">
						<InputGroupAddon>
							<InputGroupButton
								size="icon-xs"
								variant="outline"
								className="rounded-full"
							>
								<IconLink />
							</InputGroupButton>
						</InputGroupAddon>
						<InputGroupInput
							value={formState.slug}
							placeholder="slug"
							onChange={(event) => {
								const nextSlug = event.target.value;

								setIsSlugManuallyEdited(nextSlug.length > 0);
								setFormState((current) => ({
									...current,
									slug: nextSlug,
								}));
							}}
							onBlur={() => {
								const normalizedSlug =
									toSlug(formState.slug) ||
									(isSlugManuallyEdited ? "" : toSlug(formState.title));

								setIsSlugManuallyEdited(normalizedSlug.length > 0);
								setFormState((current) => ({
									...current,
									slug: normalizedSlug,
								}));
							}}
						/>
					</InputGroup>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{selectedTags.length === 0 ? (
						<Badge variant="outline" className="h-7 rounded-full px-3 text-xs">
							No Tags
						</Badge>
					) : (
						selectedTags.map((tag) => (
							<PostTagBadge
								key={tag.id}
								label={tag.label}
								onRemove={() =>
									setFormState((current) => ({
										...current,
										tagIds: current.tagIds.filter((tagId) => tagId !== tag.id),
									}))
								}
							/>
						))
					)}

					<Popover open={isTagPickerOpen} onOpenChange={setIsTagPickerOpen}>
						<PopoverTrigger
							render={<Button variant="outline" size="icon-xs" />}
						>
							<IconPlus />
						</PopoverTrigger>
						<PopoverContent align="start" className="w-72 p-0">
							<Command>
								<CommandInput placeholder="Search tags..." />
								<CommandList>
									<CommandEmpty>No tags available.</CommandEmpty>
									<CommandGroup>
										{availableTags.map((tag) => (
											<CommandItem
												key={tag.id}
												onSelect={() => {
													setFormState((current) => ({
														...current,
														tagIds: [...current.tagIds, tag.id],
													}));
													setIsTagPickerOpen(false);
												}}
											>
												<div className="flex min-w-0 flex-1 items-center justify-between gap-2">
													<span className="truncate">{tag.label}</span>
													{tag.description ? (
														<span className="truncate text-muted-foreground text-xs">
															{tag.description}
														</span>
													) : null}
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<div className="min-h-0 flex-1">
					<Editor
						value={formState.content}
						onChange={(content) =>
							setFormState((current) => ({ ...current, content }))
						}
						className="prose prose-amber dark:prose-invert h-full w-full max-w-none!"
						editorClassName="h-full min-h-[65vh] !max-w-none"
						format="markdown"
						headingLevels={[2, 3]}
						enableImagePasteDrop
						onRequestImage={handleRequestImage}
						onUploadImage={handleUploadImage}
					/>
				</div>

				{pickerResolver && (
					<MediaPickerDialog
						open
						onSelect={(result) => {
							pickerResolver.resolve(result);
							setPickerResolver(null);
						}}
						onCancel={() => {
							pickerResolver.resolve(null);
							setPickerResolver(null);
						}}
					/>
				)}
			</CardContent>
		</Card>
	);
}
