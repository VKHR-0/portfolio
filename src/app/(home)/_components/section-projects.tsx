import ExpandingText from "@/components/expanding-text";
import { memo, useEffect, useState } from "react";
import { client } from "@/../sanity/lib/client";
import IProject from "@/types/project";
import ProjectCard from "@/components/project-card";

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
      className="scroller-section min-h-screen text-zinc-100 p-16 pb-64 relative"
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

      <div className="mx-auto container grid place-items-center justify-items-center grid-cols-3 gap-x-8 gap-y-10 px-5 w-fit">
        {isLoading ? (
          <div>loading...</div>
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
