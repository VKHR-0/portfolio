import { ArrowLeft, ExternalLink, Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { COLORS, type ColorKey } from "shared/colors";
import { MarkdownContent } from "#/components/markdown-content";
import { Badge } from "#/components/ui/badge";
import { getRendered } from "#/functions/renderer";
import { getProjectBySlug } from "#/queries/public";
import { CornerSquare, Layout } from "../-layout";

export const Route = createFileRoute("/_home/projects/$slugId")({
	loader: async ({ context, params }) => {
		const project = await context.queryClient.ensureQueryData(
			getProjectBySlug(params.slugId),
		);
		const contentHtml = project?.content
			? await getRendered({ data: project.content })
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
	const { data: project } = useSuspenseQuery(getProjectBySlug(slugId));

	if (!project) {
		return (
			<Layout>
				<div className="flex flex-col items-center gap-4 py-20">
					<h1 className="font-bold text-2xl">Project not found</h1>
					<p className="text-muted-foreground">
						This project doesn't exist or isn't available.
					</p>
					<Link
						to="/projects"
						className="text-primary text-sm underline underline-offset-4"
					>
						Back to projects
					</Link>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<article className="relative mx-auto my-8 w-full max-w-4xl border-2 bg-background">
				<CornerSquare position="top-left" mode="offset" />
				<CornerSquare position="top-right" mode="offset" />
				<CornerSquare position="bottom-left" mode="offset" />
				<CornerSquare position="bottom-right" mode="offset" />

				{project.imageUrl && (
					<div className="relative border-b-2">
						<img
							src={project.imageUrl}
							alt=""
							className="h-[35vh] w-full object-cover"
						/>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
						<Link
							to="/projects"
							className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm backdrop-blur-md transition-colors hover:bg-background/80"
						>
							<HugeiconsIcon
								icon={ArrowLeft}
								strokeWidth={2}
								className="size-4"
							/>
							Back
						</Link>

						{(project.repositoryUrl || project.demoUrl) && (
							<div className="absolute top-4 right-4 flex items-center gap-3">
								{project.repositoryUrl && (
									<a
										href={project.repositoryUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm backdrop-blur-md transition-colors hover:bg-background/80"
									>
										<HugeiconsIcon
											icon={Github}
											strokeWidth={2}
											className="size-4"
										/>
										Repository
									</a>
								)}
								{project.demoUrl && (
									<a
										href={project.demoUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm backdrop-blur-md transition-colors hover:bg-background/80"
									>
										<HugeiconsIcon
											icon={ExternalLink}
											strokeWidth={2}
											className="size-4"
										/>
										Live Demo
									</a>
								)}
							</div>
						)}
					</div>
				)}

				<div className="mx-auto w-full max-w-3xl px-4 pb-10">
					{!project.imageUrl && (
						<div className="mt-10 mb-8 flex items-center justify-between">
							<Link
								to="/projects"
								className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								<HugeiconsIcon
									icon={ArrowLeft}
									strokeWidth={2}
									className="size-4"
								/>
								Back to projects
							</Link>

							{(project.repositoryUrl || project.demoUrl) && (
								<div className="flex items-center gap-3 text-sm">
									{project.repositoryUrl && (
										<a
											href={project.repositoryUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
										>
											<HugeiconsIcon
												icon={Github}
												strokeWidth={2}
												className="size-4"
											/>
											Repository
										</a>
									)}
									{project.demoUrl && (
										<a
											href={project.demoUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
										>
											<HugeiconsIcon
												icon={ExternalLink}
												strokeWidth={2}
												className="size-4"
											/>
											Live Demo
										</a>
									)}
								</div>
							)}
						</div>
					)}

					<div
						className={`${project.imageUrl ? "mt-4" : ""} mb-4 flex flex-wrap items-end gap-3`}
					>
						<h1 className="font-bold text-4xl leading-tight tracking-tight">
							{project.title}
						</h1>
						<div className="mb-1 flex items-center gap-3 text-muted-foreground text-sm">
							<Badge
								variant={project.status === "active" ? "default" : "secondary"}
								className="h-6 rounded-none border-2 border-border bg-transparent py-2 font-bold text-sm uppercase tracking-wider"
							>
								{project.status}
							</Badge>
							<span aria-hidden="true">|</span>
							<time dateTime={new Date(project._creationTime).toISOString()}>
								{dateFormatter.format(new Date(project._creationTime))}
							</time>
						</div>
					</div>

					{project.technologies.length > 0 && (
						<div className="mb-4 flex flex-wrap gap-1.5">
							{project.technologies.map((tech) => {
								const palette = COLORS[tech.color as ColorKey] ?? COLORS.blue;

								return (
									<Badge
										key={tech.name}
										variant="outline"
										className={`${palette.text} ${palette.border} rounded-none border bg-transparent`}
									>
										{tech.name}
									</Badge>
								);
							})}
						</div>
					)}

					{project.description && (
						<p className="mb-8 text-lg text-muted-foreground leading-relaxed">
							{project.description}
						</p>
					)}

					<MarkdownContent
						html={contentHtml}
						className="prose prose-amber dark:prose-invert max-w-none"
					/>
				</div>
			</article>
		</Layout>
	);
}
