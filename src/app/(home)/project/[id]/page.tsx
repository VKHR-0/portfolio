"use client";

import { Suspense, useEffect, useState } from "react";
import IProject from "@/types/project";
import { client } from "@/../sanity/lib/client";
import { PortableText } from "@portabletext/react";
import Skeleton from "react-loading-skeleton";

export default function Page({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<IProject | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getProject = async () => {
      try {
        setIsLoading(true);
        const project = await client.fetch(
          `*[_type == "project" && _id == "${params.id}"]{_id, title, description, shortDescription, thumbnail{asset->{url}}}`,
        );

        setProject(project[0]);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        // setTimeout(() => setIsLoading(false), 50000);
      }
    };

    getProject();
  }, [params.id]);

  return (
    <section className="mx-auto container text-zinc-100 p-16">
      {isLoading ? (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton count={25} />
        </>
      ) : (
        <>
          {project ? (
            <>
              <h1>{project.title}</h1>
              <p>{project.shortDescription}</p>
              <div>
                <PortableText value={project.description} />
              </div>
            </>
          ) : (
            <h1>Project not found</h1>
          )}
        </>
      )}
    </section>
  );
}
