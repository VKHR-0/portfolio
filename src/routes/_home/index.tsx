import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/_home/")({ component: App });

function App() {
	return (
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
	);
}
