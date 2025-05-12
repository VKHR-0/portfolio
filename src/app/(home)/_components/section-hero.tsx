"use client";

import MainPanelScene from "@/components/decorations/scenes/main-panel-scene";
import { ArrowUpRight, CircleDot } from "lucide-react";
import Link from "next/link";

const SectionHero = () => {
  return (
    <section
      className="from-black-secondary to-black-primary relative bg-linear-to-b from-25% pt-24 pb-12"
      id="home"
    >
      <div className="container mx-auto">
        <div className="mt-24 flex flex-col gap-6">
          <div className="font-kanit shadow-card inset-shadow-card-inner flex w-fit items-center gap-2 rounded-3xl border border-white/25 bg-black px-4 py-3 text-sm text-white">
            <CircleDot size={16} className="inline" /> Software Engineer &amp;
            Full-Stack Developer
          </div>
          <div className="space-y-3">
            <h1 className="font-kanit space-x-4 text-7xl leading-24 font-medium text-white">
              <span>
                Viktor <span className="text-white/60">Harhat</span>
              </span>
              <Link href="#about" className="inline-block">
                <span className="inset-shadow-circle flex h-14 w-14 items-center justify-center rounded-full bg-black">
                  <ArrowUpRight size={32} className="inline text-white" />
                </span>
              </Link>
            </h1>
            <p className="font-convergence max-w-sm text-base text-white/60">
              Some cool text about me Some cool t about m Som bout me Some cool
              text about me tet about me
            </p>
          </div>
          <div className="flex gap-4 py-1.5">
            <button className="black-button">See All Projects</button>
            <Link
              href="https://drive.google.com/file/d/1poV2F2AHTvpi060R57rmZCQri14vENpQ/view?usp=sharing"
              target="_blank"
              className="white-button"
            >
              Resume (CV)
            </Link>
          </div>
        </div>
        <div className="absolute inset-0">
          <MainPanelScene />
        </div>
      </div>
    </section>
  );
};

export default SectionHero;
