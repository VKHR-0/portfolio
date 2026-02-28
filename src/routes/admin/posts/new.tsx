import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SLUG_PATTERN, toSlug } from "shared/slug";
import z from "zod";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

export const Route = createFileRoute("/admin/posts/new")({
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

	const defaultValues: PostMetadataFormValues = {
		title: "",
		slug: "",
		status: "draft",
		seriesId: "",
		categoryId: "",
		projectId: "",
		tagIds: [],
	};

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: postMetadataSchema,
		},
		onSubmit: async () => {},
	});

	return (
		<div className="mx-auto w-full max-w-5xl p-4 md:p-6">
			<form
				className="rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/20 px-6 py-7 shadow-sm md:px-10 md:py-10"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(12rem,16rem)_1fr_auto] md:gap-5">
					<div className="md:pt-2">
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
											className="h-8 rounded-none border-0 border-input border-b px-0 font-mono text-xs tracking-wide shadow-none focus-visible:ring-0"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</div>

					<div>
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
											className="h-12 rounded-none border-0 border-input border-b-2 px-0 font-semibold text-3xl shadow-none focus-visible:border-ring focus-visible:ring-0 md:text-4xl"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</div>

					<div className="md:pt-2">
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
											<SelectTrigger id={field.name} className="w-[10rem]">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="draft">Draft</SelectItem>
												<SelectItem value="private">Private</SelectItem>
												<SelectItem value="public">Public</SelectItem>
											</SelectContent>
										</Select>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</div>
				</div>
			</form>
		</div>
	);
}
