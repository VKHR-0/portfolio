import ExpandingText from "@/components/expanding-text";
import { useEffect, useState } from "react";
import { client } from "@/../sanity/lib/client";
import ISideProject from "@/types/side-project";
import {
  SideProjectCard,
  SideProjectCardSkeleton,
} from "@/components/side-project-card";

const SectionSideProject = () => {
  const [sideProjects, setSideProjects] = useState<ISideProject[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSideProjects = async () => {
      try {
        setIsLoading(true);
        const sideProjects = await client.fetch(
          `*[_type == "sideProject"]{_id, title, shortDescription, thumbnail{asset->{url}}}`,
        );

        setSideProjects(sideProjects);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    getSideProjects();
  }, []);

  return (
    <section
      className="scroller-section relative min-h-screen p-16 text-zinc-100"
      id="side-project"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-20"
        textClassName="h-20 mb-8 max-md:text-center"
        element="h2"
      >
        Side Projects
      </ExpandingText>

      <div className="container mx-auto grid w-full grid-cols-3 place-items-center justify-items-center gap-x-12 gap-y-10 px-5 max-lg:grid-cols-2 max-md:grid-cols-1 max-md:w-3/4 max-sm:!w-full max-sm:px-12">
        {isLoading ? (
          <>
            {Array(3)
              .fill(true)
              .map((_, index) => (
                <SideProjectCardSkeleton key={index.toString()} />
              ))}
          </>
        ) : (
          <>
            {sideProjects?.map((sideProject) => (
              <SideProjectCard key={sideProject._id} {...sideProject} />
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default SectionSideProject;
