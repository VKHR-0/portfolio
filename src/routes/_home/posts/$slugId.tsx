import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarkdownContent } from "#/components/markdown-content";
import { Badge } from "#/components/ui/badge";
import { getPublicPostBySlugQuery } from "#/queries";
import { renderContent } from "#/server/render-content";

export const Route = createFileRoute("/_home/posts/$slugId")({
	loader: async ({ context, params }) => {
		const post = await context.queryClient.ensureQueryData(
			getPublicPostBySlugQuery(params.slugId),
		);
		const contentHtml = post?.content
			? await renderContent({ data: post.content })
			: "";
		return { contentHtml };
	},
	component: RouteComponent,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

function RouteComponent() {
	const { contentHtml } = Route.useLoaderData();
	const { slugId } = Route.useParams();
	const { data: post } = useSuspenseQuery(getPublicPostBySlugQuery(slugId));

	if (!post) {
		return (
			<div className="flex flex-col items-center gap-4 py-20">
				<h1 className="font-bold text-2xl">Post not found</h1>
				<p className="text-muted-foreground">
					This post doesn't exist or isn't published yet.
				</p>
				<Link
					to="/posts"
					className="text-primary text-sm underline underline-offset-4"
				>
					Back to posts
				</Link>
			</div>
		);
	}

	return (
		<article className="mx-auto w-full max-w-3xl px-4 py-10">
			<Link
				to="/posts"
				className="mb-8 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				<HugeiconsIcon icon={ArrowLeft} strokeWidth={2} className="size-4" />
				Back to posts
			</Link>

			<h1 className="mb-4 font-bold text-4xl leading-tight tracking-tight">
				{post.title}
			</h1>

			<div className="mb-8 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
				<time dateTime={new Date(post._creationTime).toISOString()}>
					{dateFormatter.format(new Date(post._creationTime))}
				</time>

				{post.category && (
					<>
						<span aria-hidden="true">&middot;</span>
						<Badge variant="secondary">{post.category.name}</Badge>
					</>
				)}

				{post.tags.length > 0 && (
					<>
						<span aria-hidden="true">&middot;</span>
						<div className="flex flex-wrap gap-1.5">
							{post.tags.map((tag) => (
								<Badge key={tag.slug} variant="outline">
									{tag.name}
								</Badge>
							))}
						</div>
					</>
				)}
			</div>

			<MarkdownContent
				html={contentHtml}
				className="prose prose-amber dark:prose-invert max-w-none"
			/>
		</article>
	);
}
