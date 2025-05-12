import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { FC, PropsWithChildren, useRef } from "react";
import { Mesh } from "three";

interface IFollowedCube {
  args: [number, number, number];
  radius: number;
  rotation: [number, number, number];
  position: [number, number, number];
}

const FollowedCube: FC<PropsWithChildren<IFollowedCube>> = (props) => {
  const { children } = props;

  const cubeRef = useRef<Mesh | null>(null);

  const { pointer } = useThree();

  useFrame(() => {
    const xRotation = (pointer.x * Math.PI) / 2;
    const yRotation = (pointer.y * Math.PI) / 2;

    if (cubeRef.current) {
      cubeRef.current.rotation.x +=
        (xRotation - cubeRef.current.rotation.x) * 0.005;
      cubeRef.current.rotation.y +=
        (yRotation - cubeRef.current.rotation.y) * 0.005;
    }
  });

  return (
    <RoundedBox ref={cubeRef} {...props}>
      {children}
    </RoundedBox>
  );
};

export default FollowedCube;
