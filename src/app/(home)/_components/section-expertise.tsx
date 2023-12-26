import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ExpandingText from "@/components/expanding-text";

const SectionExpertise = () => {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const width = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["50%", "100vw", "50%"],
  );

  return (
    <section
      className="scroller-section min-h-screen text-slate-950 p-16 relative"
      id="expertise"
      ref={ref}
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase before:-z-10 before:absolute before:bg-zinc-100 before:w-full before:h-full"
        overlapClassName="bg-slate-950 h-20"
        textClassName="h-20"
        element="h2"
      >
        Expertise
      </ExpandingText>

      <motion.div
        className="absolute -top-48 -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-100 h-auto w-full -z-50"
        style={{ width }}
      />
    </section>
  );
};

export default SectionExpertise;
