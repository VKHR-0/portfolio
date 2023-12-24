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
    <figure className="p-6 rounded-3xl w-full max-w-md running-border">
      <Link className="relative" href={`/project/${_id}`}>
        <Image
          className="!relative rounded-lg"
          src={thumbnail.asset.url}
          alt={title}
          fill
        />
      </Link>
      <figcaption>
        <h3 className="font-black text-2xl my-4">
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
