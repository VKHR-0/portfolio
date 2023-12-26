import ExpandingText from "@/components/expanding-text";
import { memo, useEffect, useState } from "react";
import { client } from "@/../sanity/lib/client";
import IProject from "@/types/project";
import ProjectCard from "@/components/project-card";
import Skeleton from "react-loading-skeleton";

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
        // setTimeout(() => setIsLoading(false), 50000);
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
                <div
                  key={index.toString()}
                  className="running-border w-full max-w-md rounded-3xl px-6 py-5"
                >
                  <Skeleton className="aspect-square rounded-lg" />
                  <div>
                    <Skeleton height={32} containerClassName="block my-4" />
                    <Skeleton />
                  </div>
                </div>
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
