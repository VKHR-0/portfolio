import { ArrowRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { CornerSquare } from "./-layout";

type Post = FunctionReturnType<
	typeof api.functions.posts.listPublicRecent
>[number];

export function Posts({ posts }: { posts: Array<Post> }) {
	return (
		<section>
			<h2 className="px-4 font-semibold text-2xl">Recent posts</h2>
			{posts.length === 0 ? (
				<p className="mt-6 text-muted-foreground">No posts yet.</p>
			) : (
				<div className="mt-6">
					{posts.map((post) => (
						<PostCard key={post._id} post={post} />
					))}
				</div>
			)}
		</section>
	);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

type PostCardProps = {
	post: Post;
};

function PostCard({ post }: PostCardProps) {
	return (
		<Link
			to="/posts/$slugId"
			params={{ slugId: post.slug }}
			className="group relative flex items-center justify-between border-t-2 px-4 py-4 transition-colors hover:bg-muted/50"
		>
			<CornerSquare position="top-left" mode="centered" className="-ml-px" />
			<CornerSquare position="top-right" mode="centered" className="-mr-px" />
			<div>
				<h3 className="font-medium group-hover:text-primary">{post.title}</h3>
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
	);
}
