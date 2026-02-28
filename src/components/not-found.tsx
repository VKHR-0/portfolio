import { IconSearchOff } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

function NotFoundPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconSearchOff className="size-4 text-muted-foreground" />
						Page not found
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						The page you requested does not exist or has been moved.
					</p>
				</CardContent>
				<CardFooter className="justify-end gap-2">
					<Button variant="outline" render={<Link to="/admin" />}>
						Admin
					</Button>
					<Button render={<Link to="/" />}>Go home</Button>
				</CardFooter>
			</Card>
		</main>
	);
}

export { NotFoundPage };
