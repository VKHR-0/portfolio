import { type FC, type PropsWithChildren, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  PerspectiveCamera,
} from "@react-three/drei";

const Scene: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Canvas dpr={[1, 2]} style={{ width: "100%", height: "100%" }}>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
      <ambientLight intensity={0.5} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      {children}
    </Canvas>
  );
};

export default Scene;
