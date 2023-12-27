import { FC, PropsWithChildren } from "react";
import { Canvas } from "@react-three/fiber";

const Scene: FC<PropsWithChildren<unknown>> = ({ children }) => {
  return <Canvas>{children}</Canvas>;
};

export default Scene;
