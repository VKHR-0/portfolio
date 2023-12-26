import MainPannelScene from "@/components/decorations/scenes/main-pannel-scene";
import { motion } from "framer-motion";

const SectionMain = () => {
  return (
    <section
      className="scroller-section relative h-screen w-screen overflow-x-hidden font-kanit font-black"
      id="home"
    >
      <div className="absolute left-1/2 top-1/2 z-10 w-max -translate-x-1/2 -translate-y-1/2 text-9xl uppercase text-zinc-100 mix-blend-difference">
        <motion.p
          initial={{ translateX: 2000 }}
          animate={{ translateX: "75%" }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 20,
          }}
          className="translate-x-3/4 font-cormorant text-xl italic"
        >
          Viktor Harhat
        </motion.p>
        <motion.h1
          initial={{ translateX: -2000 }}
          animate={{ translateX: 128 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
          }}
          className="translate-x-32 drop-shadow-2xl"
        >
          Independent
        </motion.h1>
        <motion.h1
          initial={{ translateX: 2000 }}
          animate={{ translateX: -112 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          className="-translate-x-28 drop-shadow-2xl"
        >
          Full-Stack
        </motion.h1>
        <motion.h1
          initial={{ translateX: -2000 }}
          animate={{ translateX: 40 }}
          transition={{
            type: "spring",
            stiffness: 225,
            damping: 30,
          }}
          className="translate-x-10 drop-shadow-2xl"
        >
          Web Developer
        </motion.h1>
        <motion.p
          initial={{ translateX: -2000 }}
          animate={{ translateX: "75%" }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 20,
          }}
          className="translate-x-3/4 text-xl"
        >
          WELCOME TO <span className="font-cormorant lowercase italic">my</span>{" "}
          2023{" "}
          <span className="font-cormorant lowercase italic">portfolio</span>
        </motion.p>
      </div>
      <MainPannelScene />
    </section>
  );
};

export default SectionMain;
