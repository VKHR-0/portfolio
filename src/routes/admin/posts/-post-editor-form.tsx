import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { SLUG_PATTERN, toSlug } from "shared/slug";
import z from "zod";
import { Editor } from "#/components/editor";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from "#/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";

export const postMetadataSchema = z.object({
	title: z.string().trim().min(1, "Title is required."),
	slug: z
		.string()
		.trim()
		.min(1, "Slug is required.")
		.regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens."),
	status: z.union([
		z.literal("draft"),
		z.literal("private"),
		z.literal("public"),
	]),
	seriesId: z.string().optional(),
	categoryId: z.string().optional(),
	projectId: z.string().optional(),
	tagIds: z.array(z.string()),
});

export type PostEditorValue = {
	title: string;
	slug: string;
	content: string;
	status: "draft" | "private" | "public";
	seriesId: string;
	categoryId: string;
	projectId: string;
	tagIds: string[];
};

type PostOption = {
	value: string;
	label: string;
};

type SaveState = "saved" | "saving" | "unsaved";

type PostEditorFormProps = {
	value: PostEditorValue;
	onChange: (value: PostEditorValue) => void;
	isSlugManuallyEdited: boolean;
	onSlugManualEditChange: (isManual: boolean) => void;
	seriesOptions: PostOption[];
	categoryOptions: PostOption[];
	projectOptions: PostOption[];
	tagOptions: PostOption[];
	saveState?: SaveState;
	formError?: string | null;
	titleAutoFocus?: boolean;
};

function normalizeMetadataValue(value: PostEditorValue) {
	return {
		title: value.title,
		slug: value.slug,
		status: value.status,
		seriesId: value.seriesId || undefined,
		categoryId: value.categoryId || undefined,
		projectId: value.projectId || undefined,
		tagIds: value.tagIds,
	};
}

export function createEmptyPostEditorValue(): PostEditorValue {
	return {
		title: "",
		slug: "",
		content: "",
		status: "draft",
		seriesId: "",
		categoryId: "",
		projectId: "",
		tagIds: [],
	};
}

export function getPostMetadataErrors(value: PostEditorValue) {
	const normalizedValue = normalizeMetadataValue(value);
	const titleResult = postMetadataSchema.shape.title.safeParse(normalizedValue.title);
	const slugResult = postMetadataSchema.shape.slug.safeParse(normalizedValue.slug);

	return {
		title: titleResult.success ? null : titleResult.error.issues[0]?.message ?? null,
		slug: slugResult.success ? null : slugResult.error.issues[0]?.message ?? null,
	};
}

export function isPostMetadataValid(value: PostEditorValue) {
	return postMetadataSchema.safeParse(normalizeMetadataValue(value)).success;
}

export function saveStateLabel(saveState?: SaveState) {
	switch (saveState) {
		case "saving":
			return "Saving...";
		case "saved":
			return "Saved";
		case "unsaved":
			return "Unsaved changes";
		default:
			return null;
	}
}

