import ExpandingText from "@/components/expanding-text";
import { motion, useScroll, useTransform } from "framer-motion";

const SectionSideProject = () => {
  const { scrollYProgress } = useScroll();

  const width = useTransform(scrollYProgress, [0.5, 0.75], ["100vw", "50%"]);

  return (
    <section
      className="scroller-section min-h-screen text-zinc-100 p-16 relative"
      id="side-project"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-16"
        textClassName="h-16"
        element="h2"
      >
        Side Projects
      </ExpandingText>

      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-100 h-8"
        style={{ width }}
      />
    </section>
  );
};

export default SectionSideProject;
