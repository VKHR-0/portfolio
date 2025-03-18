import { useMemo } from "react";
import useWindowDimensions from "./use-window-dimentions";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const defaultBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

const useBreakpoint = (customBreakpoints = defaultBreakpoints): Breakpoint => {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    if (width < customBreakpoints.sm) return "sm";
    if (width < customBreakpoints.md) return "md";
    if (width < customBreakpoints.lg) return "lg";
    if (width < customBreakpoints.xl) return "xl";
    return "2xl";
  }, [width, customBreakpoints]);
};

export default useBreakpoint;
