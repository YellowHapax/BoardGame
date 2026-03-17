import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Board3D } from './Board3D';

export function GameCanvas() {
  return (
    <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1410 0%, #0a0806 100%)' }}>
      <Canvas shadows camera={{ position: [0, 7, 7], fov: 42 }}>
        {/* Ambient — lifted enough to read piece geometry in shadow */}
        <ambientLight intensity={0.38} color="#c8a87a" />

        {/* Warm key light — low angle from upper-left, like a desk lamp */}
        <pointLight
          position={[-4, 9, 4]}
          intensity={90}
          color="#f5deb3"
          castShadow
          shadow-mapSize={2048}
          shadow-bias={-0.001}
          decay={2}
        />

        {/* Secondary warm fill — opposite side */}
        <pointLight
          position={[5, 6, -3]}
          intensity={38}
          color="#e8c990"
          decay={2}
        />

        {/* Cool rim light from below-back — separates board from bg */}
        <pointLight
          position={[0, -1, -6]}
          intensity={14}
          color="#4a6080"
          decay={2}
        />

        <Board3D />

        <ContactShadows
          position={[0, -0.21, 0]}
          opacity={0.75}
          scale={12}
          blur={2.5}
          far={5}
          color="#000000"
        />
        <OrbitControls
          makeDefault
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={4}
          maxDistance={16}
          zoomSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
