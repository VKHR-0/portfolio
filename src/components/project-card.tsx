import { FC, PropsWithChildren } from "react";

import IProject from "@/types/project";
import Image from "next/image";
import Link from "next/link";

const ProjectCard: FC<PropsWithChildren<IProject>> = ({
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
          fill
        />
      </Link>
      <figcaption>
        <h3 className="my-4 text-2xl font-black">
          <Link className="relative" href={`/project/${_id}`}>
            {title}
          </Link>
        </h3>
        <p>{shortDescription}</p>
      </figcaption>
    </figure>
  );
};

export default ProjectCard;
