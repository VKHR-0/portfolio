import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
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
import { toSlug } from "#/lib/slug";

const createTagSchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	slug: z
		.string()
		.trim()
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Use lowercase letters, numbers, and hyphens.",
		)
		.or(z.literal("")),
});

export const Route = createFileRoute("/admin/tags/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const createTag = useMutation(api.functions.tags.createTag);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
		},
		validators: {
			onSubmit: createTagSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);

			try {
				await createTag({
					name: value.name,
					slug: value.slug || undefined,
				});

				void navigate({ to: "/admin/tags" });
			} catch (mutationError: unknown) {
				setError(
					mutationError instanceof Error
						? mutationError.message
						: "Unable to create tag.",
				);
			}
		},
	});

	const closeModal = () => {
		void navigate({ to: "/admin/tags" });
	};

	return (
		<Dialog open onOpenChange={(open) => !open && closeModal()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create tag</DialogTitle>
					<DialogDescription>Add a tag for organizing posts.</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					id="admin-create-tag-form"
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
											placeholder="Tag name"
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
												setIsSlugManuallyEdited(true);
												field.handleChange(event.target.value);
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
					</FieldGroup>

					{error ? <p className="text-destructive text-sm">{error}</p> : null}

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
										form="admin-create-tag-form"
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
