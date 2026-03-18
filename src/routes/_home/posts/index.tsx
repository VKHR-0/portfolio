import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPublicPosts } from "#/queries/public";
import { Footer } from "../-footer";
import { Header } from "../-header";
import { CornerSquare, Layout } from "../-layout";

export const Route = createFileRoute("/_home/posts/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listPublicPosts());
	},
	component: PostsPage,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});

function PostsPage() {
	const { data: posts } = useSuspenseQuery(listPublicPosts());

	const groupedPosts = posts.reduce(
		(acc, post) => {
			const year = new Date(post._creationTime).getFullYear();
			if (!acc[year]) acc[year] = [];
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, typeof posts>,
	);

	const years = Object.keys(groupedPosts)
		.map(Number)
		.sort((a, b) => b - a);

	return (
		<Layout>
			<Header />
			<div className="flex h-full flex-1 flex-col px-4">
				<main className="container relative mx-auto min-h-full max-w-4xl flex-1 border-x-2 bg-background">
					<CornerSquare position="top-left" />
					<CornerSquare position="top-right" />
					<CornerSquare position="bottom-left" />
					<CornerSquare position="bottom-right" />

					<div className="relative mb-2 flex items-center gap-4 border-b-2 p-2 sm:p-4">
						<Link
							to="/"
							className="inline-flex items-center justify-center border-2 bg-background p-1.5 transition-colors hover:bg-muted"
							aria-label="Back to home"
						>
							<HugeiconsIcon
								icon={ArrowLeft}
								strokeWidth={2}
								className="size-5"
							/>
						</Link>
						<h1 className="font-bold text-2xl">Posts</h1>
						<CornerSquare position="bottom-left" />
						<CornerSquare position="bottom-right" />
					</div>

					{!posts || posts.length === 0 ? (
						<p className="text-muted-foreground">No posts yet.</p>
					) : (
						<div className="space-y-12 p-2 sm:p-4">
							{years.map((year) => (
								<section key={year}>
									<h2 className="mb-6 font-bold text-xl">{year}</h2>
									<div className="flex flex-col gap-4">
										{groupedPosts[year].map((post) => (
											<Link
												key={post._id}
												to="/posts/$slugId"
												params={{ slugId: post.slug }}
												className="group relative flex flex-col justify-between gap-4 border-2 bg-background p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center"
											>
												<CornerSquare position="top-left" mode="offset" />
												<CornerSquare position="top-right" mode="offset" />
												<CornerSquare position="bottom-left" mode="offset" />
												<CornerSquare position="bottom-right" mode="offset" />

												<h3 className="font-semibold text-lg">{post.title}</h3>

												<div className="shrink-0 text-muted-foreground text-sm">
													<time
														dateTime={new Date(
															post._creationTime,
														).toISOString()}
													>
														{dateFormatter.format(new Date(post._creationTime))}
													</time>
												</div>
											</Link>
										))}
									</div>
								</section>
							))}
						</div>
					)}
				</main>
			</div>
			<Footer />
		</Layout>
	);
}
