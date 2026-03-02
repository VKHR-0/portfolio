import { IconPlus, IconX } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
	listCategoriesQuery,
	listProjectsQuery,
	listSeriesQuery,
	listTagsQuery,
} from "#/queries";

export const Route = createFileRoute("/admin/posts/new")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listSeriesQuery()),
			context.queryClient.ensureQueryData(listCategoriesQuery()),
			context.queryClient.ensureQueryData(listProjectsQuery()),
			context.queryClient.ensureQueryData(listTagsQuery()),
		]);
	},
	component: RouteComponent,
});

const postMetadataSchema = z.object({
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

type PostMetadataFormValues = z.infer<typeof postMetadataSchema>;

function RouteComponent() {
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
	const [isTagsPickerOpen, setIsTagsPickerOpen] = useState(false);
	const [tagsQuery, setTagsQuery] = useState("");
	const tagsAnchorRef = useComboboxAnchor();
	const { data: seriesResult } = useSuspenseQuery(listSeriesQuery());
	const { data: categoriesResult } = useSuspenseQuery(listCategoriesQuery());
	const { data: projectsResult } = useSuspenseQuery(listProjectsQuery());
	const { data: tagsResult } = useSuspenseQuery(listTagsQuery());

	const seriesOptions = useMemo(
		() =>
			seriesResult.page.map((series) => ({
				value: series._id,
				label: series.name,
			})),
		[seriesResult.page],
	);
	const categoryOptions = useMemo(
		() =>
			categoriesResult.page.map((category) => ({
				value: category._id,
				label: category.name,
			})),
		[categoriesResult.page],
	);
	const projectOptions = useMemo(
		() =>
			projectsResult.page.map((project) => ({
				value: project._id,
				label: project.title,
			})),
		[projectsResult.page],
	);
	const tagOptions = useMemo(
		() =>
			tagsResult.page.map((tag) => ({
				value: tag._id,
				label: tag.name,
			})),
		[tagsResult.page],
	);

	const form = useForm({
		defaultValues: {
			title: "",
			slug: "",
			status: "draft",
			seriesId: "",
			categoryId: "",
			projectId: "",
			tagIds: [],
		} as PostMetadataFormValues,
		validators: {
			onSubmit: postMetadataSchema,
		},
		onSubmit: async () => {},
	});

	return (
		<Card className="min-w-0 flex-1">
			<CardHeader className="space-y-2">
				<div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_minmax(12rem,16rem)_5.5rem] md:gap-5">
					<form.Field name="title">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid} className="gap-1.5">
									<FieldLabel htmlFor={field.name} className="sr-only">
										Title
									</FieldLabel>
									<Input
										autoFocus
										id={field.name}
										name={field.name}
										placeholder="Untitled post"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											const nextTitle = event.target.value;
											field.handleChange(nextTitle);

											if (!isSlugManuallyEdited) {
												form.setFieldValue("slug", toSlug(nextTitle));
											}
										}}
										aria-invalid={isInvalid}
										className="h-12 rounded-none border-0 border-input border-b-2 bg-transparent! px-0 font-semibold text-3xl shadow-none focus-visible:border-ring focus-visible:ring-0 md:text-4xl"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="slug">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid} className="gap-1.5">
									<FieldLabel htmlFor={field.name} className="sr-only">
										Slug
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="post-slug"
										value={field.state.value}
										onBlur={() => {
											field.handleBlur();
											field.handleChange(toSlug(field.state.value));
										}}
										onChange={(event) => {
											const nextSlug = event.target.value;
											setIsSlugManuallyEdited(nextSlug.length > 0);
											field.handleChange(nextSlug);
										}}
										aria-invalid={isInvalid}
										className="h-8 rounded-none border-0 border-input border-b bg-transparent! px-0 font-mono text-xs tracking-wide shadow-none focus-visible:ring-0"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="status">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid} className="gap-1.5">
									<FieldLabel htmlFor={field.name} className="sr-only">
										Status
									</FieldLabel>
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={(value) => {
											if (value) {
												field.handleChange(value);
											}
										}}
									>
										<SelectTrigger id={field.name} size="sm">
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
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<form.Field name="seriesId">
						{(field) => {
							const selected = seriesOptions.find(
								(option) => option.value === field.state.value,
							);

							return (
								<div className="shrink-0">
									<Combobox
										items={seriesOptions}
										value={selected ?? null}
										onValueChange={(value) => {
											field.handleChange(value?.value ?? "");
										}}
									>
										<ComboboxInput
											id={field.name}
											aria-label="Series"
											placeholder="Series"
											className="h-7 w-40"
											showClear={Boolean(field.state.value)}
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
							);
						}}
					</form.Field>

					<form.Field name="categoryId">
						{(field) => {
							const selected = categoryOptions.find(
								(option) => option.value === field.state.value,
							);

							return (
								<div className="shrink-0">
									<Combobox
										items={categoryOptions}
										value={selected ?? null}
										onValueChange={(value) => {
											field.handleChange(value?.value ?? "");
										}}
									>
										<ComboboxInput
											id={field.name}
											aria-label="Category"
											placeholder="Category"
											className="h-7 w-40"
											showClear={Boolean(field.state.value)}
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
							);
						}}
					</form.Field>

					<form.Field name="projectId">
						{(field) => {
							const selected = projectOptions.find(
								(option) => option.value === field.state.value,
							);

							return (
								<div className="shrink-0">
									<Combobox
										items={projectOptions}
										value={selected ?? null}
										onValueChange={(value) => {
											field.handleChange(value?.value ?? "");
										}}
									>
										<ComboboxInput
											id={field.name}
											aria-label="Project"
											placeholder="Project"
											className="h-7 w-40"
											showClear={Boolean(field.state.value)}
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
							);
						}}
					</form.Field>

					<form.Field name="tagIds">
						{(field) => {
							const selectedTags = tagOptions.filter((tag) =>
								field.state.value.includes(tag.value),
							);

							return (
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
							);
						}}
					</form.Field>
				</div>

				<form.Field name="tagIds">
					{(field) => {
						const selectedTagIds = field.state.value;
						const selectedTags = tagOptions.filter((tag) =>
							selectedTagIds.includes(tag.value),
						);

						return (
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
									onValueChange={(value) => {
										field.handleChange(value.map((tag) => tag.value));
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
											id={field.name}
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

								{selectedTags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{selectedTags.map((tag) => (
											<Badge
												key={tag.value}
												variant="secondary"
												className="gap-0"
											>
												<span>{tag.label}</span>
												<Button
													type="button"
													variant="ghost"
													size="icon-xs"
													className="-mr-1"
													aria-label={`Remove ${tag.label}`}
													onClick={() => {
														field.handleChange(
															selectedTagIds.filter((id) => id !== tag.value),
														);
													}}
												>
													<IconX className="size-3" />
												</Button>
											</Badge>
										))}
									</div>
								)}
							</Field>
						);
					}}
				</form.Field>
			</CardHeader>

			<Separator />

			<CardContent className="px-6 pb-6 md:px-10 md:pb-10">
				<Editor />
			</CardContent>
		</Card>
	);
}
