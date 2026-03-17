import { ArrowRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { cn } from "#/lib/utils";

type CornerSquareProps = {
	position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
	className?: string;
};

function CornerSquare({ position, className }: CornerSquareProps) {
	const positionClasses: Record<CornerSquareProps["position"], string> = {
		"top-left": "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
		"top-right": "right-0 top-0 translate-x-1/2 -translate-y-1/2",
		"bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
		"bottom-right": "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
	};

	return (
		<div
			className={cn(
				"absolute z-20 size-3 rotate-45 border-2 bg-background",
				positionClasses[position],
				className,
			)}
			aria-hidden="true"
		/>
	);
}

type Post = FunctionReturnType<
	typeof api.functions.posts.listPublicRecent
>[number];

type PostCardProps = {
	post: Post;
	dateFormatter: Intl.DateTimeFormat;
};

function PostCard({ post, dateFormatter }: PostCardProps) {
	return (
		<Link
			to="/posts/$slugId"
			params={{ slugId: post.slug }}
			className="group relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
		>
			<CornerSquare position="top-left" />
			<CornerSquare position="top-right" />
			<CornerSquare position="bottom-left" />
			<CornerSquare position="bottom-right" />
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

export function Posts({ posts }: { posts: Array<Post> }) {
	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<section>
			<h2 className="px-4 font-semibold text-2xl">Recent posts</h2>
			{posts.length === 0 ? (
				<p className="mt-6 text-muted-foreground">No posts yet.</p>
			) : (
				<div className="mt-6">
					{posts.map((post) => (
						<PostCard
							key={post._id}
							post={post}
							dateFormatter={dateFormatter}
						/>
					))}
				</div>
			)}
		</section>
	);
}
