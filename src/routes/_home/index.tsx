import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "#/components/ui/skeleton";
import { listPublicPosts, listPublicProjects } from "#/queries/public";
import { Header } from "./-header";
import { Hero } from "./-hero";
import { CornerSquare, Layout } from "./-layout";
import { Posts } from "./-posts";
import { Projects } from "./-projects";

export const Route = createFileRoute("/_home/")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listPublicProjects(4)),
			context.queryClient.ensureQueryData(listPublicPosts(5)),
		]);
	},
	component: HomePage,
	pendingComponent: HomePageSkeleton,
});

function HomePage() {
	const { data: projects } = useSuspenseQuery(listPublicProjects(4));
	const { data: posts } = useSuspenseQuery(listPublicPosts(5));

	return (
		<Layout>
			<Header />
			<div className="flex h-full flex-1 flex-col">
				<main className="container relative mx-auto max-w-4xl flex-1 border-r-2 border-l-2 bg-background">
					<CornerSquare position="top-left" />
					<CornerSquare position="top-right" />

					<Hero />

					<Projects projects={projects} />
					<Posts posts={posts} />

					<CornerSquare position="bottom-left" />
					<CornerSquare position="bottom-right" />
				</main>
			</div>
		</Layout>
	);
}

function HomePageSkeleton() {
	return (
		<div className="mx-auto min-h-screen max-w-4xl px-4 py-16">
			<Skeleton className="h-12 w-64" />
			<Skeleton className="mt-4 h-6 w-96" />
			<Skeleton className="mt-6 h-10 w-24" />

			<Skeleton className="mt-12 h-8 w-40" />
			<div className="mt-6 grid gap-6 sm:grid-cols-2">
				<Skeleton className="aspect-video" />
				<Skeleton className="aspect-video" />
				<Skeleton className="aspect-video" />
				<Skeleton className="aspect-video" />
			</div>

			<Skeleton className="mt-12 h-8 w-32" />
			<div className="mt-6 space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
		</div>
	);
}
