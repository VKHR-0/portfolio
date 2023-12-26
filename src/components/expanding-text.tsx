"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { FC, PropsWithChildren, useEffect, useRef } from "react";

interface IExpandingText {
  parentClassName: string;
  overlapClassName: string;
  textClassName: string;
  element: keyof JSX.IntrinsicElements;
}

const ExpandingText: FC<PropsWithChildren<IExpandingText>> = ({
  parentClassName,
  overlapClassName,
  textClassName,
  element,
  children,
}) => {
  const controlOverlay = useAnimation();
  const controlText = useAnimation();

  const wrapper = useRef<HTMLDivElement | null>(null);

  const inView = useInView(wrapper);

  useEffect(() => {
    const animateInView = async () => {
      await controlOverlay.start({
        width: "100%",
        transition: { delay: 0.1, duration: 0.25, ease: [0, 1, 1, 1] },
      });

      await controlText.start({
        width: "auto",
        transition: { ease: [0, 0.75, 1, 1] },
      });

      await controlOverlay.start({
        width: 0,
        left: "100%",
        transition: { duration: 0.5, ease: [0.25, 1, 0, 1] },
      });
    };

    if (inView) {
      animateInView();
    } else {
      controlOverlay.start({ width: 0, left: 0 });
      controlText.start({ width: 0 });
    }
  }, [inView, controlOverlay, controlText]);

  const VariableMotion = motion<{ className: string }>(element);

  return (
    <div
      ref={wrapper}
      className={`${parentClassName} relative overflow-hidden`}
    >
      <motion.div
        className={`${overlapClassName} absolute top-0 left-0`}
        initial={{ width: 0 }}
        animate={controlOverlay}
      />
      <VariableMotion
        className={`${textClassName} mx-8 py-2 overflow-hidden`}
        initial={{ width: 0 }}
        animate={controlText}
      >
        {children}
      </VariableMotion>
    </div>
  );
};

export default ExpandingText;
