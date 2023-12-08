import ExpandingText from "@/components/expanding-text";
import { motion, useScroll, useTransform } from "framer-motion";

const SectionProjects = () => {
  const { scrollYProgress } = useScroll();

  const width = useTransform(scrollYProgress, [0.25, 0.5], ["50%", "100vw"]);

  return (
    <section className="scroller-section min-h-screen text-zinc-100 p-16 relative">
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-16"
        textClassName="h-16"
        element="h2"
      >
        Projects
      </ExpandingText>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-zinc-100 h-32"
        style={{ width }}
      />
    </section>
  );
};

export default SectionProjects;
