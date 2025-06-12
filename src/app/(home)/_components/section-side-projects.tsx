"use client";

import MasonryGrid from "@/components/masonry-grid";
import { SideProjectCard } from "@/components/side-project-card";
import type ISideProject from "@/types/side-project";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import React from "react";

interface SectionSideProjectProps {
  sideProjects: ISideProject[];
}

const SectionSideProject = ({ sideProjects }: SectionSideProjectProps) => {
  return (
    <section
      id="side-projects"
      className="bg-black-tertiary relative z-10 -mb-12 rounded-2xl pt-8 text-white before:absolute before:inset-0 before:rounded-2xl before:border-t-[3px] before:border-r-[2px] before:border-b-[3px] before:border-l-[2px] before:border-white/25 before:from-white/25 before:to-transparent"
    >
      <div className="relative container mx-auto space-y-6">
        <h2 className="font-kanit text-center text-6xl font-bold">
          Side Projects
        </h2>
        <p className="font-convergence text-center text-base text-white/60">
          Some cool text about me Some cool t about m Som bout me Some cool text
          about me tet about me
        </p>

        <MasonryGrid columns={2} gap={[4, 6]} className="pb-16">
          {sideProjects.slice(0, 6).map((sideProject) => (
            <SideProjectCard key={sideProject._id} {...sideProject} />
          ))}
        </MasonryGrid>

        <div className="pointer-events-none absolute bottom-0 h-72 w-full">
          <div className="to-black-primary/50 from-black-tertiary h-full w-full bg-gradient-to-t from-25% blur-lg" />
          <div className="absolute inset-0 bg-transparent backdrop-blur-[3px]" />
        </div>

        <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 transform">
          <Link
            href="/side-projects"
            className="flex items-center justify-center"
          >
            <ArrowDown className="text-white" size={48} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SectionSideProject;
