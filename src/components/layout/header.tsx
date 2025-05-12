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
      className="shadow-card inset-shadow-card-inner sticky top-8 z-50 w-10/12 max-w-7xl self-center rounded-full border border-white/25 bg-black/75 py-5 backdrop-blur-lg min-xl:w-8/12"
    >
      <div className="flex items-center justify-between px-6">
        <Link href="/">
          <Image src="/images/logo.svg" alt="logo" height={36} width={95} />
        </Link>
        <ul className="space-x-5 text-base font-medium text-white *:text-white/50 *:transition-colors *:hover:text-white">
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
