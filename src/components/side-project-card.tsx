import ISideProject from "@/types/side-project";

import { FC, PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export const SideProjectCard: FC<PropsWithChildren<ISideProject>> = ({
  _id,
  title,
  thumbnail,
  height,
}) => {
  return (
    <article className="shadow-card inset-shadow-card-inner rounded-3xl bg-black p-5">
      <Link
        className="relative block"
        href={`/side-project/${_id}`}
        style={{ height: `${height}px` }}
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
          <span className="circle-button">
            <ArrowUpRight size={32} className="inline text-white" />
          </span>
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
