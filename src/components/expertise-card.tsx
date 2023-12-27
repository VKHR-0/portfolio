import IExpertise from "@/types/expertise";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { FC } from "react";
import { motion } from "framer-motion";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export const ExpertiseCard: FC<IExpertise> = ({
  title,
  number,
  description,
  icon,
}) => {
  return (
    <div className="group relative grid grid-cols-[0.5fr_1.5fr] grid-rows-[0.5fr_1.5fr] items-center justify-items-center gap-4 bg-zinc-100 p-6 first:rounded-l-3xl last:rounded-r-3xl">
      <Image src={icon.asset.url} alt={title} width={75} height={75} />
      <h3 className="flex w-full justify-between text-4xl font-bold">
        <span>{title}</span>
        <span>| #{number}</span>
      </h3>
      <div className="prose prose-lg col-start-1 col-end-3">
        <PortableText value={description} />
      </div>
      <motion.div
        className="absolute left-0 top-0 h-full w-full bg-zinc-950 group-first:rounded-l-3xl group-first:border-r group-first:border-l-zinc-100 group-last:rounded-r-3xl group-last:border-l group-last:border-l-zinc-100"
        initial={{ height: "100%" }}
        whileInView={{ height: 0 }}
        transition={{ delay: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};

export const ExpertiseCardSkeleton = () => {
  return (
    <div className="group relative grid w-full grid-cols-[0.5fr_1.5fr] grid-rows-[0.5fr_1.5fr] items-center gap-4 bg-zinc-950 p-6 first:rounded-l-3xl first:border-r first:border-l-zinc-100 last:rounded-r-3xl last:border-l last:border-l-zinc-100">
      <Skeleton width={75} height={75} circle />
      <Skeleton height={28} />
      <Skeleton
        containerClassName="col-start-1 col-end-3 mb-auto space-y-1"
        count={4}
      />
    </div>
  );
};
