import ExpandingText from "@/components/expanding-text";

const SectionSideProject = () => {
  return (
    <section
      className="scroller-section min-h-screen text-zinc-100 p-16 relative"
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
    </section>
  );
};

export default SectionSideProject;
