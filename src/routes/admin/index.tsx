import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/admin/")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await context.convexQueryClient.queryClient.ensureQueryData(
			convexQuery(api.auth.getCurrentUser),
		);
	},
});

function RouteComponent() {
	const navigate = useNavigate();

	const { data: user } = useSuspenseQuery(
		convexQuery(api.auth.getCurrentUser, {}),
	);

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
			<Card className="w-full">
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
		</main>
	);
}
