import ExpandingText from "@/components/expanding-text";

const SectionAbout = () => {
  return (
    <section
      className="scroller-section min-h-screen relative text-zinc-100 p-16"
      id="about"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-16"
        textClassName="h-16"
        element="h2"
      >
        About
      </ExpandingText>
    </section>
  );
};

export default SectionAbout;
