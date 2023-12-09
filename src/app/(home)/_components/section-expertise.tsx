import ExpandingText from "@/components/expanding-text";
import { motion, useScroll, useTransform } from "framer-motion";

const SectionExpertise = () => {
  const { scrollYProgress } = useScroll();

  const width = useTransform(
    scrollYProgress,
    [0.25, 0.5, 0.75],
    ["50%", "100vw", "50%"],
  );

  return (
    <section
      className="scroller-section min-h-screen text-slate-950 p-16 relative"
      id="expertise"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-slate-950 h-16"
        textClassName="h-16"
        element="h2"
      >
        Expertise
      </ExpandingText>

      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-100 h-full w-full -z-10"
        style={{ width }}
      />
    </section>
  );
};

export default SectionExpertise;
