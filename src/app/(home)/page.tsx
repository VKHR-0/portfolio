import { client } from "@/../sanity/lib/client";

import type IProject from "@/types/project";
import type ISkill from "@/types/skill";
import type ISideProject from "@/types/side-project";

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
      thumbnail{asset->{url}},
      height,
      order
    }`;
  const projects: IProject[] = await client.fetch(query);

  return projects;
};

const getSkills = async (): Promise<ISkill[]> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "skill"]{
      _id,
      title,
      description,
      order,
      badges
    }`;

  const skills: ISkill[] = await client.fetch(query);

  return skills;
};

const getSideProjects = async (): Promise<ISideProject[]> => {
  "use cache";

  cacheLife("days");

  const query = `
    *[_type == "sideProject"]{
      _id,
      title,
      description,
      height,
      thumbnail{asset->{url}},
      order
    }`;

  const sideProjects: ISideProject[] = await client.fetch(query);

  return sideProjects;
};

export default async function Home() {
  const projects = await getProjects();
  const skills = await getSkills();
  const sideProjects = await getSideProjects();

  // Sort projects and side projects by order
  const sortedProjects = projects
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
  const sortedSideProjects = sideProjects
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);

  return (
    <>
      <SectionHero />
      <SectionProjects projects={sortedProjects} />
      <SectionAbout skills={skills} />
      <SectionSideProject sideProjects={sortedSideProjects} />
    </>
  );
}
