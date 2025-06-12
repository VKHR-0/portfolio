import type { FC, PropsWithChildren } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

const Providers: FC<PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <SkeletonTheme baseColor="#f4f4f5" highlightColor="#71717a" duration={2}>
      {children}
    </SkeletonTheme>
  );
};

export default Providers;
