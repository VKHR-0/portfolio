import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Spinner } from "./ui/spinner";

function LoadingPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Spinner />
						Loading
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Please wait while we fetch the latest data.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export { LoadingPage };
