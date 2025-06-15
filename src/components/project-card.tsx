"use client";

import Image from "next/image";
import Link from "next/link";
import type { FC, PropsWithChildren } from "react";

import useBreakpoint from "@/hooks/use-breakpoint";
import type IProject from "@/types/project";
import { useEffect, useRef } from "react";
import CircleButton from "./circle-button";

export const ProjectCard: FC<PropsWithChildren<IProject>> = ({
  _id,
  title,
  thumbnail,
  height,
}) => {
  const breakpoint = useBreakpoint();
  const heightRef = useRef<number>(height);

  useEffect(() => {
    switch (breakpoint) {
      case "2xl":
        heightRef.current = height;
        break;
      case "xl":
        heightRef.current = height * 0.75;
        break;
      case "lg":
        heightRef.current = height * 0.75;
        break;
      case "md":
        heightRef.current = height * 0.75;
        break;
      case "sm":
        heightRef.current = height * 0.5;
        break;
    }
  }, [breakpoint, height]);

  return (
    <article className="shadow-card inset-shadow-card-inner rounded-3xl bg-black p-5">
      <Link
        className="relative block"
        href={`/projects/${_id}`}
        style={{ height: `${heightRef.current}px` }}
      >
        <Image
          className="!relative rounded-lg object-cover"
          src={thumbnail.asset.url}
          alt={title}
          priority
          fill
        />
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="my-4 text-3xl font-medium text-white">
          <Link className="relative" href={`/project/${_id}`}>
            {title}
          </Link>
        </h3>
        <Link href={`/project/${_id}`} className="inline-block">
          <CircleButton />
        </Link>
      </div>
    </article>
  );
};
