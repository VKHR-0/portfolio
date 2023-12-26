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
      className="scroller-section relative min-h-screen p-16"
      id="expertise"
      ref={ref}
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase before:-z-10 before:absolute before:bg-zinc-100 before:w-full before:h-full"
        overlapClassName="bg-zinc-950 h-20"
        textClassName="h-20"
        element="h2"
      >
        Expertise
      </ExpandingText>

      <div className="container mx-auto"></div>

      <motion.div
        className="absolute -bottom-8 -top-32 left-1/2 -z-50 h-auto w-full -translate-x-1/2 bg-zinc-100"
        style={{ width }}
      />
    </section>
  );
};

export default SectionExpertise;
