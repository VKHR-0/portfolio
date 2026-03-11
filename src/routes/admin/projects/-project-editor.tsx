import {
	IconBrandGithub,
	IconDice,
	IconExternalLink,
	IconEye,
	IconLink,
	IconPhoto,
	IconPlus,
	IconTrash,
	IconUpload,
	IconX,
} from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import {
	TECHNOLOGY_COLORS,
	type TechnologyColorKey,
} from "shared/technology-colors";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "#/components/confirm-delete-dialog";
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
import { Textarea } from "#/components/ui/textarea";
import { useConvexUpload } from "#/hooks/use-convex-upload";
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { generateGradientImage } from "#/lib/generate-gradient";

type ProjectStatus = "active" | "completed" | "archived";

type EditableProject = {
	_id: Id<"projects">;
	title: string;
	slug: string;
	description: string;
	content: string;
	status: ProjectStatus;
	imageId?: string;
	repositoryUrl?: string;
	demoUrl?: string;
	technologyIds: Array<Id<"technologies">>;
};

type TechnologyOption = {
	_id: Id<"technologies">;
	name: string;
	slug: string;
	color: string;
};

type ProjectEditorProps = {
	initialProject?: EditableProject;
	technologies: Array<TechnologyOption>;
};

type EditorFormState = {
	title: string;
	slug: string;
	description: string;
	content: string;
	status: ProjectStatus;
	imageId?: string;
	repositoryUrl?: string;
	demoUrl?: string;
	technologyIds: Array<Id<"technologies">>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1_500;

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
	{ value: "active", label: "Active" },
	{ value: "completed", label: "Completed" },
	{ value: "archived", label: "Archived" },
];

