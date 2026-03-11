import { Dice } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import * as React from "react";
import { SLUG_PATTERN, toSlug } from "shared/slug";
import {
	getRandomColorKey,
	TECHNOLOGY_COLOR_KEYS,
	TECHNOLOGY_COLORS,
	type TechnologyColorKey,
} from "shared/technology-colors";
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
import { getErrorMessage, toAsyncResult } from "#/lib/async-result";
import { cn } from "#/lib/utils";

const createTechnologySchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	slug: z
		.string()
		.trim()
		.regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens.")
		.or(z.literal("")),
	color: z.enum(
		TECHNOLOGY_COLOR_KEYS as unknown as [
			TechnologyColorKey,
			...TechnologyColorKey[],
		],
		{ message: "Please select a color." },
	),
});

export const Route = createFileRoute("/admin/technologies/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const createTechnology = useMutation(
		api.functions.technologies.createTechnology,
	);
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
	const nameInputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		nameInputRef.current?.focus();
	}, []);

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
			color: getRandomColorKey(),
		},
		validators: {
			onSubmit: createTechnologySchema,
		},
		onSubmit: async ({ value }) => {
			const result = await toAsyncResult(
				createTechnology({
					name: value.name,
					slug: value.slug || undefined,
					color: value.color,
				}),
			);

			if (!result.ok) {
				toast.error(
					getErrorMessage(result.error, "Unable to create technology."),
				);
				return;
			}

			void navigate({ to: "/admin/technologies" });
		},
	});

	const closeModal = () => {
		void navigate({ to: "/admin/technologies" });
	};

	return (
		<Dialog open onOpenChange={(open) => !open && closeModal()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create technology</DialogTitle>
					<DialogDescription>
						Add a technology for project tech stacks.
					</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					id="admin-create-technology-form"
					onSubmit={(event) => {
						event.preventDefault();
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
											ref={nameInputRef}
											id={field.name}
											name={field.name}
											placeholder="Technology name"
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

						<form.Field name="color">
							{(field) => (
								<Field>
									<div className="flex items-center justify-between">
										<FieldLabel id="color-label">Color</FieldLabel>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="-mr-1 h-auto px-2 py-1 text-muted-foreground"
											onClick={() => field.handleChange(getRandomColorKey())}
										>
											<HugeiconsIcon
												icon={Dice}
												strokeWidth={2}
												data-icon="inline-start"
											/>
											Random
										</Button>
									</div>
									<div className="grid grid-cols-6 gap-x-1.5 gap-y-2.5">
										{TECHNOLOGY_COLOR_KEYS.map((key) => {
											const palette = TECHNOLOGY_COLORS[key];
											const isSelected = key === field.state.value;

											return (
												<button
													key={key}
													type="button"
													className={cn(
														"flex size-8 items-center justify-center rounded-md border transition-colors",
														palette.bg,
														palette.border,
														isSelected && "ring-2 ring-ring ring-offset-1",
													)}
													title={key}
													onClick={() => field.handleChange(key)}
												/>
											);
										})}
									</div>
								</Field>
							)}
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
										form="admin-create-technology-form"
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
