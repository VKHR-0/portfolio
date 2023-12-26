"use client";

import { Suspense, useEffect, useState } from "react";
import IProject from "@/types/project";
import { client } from "@/../sanity/lib/client";
import { PortableText } from "@portabletext/react";

export default function Page({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<IProject | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getProject = async () => {
      const project = await client.fetch(
        `*[_type == "project" && _id == "${params.id}"]{_id, title, description, shortDescription, thumbnail{asset->{url}}}`,
      );

      setProject(project[0]);
      setIsLoading(false);
    };

    try {
      setIsLoading(true);
      getProject();
    } catch (error) {
      console.log(error);
    }
  }, [params.id]);

  return (
    <section className="mx-auto container text-zinc-100 p-16">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {project ? (
            <>
              <h1>{project.title}</h1>
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
