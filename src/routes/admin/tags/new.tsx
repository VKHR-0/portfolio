import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";

export const Route = createFileRoute("/admin/tags/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const createTag = useMutation(api.taxonomy.createTag);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const closeModal = () => {
		void navigate({ to: "/admin/tags" });
	};

	return (
		<Dialog open onOpenChange={(open) => !open && closeModal()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create tag</DialogTitle>
					<DialogDescription>Add a tag for organizing posts.</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault();
						setError(null);
						setIsSaving(true);

						createTag({
							name,
							slug: slug || undefined,
						})
							.then(() => {
								void navigate({ to: "/admin/tags" });
							})
							.catch((mutationError: unknown) => {
								setError(
									mutationError instanceof Error
										? mutationError.message
										: "Unable to create tag.",
								);
							})
							.finally(() => {
								setIsSaving(false);
							});
					}}
				>
					<Input
						autoFocus
						placeholder="Name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
					/>
					<Input
						placeholder="Slug (optional)"
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
					/>
					{error ? <p className="text-destructive text-sm">{error}</p> : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeModal}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSaving || !name.trim()}>
							{isSaving ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
