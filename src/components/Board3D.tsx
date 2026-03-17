import { useGameStore } from '../store';
import { Piece3D } from './Piece3D';
import { Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

const BRASS_COLOR = '#7a6240';
const BRASS_DARK = '#5c4a2e';

function BookCorner({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const thickness = 0.025;
  const armLength = 0.38;
  const height = 0.20;
  const lift = 0.01;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box args={[armLength, height, thickness]} position={[armLength / 2 - thickness / 2, 0, lift]} castShadow receiveShadow>
        <meshStandardMaterial color={BRASS_COLOR} roughness={0.22} metalness={0.88} />
      </Box>
      <Box args={[thickness, height, armLength]} position={[lift, 0, armLength / 2 - thickness / 2]} castShadow receiveShadow>
        <meshStandardMaterial color={BRASS_COLOR} roughness={0.22} metalness={0.88} />
      </Box>
      {[0.10, 0.26].map((t, i) => (
        <Box key={`rh-${i}`} args={[0.032, height * 0.38, 0.032]} position={[t, 0, lift + 0.018]} castShadow>
          <meshStandardMaterial color={BRASS_DARK} roughness={0.18} metalness={0.92} />
        </Box>
      ))}
      {[0.10, 0.26].map((t, i) => (
        <Box key={`rv-${i}`} args={[0.032, height * 0.38, 0.032]} position={[lift + 0.018, 0, t]} castShadow>
          <meshStandardMaterial color={BRASS_DARK} roughness={0.18} metalness={0.92} />
        </Box>
      ))}
    </group>
  );
}

function BoardTile({ x, y, isSelected }: { x: number; y: number; isSelected: boolean }) {
  const tileSize = 0.92;
  const insetSize = 0.80;
  const insetDepth = 0.04;

  const frameGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const h = tileSize / 2;
    shape.moveTo(-h, -h);
    shape.lineTo(h, -h);
    shape.lineTo(h, h);
    shape.lineTo(-h, h);
    shape.closePath();
    const ih = insetSize / 2;
    const hole = new THREE.Path();
    hole.moveTo(-ih, -ih);
    hole.lineTo(ih, -ih);
    hole.lineTo(ih, ih);
    hole.lineTo(-ih, ih);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: insetDepth,
      bevelEnabled: true,
      bevelThickness: 0.007,
      bevelSize: 0.007,
      bevelSegments: 1,
    });
  }, []);

  const isDark = (x + y) % 2 === 1;
  const rimColor = isSelected ? '#4a6a99' : (isDark ? '#3a2c1c' : '#50401e');
  const floorColor = isSelected ? '#2e4466' : (isDark ? '#221810' : '#2a1e0e');

  return (
    <group>
      <mesh geometry={frameGeo} position={[0, -0.1 + insetDepth, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color={rimColor} roughness={0.72} metalness={0.04} />
      </mesh>
      <Box args={[insetSize, 0.008, insetSize]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color={floorColor} roughness={0.88} metalness={0.02} />
      </Box>
    </group>
  );
}

export function Board3D() {
  const board = useGameStore(state => state.board);
  const clickSquare = useGameStore(state => state.clickSquare);
  const phase = useGameStore(state => state.phase);
  const selectedSquare = useGameStore(state => state.selectedSquare);
  const carriedPieces = useGameStore(state => state.carriedPieces);
  const pickupPieces = useGameStore(state => state.pickupPieces);
  const cancelAction = useGameStore(state => state.cancelAction);

  const squares = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const isSelected = selectedSquare?.[0] === x && selectedSquare?.[1] === y;
      let currentY = 0.0;
      const piecesWithY = board[y][x].map((piece) => {
        const yPos = currentY;
        if (piece.type === 'flat') currentY += 0.17;
        else if (piece.type === 'wall') currentY += 0.62;
        else if (piece.type === 'cap') currentY += 0.35;
        return { ...piece, yPos };
      });

      squares.push(
        <group
          key={`sq-${x}-${y}`}
          position={[x - 2, 0, y - 2]}
          onClick={(e) => { e.stopPropagation(); clickSquare(x, y); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
        >
          <BoardTile x={x} y={y} isSelected={isSelected} />
          {piecesWithY.map((piece) => (
            <Piece3D key={piece.id} piece={piece} position={[0, piece.yPos, 0]} />
          ))}
          {phase === 'pickup' && isSelected && (
            <Html position={[0, Math.max(1.5, currentY + 0.5), 0]} center zIndexRange={[100, 0]}>
              <div className="bg-zinc-950/95 p-2 rounded-xl shadow-2xl border border-amber-900/30 flex flex-col items-center gap-2 backdrop-blur-sm select-none">
                <div className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Carry</div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(board[y][x].length, 5) }).map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); pickupPieces(i + 1); }}
                      className="w-8 h-8 rounded-lg bg-amber-900/25 hover:bg-amber-700/40 text-amber-100 font-mono text-sm transition-colors border border-amber-800/25">
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); cancelAction(); }}
                  className="text-red-400/60 hover:text-red-300 text-xs uppercase tracking-wider mt-1">
                  Cancel
                </button>
              </div>
            </Html>
          )}
          {phase === 'move' && isSelected && (() => {
            let carryY = currentY + 0.5;
            return (
              <group>
                {carriedPieces.map((piece) => {
                  const yPos = carryY;
                  if (piece.type === 'flat') carryY += 0.17;
                  else if (piece.type === 'wall') carryY += 0.62;
                  else if (piece.type === 'cap') carryY += 0.35;
                  return <Piece3D key={piece.id} piece={piece} position={[0, yPos, 0]} />;
                })}
              </group>
            );
          })()}
        </group>
      );
    }
  }

  return (
    <group>
      <Box args={[5.32, 0.22, 5.32]} position={[0, -0.21, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#231810" roughness={0.62} metalness={0.04} />
      </Box>
      <Box args={[5.06, 0.035, 5.06]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#352510" roughness={0.58} metalness={0.03} />
      </Box>
      {([
        { pos: [0, -0.12, 2.67] as [number,number,number], args: [5.32, 0.18, 0.028] as [number,number,number] },
        { pos: [0, -0.12, -2.67] as [number,number,number], args: [5.32, 0.18, 0.028] as [number,number,number] },
        { pos: [2.67, -0.12, 0] as [number,number,number], args: [0.028, 0.18, 5.32] as [number,number,number] },
        { pos: [-2.67, -0.12, 0] as [number,number,number], args: [0.028, 0.18, 5.32] as [number,number,number] },
      ] as { pos: [number,number,number]; args: [number,number,number] }[]).map(({ pos, args }, i) => (
        <Box key={`edge-${i}`} args={args} position={pos} castShadow receiveShadow>
          <meshStandardMaterial color={BRASS_COLOR} roughness={0.2} metalness={0.9} />
        </Box>
      ))}
      <BookCorner position={[-2.64, -0.08, -2.64]} rotationY={0} />
      <BookCorner position={[2.64, -0.08, -2.64]} rotationY={-Math.PI / 2} />
      <BookCorner position={[2.64, -0.08, 2.64]} rotationY={Math.PI} />
      <BookCorner position={[-2.64, -0.08, 2.64]} rotationY={Math.PI / 2} />
      {squares}
    </group>
  );
}
