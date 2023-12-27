import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import ExpandingText from "@/components/expanding-text";
import { client } from "@/../sanity/lib/client";
import {
  ExpertiseCard,
  ExpertiseCardSkeleton,
} from "@/components/expertise-card";
import IExpertise from "@/types/expertise";

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

  const [expertises, setExpertises] = useState<IExpertise[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getExpertises = async () => {
      try {
        setIsLoading(true);
        const expertises = await client.fetch(
          `*[_type == "expertise"]{_id, icon{asset->{url}}, title, number, description} | order(number)`,
        );

        setExpertises(expertises);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    getExpertises();
  }, []);

  return (
    <section
      className="scroller-section relative grid min-h-screen p-16"
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

      <div className="container mx-auto mt-8 grid h-fit w-full grid-cols-3 place-items-center justify-items-center gap-y-10 divide-x-2 divide-zinc-950 rounded-3xl border-2 border-zinc-950 bg-zinc-100 px-2 py-8">
        {isLoading ? (
          <>
            {Array(3)
              .fill(true)
              .map((_, index) => (
                <ExpertiseCardSkeleton key={index.toString()} />
              ))}
          </>
        ) : (
          <>
            {expertises?.map((expertise) => (
              <ExpertiseCard key={expertise._id} {...expertise} />
            ))}
          </>
        )}
      </div>

      <motion.div
        className="absolute -bottom-8 -top-32 left-1/2 -z-50 h-auto w-full -translate-x-1/2 bg-zinc-100"
        style={{ width }}
      />
    </section>
  );
};

export default SectionExpertise;
