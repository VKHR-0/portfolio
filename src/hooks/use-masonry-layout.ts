import { useMemo } from "react";
import useBreakpointValue, {
  type BreakpointValue,
} from "./use-breakpoint-value";

const useMasonryLayout = (
  childrenCount: number,
  columns: BreakpointValue<number>,
  defaultColumnCount = 2,
): number => {
  const resolvedColumns = useBreakpointValue(columns, defaultColumnCount);

  return useMemo(() => {
    return Math.min(resolvedColumns, childrenCount);
  }, [childrenCount, resolvedColumns]);
};

export default useMasonryLayout;
