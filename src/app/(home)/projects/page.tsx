import { client } from "@/../sanity/lib/client";
import MasonryGrid from "@/components/masonry-grid";
import { ProjectCard } from "@/components/project-card";
import type IProject from "@/types/project";
import { unstable_cacheLife as cacheLife } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | Viktor Harhat | Portfolio",
  description:
    "Explore all my projects - full-stack web development, software engineering, and creative solutions.",
};

const getProjects = async (): Promise<IProject[]> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "project"]{
      _id,
      title,
      thumbnail{asset->{url}},
      height,
      order
    }`;
  const projects: IProject[] = await client.fetch(query);

  return projects;
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  // Sort projects by order
  const sortedProjects = projects.slice().sort((a, b) => a.order - b.order);

  return (
    <main className="bg-black-primary min-h-screen">
      <div className="container mx-auto pt-32 pb-16">
        <div className="space-y-12">
          <div className="space-y-6 text-center">
            <h1 className="font-kanit text-6xl font-bold text-white">
              All Projects
            </h1>
          </div>

          <MasonryGrid columns={2} gap={[4, 6]} className="pb-8">
            {sortedProjects.map((project) => (
              <ProjectCard key={project._id} {...project} />
            ))}
          </MasonryGrid>
        </div>
      </div>
    </main>
  );
}
