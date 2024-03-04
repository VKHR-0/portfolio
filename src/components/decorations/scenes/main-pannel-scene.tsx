import { MeshWobbleMaterial } from "@react-three/drei";
import FollowedCube from "../followed-cube";
import Scene from "../scene";

const MainPannelScene = () => {
  return (
    <Scene>
      <mesh>
        <FollowedCube
          args={[1.25, 1.25, 1.25]}
          radius={0.1}
          rotation={[0, 45, 45]}
          position={[-4, 1, 0]}
        />
        <FollowedCube
          args={[1.25, 1.25, 1.25]}
          radius={0.1}
          rotation={[10, 45, 45]}
          position={[4, -1, 0]}
        />
        <FollowedCube
          args={[1, 1, 1]}
          radius={0.1}
          rotation={[0, 25, 25]}
          position={[2, -1.75, 0]}
        />
        <FollowedCube
          args={[1, 1, 1]}
          radius={0.1}
          rotation={[0, -25, 45]}
          position={[-2, 1.75, 0]}
        />
      </mesh>
    </Scene>
  );
};

export default MainPannelScene;
