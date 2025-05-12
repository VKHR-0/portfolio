import DottedCube from "../dotted-cube";
import Scene from "../scene";

const MainPanelScene = () => {
  return (
    <Scene>
      <group>
        <DottedCube
          size={10}
          dotSize={0.035}
          dotCount={700}
          position={[0, 3, 0]}
          rotation={[0, 1, 2]}
          color="#ffffff"
          followSpeed={0.0005}
        />
        <DottedCube
          size={15}
          dotSize={0.05}
          dotCount={700}
          position={[-3, -2, 0]}
          rotation={[1, 2, 0]}
          color="#ffffff"
          followSpeed={0.0005}
        />
        <DottedCube
          size={12}
          dotSize={0.035}
          dotCount={700}
          position={[3, -2, 0]}
          rotation={[0, 1, 0]}
          color="#ffffff"
          followSpeed={0.0005}
        />
      </group>
    </Scene>
  );
};

export default MainPanelScene;
