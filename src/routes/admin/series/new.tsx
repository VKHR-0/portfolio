import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { SLUG_PATTERN, toSlug } from "shared/slug";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";

const createSeriesSchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	slug: z
		.string()
		.trim()
		.regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens.")
		.or(z.literal("")),
	description: z.string(),
});

export const Route = createFileRoute("/admin/series/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const createSeries = useMutation(api.functions.series.createSeries);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
			description: "",
		},
		validators: {
			onSubmit: createSeriesSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await createSeries({
					name: value.name,
					slug: value.slug || undefined,
					description: value.description || undefined,
				});

				void navigate({ to: "/admin/series" });
			} catch (mutationError: unknown) {
				toast.error(
					mutationError instanceof Error
						? mutationError.message
						: "Unable to create series.",
				);
			}
		},
	});

	const closeModal = () => {
		void navigate({ to: "/admin/series" });
	};

	return (
		<Dialog open onOpenChange={(open) => !open && closeModal()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create series</DialogTitle>
					<DialogDescription>
						Group related posts into a series.
					</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					id="admin-create-series-form"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											autoFocus
											id={field.name}
											name={field.name}
											placeholder="Series name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => {
												const nextName = event.target.value;
												field.handleChange(nextName);

												if (!isSlugManuallyEdited) {
													form.setFieldValue("slug", toSlug(nextName));
												}
											}}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
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
											placeholder="auto-generated"
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
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="description">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Description</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											placeholder="Description (optional)"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={closeModal}
										disabled={isSubmitting}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										form="admin-create-series-form"
										disabled={!canSubmit}
									>
										{isSubmitting ? (
											<>
												<Spinner />
												Creating...
											</>
										) : (
											<>Create</>
										)}
									</Button>
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
