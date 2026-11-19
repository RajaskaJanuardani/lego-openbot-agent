import React, { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { Vec3 } from '../../types';
import { BRICK_GAP, BRICK_H, STUD_UNIT } from '../../lib/layout';
import { getLegoMaterial, type LegoMaterialOptions } from '../../lib/materials';
import { Studs } from './Studs';

export interface BrickProps {
  position: Vec3;
  size: [number, number, number];
  color: string;
  rotation?: Vec3;
  studs?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  materialOpts?: LegoMaterialOptions;
}

export const Brick: React.FC<BrickProps> = ({
  position,
  size,
  color,
  rotation,
  studs = true,
  castShadow = true,
  receiveShadow = true,
  materialOpts,
}) => {
  const [w, hBricks, d] = size;
  const height = hBricks * BRICK_H;
  const boxW = Math.max(0.06, w * STUD_UNIT - BRICK_GAP);
  const boxH = Math.max(0.06, height - BRICK_GAP);
  const boxD = Math.max(0.06, d * STUD_UNIT - BRICK_GAP);
  const radius = Math.min(0.05, boxW * 0.22, boxH * 0.22, boxD * 0.22);

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

  const studPositions = useMemo<Vec3[]>(() => {
    if (!studs) return [];
    const cols = w >= 0.7 && w < 1 ? 1 : Math.floor(w + 0.05);
    const rows = d >= 0.7 && d < 1 ? 1 : Math.floor(d + 0.05);
    if (cols <= 0 || rows <= 0) return [];

    const pts: Vec3[] = [];
    const halfX = (cols - 1) * 0.5 * STUD_UNIT;
    const halfZ = (rows - 1) * 0.5 * STUD_UNIT;

    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        pts.push([ix * STUD_UNIT - halfX, height, iz * STUD_UNIT - halfZ]);
      }
    }
    return pts;
  }, [studs, w, d, height]);

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
      {studPositions.length > 0 && (
        <Studs
          positions={studPositions}
          color={color}
          materialOpts={materialOpts}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
    </group>
  );
};
