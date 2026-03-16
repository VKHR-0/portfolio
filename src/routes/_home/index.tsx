import { ArrowRight, Github, Mail } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { COLORS, type ColorKey } from "shared/colors";
import { ThemeSwitcher } from "#/components/theme-switcher";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { listPublicPosts, listPublicProjects } from "#/queries/public";

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

type Project = {
	_id: string;
	title: string;
	slug: string;
	description: string;
	imageUrl?: string;
	technologies: Array<{ name: string; color: string }>;
	repositoryUrl?: string;
	demoUrl?: string;
};

type Post = {
	_id: string;
	title: string;
	slug: string;
	_creationTime: number;
};

function HomePage() {
	const { data: projects } = useSuspenseQuery(listPublicProjects(4));
	const { data: posts } = useSuspenseQuery(listPublicPosts(5));

	return (
		<div className="min-h-screen">
			<HeroSection />
			<ProjectsSection projects={projects} />
			<PostsSection posts={posts} />
			<Footer />
		</div>
	);
}

function HeroSection() {
	return (
		<section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
			<h1 className="font-bold text-4xl md:text-5xl">Hi, I'm Viktor</h1>
			<p className="mt-4 text-lg text-muted-foreground">PLACEHOLDER</p>
			<div className="mt-6 flex gap-3">
				<a
					href="https://github.com/VKHR-0"
					target="_blank"
					rel="noopener noreferrer"
					className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
				>
					<HugeiconsIcon icon={Github} strokeWidth={2} />
					<span className="sr-only">GitHub</span>
				</a>
				<a
					href="mailto:viktor.harhatt@gmail.com"
					className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
				>
					<HugeiconsIcon icon={Mail} strokeWidth={2} />
					<span className="sr-only">Email</span>
				</a>
			</div>
		</section>
	);
}

function ProjectsSection({ projects }: { projects: Array<Project> }) {
	return (
		<section className="mx-auto max-w-4xl px-4 py-12">
			<h2 className="font-semibold text-2xl">Featured projects</h2>
			{projects.length === 0 ? (
				<p className="mt-6 text-muted-foreground">No projects yet.</p>
			) : (
				<div className="mt-6 grid gap-6 sm:grid-cols-2">
					{projects.map((project) => (
						<ProjectCard key={project._id} project={project} />
					))}
				</div>
			)}
		</section>
	);
}

function ProjectCard({ project }: { project: Project }) {
	return (
		<Link
			to="/projects/$slugId"
			params={{ slugId: project.slug }}
			className="group"
		>
			<Card className="overflow-hidden transition-shadow hover:shadow-lg">
				<div className="aspect-video overflow-hidden bg-muted">
					{project.imageUrl ? (
						<img
							src={project.imageUrl}
							alt={project.title}
							className="h-full w-full object-cover transition-transform group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							No image
						</div>
					)}
				</div>
				<div className="p-4">
					<h3 className="font-semibold text-lg">{project.title}</h3>
					{project.description && (
						<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
							{project.description}
						</p>
					)}
					{project.technologies.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{project.technologies.map((tech) => {
								const palette = COLORS[tech.color as ColorKey] ?? COLORS.blue;
								return (
									<Badge
										key={tech.name}
										variant="outline"
										className={`${palette.bg} ${palette.text} ${palette.border}`}
									>
										{tech.name}
									</Badge>
								);
							})}
						</div>
					)}
				</div>
			</Card>
		</Link>
	);
}

function PostsSection({ posts }: { posts: Array<Post> }) {
	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<section className="mx-auto max-w-4xl px-4 py-12">
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

function Footer() {
	return (
		<footer className="mt-16 border-t py-8">
			<div className="mx-auto flex max-w-4xl items-center justify-between px-4">
				<a
					href="https://github.com/VKHR-0"
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					Builded by VKHR
				</a>
				<ThemeSwitcher variant="ghost" />
			</div>
		</footer>
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
