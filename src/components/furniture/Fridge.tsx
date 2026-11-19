import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface FridgeProps {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}

const handleGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.05, 8);
const smallHandleGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.65, 8);
const magnetGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8);

/** Tall silver LEGO refrigerator (kulkas silver) with chrome handles, dispenser & colorful magnets (front faces +Z) */
export const Fridge: React.FC<FridgeProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.silver,
}) => {
  const chromeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white, { metalness: 0.72, roughness: 0.16 }), []);
  const darkScreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black, { roughness: 0.15, metalness: 0.2 }), []);
  const redMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const blueMat = useMemo(() => getLegoMaterial(LEGO_COLORS.lightBlue), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Base plinth */}
      <Tile position={[0, 0, 0]} size={[1.76, 1.48]} height={0.18} color={LEGO_COLORS.darkGray} />

      {/* Main metallic silver body */}
      <Brick
        position={[0, 0.18, 0]}
        size={[1.85, 3.85, 1.5]}
        color={color}
        studs={false}
        materialOpts={{ metalness: 0.45, roughness: 0.24 }}
      />

      {/* Smooth top cap */}
      <Tile
        position={[0, 4.8, 0]}
        size={[1.88, 1.54]}
        height={0.14}
        color={color}
        materialOpts={{ metalness: 0.45, roughness: 0.24 }}
      />

      {/* Lower main fridge door panel */}
      <Tile
        position={[0, 0.28, 0.78]}
        size={[1.72, 0.12]}
        height={2.85}
        color={LEGO_COLORS.lightGray}
        materialOpts={{ metalness: 0.48, roughness: 0.22 }}
      />

      {/* Upper freezer door panel */}
      <Tile
        position={[0, 3.24, 0.78]}
        size={[1.72, 0.12]}
        height={1.48}
        color={LEGO_COLORS.lightGray}
        materialOpts={{ metalness: 0.48, roughness: 0.22 }}
      />

      {/* Chrome vertical door handles */}
      <mesh geometry={handleGeo} material={chromeMat} position={[-0.64, 2.35, 0.92]} castShadow />
      <mesh geometry={smallHandleGeo} material={chromeMat} position={[-0.64, 3.85, 0.92]} castShadow />

      {/* Handle standoffs */}
      <Tile position={[-0.64, 2.75, 0.85]} size={[0.08, 0.12]} height={0.08} color={LEGO_COLORS.darkGray} />
      <Tile position={[-0.64, 1.9, 0.85]} size={[0.08, 0.12]} height={0.08} color={LEGO_COLORS.darkGray} />
      <Tile position={[-0.64, 4.1, 0.85]} size={[0.08, 0.12]} height={0.08} color={LEGO_COLORS.darkGray} />
      <Tile position={[-0.64, 3.55, 0.85]} size={[0.08, 0.12]} height={0.08} color={LEGO_COLORS.darkGray} />

      {/* Recessed water/ice dispenser panel */}
      <mesh material={darkScreenMat} position={[0.25, 2.2, 0.85]}>
        <boxGeometry args={[0.52, 0.72, 0.06]} />
      </mesh>
      <Tile position={[0.25, 2.48, 0.89]} size={[0.32, 0.03]} height={0.1} color={LEGO_COLORS.turquoise} />

      {/* Cute colorful LEGO stud fridge magnets & grocery note */}
      <Tile position={[0.28, 3.62, 0.85]} size={[0.42, 0.03]} height={0.48} color={LEGO_COLORS.creamWall} />
      <mesh geometry={magnetGeo} material={redMat} position={[0.28, 4.02, 0.88]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={magnetGeo} material={yellowMat} position={[-0.15, 3.72, 0.86]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={magnetGeo} material={blueMat} position={[0.55, 3.45, 0.86]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};
