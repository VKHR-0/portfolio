import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { COLORS, type ColorKey } from "shared/colors";
import { Badge } from "#/components/ui/badge";
import { Card } from "#/components/ui/card";

type Project = FunctionReturnType<
	typeof api.functions.projects.listPublicRecent
>[number];

export function Projects({ projects }: { projects: Array<Project> }) {
	return (
		<section className="px-4 py-12">
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
