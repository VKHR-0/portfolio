import { FC, PropsWithChildren } from "react";
import { Canvas } from "@react-three/fiber";

const Scene: FC<PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      {children}
    </Canvas>
  );
};

export default Scene;
