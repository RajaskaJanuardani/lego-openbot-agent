import React, { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { Vec3 } from '../../types';
import { BRICK_GAP, PLATE_H, STUD_UNIT } from '../../lib/layout';
import { getLegoMaterial, type LegoMaterialOptions } from '../../lib/materials';

export interface TileProps {
  position: Vec3;
  size: [number, number];
  color: string;
  rotation?: Vec3;
  height?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  materialOpts?: LegoMaterialOptions;
}

export const Tile: React.FC<TileProps> = ({
  position,
  size,
  color,
  rotation,
  height = PLATE_H,
  castShadow = true,
  receiveShadow = true,
  materialOpts,
}) => {
  const [w, d] = size;
  const boxW = Math.max(0.06, w * STUD_UNIT - BRICK_GAP);
  const boxH = Math.max(0.05, height - BRICK_GAP * 0.5);
  const boxD = Math.max(0.06, d * STUD_UNIT - BRICK_GAP);
  const radius = Math.min(0.04, boxW * 0.22, boxH * 0.22, boxD * 0.22);

  const material = useMemo(
    () => getLegoMaterial(color, materialOpts),
    [
      color,
      materialOpts?.roughness,
      materialOpts?.metalness,
      materialOpts?.transparent,
      materialOpts?.opacity,
      materialOpts?.emissive,
      materialOpts?.emissiveIntensity,
    ]
  );

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[boxW, boxH, boxD]}
        radius={radius}
        smoothness={2}
        position={[0, height * 0.5, 0]}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />
    </group>
  );
};
