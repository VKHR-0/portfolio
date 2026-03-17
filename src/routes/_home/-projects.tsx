import { Github, Link as LinkIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import * as React from "react";
import { COLORS, type ColorKey } from "shared/colors";
import { Badge } from "#/components/ui/badge";
import { Card } from "#/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";

import { CornerSquare } from "./-layout";

type Project = FunctionReturnType<
	typeof api.functions.projects.listPublicRecent
>[number];

export function Projects({
	recentProjects,
	featuredProjects,
}: {
	recentProjects: Array<Project>;
	featuredProjects: Array<Project>;
}) {
	const [tab, setTab] = React.useState<"recent" | "featured">("recent");

	const projects = tab === "recent" ? recentProjects : featuredProjects;

	return (
		<section className="relative border-t-2 px-4 py-12">
			<CornerSquare position="top-left" />
			<CornerSquare position="top-right" />

			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-2xl">
					{tab === "recent" ? "Recent Projects" : "Featured Projects"}
				</h2>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value as "recent" | "featured")}
				>
					<TabsList variant="line">
						<TabsTrigger value="recent">Recent</TabsTrigger>
						<TabsTrigger value="featured">Featured</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{!projects || projects.length === 0 ? (
				<p className="mt-6 text-muted-foreground">
					{tab === "recent" ? "No projects yet." : "No featured projects."}
				</p>
			) : (
				<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<ProjectCard key={project._id} project={project} />
					))}
				</div>
			)}
		</section>
	);
}

function ProjectCard({ project }: { project: Project }) {
	const hasLinks = project.repositoryUrl || project.demoUrl;

	return (
		<Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
			<Link
				to="/projects/$slugId"
				params={{ slugId: project.slug }}
				className="block p-4"
			>
				<h3 className="font-semibold text-lg">{project.title}</h3>
				{project.description && (
					<p className="mt-2 line-clamp-3 text-muted-foreground text-sm">
						{project.description}
					</p>
				)}
			</Link>

			{hasLinks && (
				<div className="absolute top-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
					{project.repositoryUrl && (
						<a
							href={project.repositoryUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
							onClick={(e) => e.stopPropagation()}
							aria-label="View repository"
						>
							<HugeiconsIcon icon={Github} strokeWidth={2} className="size-4" />
						</a>
					)}
					{project.demoUrl && (
						<a
							href={project.demoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
							onClick={(e) => e.stopPropagation()}
							aria-label="View demo"
						>
							<HugeiconsIcon
								icon={LinkIcon}
								strokeWidth={2}
								className="size-4"
							/>
						</a>
					)}
				</div>
			)}

			{project.technologies.length > 0 && (
				<div className="flex flex-wrap gap-1.5 px-4 pb-4">
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
		</Card>
	);
}
