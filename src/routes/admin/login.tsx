import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";

const loginSchema = z.object({
	email: z.email("Enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const Route = createFileRoute("/admin/login")({
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated) {
			throw redirect({ to: "/admin" });
		}
	},
	component: RouteComponent,
	validateSearch: zodValidator(
		z.object({
			redirect: fallback(z.string(), "/admin"),
		}),
	),
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});

			if (error) {
				toast.error(error.message || "Unable to sign in");
				return;
			}

			toast.success("Signed in successfully!");

			await navigate({ to: search.redirect });
		},
	});

	return (
		<main className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-12">
			<Card className="w-full max-w-md gap-4">
				<CardHeader>
					<CardTitle>Admin Login</CardTitle>
					<CardDescription>
						Sign in to access your Convex admin profile.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						id="admin-login-form"
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field name="email">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Email</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												autoComplete="email"
												type="email"
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

							<form.Field name="password">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Password</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												autoComplete="current-password"
												type="password"
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
					</form>
				</CardContent>

				<CardFooter>
					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								className="w-full"
								disabled={!canSubmit}
								form="admin-login-form"
								type="submit"
							>
								{isSubmitting ? (
									<>
										<Spinner />
										Signing in...
									</>
								) : (
									<>Sign in</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</CardFooter>
			</Card>
		</main>
	);
}
