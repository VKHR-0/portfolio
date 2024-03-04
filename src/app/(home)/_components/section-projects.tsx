import ExpandingText from "@/components/expanding-text";
import { useEffect, useState } from "react";
import { client } from "@/../sanity/lib/client";
import IProject from "@/types/project";
import { ProjectCard, ProjectCardSkeleton } from "@/components/project-card";

const SectionProjects = () => {
  const [projects, setProjects] = useState<IProject[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getProjects = async () => {
      try {
        setIsLoading(true);
        const projects = await client.fetch(
          `*[_type == "project"]{_id, title, shortDescription, thumbnail{asset->{url}}}`,
        );

        setProjects(projects);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    getProjects();
  }, []);

  return (
    <section
      className="scroller-section relative min-h-screen p-16 text-zinc-100"
      id="projects"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-20"
        textClassName="h-20 mb-8 max-md:text-center"
        element="h2"
      >
        Projects
      </ExpandingText>

      <div className="container mx-auto grid w-full grid-cols-3 place-items-center justify-items-center gap-x-12 gap-y-10 px-5 max-lg:grid-cols-2 max-md:grid-cols-1 max-md:w-3/4 max-sm:w-full max-sm:px-12">
        {isLoading ? (
          <>
            {Array(3)
              .fill(true)
              .map((_, index) => (
                <ProjectCardSkeleton key={index.toString()} />
              ))}
          </>
        ) : (
          <>
            {projects?.map((project) => (
              <ProjectCard key={project._id} {...project} />
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default SectionProjects;
