"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ top: "-100%" }}
      animate={{ top: "2rem" }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      className="shadow-card inset-shadow-card-inner sticky top-8 z-50 min-xl:w-8/12 max-w-7xl w-full py-5 border border-white/25 backdrop-blur-lg bg-black/75 rounded-full"
    >
      <div className="flex justify-between items-center px-6">
        <Link href="/">
          <Image src="/images/logo.svg" alt="logo" height={36} width={95} />
        </Link>
        <ul className="space-x-5 text-base font-medium text-white *:text-white/50 *:hover:text-white *:transition-colors">
          <li className="inline-block">
            <Link href="/">Home</Link>
          </li>
          <li className="inline-block">
            <Link href="/projects">Projects</Link>
          </li>
          <li className="inline-block">
            <Link href="/#about">About</Link>
          </li>
          <li className="inline-block">
            <Link href="/side-projects">Side Projects</Link>
          </li>
        </ul>
      </div>
    </motion.header>
  );
};

export default Header;
