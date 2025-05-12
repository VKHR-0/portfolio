import { FC, PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";

import IProject from "@/types/project";
import { ArrowUpRight } from "lucide-react";

export const ProjectCard: FC<PropsWithChildren<IProject>> = ({
  _id,
  title,
  thumbnail,
  height,
}) => {
  return (
    <article className="shadow-card inset-shadow-card-inner rounded-3xl bg-black p-5">
      <Link
        className="relative block"
        href={`/project/${_id}`}
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
        <Link href={`/project/${_id}`} className="inline-block">
          <span className="inset-shadow-circle flex h-12 w-12 items-center justify-center rounded-full bg-black">
            <ArrowUpRight size={32} className="inline text-white" />
          </span>
        </Link>
      </div>
    </article>
  );
};
