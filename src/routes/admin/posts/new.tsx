import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "#/components/ui/editor";

export const Route = createFileRoute("/admin/posts/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<Editor />
		</div>
	);
}
