"use client";

import { BreakpointValue } from "@/hooks/use-breakpoint-value";
import useMasonryLayout from "@/hooks/use-masonry-layout";
import { FC, ReactNode, useMemo } from "react";

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

type GapClass = {
  x: string;
  y: string;
};

interface MasonryGridProps {
  children: ReactNode[];
  columns?: BreakpointValue<number>;
  gap?: Gap | [Gap, Gap];
  className?: string;
}

const gapXToTailwindClass = (gap: Gap): string => {
  const gapMap: Record<Gap, string> = {
    0: "gap-x-0",
    1: "gap-x-1",
    2: "gap-x-2",
    3: "gap-x-3",
    4: "gap-x-4",
    5: "gap-x-5",
    6: "gap-x-6",
    8: "gap-x-8",
    10: "gap-x-10",
    12: "gap-x-12",
    16: "gap-x-16",
  };

  return gapMap[gap] || "gap-x-4";
};

const gapYToTailwindClass = (gap: Gap): string => {
  const gapMap: Record<Gap, string> = {
    0: "gap-y-0",
    1: "gap-y-1",
    2: "gap-y-2",
    3: "gap-y-3",
    4: "gap-y-4",
    5: "gap-y-5",
    6: "gap-y-6",
    8: "gap-y-8",
    10: "gap-y-10",
    12: "gap-y-12",
    16: "gap-y-16",
  };

  return gapMap[gap] || "gap-y-4";
};

const MasonryGrid: FC<MasonryGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = "",
}) => {
  const columnCount = useMasonryLayout(children.length, columns, 2);

  const gapClass: GapClass = useMemo(() => {
    if (Array.isArray(gap)) {
      return {
        x: gapXToTailwindClass(gap[0]),
        y: gapYToTailwindClass(gap[1]),
      };
    }

    return {
      x: gapXToTailwindClass(gap),
      y: gapYToTailwindClass(gap),
    };
  }, [gap]);

  const masonryColumns = useMemo(() => {
    const columnArray: ReactNode[][] = Array.from(
      { length: columnCount },
      () => [],
    );

    children.forEach((child, index) => {
      const columnIndex = index % columnCount;
      if (columnArray[columnIndex]) {
        columnArray[columnIndex].push(
          <div key={index} className="break-inside-avoid">
            {child}
          </div>,
        );
      }
    });

    return columnArray;
  }, [children, columnCount]);

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex flex-wrap ${gapClass.x}`}>
        {masonryColumns.map((column, columnIndex) => {
          return (
            <div
              key={columnIndex}
              className={`flex flex-1 flex-col ${gapClass.y}`}
            >
              {column}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MasonryGrid;
