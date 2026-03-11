import {
	IconArrowLeft,
	IconBrandGithub,
	IconExternalLink,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	TECHNOLOGY_COLORS,
	type TechnologyColorKey,
} from "shared/technology-colors";
import { MarkdownContent } from "#/components/markdown-content";
import { Badge } from "#/components/ui/badge";
import { getPublicProjectBySlugQuery } from "#/queries";
import { renderContent } from "#/server/render-content";

export const Route = createFileRoute("/_home/projects/$slugId")({
	loader: async ({ context, params }) => {
		const project = await context.queryClient.ensureQueryData(
			getPublicProjectBySlugQuery(params.slugId),
		);
		const contentHtml = project?.content
			? await renderContent({ data: project.content })
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
	const { data: project } = useSuspenseQuery(
		getPublicProjectBySlugQuery(slugId),
	);

	if (!project) {
		return (
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
		);
	}

	return (
		<article>
			{/* Full-bleed hero with back button overlay */}
			{project.imageId && (
				<div className="relative">
					<img
						src={project.imageId}
						alt=""
						className="h-[35vh] w-full object-cover"
					/>
					{/* Gradient fade to background */}
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
					<Link
						to="/projects"
						className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm backdrop-blur-md transition-colors hover:bg-background/80"
					>
						<IconArrowLeft className="size-4" />
						Back
					</Link>
				</div>
			)}

			<div className="mx-auto w-full max-w-3xl px-4 pb-10">
				{!project.imageId && (
					<Link
						to="/projects"
						className="mt-10 mb-8 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<IconArrowLeft className="size-4" />
						Back to projects
					</Link>
				)}

				<div
					className={`${project.imageId ? "mt-4" : ""} mb-4 flex flex-wrap items-end gap-3`}
				>
					<h1 className="font-bold text-4xl leading-tight tracking-tight">
						{project.title}
					</h1>
					<div className="mb-1 flex items-center gap-2 text-muted-foreground text-sm">
						<Badge
							variant={project.status === "active" ? "default" : "secondary"}
						>
							{project.status === "active" ? "Active" : "Completed"}
						</Badge>
						<span aria-hidden="true">&middot;</span>
						<time dateTime={new Date(project._creationTime).toISOString()}>
							{dateFormatter.format(new Date(project._creationTime))}
						</time>
					</div>

					{(project.repositoryUrl || project.demoUrl) && (
						<div className="mb-1 ml-auto flex items-center gap-3 text-sm">
							{project.repositoryUrl && (
								<a
									href={project.repositoryUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
								>
									<IconBrandGithub className="size-4" />
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
									<IconExternalLink className="size-4" />
									Live Demo
								</a>
							)}
						</div>
					)}
				</div>

				{project.technologies.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-1.5">
						{project.technologies.map((tech) => {
							const palette =
								TECHNOLOGY_COLORS[tech.color as TechnologyColorKey] ??
								TECHNOLOGY_COLORS.blue;

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
	);
}
