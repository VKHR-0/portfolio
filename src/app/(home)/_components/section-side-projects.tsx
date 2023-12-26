import ExpandingText from "@/components/expanding-text";

const SectionSideProject = () => {
  return (
    <section
      className="scroller-section relative min-h-screen p-16 text-zinc-100"
      id="side-project"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-20"
        textClassName="h-20"
        element="h2"
      >
        Side Projects
      </ExpandingText>

      <div className="container mx-auto"></div>
    </section>
  );
};

export default SectionSideProject;
