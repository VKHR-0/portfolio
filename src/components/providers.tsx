import { FC, PropsWithChildren } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

const Providers: FC<PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <SkeletonTheme baseColor="#cbd5e1" highlightColor="#94a3b8" duration={2}>
      {children}
    </SkeletonTheme>
  );
};

export default Providers;
