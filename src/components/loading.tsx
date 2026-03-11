import { IconLoader2 } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

function LoadingPage() {
	return (
		<div className="flex w-full items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconLoader2 className="size-4 animate-spin text-muted-foreground" />
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
