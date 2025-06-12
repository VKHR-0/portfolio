import { client } from "@/../sanity/lib/client";
import MasonryGrid from "@/components/masonry-grid";
import { SideProjectCard } from "@/components/side-project-card";
import type ISideProject from "@/types/side-project";
import { unstable_cacheLife as cacheLife } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Side Projects | Viktor Harhat | Portfolio",
  description:
    "Explore all my side projects - creative experiments, open source contributions, and personal development projects.",
};

const getSideProjects = async (): Promise<ISideProject[]> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "sideProject"]{
      _id,
      title,
      description,
      height,
      thumbnail{asset->{url}},
      order
    }`;

  const sideProjects: ISideProject[] = await client.fetch(query);

  return sideProjects;
};

export default async function SideProjectsPage() {
  const sideProjects = await getSideProjects();

  // Sort side projects by order
  const sortedSideProjects = sideProjects
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <main className="bg-black-primary min-h-screen">
      <div className="container mx-auto pt-32 pb-16">
        <div className="space-y-12">
          <div className="space-y-6 text-center">
            <h1 className="font-kanit text-6xl font-bold text-white">
              All Side Projects
            </h1>
          </div>

          <MasonryGrid columns={2} gap={[4, 6]} className="pb-8">
            {sortedSideProjects.map((sideProject) => (
              <SideProjectCard key={sideProject._id} {...sideProject} />
            ))}
          </MasonryGrid>
        </div>
      </div>
    </main>
  );
}
