import type IExpertise from "@/types/expertise";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import type { FC } from "react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";

export const ExpertiseCard: FC<IExpertise> = ({
  title,
  number,
  description,
  icon,
}) => {
  return (
    <div className="group relative grid grid-cols-[1fr_3fr] items-center justify-items-center gap-4 bg-zinc-100 p-6 first:rounded-l-3xl last:rounded-r-3xl max-lg:grid-cols-[auto_1fr] max-lg:first:-mb-0.5 max-lg:first:rounded-l-none max-lg:first:border-r-0 max-lg:last:rounded-r-none max-sm:p-0 max-sm:[&:not(:first-child)]:pt-5">
      <Image
        src={icon.asset.url}
        alt={title}
        width={75}
        height={75}
        className="max-sm:!h-16 max-sm:!w-16"
      />
      <h3 className="flex w-full items-center justify-between gap-1 text-4xl font-bold max-xl:flex-col max-xl:items-start max-xl:gap-0 max-lg:flex-row max-lg:items-center max-sm:text-2xl">
        <span>{title}</span>
        <span className="border-l-4 border-black pl-1.5 max-xl:border-l-0 max-lg:border-l-4 max-lg:pl-2.5">
          #{number}
        </span>
      </h3>
      <div className="prose prose-lg max-sm:prose-base col-start-1 col-end-3">
        <PortableText value={description} />
      </div>
      <motion.div
        className="absolute top-0 left-0 h-full w-full bg-zinc-950 group-first:rounded-l-3xl group-first:border-r group-first:border-l-zinc-100 group-last:rounded-r-3xl group-last:border-l group-last:border-l-zinc-100 max-lg:group-first:rounded-t-3xl max-lg:group-first:rounded-bl-none max-lg:group-last:rounded-tr-none max-lg:group-last:rounded-b-3xl"
        initial={{ height: "100%" }}
        whileInView={{ height: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};

export const ExpertiseCardSkeleton = () => {
  return (
    <div className="group relative grid w-full grid-cols-[1fr_3fr] items-center gap-4 bg-zinc-950 p-6 first:rounded-l-3xl first:border-r first:border-l-zinc-100 last:rounded-r-3xl last:border-l last:border-l-zinc-100 max-lg:first:-mb-0.5 max-lg:first:rounded-t-3xl max-lg:first:rounded-bl-none max-lg:first:border-r-0 max-lg:last:rounded-tr-none max-lg:last:rounded-b-3xl max-sm:[&:not(:first-child)]:pt-5">
      <Skeleton width={75} height={75} circle />
      <Skeleton height={28} />
      <Skeleton
        containerClassName="col-start-1 col-end-3 mb-auto space-y-1"
        count={4}
      />
    </div>
  );
};
