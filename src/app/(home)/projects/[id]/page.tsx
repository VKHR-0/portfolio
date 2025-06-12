import { client } from "@/../sanity/lib/client";
import type IProject from "@/types/project";
import { unstable_cacheLife as cacheLife } from "next/cache";
import type { Metadata } from "next";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const getProject = async (id: string): Promise<IProject | null> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "project" && _id == $id][0]{
      _id,
      title,
      thumbnail{asset->{url}},
      height,
      order,
      description
    }`;

  const project: IProject | null = await client.fetch(query, { id });
  return project;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Project Not Found | Viktor Harhat | Portfolio",
      description: "The requested project could not be found.",
    };
  }

  return {
    title: `${project.title} | Viktor Harhat | Portfolio`,
    description: `Learn more about ${project.title} - one of my featured projects.`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="bg-black-primary min-h-screen">
      {/* Full Width Blurred Project Image */}
      <div className="relative h-96 w-full overflow-hidden">
        <Image
          src={project.thumbnail.asset.url}
          alt={project.title}
          fill
          className="object-cover blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container mx-auto pt-16 pb-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Project Title */}
          <div className="text-center">
            <h1 className="font-kanit text-6xl font-bold text-white">
              {project.title}
            </h1>
          </div>

          {/* Project Description */}
          <div className="prose prose-invert prose-lg max-w-none text-white/80">
            <PortableText value={project.description} />
          </div>
        </div>
      </div>
    </main>
  );
}
