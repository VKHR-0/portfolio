import { ArrowRight, FileText } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { CornerSquare } from "./-layout";

type Post = FunctionReturnType<
	typeof api.functions.posts.listPublicRecent
>[number];

type PostsProps = {
	posts: Array<Post>;
};

export function Posts({ posts }: PostsProps) {
	return (
		<section>
			<div className="flex items-center px-4">
				<h2 className="font-semibold text-2xl">Recent posts</h2>
				<Link
					to="/posts"
					className="group ml-2 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
				>
					<HugeiconsIcon icon={ArrowRight} strokeWidth={2} className="size-5" />
					<span className="max-w-0 overflow-hidden whitespace-nowrap transition-all group-hover:max-w-xs">
						See more
					</span>
				</Link>
			</div>
			{posts.length === 0 ? (
				<div className="mx-4 mt-6 flex flex-col items-center justify-center border-2 border-dashed bg-muted/50 p-12 text-center">
					<HugeiconsIcon
						icon={FileText}
						strokeWidth={2}
						className="mb-4 size-8 text-muted-foreground/50"
					/>
					<p className="text-muted-foreground">No posts yet.</p>
				</div>
			) : (
				<div className="mt-8 flex flex-col gap-4 p-2 sm:p-4">
					{posts.map((post) => (
						<PostCard key={post._id} post={post} />
					))}
				</div>
			)}
		</section>
	);
}

import { mediumDate } from "#/lib/format";

type PostCardProps = {
	post: Post;
};

function PostCard({ post }: PostCardProps) {
	return (
		<Link
			to="/posts/$slugId"
			params={{ slugId: post.slug }}
			className="group relative flex flex-col justify-between gap-4 border-2 bg-background p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center"
		>
			<CornerSquare position="top-left" mode="offset" />
			<CornerSquare position="top-right" mode="offset" />
			<CornerSquare position="bottom-left" mode="offset" />
			<CornerSquare position="bottom-right" mode="offset" />

			<h3 className="font-semibold text-lg">{post.title}</h3>

			<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm">
				<time dateTime={new Date(post._creationTime).toISOString()}>
					{mediumDate.format(new Date(post._creationTime))}
				</time>
				<HugeiconsIcon
					icon={ArrowRight}
					strokeWidth={2}
					className="size-5 transition-transform group-hover:translate-x-1"
				/>
			</div>
		</Link>
	);
}
