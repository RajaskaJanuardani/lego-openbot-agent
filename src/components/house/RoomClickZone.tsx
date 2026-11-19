import React, { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { RoomId } from '../../types';
import { FLOOR_Y } from '../../lib/layout';

export interface RoomClickZoneProps {
  roomId: RoomId;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y?: number;
  highlightColor?: string;
  onSelectRoom: (roomId: RoomId) => void;
}

export const RoomClickZone: React.FC<RoomClickZoneProps> = ({
  roomId,
  minX,
  maxX,
  minZ,
  maxZ,
  y = FLOOR_Y + 0.04,
  highlightColor = '#FFF3B0',
  onSelectRoom,
}) => {
  const [hovered, setHovered] = useState(false);

  const width = maxX - minX;
  const depth = maxZ - minZ;
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    onSelectRoom(roomId);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <mesh
      position={[cx, y, cz]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial
        color={highlightColor}
        transparent
        opacity={hovered ? 0.16 : 0}
        depthWrite={false}
      />
    </mesh>
  );
};
