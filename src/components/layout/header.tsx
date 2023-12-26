"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ top: "-100%" }}
      animate={{ top: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      className="absolute top-0 z-10 w-screen py-5"
    >
      <div className="container flex justify-between">
        <Link href="/">{/* <Image src="" alt="logo" fill /> */}</Link>
        <ul className="text-zinc-100 text-lg font-bold space-x-5">
          <li className="inline-block">
            <Link href="/#home">Home</Link>
          </li>
          <li className="inline-block">
            <Link href="/#projects">Projects</Link>
          </li>
          <li className="inline-block">
            <Link href="/#expertise">Expertise</Link>
          </li>
          <li className="inline-block">
            <Link href="/#about">About</Link>
          </li>
        </ul>
      </div>
    </motion.header>
  );
};

export default Header;
