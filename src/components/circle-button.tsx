"use client";

import useBreakpoint from "@/hooks/use-breakpoint";
import { ArrowUpRight } from "lucide-react";
import { type FC, useEffect, useRef } from "react";

const CircleButton: FC<{ size?: number }> = ({ size = 32 }) => {
  const breakpoint = useBreakpoint();
  const sizeRef = useRef<number>(size);

  useEffect(() => {
    switch (breakpoint) {
      case "2xl":
      case "xl":
      case "lg":
        sizeRef.current = size;
        break;
      case "md":
      case "sm":
        sizeRef.current = size * 0.75;
        break;
    }
  }, [breakpoint, size]);

  return (
    <span className="circle-button">
      <ArrowUpRight size={sizeRef.current} className="inline text-white" />
    </span>
  );
};

export default CircleButton;
