"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  return (
    <>
      <motion.header
        initial={{ top: "-100%" }}
        animate={{ top: "2rem" }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
        }}
        className="shadow-card inset-shadow-card-inner sticky top-8 z-50 -mb-[66px] w-10/12 max-w-7xl self-center rounded-full border border-white/25 bg-black/75 py-5 backdrop-blur-lg min-xl:w-8/12"
      >
        <div className="flex items-center justify-between px-6">
          <Link href="/">
            <Image src="/images/logo.svg" alt="logo" height={36} width={95} />
          </Link>
          <ul className="space-x-5 text-base font-medium text-white *:relative *:text-white/50 *:transition-all *:duration-300 *:after:absolute *:after:bottom-0 *:after:left-0 *:after:h-[2px] *:after:w-0 *:after:bg-white *:after:transition-all *:after:duration-300 *:hover:text-white *:hover:after:w-full max-md:hidden">
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
          <div className="h-8 md:hidden">
            <button
              type="button"
              className="text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="x"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X size={32} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Menu size={32} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-lg"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            <ul className="text-center text-3xl text-white">
              <li className="my-4">
                <Link href="/" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
              </li>
              <li className="my-4">
                <Link href="/projects" onClick={() => setIsOpen(false)}>
                  Projects
                </Link>
              </li>
              <li className="my-4">
                <Link href="/#about" onClick={() => setIsOpen(false)}>
                  About
                </Link>
              </li>
              <li className="my-4">
                <Link href="/side-projects" onClick={() => setIsOpen(false)}>
                  Side Projects
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
