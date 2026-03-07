import { IconLink, IconPlus, IconX } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
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

const AUTOSAVE_DELAY_MS = 5_000;

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

function getNormalizedDraft(state: EditorFormState): EditorFormState {
	return {
		...state,
		title: state.title.trim(),
		slug: toSlug(state.slug.trim()),
	};
}

function serializeDraft(state: EditorFormState) {
	return JSON.stringify(getNormalizedDraft(state));
}

type DraftUiState = {
	canSave: boolean;
	isDirty: boolean;
	saveButtonLabel: string;
	isSaveButtonDisabled: boolean;
};

function getDraftState(
	state: EditorFormState,
	saveState: SaveState,
	lastPersistedSnapshot: string,
): DraftUiState {
	const normalizedDraft = getNormalizedDraft(state);
	const draftSnapshot = JSON.stringify(normalizedDraft);
	const canSave =
		normalizedDraft.title.length > 0 && normalizedDraft.slug.length > 0;
	const isDirty = draftSnapshot !== lastPersistedSnapshot;
	const saveButtonLabel = (() => {
		if (saveState === "saving") return "Saving...";
		if (!canSave) return "Not saved";
		if (saveState === "error") return "Save failed";
		if (isDirty) return "Save";
		return "Saved";
	})();
	const isSaveButtonDisabled =
		saveState === "saving" || !canSave || (!isDirty && saveState !== "error");

	return {
		canSave,
		isDirty,
		saveButtonLabel,
		isSaveButtonDisabled,
	};
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

function PostEditorAutosave({
	values,
	saveState,
	lastPersistedSnapshot,
	clearAutosaveTimer,
	submitDraft,
}: {
	values: EditorFormState;
	saveState: SaveState;
	lastPersistedSnapshot: string;
	clearAutosaveTimer: () => void;
	submitDraft: () => void;
}) {
	const { canSave, isDirty } = getDraftState(
		values,
		saveState,
		lastPersistedSnapshot,
	);
	const draftSnapshot = serializeDraft(values);

	React.useEffect(() => {
		clearAutosaveTimer();

		if (
			!canSave ||
			!isDirty ||
			saveState === "saving" ||
			draftSnapshot === lastPersistedSnapshot
		) {
			return;
		}

		const timerId = window.setTimeout(() => {
			submitDraft();
		}, AUTOSAVE_DELAY_MS);

		return () => {
			window.clearTimeout(timerId);
		};
	}, [
		canSave,
		clearAutosaveTimer,
		draftSnapshot,
		isDirty,
		lastPersistedSnapshot,
		saveState,
		submitDraft,
	]);

	return null;
}

function PostEditorSaveButton({
	values,
	saveState,
	lastPersistedSnapshot,
	onClick,
}: {
	values: EditorFormState;
	saveState: SaveState;
	lastPersistedSnapshot: string;
	onClick: () => void;
}) {
	const { isSaveButtonDisabled, saveButtonLabel } = getDraftState(
		values,
		saveState,
		lastPersistedSnapshot,
	);

	return (
		<Button
			size="sm"
			className="border-none"
			disabled={isSaveButtonDisabled}
			onClick={onClick}
		>
			{saveState === "saving" && <Spinner />}
			{saveButtonLabel}
		</Button>
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

	const [draftId, setDraftId] = React.useState<Id<"posts"> | undefined>(
		initialPost?._id,
	);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
	const [saveState, setSaveState] = React.useState<SaveState>(
		initialPost ? "saved" : "idle",
	);

	const [pickerResolver, setPickerResolver] = React.useState<{
		resolve: (result: ImagePickerResult | null) => void;
	} | null>(null);

	const { uploadFile } = useConvexUpload();

	const form = useForm({
		defaultValues: createFormState(initialPost),
		onSubmit: async ({ value }) => {
			await persistDraft(value);
		},
	});

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

		clearAutosaveTimer();
		hydratedPostIdRef.current = initialPost?._id;
		form.reset(nextState);
		setDraftId(initialPost?._id);
		setIsSlugManuallyEdited(false);
		setSaveState(initialPost ? "saved" : "idle");
		lastPersistedSnapshotRef.current = serializeDraft(nextState);
	}, [form, initialPost]);

	const clearAutosaveTimer = React.useEffectEvent(() => {
		if (autosaveTimerRef.current === null) return;
		window.clearTimeout(autosaveTimerRef.current);
		autosaveTimerRef.current = null;
	});

	const submitDraft = React.useEffectEvent(() => {
		void form.handleSubmit();
	});

	const persistDraft = React.useEffectEvent(
		async (snapshotState: EditorFormState) => {
			const nextDraft = getNormalizedDraft(snapshotState);
			const canSave = nextDraft.title.length > 0 && nextDraft.slug.length > 0;

			if (!canSave || saveState === "saving") return;

			setSaveState("saving");

			try {
				if (!draftId) {
					const createdDraft = await createDraft(nextDraft);

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
						...nextDraft,
					});

					if (initialPost && nextDraft.slug !== initialPost.slug) {
						void navigate({
							to: "/admin/posts/$slugId",
							params: { slugId: nextDraft.slug },
							replace: true,
						});
					}
				}

				const currentTitle = form.getFieldValue("title");
				const currentSlug = form.getFieldValue("slug");

				if (
					currentTitle === snapshotState.title &&
					currentTitle !== nextDraft.title
				) {
					form.setFieldValue("title", nextDraft.title);
				}

				if (
					currentSlug === snapshotState.slug &&
					currentSlug !== nextDraft.slug
				) {
					form.setFieldValue("slug", nextDraft.slug);
				}

				lastPersistedSnapshotRef.current = JSON.stringify(nextDraft);
				setSaveState("saved");
			} catch (error) {
				setSaveState("error");
				toast.error(
					error instanceof Error ? error.message : "Unable to save post.",
				);
			}
		},
	);

	React.useEffect(
		() => () => {
			clearAutosaveTimer();
		},
		[],
	);

	return (
		<Card size="sm" className="w-full min-w-0 flex-1">
			<CardContent className="flex h-full min-w-0 flex-col gap-5">
				<form.Subscribe selector={(state) => state.values}>
					{(values) => (
						<PostEditorAutosave
							values={values}
							saveState={saveState}
							lastPersistedSnapshot={lastPersistedSnapshotRef.current}
							clearAutosaveTimer={clearAutosaveTimer}
							submitDraft={submitDraft}
						/>
					)}
				</form.Subscribe>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						<form.Field name="projectId">
							{(field) => (
								<OptionalSelect
									label="project"
									value={field.state.value}
									placeholder="Project"
									options={projects}
									onChange={field.handleChange}
								/>
							)}
						</form.Field>
						<form.Field name="categoryId">
							{(field) => (
								<OptionalSelect
									label="category"
									value={field.state.value}
									placeholder="Category"
									options={categories}
									onChange={field.handleChange}
								/>
							)}
						</form.Field>
						<form.Field name="seriesId">
							{(field) => (
								<OptionalSelect
									label="series"
									value={field.state.value}
									placeholder="Series"
									options={series}
									onChange={field.handleChange}
								/>
							)}
						</form.Field>
					</div>

					<ButtonGroup className="rounded-lg border border-input bg-background dark:bg-input/30">
						<form.Field name="status">
							{(field) => (
								<Select
									value={field.state.value}
									onValueChange={(nextValue) => {
										if (!nextValue) return;
										field.handleChange(nextValue as PostStatus);
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
							)}
						</form.Field>

						<form.Subscribe selector={(state) => state.values}>
							{(values) => (
								<PostEditorSaveButton
									values={values}
									saveState={saveState}
									lastPersistedSnapshot={lastPersistedSnapshotRef.current}
									onClick={() => {
										clearAutosaveTimer();
										submitDraft();
									}}
								/>
							)}
						</form.Subscribe>
					</ButtonGroup>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<form.Field name="title">
						{(field) => (
							<Input
								id="post-title"
								value={field.state.value}
								placeholder="Untitled"
								onChange={(event) => {
									const nextTitle = event.target.value;

									field.handleChange(nextTitle);

									if (!isSlugManuallyEdited) {
										form.setFieldValue("slug", toSlug(nextTitle));
									}
								}}
								className="h-auto min-w-[18rem] flex-1 border-0 bg-transparent px-0 py-0 font-semibold text-4xl leading-tight shadow-none ring-0 placeholder:text-muted-foreground/70 focus-visible:ring-0 md:text-5xl"
							/>
						)}
					</form.Field>

					<form.Field name="slug">
						{(field) => (
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
									value={field.state.value}
									placeholder="slug"
									onChange={(event) => {
										const nextSlug = event.target.value;

										setIsSlugManuallyEdited(nextSlug.length > 0);
										field.handleChange(nextSlug);
									}}
									onBlur={() => {
										field.handleBlur();
										const normalizedSlug =
											toSlug(field.state.value) ||
											(isSlugManuallyEdited
												? ""
												: toSlug(form.getFieldValue("title")));

										setIsSlugManuallyEdited(normalizedSlug.length > 0);
										field.handleChange(normalizedSlug);
									}}
								/>
							</InputGroup>
						)}
					</form.Field>
				</div>
				<form.Subscribe selector={(state) => state.values.tagIds}>
					{(tagIds) => {
						const availableTags = tags.filter(
							(tag) => !tagIds.includes(tag.id),
						);
						const selectedTags = tagIds
							.map((tagId) => tags.find((tag) => tag.id === tagId))
							.filter((tag): tag is LookupOption<Id<"tags">> => Boolean(tag));

						return (
							<div className="flex flex-wrap items-center gap-2">
								{selectedTags.length === 0 ? (
									<Badge
										variant="outline"
										className="h-7 rounded-full px-3 text-xs"
									>
										No Tags
									</Badge>
								) : (
									selectedTags.map((tag) => (
										<PostTagBadge
											key={tag.id}
											label={tag.label}
											onRemove={() =>
												form.setFieldValue("tagIds", (current) =>
													current.filter((tagId) => tagId !== tag.id),
												)
											}
										/>
									))
								)}

								<Popover>
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
																form.setFieldValue("tagIds", (current) => [
																	...current,
																	tag.id,
																]);
															}}
														>
															<div className="flex min-w-0 flex-1 items-center justify-between gap-2">
																<span className="truncate">{tag.label}</span>
																{tag.description && (
																	<span className="truncate text-muted-foreground text-xs">
																		{tag.description}
																	</span>
																)}
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						);
					}}
				</form.Subscribe>
				<div className="min-h-0 flex-1">
					<form.Field name="content">
						{(field) => (
							<Editor
								value={field.state.value}
								onChange={field.handleChange}
								className="prose prose-amber dark:prose-invert h-full w-full max-w-none!"
								editorClassName="h-full min-h-[65vh] !max-w-none"
								format="markdown"
								headingLevels={[2, 3]}
								enableImagePasteDrop
								onRequestImage={handleRequestImage}
								onUploadImage={handleUploadImage}
							/>
						)}
					</form.Field>
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
