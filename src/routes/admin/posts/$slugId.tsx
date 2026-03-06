import { createFileRoute } from "@tanstack/react-router";
import { PostEditor } from "./-post-editor";

export const Route = createFileRoute("/admin/posts/$slugId")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<PostEditor />
		</div>
	);
}
