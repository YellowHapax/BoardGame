import { useMemo } from 'react';
import * as THREE from 'three';
import { Piece, useGameStore, COLOR_PAIRS } from '../store';
import { Sphere } from '@react-three/drei';

export function Piece3D({ piece, position }: { piece: Piece; position: [number, number, number] }) {
  const paletteIndex = useGameStore(state => state.paletteIndex);
  const color = COLOR_PAIRS[paletteIndex][piece.owner];

  // The trapezoid shape — kept exactly as-is, it's doing ideographic work
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.4, -0.3);
    s.lineTo(0.4, -0.3);
    s.lineTo(0.2, 0.3);
    s.lineTo(-0.2, 0.3);
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 3,
  }), []);

  // Shared material props — lacquered/ceramic weight
  const matProps = {
    color,
    roughness: 0.35,
    metalness: 0.18,
  };

  if (piece.type === 'flat') {
    return (
      <group position={[position[0], position[1] + 0.075, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, -0.075]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
    );
  }

  if (piece.type === 'wall') {
    return (
      <group position={[position[0], position[1] + 0.3, position[2]]}>
        <mesh position={[0, 0, -0.075]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
    );
  }

  if (piece.type === 'cap') {
    return (
      <Sphere
        args={[0.35, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]}
        position={[position[0], position[1], position[2]]}
        castShadow receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.25} />
      </Sphere>
    );
  }

  return null;
}
