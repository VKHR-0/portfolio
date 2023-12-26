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
      className="scroller-section relative min-h-screen p-16 pb-64 text-zinc-100"
      id="projects"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-20"
        textClassName="h-20 mb-8"
        element="h2"
      >
        Projects
      </ExpandingText>

      <div className="container mx-auto grid w-full grid-cols-3 place-items-center justify-items-center gap-x-8 gap-y-10 px-5">
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
            {projects ? (
              projects.map((project) => (
                <ProjectCard key={project._id} {...project} />
              ))
            ) : (
              <p>Not found</p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default SectionProjects;
