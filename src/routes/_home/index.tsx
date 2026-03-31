import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	listPublicFeaturedProjects,
	listPublicPosts,
	listPublicProjects,
} from "#/queries/public";
import { Footer } from "./-footer";
import { Header } from "./-header";
import { Hero } from "./-hero";
import { CornerSquare, Layout } from "./-layout";
import { Posts } from "./-posts";
import { Projects } from "./-projects";

export const Route = createFileRoute("/_home/")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(listPublicProjects(6)),
			context.queryClient.ensureQueryData(listPublicFeaturedProjects(6)),
			context.queryClient.ensureQueryData(listPublicPosts(5)),
		]);
	},
	component: HomePage,
});

function HomePage() {
	const { data: recentProjects } = useSuspenseQuery(listPublicProjects(6));
	const { data: featuredProjects } = useSuspenseQuery(
		listPublicFeaturedProjects(6),
	);
	const { data: posts } = useSuspenseQuery(listPublicPosts(5));

	return (
		<Layout>
			<Header />
			<div className="flex h-full flex-1 flex-col px-4">
				<main className="container relative mx-auto max-w-4xl flex-1 border-r-2 border-l-2 bg-background">
					<CornerSquare position="top-left" />
					<CornerSquare position="top-right" />

					<Hero />

					<Projects
						recentProjects={recentProjects}
						featuredProjects={featuredProjects}
					/>
					<Posts posts={posts} />

					<CornerSquare position="bottom-left" />
					<CornerSquare position="bottom-right" />
				</main>
			</div>
			<Footer />
		</Layout>
	);
}
