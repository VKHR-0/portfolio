import { client } from "@/../sanity/lib/client";

import IProject from "@/types/project";

import SectionAbout from "./_components/section-about";
import SectionHero from "./_components/section-hero";
import SectionProjects from "./_components/section-projects";
import SectionSideProject from "./_components/section-side-projects";
import { unstable_cacheLife as cacheLife } from "next/cache";

const getProjects = async (): Promise<IProject[]> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "project"]{
      _id,
      title,
      shortDescription,
      thumbnail{asset->{url}},
      height
    }`;
  const projects: IProject[] = await client.fetch(query);

  return projects;
};

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <SectionHero />
      <SectionProjects projects={projects} />
      <SectionAbout />
      <SectionSideProject />
    </>
  );
}
