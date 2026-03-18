import { createFileRoute } from "@tanstack/react-router";
import { Card } from "#/components/ui/card";
import { CornerSquare } from "../-layout";

export const Route = createFileRoute("/_home/projects/")({
	component: ProjectsPage,
});

function ProjectsPage() {
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-diagonal-dashed">
			<Card className="relative max-w-md overflow-visible rounded-none border bg-background p-8 text-center">
				<CornerSquare
					position="top-left"
					mode="offset"
					className="-mt-px -ml-px"
				/>
				<CornerSquare
					position="top-right"
					mode="offset"
					className="-mt-px -mr-px"
				/>
				<CornerSquare
					position="bottom-left"
					mode="offset"
					className="-mb-px -ml-px"
				/>
				<CornerSquare
					position="bottom-right"
					mode="offset"
					className="-mr-px -mb-px"
				/>

				<h1 className="font-semibold text-2xl">Projects</h1>
				<p className="mt-4 text-muted-foreground">
					This page is under construction.
				</p>
				<p className="mt-2 text-muted-foreground text-sm">
					Check back soon for updates!
				</p>
			</Card>
		</div>
	);
}
