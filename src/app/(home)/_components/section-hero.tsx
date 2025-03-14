"use client";

import MainPannelScene from "@/components/decorations/scenes/main-pannel-scene";
import useMediaQuery from "@/hooks/use-media-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface IVariant {
  initial: number | string;
  animate: number | string;
}

interface IVariants {
  big: IVariant[];
  medium: IVariant[];
  small: IVariant[];
  tiny: IVariant[];
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
};

const SectionHero = () => {
  const isBig = useMediaQuery("(min-width: 1280px)");
  const isMedium = useMediaQuery("(min-width: 768px)") && !isBig;
  const isTiny = useMediaQuery("(max-width: 640px)");
  const isSmall = useMediaQuery("(max-width: 767px)") && !isTiny;

  console.log(isTiny, isSmall, isMedium, isBig);

  const selectVariant = (): IVariant[] => {
    switch (true) {
      case isBig:
        return VARIANTS.big;
      case isMedium:
        return VARIANTS.medium;
      case isSmall:
        return VARIANTS.small;
      case isTiny:
        return VARIANTS.tiny;
      default:
        return VARIANTS.big;
    }
  };

  const [variant, setVariant] = useState<IVariant[]>(selectVariant());

  useEffect(() => {
    setVariant(selectVariant());
  }, [isTiny, isSmall, isMedium, isBig]);

  return (
    <section
      className="scroller-section relative h-dvh w-full overflow-x-hidden font-kanit font-bold"
      id="home"
    >
      <MainPannelScene />
    </section>
  );
};

export default SectionHero;
