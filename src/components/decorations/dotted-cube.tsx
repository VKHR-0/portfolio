import { useFrame, useThree } from "@react-three/fiber";
import { type FC, useMemo, useRef } from "react";
import {
  type BufferGeometry,
  type Material,
  type Points,
  Vector3,
} from "three";

interface IDottedCube {
  size: number;
  dotSize: number;
  dotCount: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  followSpeed?: number;
}

const DottedCube: FC<IDottedCube> = ({
  size = 1,
  dotSize = 0.04,
  dotCount = 250,
  position,
  rotation = [0, 0, 0],
  color = "#ffffff",
  followSpeed = 0.01,
}) => {
  const meshRef = useRef<Points<BufferGeometry, Material> | null>(null);
  const { pointer } = useThree();

  // Create dots in a cube shape with evenly distributed points
  const positions = useMemo(() => {
    const vertexArray: number[] = [];

    // Create points for a cube with specified resolution
    const resolution = Math.floor(Math.cbrt(dotCount));
    const step = size / (resolution - 1);
    const offset = size / 2;

    // Generate points for all faces
    for (let i = 0; i < resolution; i++) {
      const x = i * step - offset;

      for (let j = 0; j < resolution; j++) {
        const y = j * step - offset;

        // Front and back faces (z = constant)
        vertexArray.push(x, y, -offset); // Front face
        vertexArray.push(x, y, offset); // Back face

        // For the remaining faces, avoid duplicate vertices
        // at the edges by checking if we're on an edge
        if (
          i === 0 ||
          i === resolution - 1 ||
          j === 0 ||
          j === resolution - 1
        ) {
          for (let k = 1; k < resolution - 1; k++) {
            const z = k * step - offset;
            // Add points for left/right/top/bottom faces while avoiding duplicates
            if (i === 0) vertexArray.push(-offset, y, z); // Left face
            if (i === resolution - 1) vertexArray.push(offset, y, z); // Right face
            if (j === 0) vertexArray.push(x, -offset, z); // Bottom face
            if (j === resolution - 1) vertexArray.push(x, offset, z); // Top face
          }
        }
      }
    }

    return new Float32Array(vertexArray);
  }, [size, dotCount]);

  useFrame(() => {
    if (meshRef.current) {
      // Update rotation based on mouse position
      const targetRotationX = pointer.y * Math.PI * 0.5;
      const targetRotationY = pointer.x * Math.PI * 0.5;

      meshRef.current.rotation.x +=
        (targetRotationX - meshRef.current.rotation.x) * followSpeed;
      meshRef.current.rotation.y +=
        (targetRotationY - meshRef.current.rotation.y) * followSpeed;

      // Add subtle continuous rotation
      meshRef.current.rotation.z += 0.001;
    }
  });

  return (
    <points
      ref={meshRef}
      position={new Vector3(...position)}
      rotation={rotation}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={dotSize}
        sizeAttenuation={true}
        color={color}
        transparent={true}
        opacity={0.9}
      />
    </points>
  );
};

export default DottedCube;
