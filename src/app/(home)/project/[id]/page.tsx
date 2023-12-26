"use client";

import { useEffect, useState } from "react";
import IProject from "@/types/project";
import { client } from "@/../sanity/lib/client";
import { PortableText } from "@portabletext/react";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import urlBuilder from "@sanity/image-url";
import { getImageDimensions } from "@sanity/asset-utils";
import { notFound } from "next/navigation";

const PortableImageComponent = ({ value }: { value: string }) => {
  const { width, height } = getImageDimensions(value);
  return (
    <img
      src={urlBuilder(client).image(value).fit("max").auto("format").url()}
      alt={(value as string & { alt: string }).alt || ""}
      loading="lazy"
      style={{
        aspectRatio: width / height,
      }}
    />
  );
};

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
      }
    };

    getProject();
  }, [params.id]);

  if (!isLoading && !project) notFound();

  return (
    <article className="container mx-auto flex h-full flex-col p-16 text-zinc-100">
      {isLoading ? (
        <>
          <Skeleton
            containerClassName="relative -top-16"
            className="project-thumbnail -mb-8 aspect-[7/2] h-80"
          />
          <Skeleton height={56} />
          <Skeleton height={6} className="my-3" />
          <Skeleton />
          <Skeleton containerClassName="mt-8 h-full" className="h-full" />
        </>
      ) : (
        <>
          {project && (
            <>
              <Image
                className="project-thumbnail !relative !top-0 -mt-16 mb-8 aspect-[7/2] !h-80 rounded-b-lg object-cover object-top"
                src={project.thumbnail.asset.url}
                alt={project.title}
                fill
              />
              <h1 className="text-6xl font-extrabold">{project.title}</h1>
              <hr className="my-4 border-2 border-zinc-100" />
              <p>{project.shortDescription}</p>
              <div className="prose prose-invert mt-8 h-full max-w-full rounded-lg bg-slate-900 p-8 prose-img:mx-auto prose-img:rounded-lg">
                <PortableText
                  value={project.description}
                  components={{
                    types: {
                      image: PortableImageComponent,
                    },
                  }}
                />
              </div>
            </>
          )}
        </>
      )}
    </article>
  );
}
