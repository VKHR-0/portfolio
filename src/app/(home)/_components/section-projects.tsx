"use client";

import MasonryGrid from "@/components/masonry-grid";
import { ProjectCard } from "@/components/project-card";

import IProject from "@/types/project";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

interface SectionProjectsProps {
  projects: IProject[];
}

const SectionProjects = ({ projects }: SectionProjectsProps) => {
  return (
    <section id="projects" className="bg-black-primary">
      <div className="relative container mx-auto">
        <MasonryGrid columns={2} gap={[4, 6]} className="pb-16">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard key={project._id} {...project} />
          ))}
        </MasonryGrid>

        <div className="pointer-events-none absolute -right-1/2 bottom-0 -left-1/2 h-72 w-full">
          <div className="to-black-primary/50 from-black-tertiary h-full w-full bg-gradient-to-t from-25% blur-lg"></div>
          <div className="absolute inset-0 bg-transparent backdrop-blur-[3px]"></div>
        </div>

        <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 transform">
          <Link href="/projects" className="flex items-center justify-center">
            <ArrowDown className="text-white" size={48} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SectionProjects;
