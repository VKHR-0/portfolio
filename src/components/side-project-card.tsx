"use client";

import type ISideProject from "@/types/side-project";

import useBreakpoint from "@/hooks/use-breakpoint";
import Image from "next/image";
import Link from "next/link";
import type { FC, PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import CircleButton from "./circle-button";

export const SideProjectCard: FC<PropsWithChildren<ISideProject>> = ({
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
        heightRef.current = height * 0.5;
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
        href={`/side-projects/${_id}`}
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
        <Link href={`/side-project/${_id}`} className="inline-block">
          <CircleButton />
        </Link>
      </div>
    </article>
  );
};

export const SideProjectCardSkeleton = () => {
  return (
    <div className="running-border w-full rounded-3xl px-6 py-5">
      <Skeleton className="aspect-square rounded-lg" />
      <div>
        <Skeleton height={32} containerClassName="block my-4" />
        <Skeleton />
      </div>
    </div>
  );
};
