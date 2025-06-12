import { client } from "@/../sanity/lib/client";
import type ISideProject from "@/types/side-project";
import { unstable_cacheLife as cacheLife } from "next/cache";
import type { Metadata } from "next";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";

interface SideProjectPageProps {
  params: Promise<{ id: string }>;
}

const getSideProject = async (id: string): Promise<ISideProject | null> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "sideProject" && _id == $id][0]{
      _id,
      title,
      thumbnail{asset->{url}},
      height,
      order,
      description
    }`;

  const sideProject: ISideProject | null = await client.fetch(query, { id });
  return sideProject;
};

export async function generateMetadata({
  params,
}: SideProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const sideProject = await getSideProject(id);

  if (!sideProject) {
    return {
      title: "Side Project Not Found | Viktor Harhat | Portfolio",
      description: "The requested side project could not be found.",
    };
  }

  return {
    title: `${sideProject.title} | Viktor Harhat | Portfolio`,
    description: `Learn more about ${sideProject.title} - one of my featured side projects.`,
  };
}

export default async function SideProjectPage({
  params,
}: SideProjectPageProps) {
  const { id } = await params;
  const sideProject = await getSideProject(id);

  if (!sideProject) {
    notFound();
  }

  return (
    <main className="bg-black-primary min-h-screen">
      {/* Full Width Blurred Side Project Image */}
      <div className="relative h-96 w-full overflow-hidden">
        <Image
          src={sideProject.thumbnail.asset.url}
          alt={sideProject.title}
          fill
          className="object-cover blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container mx-auto pt-16 pb-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Side Project Title */}
          <div className="text-center">
            <h1 className="font-kanit text-6xl font-bold text-white">
              {sideProject.title}
            </h1>
          </div>

          {/* Side Project Description */}
          <div className="prose prose-invert prose-lg max-w-none text-white/80">
            <PortableText value={sideProject.description} />
          </div>
        </div>
      </div>
    </main>
  );
}
