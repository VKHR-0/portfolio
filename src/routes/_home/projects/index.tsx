import { ArrowLeft, ExternalLink, Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPublicProjects } from "#/queries/public";
import { Footer } from "../-footer";
import { Header } from "../-header";
import { CornerSquare, Layout } from "../-layout";

export const Route = createFileRoute("/_home/projects/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listPublicProjects());
	},
	component: ProjectsPage,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});

function ProjectsPage() {
	const { data: projects } = useSuspenseQuery(listPublicProjects());

	const groupedProjects = projects.reduce(
		(acc, project) => {
			const year = new Date(project._creationTime).getFullYear();
			if (!acc[year]) acc[year] = [];
			acc[year].push(project);
			return acc;
		},
		{} as Record<number, typeof projects>,
	);

	const years = Object.keys(groupedProjects)
		.map(Number)
		.sort((a, b) => b - a);

	return (
		<Layout>
			<Header />
			<div className="flex h-full flex-1 flex-col px-4">
				<main className="container relative mx-auto min-h-full max-w-4xl flex-1 border-x-2 bg-background">
					<CornerSquare position="top-left" />
					<CornerSquare position="top-right" />
					<CornerSquare position="bottom-left" />
					<CornerSquare position="bottom-right" />

					<div className="relative mb-2 flex items-center gap-4 border-b-2 p-2 sm:p-4">
						<Link
							to="/"
							className="inline-flex items-center justify-center border-2 bg-background p-1.5 transition-colors hover:bg-muted"
							aria-label="Back to home"
						>
							<HugeiconsIcon
								icon={ArrowLeft}
								strokeWidth={2}
								className="size-5"
							/>
						</Link>
						<h1 className="font-bold text-2xl">Projects</h1>
						<CornerSquare position="bottom-left" />
						<CornerSquare position="bottom-right" />
					</div>

					{!projects || projects.length === 0 ? (
						<p className="text-muted-foreground">No projects yet.</p>
					) : (
						<div className="space-y-12 p-2 sm:p-4">
							{years.map((year) => (
								<section key={year}>
									<h2 className="mb-6 font-bold text-xl">{year}</h2>
									<div className="flex flex-col gap-4">
										{groupedProjects[year].map((project) => (
											<Link
												key={project._id}
												to="/projects/$slugId"
												params={{ slugId: project.slug }}
												className="group relative flex flex-col justify-between gap-4 border-2 bg-background p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center"
											>
												<CornerSquare position="top-left" mode="offset" />
												<CornerSquare position="top-right" mode="offset" />
												<CornerSquare position="bottom-left" mode="offset" />
												<CornerSquare position="bottom-right" mode="offset" />

												<div className="flex-1">
													<h3 className="font-semibold text-lg">
														{project.title}
													</h3>
													{project.description && (
														<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
															{project.description}
														</p>
													)}
												</div>

												<div className="flex shrink-0 items-center gap-4">
													{(project.repositoryUrl || project.demoUrl) && (
														<div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
															{project.repositoryUrl && (
																<a
																	href={project.repositoryUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex border-2 bg-background p-2 transition-colors hover:bg-muted"
																	onClick={(e) => {
																		e.stopPropagation();
																	}}
																	aria-label="View repository"
																>
																	<HugeiconsIcon
																		icon={Github}
																		strokeWidth={2}
																		className="size-4"
																	/>
																</a>
															)}
															{project.demoUrl && (
																<a
																	href={project.demoUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex border-2 bg-background p-2 transition-colors hover:bg-muted"
																	onClick={(e) => {
																		e.stopPropagation();
																	}}
																	aria-label="View demo"
																>
																	<HugeiconsIcon
																		icon={ExternalLink}
																		strokeWidth={2}
																		className="size-4"
																	/>
																</a>
															)}
														</div>
													)}
													<time
														dateTime={new Date(
															project._creationTime,
														).toISOString()}
														className="text-muted-foreground text-sm"
													>
														{dateFormatter.format(
															new Date(project._creationTime),
														)}
													</time>
												</div>
											</Link>
										))}
									</div>
								</section>
							))}
						</div>
					)}
				</main>
			</div>
			<Footer />
		</Layout>
	);
}
