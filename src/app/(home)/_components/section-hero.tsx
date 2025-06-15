"use client";

import CircleButton from "@/components/circle-button";
import MainPanelScene from "@/components/decorations/scenes/main-panel-scene";
import { CircleDot } from "lucide-react";
import Link from "next/link";

const SectionHero = () => {
  return (
    <section
      className="from-black-secondary to-black-primary relative bg-linear-to-b from-25% pt-24 pb-12"
      id="home"
    >
      <div className="container mx-auto px-4">
        <div className="relative z-10 mt-24 flex flex-col gap-6 max-md:items-center">
          <div className="font-kanit shadow-card inset-shadow-card-inner flex w-fit items-center gap-2 rounded-3xl border border-white/25 bg-black px-4 py-3 text-sm text-white">
            <CircleDot size={16} className="inline" /> Software Engineer &amp;
            Full-Stack Developer
          </div>
          <div className="space-y-3">
            <h1 className="font-kanit space-x-4 text-7xl leading-24 font-medium text-white max-[475px]:text-[10vw]! max-sm:text-center max-sm:text-6xl">
              <span>
                Viktor <span className="text-white/60">Harhat</span>
              </span>
              <Link className="inline-block" href="/#about">
                <CircleButton />
              </Link>
            </h1>
            <p className="font-convergence max-w-sm text-base text-white/60 max-sm:mx-auto max-sm:text-center">
              Second-year student at NHL Stenden University of Applied Sciences
              with 2 years of Freelance experience. Looking for internship
              opportunities.
            </p>
          </div>
          <div className="flex gap-4 py-1.5 max-[475px]:w-full max-[475px]:flex-col">
            <button className="black-button max-[475px]:w-full" type="button">
              See All Projects
            </button>
            <Link
              href="https://drive.google.com/file/d/1F5MOLqZH-C3Ioehlr4ZS0_7M5zhd2Tm1/view?usp=sharing"
              target="_blank"
              className="white-button max-[475px]:w-full"
            >
              Resume (CV)
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0">
          <MainPanelScene />
        </div>
      </div>
    </section>
  );
};

export default SectionHero;