function createFormState(initialProject?: EditableProject): EditorFormState {
	return {
		title: initialProject?.title ?? "",
		slug: initialProject?.slug ?? "",
		description: initialProject?.description ?? "",
		content: initialProject?.content ?? "",
		status: initialProject?.status ?? "active",
		imageId: initialProject?.imageId,
		repositoryUrl: initialProject?.repositoryUrl,
		demoUrl: initialProject?.demoUrl,
		technologyIds: initialProject?.technologyIds ?? [],
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

function TechnologyBadge({
	name,
	color,
	onRemove,
}: {
	name: string;
	color: TechnologyColorKey;
	onRemove: () => void;
}) {
	const palette = TECHNOLOGY_COLORS[color] ?? TECHNOLOGY_COLORS.blue;

	return (
		<Badge
			variant="outline"
			className={`group/tag h-7 gap-0 overflow-hidden rounded-full border px-3 text-xs ${palette.bg} ${palette.text} ${palette.border}`}
		>
			<span>{name}</span>
			<span className="w-0 overflow-hidden transition-[width,margin] duration-150 group-focus-within/tag:-mr-2 group-focus-within/tag:ml-1 group-focus-within/tag:w-5 group-hover/tag:-mr-2 group-hover/tag:ml-1 group-hover/tag:w-5">
				<Button
					variant="ghost"
					size="icon-xs"
					className="size-5 rounded-full opacity-0 transition-opacity duration-100 group-focus-within/tag:opacity-100 group-hover/tag:opacity-100"
					onClick={onRemove}
					aria-label={`Remove ${name}`}
					title={`Remove ${name}`}
				>
					<IconX />
				</Button>
			</span>
		</Badge>
	);
}

function TechnologyPicker({
	technologyIds,
	technologies,
	onChange,
}: {
	technologyIds: Array<Id<"technologies">>;
	technologies: Array<TechnologyOption>;
	onChange: (next: Array<Id<"technologies">>) => void;
}) {
	const availableTechnologies = technologies.filter(
		(tech) => !technologyIds.includes(tech._id),
	);
	const selectedTechnologies = technologyIds
		.map((id) => technologies.find((tech) => tech._id === id))
		.filter((tech): tech is TechnologyOption => Boolean(tech));

	return (
		<div className="flex flex-wrap items-center gap-2">
			{selectedTechnologies.length === 0 ? (
				<Badge variant="outline" className="h-7 rounded-full px-3 text-xs">
					No Technologies
				</Badge>
			) : (
				selectedTechnologies.map((tech) => (
					<TechnologyBadge
						key={tech._id}
						name={tech.name}
						color={tech.color as TechnologyColorKey}
						onRemove={() =>
							onChange(technologyIds.filter((id) => id !== tech._id))
						}
					/>
				))
			)}

			<Popover>
				<PopoverTrigger render={<Button variant="outline" size="icon-xs" />}>
					<IconPlus />
				</PopoverTrigger>
				<PopoverContent align="start" className="w-72 p-0">
					<Command>
						<CommandInput placeholder="Search technologies..." />
						<CommandList>
							<CommandEmpty>No technologies available.</CommandEmpty>
							<CommandGroup>
								{availableTechnologies.map((tech) => {
									const palette =
										TECHNOLOGY_COLORS[tech.color as TechnologyColorKey] ??
										TECHNOLOGY_COLORS.blue;

									return (
										<CommandItem
											key={tech._id}
											onSelect={() => {
												onChange([...technologyIds, tech._id]);
											}}
										>
											<div className="flex min-w-0 flex-1 items-center gap-2">
												<span
													className={`size-3 shrink-0 rounded-full border ${palette.bg} ${palette.border}`}
												/>
												<span className="truncate">{tech.name}</span>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export function ProjectEditorSkeleton() {
	return (
		<Card size="sm" className="w-full min-w-0 flex-1">
			<Skeleton className="min-h-[35vh] w-full rounded-t-lg rounded-b-none" />
			<CardContent className="flex min-w-0 flex-col gap-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-9 w-48" />
						<Skeleton className="h-9 w-48" />
					</div>
					<Skeleton className="h-8 w-44" />
				</div>
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-7" />
				</div>
				<Skeleton className="h-24 w-full" />
				<Skeleton className="min-h-[40vh] w-full" />
			</CardContent>
		</Card>
	);
}

function ProjectEditorAutosave({
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

function ProjectEditorSaveButton({
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

export function ProjectEditor({
	initialProject,
	technologies,
}: ProjectEditorProps) {
	const navigate = useNavigate();

	const createDraft = useMutation(api.functions.projects.createDraft);
	const updateDraft = useMutation(api.functions.projects.updateDraft);
	const deleteProjectMutation = useMutation(
		api.functions.projects.deleteProject,
	);

	const [draftId, setDraftId] = React.useState<Id<"projects"> | undefined>(
		initialProject?._id,
	);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
	const [saveState, setSaveState] = React.useState<SaveState>(
		initialProject ? "saved" : "idle",
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [isDeletingProject, setIsDeletingProject] = React.useState(false);
	const [isImagePickerOpen, setIsImagePickerOpen] = React.useState(false);
	const [isGeneratingGradient, setIsGeneratingGradient] = React.useState(false);

	const [pickerResolver, setPickerResolver] = React.useState<{
		resolve: (result: ImagePickerResult | null) => void;
	} | null>(null);

	const { uploadFile } = useConvexUpload();

	const form = useForm({
		defaultValues: createFormState(initialProject),
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

	const handleGenerateGradient = React.useCallback(async () => {
		setIsGeneratingGradient(true);
		const result = await toAsyncResult(
			generateGradientImage().then(async (file) => {
				const uploadResult = await uploadFile(file);
				form.setFieldValue("imageId", uploadResult.url);
			}),
		);
		setIsGeneratingGradient(false);

		if (!result.ok) {
			toast.error("Failed to generate gradient");
		}
	}, [form, uploadFile]);

	const autosaveTimerRef = React.useRef<number | null>(null);
	const lastPersistedSnapshotRef = React.useRef(
		serializeDraft(createFormState(initialProject)),
	);
	const hydratedProjectIdRef = React.useRef<Id<"projects"> | undefined>(
		initialProject?._id,
	);
	const clearAutosaveTimer = React.useEffectEvent(() => {
		if (autosaveTimerRef.current === null) return;
		window.clearTimeout(autosaveTimerRef.current);
		autosaveTimerRef.current = null;
	});
	const submitDraft = React.useEffectEvent(() => {
		void form.handleSubmit();
	});

	React.useEffect(() => {
		if (hydratedProjectIdRef.current === initialProject?._id) return;

		const nextState = createFormState(initialProject);

		clearAutosaveTimer();
		hydratedProjectIdRef.current = initialProject?._id;
		form.reset(nextState);
		setDraftId(initialProject?._id);
		setIsSlugManuallyEdited(false);
		setSaveState(initialProject ? "saved" : "idle");
		lastPersistedSnapshotRef.current = serializeDraft(nextState);
	}, [form, initialProject]);

	const persistDraft = React.useEffectEvent(
		async (snapshotState: EditorFormState) => {
			const nextDraft = getNormalizedDraft(snapshotState);
			const canSave = nextDraft.title.length > 0 && nextDraft.slug.length > 0;

			if (!canSave || saveState === "saving") return;

			setSaveState("saving");
			const result = await toAsyncResult(
				(async () => {
					if (!draftId) {
						const createdDraft = await createDraft(nextDraft);

						setDraftId(createdDraft._id);
						hydratedProjectIdRef.current = createdDraft._id;

						if (nextDraft.slug) {
							void navigate({
								to: "/admin/projects/$slugId",
								params: { slugId: nextDraft.slug },
								replace: true,
							});
						}
					} else {
						await updateDraft({
							id: draftId,
							...nextDraft,
						});

						if (initialProject && nextDraft.slug !== initialProject.slug) {
							void navigate({
								to: "/admin/projects/$slugId",
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
				})(),
			);

			if (!result.ok) {
				setSaveState("error");
				toast.error(getErrorMessage(result.error, "Unable to save project."));
			}
		},
	);

	const handleDeleteProject = React.useEffectEvent(async () => {
		if (!draftId) return;

		clearAutosaveTimer();
		setIsDeletingProject(true);
		const result = await toAsyncResult(
			deleteProjectMutation({ id: draftId }).then(() => {
				toast.success("Project deleted.");
				setIsDeleteDialogOpen(false);
				void navigate({ to: "/admin/projects" });
			}),
		);
		setIsDeletingProject(false);

		if (!result.ok) {
			toast.error(getErrorMessage(result.error, "Unable to delete project."));
		}
	});

	React.useEffect(
		() => () => {
			clearAutosaveTimer();
		},
		[],
	);

	return (
		<>
			<Card
				size="sm"
				className="w-full min-w-0 flex-1 overflow-hidden p-0 ring-0"
			>
				<form.Subscribe selector={(state) => state.values}>
					{(values) => (
						<ProjectEditorAutosave
							values={values}
							saveState={saveState}
							lastPersistedSnapshot={lastPersistedSnapshotRef.current}
							clearAutosaveTimer={clearAutosaveTimer}
							submitDraft={submitDraft}
						/>
					)}
				</form.Subscribe>

				{/* Hero Image Area */}
				<form.Subscribe selector={(state) => state.values.imageId}>
					{(imageId) => (
						<div className="relative min-h-[35vh] overflow-hidden rounded-2xl bg-muted/30">
							{imageId ? (
								<>
									<img
										src={imageId}
										alt=""
										className="absolute inset-0 h-full w-full object-cover"
									/>
									<div className="absolute top-3 right-3 z-10 flex gap-1.5">
										<Button
											type="button"
											variant="secondary"
											size="icon-sm"
											disabled={isGeneratingGradient}
											onClick={() => void handleGenerateGradient()}
											aria-label="Random gradient"
											title="Random gradient"
										>
											{isGeneratingGradient ? <Spinner /> : <IconDice />}
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => setIsImagePickerOpen(true)}
										>
											<IconPhoto data-icon="inline-start" />
											Change
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="icon-sm"
											onClick={() => form.setFieldValue("imageId", undefined)}
											aria-label="Remove image"
											title="Remove image"
										>
											<IconX />
										</Button>
									</div>
								</>
							) : (
								<>
									<div className="flex h-full min-h-[35vh] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-muted-foreground/25 border-dashed">
										<Button
											type="button"
											variant="ghost"
											className="flex flex-col gap-2 p-6"
											onClick={() => setIsImagePickerOpen(true)}
										>
											<IconUpload className="size-8 text-muted-foreground" />
											<span className="text-muted-foreground text-sm">
												Upload hero image
											</span>
										</Button>
									</div>
									<div className="absolute top-3 right-3 z-10">
										<Button
											type="button"
											variant="secondary"
											size="icon-sm"
											disabled={isGeneratingGradient}
											onClick={() => void handleGenerateGradient()}
											aria-label="Random gradient"
											title="Random gradient"
										>
											{isGeneratingGradient ? <Spinner /> : <IconDice />}
										</Button>
									</div>
								</>
							)}

							{/* Title + Slug overlay */}
							<div className="absolute inset-x-4 bottom-4 z-10 rounded-lg border border-foreground/20 border-dashed bg-background/60 p-4 backdrop-blur-md">
								<div className="flex flex-wrap items-center gap-3">
									<form.Field name="title">
										{(field) => (
											<Input
												id="project-title"
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
							</div>
						</div>
					)}
				</form.Subscribe>

				<CardContent className="flex min-w-0 flex-col gap-5">
					{/* Top toolbar: delete, status, save */}
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-wrap items-center gap-2">
							{draftId && (
								<Button
									type="button"
									size="sm"
									variant="destructive"
									disabled={saveState === "saving" || isDeletingProject}
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<IconTrash data-icon="inline-start" />
									Delete
								</Button>
							)}
							{draftId && (
								<form.Subscribe selector={(state) => state.values.slug}>
									{(slug) => (
										<Button
											type="button"
											size="sm"
											variant="outline"
											nativeButton={false}
											render={
												<Link
													to="/projects/$slugId"
													params={{ slugId: slug }}
													target="_blank"
												/>
											}
										>
											<IconEye data-icon="inline-start" />
											Preview
										</Button>
									)}
								</form.Subscribe>
							)}
						</div>

						<ButtonGroup className="rounded-lg border border-input bg-background dark:bg-input/30">
							<form.Field name="status">
								{(field) => (
									<Select
										value={field.state.value}
										onValueChange={(nextValue) => {
											if (!nextValue) return;
											field.handleChange(nextValue as ProjectStatus);
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
									<ProjectEditorSaveButton
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

					{/* Metadata: URLs + Tech Stack */}
					<div className="flex flex-wrap items-start gap-3">
						<form.Field name="repositoryUrl">
							{(field) => (
								<InputGroup className="h-9 max-w-xs rounded-full border-dashed bg-muted/30">
									<InputGroupAddon>
										<InputGroupButton
											size="icon-xs"
											variant="outline"
											className="rounded-full"
										>
											<IconBrandGithub />
										</InputGroupButton>
									</InputGroupAddon>
									<InputGroupInput
										value={field.state.value ?? ""}
										placeholder="Repository URL"
										onChange={(event) =>
											field.handleChange(event.target.value || undefined)
										}
									/>
								</InputGroup>
							)}
						</form.Field>

						<form.Field name="demoUrl">
							{(field) => (
								<InputGroup className="h-9 max-w-xs rounded-full border-dashed bg-muted/30">
									<InputGroupAddon>
										<InputGroupButton
											size="icon-xs"
											variant="outline"
											className="rounded-full"
										>
											<IconExternalLink />
										</InputGroupButton>
									</InputGroupAddon>
									<InputGroupInput
										value={field.state.value ?? ""}
										placeholder="Demo URL"
										onChange={(event) =>
											field.handleChange(event.target.value || undefined)
										}
									/>
								</InputGroup>
							)}
						</form.Field>
					</div>

					<form.Subscribe selector={(state) => state.values.technologyIds}>
						{(technologyIds) => (
							<TechnologyPicker
								technologyIds={technologyIds}
								technologies={technologies}
								onChange={(next) => form.setFieldValue("technologyIds", next)}
							/>
						)}
					</form.Subscribe>

					{/* Description */}
					<form.Field name="description">
						{(field) => (
							<Textarea
								value={field.state.value}
								placeholder="Short description..."
								onChange={(event) => field.handleChange(event.target.value)}
								className="min-h-20 resize-none"
							/>
						)}
					</form.Field>

					{/* Feature Content (Rich Text) */}
					<div className="min-h-0 flex-1">
						<form.Field name="content">
							{(field) => (
								<Editor
									value={field.state.value}
									onChange={field.handleChange}
									className="prose prose-amber dark:prose-invert h-full w-full max-w-none!"
									editorClassName="h-full min-h-[40vh] !max-w-none"
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

			{/* Hero image picker */}
			{isImagePickerOpen && (
				<MediaPickerDialog
					open
					onSelect={(result) => {
						if (result.kind === "url") {
							form.setFieldValue("imageId", result.src);
						}
						setIsImagePickerOpen(false);
					}}
					onCancel={() => setIsImagePickerOpen(false)}
				/>
			)}

			<ConfirmDeleteDialog
				open={isDeleteDialogOpen}
				title="Delete this project?"
				description="This action cannot be undone."
				isPending={isDeletingProject}
				onOpenChange={setIsDeleteDialogOpen}
				onConfirm={() => void handleDeleteProject()}
			/>
		</>
	);
}
