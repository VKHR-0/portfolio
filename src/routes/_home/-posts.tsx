import { ArrowRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

type Post = FunctionReturnType<
	typeof api.functions.posts.listPublicRecent
>[number];

export function Posts({ posts }: { posts: Array<Post> }) {
	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<section className="px-4 py-12">
			<h2 className="font-semibold text-2xl">Recent posts</h2>
			{posts.length === 0 ? (
				<p className="mt-6 text-muted-foreground">No posts yet.</p>
			) : (
				<div className="mt-6 space-y-4">
					{posts.map((post) => (
						<Link
							key={post._id}
							to="/posts/$slugId"
							params={{ slugId: post.slug }}
							className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
						>
							<div>
								<h3 className="font-medium group-hover:text-primary">
									{post.title}
								</h3>
								<time className="text-muted-foreground text-sm">
									{dateFormatter.format(new Date(post._creationTime))}
								</time>
							</div>
							<HugeiconsIcon
								icon={ArrowRight}
								strokeWidth={2}
								className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1"
							/>
						</Link>
					))}
				</div>
			)}
		</section>
	);
}