export function PostEditorForm({
	value,
	onChange,
	isSlugManuallyEdited,
	onSlugManualEditChange,
	seriesOptions,
	categoryOptions,
	projectOptions,
	tagOptions,
	saveState,
	formError,
	titleAutoFocus = false,
}: PostEditorFormProps) {
	const [isTagsPickerOpen, setIsTagsPickerOpen] = useState(false);
	const [tagsQuery, setTagsQuery] = useState("");
	const [hasTitleInteracted, setHasTitleInteracted] = useState(false);
	const [hasSlugInteracted, setHasSlugInteracted] = useState(false);
	const tagsAnchorRef = useComboboxAnchor();
	const errors = getPostMetadataErrors(value);
	const showTitleError = hasTitleInteracted && Boolean(errors.title);
	const showSlugError = hasSlugInteracted && Boolean(errors.slug);
	const selectedSeries = seriesOptions.find(
		(option) => option.value === value.seriesId,
	);
	const selectedCategory = categoryOptions.find(
		(option) => option.value === value.categoryId,
	);
	const selectedProject = projectOptions.find(
		(option) => option.value === value.projectId,
	);
	const selectedTags = tagOptions.filter((tag) => value.tagIds.includes(tag.value));
	const nextSaveStateLabel = saveStateLabel(saveState);

	return (
		<Card className="min-w-0 flex-1 overflow-visible">
			<CardHeader className="space-y-2">
				<div className="flex min-h-5 items-center justify-between gap-3">
					{formError ? (
						<span className="text-destructive text-xs">{formError}</span>
					) : (
						<span />
					)}
					{nextSaveStateLabel ? (
						<span className="text-muted-foreground text-xs">
							{nextSaveStateLabel}
						</span>
					) : null}
				</div>

				<div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_minmax(12rem,16rem)_5.5rem] md:gap-5">
					<Field
						data-invalid={showTitleError || undefined}
						className="gap-1.5"
					>
						<FieldLabel htmlFor="post-title" className="sr-only">
							Title
						</FieldLabel>
						<Input
							autoFocus={titleAutoFocus}
							id="post-title"
							name="title"
							placeholder="Untitled post"
							value={value.title}
							onChange={(event) => {
								const nextTitle = event.target.value;
								setHasTitleInteracted(true);

								onChange({
									...value,
									title: nextTitle,
									slug: isSlugManuallyEdited ? value.slug : toSlug(nextTitle),
								});
							}}
							aria-invalid={showTitleError || undefined}
							className="h-12 rounded-none border-0 border-input border-b-2 bg-transparent! px-0 font-semibold text-3xl shadow-none focus-visible:border-ring focus-visible:ring-0 md:text-4xl"
						/>
						{showTitleError && errors.title ? (
							<FieldError errors={[{ message: errors.title }]} />
						) : null}
					</Field>

					<Field
						data-invalid={showSlugError || undefined}
						className="gap-1.5"
					>
						<FieldLabel htmlFor="post-slug" className="sr-only">
							Slug
						</FieldLabel>
						<Input
							id="post-slug"
							name="slug"
							placeholder="post-slug"
							value={value.slug}
							onBlur={() => {
								onChange({
									...value,
									slug: toSlug(value.slug),
								});
							}}
							onChange={(event) => {
								const nextSlug = event.target.value;
								setHasSlugInteracted(true);
								onSlugManualEditChange(nextSlug.length > 0);
								onChange({
									...value,
									slug: nextSlug,
								});
							}}
							aria-invalid={showSlugError || undefined}
							className="h-8 rounded-none border-0 border-input border-b bg-transparent! px-0 font-mono text-xs tracking-wide shadow-none focus-visible:ring-0"
						/>
						{showSlugError && errors.slug ? (
							<FieldError errors={[{ message: errors.slug }]} />
						) : null}
					</Field>

					<Field className="gap-1.5">
						<FieldLabel htmlFor="post-status" className="sr-only">
							Status
						</FieldLabel>
						<Select
							name="status"
							value={value.status}
							onValueChange={(nextStatus) => {
								if (!nextStatus) {
									return;
								}

								onChange({
									...value,
									status: nextStatus as PostEditorValue["status"],
								});
							}}
						>
							<SelectTrigger id="post-status" size="sm">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent alignItemWithTrigger={false} align="end">
								<SelectGroup>
									<SelectLabel>Status</SelectLabel>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="private">Private</SelectItem>
									<SelectItem value="public">Public</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="shrink-0">
						<Combobox
							items={seriesOptions}
							value={selectedSeries ?? null}
							onValueChange={(selected) => {
								onChange({
									...value,
									seriesId: selected?.value ?? "",
								});
							}}
						>
							<ComboboxInput
								id="post-series"
								aria-label="Series"
								placeholder="Series"
								className="h-7 w-40"
								showClear={Boolean(value.seriesId)}
							/>
							<ComboboxContent>
								<ComboboxEmpty>No series found.</ComboboxEmpty>
								<ComboboxList>
									<ComboboxCollection>
										{(item) => (
											<ComboboxItem key={item.value} value={item}>
												{item.label}
											</ComboboxItem>
										)}
									</ComboboxCollection>
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>

					<div className="shrink-0">
						<Combobox
							items={categoryOptions}
							value={selectedCategory ?? null}
							onValueChange={(selected) => {
								onChange({
									...value,
									categoryId: selected?.value ?? "",
								});
							}}
						>
							<ComboboxInput
								id="post-category"
								aria-label="Category"
								placeholder="Category"
								className="h-7 w-40"
								showClear={Boolean(value.categoryId)}
							/>
							<ComboboxContent>
								<ComboboxEmpty>No categories found.</ComboboxEmpty>
								<ComboboxList>
									<ComboboxCollection>
										{(item) => (
											<ComboboxItem key={item.value} value={item}>
												{item.label}
											</ComboboxItem>
										)}
									</ComboboxCollection>
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>

					<div className="shrink-0">
						<Combobox
							items={projectOptions}
							value={selectedProject ?? null}
							onValueChange={(selected) => {
								onChange({
									...value,
									projectId: selected?.value ?? "",
								});
							}}
						>
							<ComboboxInput
								id="post-project"
								aria-label="Project"
								placeholder="Project"
								className="h-7 w-40"
								showClear={Boolean(value.projectId)}
							/>
							<ComboboxContent>
								<ComboboxEmpty>No projects found.</ComboboxEmpty>
								<ComboboxList>
									<ComboboxCollection>
										{(item) => (
											<ComboboxItem key={item.value} value={item}>
												{item.label}
											</ComboboxItem>
										)}
									</ComboboxCollection>
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>

					<div
						ref={tagsAnchorRef}
						className="flex items-center gap-2 md:shrink-0"
					>
						<Button
							type="button"
							size="icon-xs"
							variant="outline"
							aria-label="Toggle tags picker"
							onClick={() => {
								setIsTagsPickerOpen((previous) => {
									if (previous) {
										setTagsQuery("");
									}

									return !previous;
								});
							}}
						>
							<IconPlus />
						</Button>
						<span className="whitespace-nowrap text-muted-foreground text-xs">
							{selectedTags.length === 0
								? "No tags"
								: `${selectedTags.length} tags`}
						</span>
					</div>
				</div>

				<Field className="gap-2">
					<Combobox
						multiple
						items={tagOptions}
						value={selectedTags}
						open={isTagsPickerOpen}
						onOpenChange={(open) => {
							setIsTagsPickerOpen(open);
							if (!open) {
								setTagsQuery("");
							}
						}}
						inputValue={tagsQuery}
						onInputValueChange={setTagsQuery}
						onValueChange={(selected) => {
							onChange({
								...value,
								tagIds: selected.map((tag) => tag.value),
							});
							setTagsQuery("");
						}}
					>
						<ComboboxContent
							anchor={tagsAnchorRef}
							side="top"
							align="start"
							className="w-88 min-w-88"
						>
							<ComboboxInput
								id="post-tags"
								placeholder="Search tags"
								aria-label="Tags"
							/>
							<ComboboxEmpty>No tags found.</ComboboxEmpty>
							<ComboboxList>
								<ComboboxCollection>
									{(item) => (
										<ComboboxItem key={item.value} value={item}>
											{item.label}
										</ComboboxItem>
									)}
								</ComboboxCollection>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>

					{selectedTags.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{selectedTags.map((tag) => (
								<Badge key={tag.value} variant="secondary" className="gap-0">
									<span>{tag.label}</span>
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										className="-mr-1"
										aria-label={`Remove ${tag.label}`}
										onClick={() => {
											onChange({
												...value,
												tagIds: value.tagIds.filter((id) => id !== tag.value),
											});
										}}
									>
										<IconX className="size-3" />
									</Button>
								</Badge>
							))}
						</div>
					) : null}
				</Field>
			</CardHeader>

			<Separator />

			<CardContent className="flex-1">
				<Editor className="h-full" value={value.content} onChange={(content) => {
					onChange({
						...value,
						content,
					});
				}} />
			</CardContent>
		</Card>
	);
}
