import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { SLUG_PATTERN } from "shared/slug";
import z from "zod";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
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
		<div className="mx-auto w-full max-w-4xl p-4 md:p-6">
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field name="title">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Title</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Post title"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											field.handleChange(event.target.value);
										}}
										aria-invalid={isInvalid}
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
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Slug</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="post-slug"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											field.handleChange(event.target.value);
										}}
										aria-invalid={isInvalid}
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
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Status</FieldLabel>
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={(value) => {
											if (value) {
												field.handleChange(value);
											}
										}}
									>
										<SelectTrigger id={field.name} className="w-full">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="private">Private</SelectItem>
											<SelectItem value="public">Public</SelectItem>
										</SelectContent>
									</Select>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button type="submit" disabled={!canSubmit || isSubmitting}>
							Continue
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
