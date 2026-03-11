import { IconAlertTriangle } from "@tabler/icons-react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "An unexpected error occurred.";
}

function ErrorPage({ error }: ErrorComponentProps) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	console.error(error);

	const message = getErrorMessage(error);

	return (
		<div className="flex w-full items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconAlertTriangle className="size-4 text-destructive" />
						Something went wrong
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-muted-foreground text-sm">
						<code>{message}</code>
					</pre>
				</CardContent>
				<CardFooter className="justify-end gap-2">
					{isRoot ? (
						<Button
							variant="outline"
							nativeButton={false}
							render={<Link to="/" />}
						>
							Home
						</Button>
					) : (
						<Button variant="outline" onClick={() => window.history.back()}>
							Go Back
						</Button>
					)}
					<Button onClick={() => router.invalidate()}>Try Again</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export { ErrorPage };
