import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Plate, Tile, Studs } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface BedProps {
  position?: Vec3;
  rotation?: Vec3;
  woodColor?: string;
  spreadColor?: string;
}

const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 5.2, 10);
const finialGeo = new THREE.SphereGeometry(0.24, 10, 8);
const pillowGeo = new THREE.BoxGeometry(1.4, 0.34, 0.9);

export const Bed: React.FC<BedProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  woodColor = LEGO_COLORS.darkWood,
  spreadColor = LEGO_COLORS.royalBlue,
}) => {
  const woodMat = useMemo(() => getLegoMaterial(woodColor), [woodColor]);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { roughness: 0.25, metalness: 0.3 }), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white, { roughness: 0.38 }), []);

  const cornerPosts: [number, number][] = [
    [-2.15, -2.55],
    [2.15, -2.55],
    [-2.15, 2.55],
    [2.15, 2.55],
  ];

  const pillowStuds: Vec3[] = [
    [-1.05, 1.72, -1.65],
    [-0.55, 1.72, -1.65],
    [0.55, 1.72, -1.65],
    [1.05, 1.72, -1.65],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Dark wood bed base platform (footprint ~4.6 x 5.4 studs) */}
      <Brick position={[0, 0.25, 0]} size={[4.5, 0.7, 5.3]} color={woodColor} studs={false} />

      {/* Four short corner feet under platform */}
      {cornerPosts.map(([px, pz], idx) => (
        <Plate key={`foot-${idx}`} position={[px, 0, pz]} size={[0.45, 0.7, 0.45]} color={LEGO_COLORS.black} studs={false} />
      ))}

      {/* Ornate tall headboard at north (-Z) */}
      <Brick position={[0, 1.05, -2.52]} size={[4.2, 1.5, 0.28]} color={woodColor} studs={false} />
      <Tile position={[0, 2.85, -2.52]} size={[4.3, 0.34]} height={0.22} color={LEGO_COLORS.brownWood} />
      {/* Carved headboard trim */}
      <Tile position={[0, 1.55, -2.36]} size={[3.4, 0.08]} height={0.95} color={LEGO_COLORS.brownWood} />
      <Tile position={[0, 1.75, -2.3]} size={[2.2, 0.08]} height={0.55} color={LEGO_COLORS.gold} />

      {/* Low footboard at south (+Z) */}
      <Brick position={[0, 1.05, 2.52]} size={[4.2, 0.55, 0.26]} color={woodColor} studs={false} />
      <Tile position={[0, 1.71, 2.52]} size={[4.3, 0.32]} height={0.18} color={LEGO_COLORS.brownWood} />

      {/* Crisp white mattress layer */}
      <Tile position={[0, 1.08, 0]} size={[4.15, 4.75]} height={0.35} color={LEGO_COLORS.white} />

      {/* Royal blue LEGO bedspread covering main body */}
      <Tile position={[0, 1.38, 0.48]} size={[4.22, 3.85]} height={0.3} color={spreadColor} />
      {/* Folded-over top sheet edge in light blue */}
      <Tile position={[0, 1.48, -1.25]} size={[4.22, 0.55]} height={0.24} color={LEGO_COLORS.lightBlue} />
      {/* Decorative patterned blanket runner at foot of bed */}
      <Tile position={[0, 1.66, 1.65]} size={[4.26, 1.1]} height={0.1} color={LEGO_COLORS.navyBlue} />
      <Tile position={[0, 1.72, 1.65]} size={[4.28, 0.28]} height={0.08} color={LEGO_COLORS.gold} />

      {/* Subtle LEGO studs along bedspread borders for LEGO brick feel */}
      <Plate position={[0, 1.68, 0.45]} size={[3.6, 0.06, 0.2]} color={spreadColor} studs={false} />

      {/* Two plump white LEGO pillows */}
      <mesh geometry={pillowGeo} material={whiteMat} position={[-0.95, 1.6, -1.78]} rotation={[0.14, 0.05, 0]} castShadow receiveShadow />
      <mesh geometry={pillowGeo} material={whiteMat} position={[0.95, 1.6, -1.78]} rotation={[0.14, -0.05, 0]} castShadow receiveShadow />
      <Studs positions={pillowStuds} color={LEGO_COLORS.white} />

      {/* Four tall canopy corner posts */}
      {cornerPosts.map(([px, pz], idx) => (
        <group key={`post-${idx}`}>
          {/* Square base collar */}
          <Brick position={[px, 0.25, pz]} size={[0.42, 1.1, 0.42]} color={woodColor} studs={false} />
          {/* Turned tall cylindrical post */}
          <mesh geometry={postGeo} material={woodMat} position={[px, 2.85, pz]} castShadow receiveShadow />
          {/* Decorative gold accent ring near top */}
          <Plate position={[px, 4.95, pz]} size={[0.42, 0.3, 0.42]} color={LEGO_COLORS.gold} studs={false} />
          {/* Finial orb on top */}
          <mesh geometry={finialGeo} material={goldMat} position={[px, 5.65, pz]} castShadow />
        </group>
      ))}

      {/* Top horizontal canopy frame beams */}
      <Tile position={[0, 5.18, -2.55]} size={[4.5, 0.28]} height={0.26} color={woodColor} />
      <Tile position={[0, 5.18, 2.55]} size={[4.5, 0.28]} height={0.26} color={woodColor} />
      <Tile position={[-2.15, 5.18, 0]} size={[0.28, 5.3]} height={0.26} color={woodColor} />
      <Tile position={[2.15, 5.18, 0]} size={[0.28, 5.3]} height={0.26} color={woodColor} />

      {/* Light cream sheer canopy valance trim along top beams */}
      <Tile position={[0, 4.92, -2.55]} size={[3.9, 0.14]} height={0.26} color={LEGO_COLORS.creamWall} />
      <Tile position={[0, 4.92, 2.55]} size={[3.9, 0.14]} height={0.26} color={LEGO_COLORS.creamWall} />
      <Tile position={[-2.15, 4.92, 0]} size={[0.14, 4.7]} height={0.26} color={LEGO_COLORS.creamWall} />
      <Tile position={[2.15, 4.92, 0]} size={[0.14, 4.7]} height={0.26} color={LEGO_COLORS.creamWall} />
    </group>
  );
};
