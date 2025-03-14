import SectionAbout from "./_components/section-about";
import SectionHero from "./_components/section-hero";
import SectionProjects from "./_components/section-projects";
import SectionSideProject from "./_components/section-side-projects";

export default function Home() {
  return (
    <>
      <SectionHero />
      <SectionProjects />
      <SectionAbout />
      <SectionSideProject />
    </>
  );
}
