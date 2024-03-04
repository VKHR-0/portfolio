"use client";

import MainPannelScene from "@/components/decorations/scenes/main-pannel-scene";
import useMediaQuery from "@/hooks/use-media-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface IVariant {
  initial: number | string,
  animate: number | string,

}

interface IVariants {
  big: IVariant[],
  medium: IVariant[],
  small: IVariant[],
  tiny: IVariant[]
}

const VARIANTS: IVariants = {
  big: [
    { initial: 2000, animate: "75%" },
    { initial: -2000, animate: 128 },
    { initial: 2000, animate: -96 },
    { initial: -2000, animate: 40 },
    { initial: -2000, animate: "75%" },
  ],
  medium: [
    { initial: 2000, animate: "66.666%" },
    { initial: -2000, animate: 64 },
    { initial: 2000, animate: -48 },
    { initial: -2000, animate: 0 },
    { initial: -2000, animate: "50%" },
  ],
  small: [
    { initial: 2000, animate: "66.666%" },
    { initial: -2000, animate: 64 },
    { initial: 2000, animate: -24 },
    { initial: -2000, animate: 0 },
    { initial: -2000, animate: "33.333%" },
  ],
  tiny: [
    { initial: 2000, animate: "66.666%" },
    { initial: -2000, animate: 64 },
    { initial: 2000, animate: -24 },
    { initial: -2000, animate: 0 },
    { initial: -2000, animate: "33.333%" },
  ],
}

const SectionMain = () => {
  const isBig = useMediaQuery("(min-width: 1280px)")
  const isMedium = useMediaQuery("(min-width: 768px)") && !isBig
  const isTiny = useMediaQuery("(max-width: 640px)")
  const isSmall = useMediaQuery("(max-width: 767px)") && !isTiny

  console.log(isTiny, isSmall, isMedium, isBig)

  const selectVariant = (): IVariant[] => {
    if (isBig) {
      return VARIANTS.big
    }
    if (isMedium) {
      return VARIANTS.medium
    }
    if (isSmall) {
      return VARIANTS.small
    }
    if (isTiny) {
      return VARIANTS.tiny
    }

    return VARIANTS.big
  }

  const [variant, setVariant] = useState<IVariant[]>(selectVariant())

  useEffect(() => {
    setVariant(selectVariant())
  }, [isTiny, isSmall, isMedium, isBig])

  return (
    <section
      className="scroller-section relative h-dvh w-full overflow-x-hidden font-kanit font-bold"
      id="home"
    >
      <div className="absolute left-1/2 top-1/2 z-10 w-max -translate-x-1/2 -translate-y-1/2 text-9xl uppercase text-zinc-100 mix-blend-difference max-xl:text-[10vw] max-md:text-[11vw]">
        <motion.p
          initial={{ translateX: variant[0].initial }}
          animate={{ translateX: variant[0].animate }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 20,
          }}
          className="translate-x-3/4 font-cormorant text-2xl font-bold italic max-md:translate-x-2/3 max-md:text-xl"
        >
          Viktor Harhat
        </motion.p>
        <motion.h1
          initial={{ translateX: variant[1].initial }}
          animate={{ translateX: variant[1].animate }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
          }}
          className="translate-x-32 drop-shadow-2xl max-md:translate-x-16"
        >
          Independent
        </motion.h1>
        <motion.h1
          initial={{ translateX: variant[2].initial }}
          animate={{ translateX: variant[2].animate }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          className="-translate-x-24 drop-shadow-2xl max-md:-translate-x-12 max-sm:-translate-x-6"
        >
          Full-Stack
        </motion.h1>
        <motion.h1
          initial={{ translateX: variant[3].initial }}
          animate={{ translateX: variant[3].animate }}
          transition={{
            type: "spring",
            stiffness: 225,
            damping: 30,
          }}
          className="translate-x-10 drop-shadow-2xl max-md:translate-x-0"
        >
          Web Developer
        </motion.h1>
        <motion.p
          initial={{ translateX: variant[4].initial }}
          animate={{ translateX: variant[4].animate }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 20,
          }}
          className="translate-x-3/4 text-2xl max-md:translate-x-1/2 max-sm:translate-x-1/3"
        >
          WELCOME TO <span className="font-cormorant lowercase italic">my</span>{" "}
          2024{" "}
          <span className="font-cormorant lowercase italic">portfolio</span>
        </motion.p>
      </div>
      <MainPannelScene />
    </section>
  );
};

export default SectionMain;
