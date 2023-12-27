import { FC, PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";

import IProject from "@/types/project";

export const ProjectCard: FC<PropsWithChildren<IProject>> = ({
  _id,
  title,
  shortDescription,
  thumbnail,
}) => {
  return (
    <figure className="running-border w-full max-w-md rounded-3xl p-6">
      <Link className="relative" href={`/project/${_id}`}>
        <Image
          className="!relative aspect-square rounded-lg bg-zinc-300"
          src={thumbnail.asset.url}
          alt={title}
          priority
          fill
        />
      </Link>
      <figcaption>
        <h3 className="my-4 text-2xl font-bold">
          <Link className="relative" href={`/project/${_id}`}>
            {title}
          </Link>
        </h3>
        <p>{shortDescription}</p>
      </figcaption>
      <motion.div
        className="absolute left-0 top-0 h-full w-full rounded-3xl bg-zinc-100"
        initial={{ height: "100%" }}
        whileInView={{ height: 0 }}
        transition={{ delay: 0.25, ease: "easeOut" }}
      />
    </figure>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <div className="running-border w-full max-w-md rounded-3xl px-6 py-5">
      <Skeleton className="aspect-square rounded-lg" />
      <div>
        <Skeleton height={32} containerClassName="block my-4" />
        <Skeleton />
      </div>
    </div>
  );
};
