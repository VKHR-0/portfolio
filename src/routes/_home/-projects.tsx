import {
	ArrowRight,
	Github,
	Link as LinkIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Link } from "@tanstack/react-router";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import * as React from "react";
import { Card } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";
import { CornerSquare } from "./-layout";

type Project = FunctionReturnType<
	typeof api.functions.projects.listPublicRecent
>[number];

type ProjectsProps = {
	recentProjects: Array<Project>;
	featuredProjects: Array<Project>;
};

export function Projects({ recentProjects, featuredProjects }: ProjectsProps) {
	const [tab, setTab] = React.useState<"recent" | "featured">("recent");

	const projects = tab === "recent" ? recentProjects : featuredProjects;

	return (
		<section className="relative border-t-2 py-8">
			<CornerSquare position="top-left" />
			<CornerSquare position="top-right" />

			<div className="flex items-center justify-between px-4">
				<Link
					to="/projects"
					className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
				>
					<h2 className="font-semibold text-2xl text-foreground">
						{tab === "recent" ? "Recent Projects" : "Featured Projects"}
					</h2>
					<HugeiconsIcon icon={ArrowRight} strokeWidth={2} className="size-5" />
					<span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-20">
						see more
					</span>
				</Link>

				<div className="border-2 bg-background px-1">
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
			</div>

			{!projects || projects.length === 0 ? (
				<p className="mt-4 text-muted-foreground">
					{tab === "recent" ? "No projects yet." : "No featured projects."}
				</p>
			) : (
				<div className="relative mt-6 grid sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<ProjectCard key={project._id} project={project} />
					))}
				</div>
			)}
		</section>
	);
}

type ProjectCardProps = {
	project: Project;
};

function ProjectCard({ project }: ProjectCardProps) {
	const hasLinks = project.repositoryUrl || project.demoUrl;

	return (
		<Card
			className={cn(
				"group relative overflow-visible rounded-none border-t-2 bg-transparent py-0 ring-0",
				"last:border-b-2 even:border-l-0",
				"sm:nth-last-[-n+2]:border-b-2 sm:even:border-l-2",
				"lg:nth-last-[-n+3]:border-b-2 lg:nth-[3n+2]:border-l-2 lg:nth-[3n]:border-l-2 lg:even:border-l-0",
			)}
		>
			<CornerSquare
				position="top-right"
				mode="offset"
				className="-mt-px -mr-px transition-all duration-300 group-hover:z-50 group-hover:ring-1 group-hover:ring-white/60"
			/>
			<CornerSquare
				position="top-left"
				mode="offset"
				className="-mt-px -ml-px transition-all duration-300 group-hover:z-50 group-hover:ring-1 group-hover:ring-white/60"
			/>
			<CornerSquare
				position="bottom-left"
				mode="offset"
				className="-mb-px -ml-px transition-all duration-300 group-hover:z-50 group-hover:ring-1 group-hover:ring-white/60"
			/>
			<CornerSquare
				position="bottom-right"
				mode="offset"
				className="-mr-px -mb-px transition-all duration-300 group-hover:z-50 group-hover:ring-1 group-hover:ring-white/60"
			/>

			<div className="relative overflow-hidden py-4">
				<span className="pointer-events-none absolute -top-1/2 -left-full z-10 h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-0 group-hover:translate-x-[350%] group-hover:duration-1000" />

				<Link
					to="/projects/$slugId"
					params={{ slugId: project.slug }}
					className="block p-4"
				>
					<h3 className="font-semibold text-lg">{project.title}</h3>
					{project.description && (
						<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
							{project.description}
						</p>
					)}
				</Link>

				{hasLinks && (
					<div className="absolute top-4 right-4 flex border-2 bg-background opacity-0 transition-opacity group-hover:opacity-100">
						{project.repositoryUrl && (
							<a
								href={project.repositoryUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center p-2 transition-colors hover:bg-muted"
								onClick={(e) => e.stopPropagation()}
								aria-label="View repository"
							>
								<HugeiconsIcon
									icon={Github}
									strokeWidth={2}
									className="size-4"
								/>
							</a>
						)}
						{project.repositoryUrl && project.demoUrl && (
							<Separator className="w-0.5!" orientation="vertical" />
						)}
						{project.demoUrl && (
							<a
								href={project.demoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center p-2 transition-colors hover:bg-muted"
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
			</div>
		</Card>
	);
}
