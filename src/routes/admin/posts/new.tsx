import { createFileRoute } from "@tanstack/react-router";
import { PostEditor } from "./-post-editor";

export const Route = createFileRoute("/admin/posts/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <PostEditor />;
}
