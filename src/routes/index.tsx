import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
			<Card className="w-96">
				<CardHeader>
					<CardTitle>Portfolio Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						I'm currently building my portfolio. Stay tuned!
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
