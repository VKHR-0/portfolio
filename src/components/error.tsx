import { IconAlertTriangle } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

type ErrorPageProps = {
	error: unknown;
	reset?: () => void;
};

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "An unexpected error occurred.";
}

function ErrorPage({ error, reset }: ErrorPageProps) {
	const message = getErrorMessage(error);

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconAlertTriangle className="size-4 text-destructive" />
						Something went wrong
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-muted-foreground">{message}</p>
				</CardContent>
				<CardFooter className="justify-end gap-2">
					<Button variant="outline" render={<Link to="/" />}>
						Go home
					</Button>
					<Button onClick={reset}>Try again</Button>
				</CardFooter>
			</Card>
		</main>
	);
}

export { ErrorPage };
