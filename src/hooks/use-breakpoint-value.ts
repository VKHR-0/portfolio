import { useMemo } from "react";
import useBreakpoint, { Breakpoint } from "./use-breakpoint";

export type BreakpointValue<T> = Partial<Record<Breakpoint, T>> | T;

const useBreakpointValue = <T>(
  values: BreakpointValue<T>,
  defaultValue?: T,
): T => {
  const currentBreakpoint = useBreakpoint();

  return useMemo(() => {
    if (typeof values === "object" && values !== null) {
      const typedValues = values as Partial<Record<Breakpoint, T>>;

      if (
        currentBreakpoint in typedValues &&
        typedValues[currentBreakpoint] !== undefined
      ) {
        return typedValues[currentBreakpoint] as T;
      }

      const breakpoints: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm"];
      const currentIndex = breakpoints.indexOf(currentBreakpoint);

      for (let i = currentIndex; i < breakpoints.length; i++) {
        const bp = breakpoints[i];
        if (bp && bp in typedValues && typedValues[bp] !== undefined) {
          return typedValues[bp] as T;
        }
      }
    }

    if (typeof values !== "object" || values === null) {
      return values;
    }

    return defaultValue as T;
  }, [values, currentBreakpoint, defaultValue]);
};

export default useBreakpointValue;
