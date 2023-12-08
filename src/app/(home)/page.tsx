"use client";

import SectionAbout from "./_components/section-about";
import SectionExpertise from "./_components/section-expertise";
import SectionMain from "./_components/section-main";
import SectionProjects from "./_components/section-projects";
import SectionSideProject from "./_components/section-side-projects";

export default function Home() {
  return (
    <>
      <SectionMain />
      <SectionProjects />
      <SectionExpertise />
      <SectionSideProject />
      <SectionAbout />
    </>
  );
}
