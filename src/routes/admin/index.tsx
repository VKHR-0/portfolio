import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { getCurrentUser } from "#/functions/auth";
import { authClient } from "#/lib/auth-client";
import { isAuthError } from "#/lib/auth-server";

export const Route = createFileRoute("/admin/")({
	component: RouteComponent,
	loader: async ({ location }) => {
		try {
			return await getCurrentUser();
		} catch (error) {
			if (isAuthError(error)) {
				throw redirect({
					to: "/admin/login",
					search: {
						redirect: location.href,
					},
				});
			}

			throw error;
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const user = Route.useLoaderData();

	return (
		<section className="grid w-full place-items-center">
			<Card className="w-full max-w-3xl">
				<CardHeader>
					<CardTitle>Admin Profile</CardTitle>
					<CardDescription>
						Your authenticated Convex profile information.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3 rounded-lg border bg-muted/30 p-4">
						<div>
							<p className="text-muted-foreground text-xs uppercase tracking-wide">
								Name
							</p>
							<p className="font-medium">{user.name || "-"}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs uppercase tracking-wide">
								Email
							</p>
							<p className="font-medium">{user.email || "-"}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs uppercase tracking-wide">
								User ID
							</p>
							<p className="break-all font-mono text-xs">{user._id}</p>
						</div>
					</div>

					<Button
						onClick={() => {
							void authClient.signOut({
								fetchOptions: {
									onSuccess: async () =>
										navigate({
											to: "/admin/login",
											search: { redirect: "/admin" },
										}),
								},
							});
						}}
						variant="outline"
					>
						Sign out
					</Button>
				</CardContent>
			</Card>
		</section>
	);
}
