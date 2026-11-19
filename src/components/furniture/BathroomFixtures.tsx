import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

const bowlGeo = new THREE.CylinderGeometry(0.42, 0.3, 0.65, 12);
const seatRingGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 12);
const pedestalGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.18, 10);
const sinkBasinGeo = new THREE.CylinderGeometry(0.46, 0.34, 0.34, 12);
const faucetGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 8);
const bottleGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.24, 8);
const tpRollGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 10);

/** Compact white LEGO toilet with tank, flush lever, rounded seat & TP holder (front faces +Z) */
export const Toilet: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const offWhiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.offWhite), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.65, roughness: 0.2 }), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Floor base plinth */}
      <Tile position={[0, 0, 0.12]} size={[0.72, 0.96]} height={0.14} color={LEGO_COLORS.white} />
      {/* Ceramic bowl */}
      <mesh geometry={bowlGeo} material={whiteMat} position={[0, 0.44, 0.22]} castShadow receiveShadow />
      {/* Seat & lid */}
      <mesh geometry={seatRingGeo} material={offWhiteMat} position={[0, 0.8, 0.22]} castShadow />
      {/* Rear flush tank */}
      <Brick position={[0, 0.6, -0.28]} size={[0.92, 0.9, 0.42]} color={LEGO_COLORS.white} studs={false} />
      <Tile position={[0, 1.68, -0.28]} size={[0.98, 0.48]} height={0.12} color={LEGO_COLORS.offWhite} />
      {/* Silver flush handle */}
      <Tile position={[0.48, 1.46, -0.22]} size={[0.16, 0.08]} height={0.07} color={LEGO_COLORS.silver} />
      {/* Tiny TP roll on side */}
      <mesh geometry={tpRollGeo} material={whiteMat} position={[-0.58, 0.95, 0.05]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={faucetGeo} material={silverMat} position={[-0.58, 0.95, -0.05]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

/** Compact white LEGO pedestal sink with chrome faucet & framed mirror above (front faces +Z) */
export const PedestalSink: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.7, roughness: 0.16 }), []);
  const mirrorMat = useMemo(() => getLegoMaterial(LEGO_COLORS.lightBlue, { metalness: 0.72, roughness: 0.08 }), []);
  const soapMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkCushion), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Floor base & vertical pedestal */}
      <Tile position={[0, 0, 0.06]} size={[0.56, 0.56]} height={0.14} color={LEGO_COLORS.white} />
      <mesh geometry={pedestalGeo} material={whiteMat} position={[0, 0.72, 0.06]} castShadow receiveShadow />
      {/* Sink basin */}
      <mesh geometry={sinkBasinGeo} material={whiteMat} position={[0, 1.44, 0.1]} castShadow receiveShadow />
      <Tile position={[0, 1.54, 0.12]} size={[0.54, 0.42]} height={0.08} color={LEGO_COLORS.mintLight} />

      {/* Chrome faucet */}
      <mesh geometry={faucetGeo} material={silverMat} position={[0, 1.72, -0.2]} />
      <Tile position={[0, 1.82, -0.08]} size={[0.08, 0.24]} height={0.07} color={LEGO_COLORS.silver} />
      {/* Pink hand soap */}
      <mesh geometry={bottleGeo} material={soapMat} position={[0.3, 1.72, -0.16]} />

      {/* Mounted white-framed bathroom mirror above sink */}
      <group position={[0, 2.75, -0.34]}>
        <Tile position={[0, -0.68, 0]} size={[1.18, 0.1]} height={1.36} color={LEGO_COLORS.white} />
        <mesh material={mirrorMat} position={[0, 0, 0.06]}>
          <boxGeometry args={[0.96, 1.14, 0.05]} />
        </mesh>
      </group>
    </group>
  );
};

/** Small bathroom wall shelf (rak kecil) with colorful soap bricks & folded towels (front faces +Z) */
export const BathroomWallShelf: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const turquoiseMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Main white LEGO wall shelf + support brackets */}
      <Tile position={[0, 0, 0.22]} size={[1.55, 0.46]} height={0.12} color={LEGO_COLORS.white} />
      <Tile position={[-0.58, -0.22, 0.14]} size={[0.1, 0.3]} height={0.22} color={LEGO_COLORS.silver} />
      <Tile position={[0.58, -0.22, 0.14]} size={[0.1, 0.3]} height={0.22} color={LEGO_COLORS.silver} />

      {/* Folded pink & mint LEGO towels */}
      <Tile position={[-0.36, 0.12, 0.22]} size={[0.52, 0.36]} height={0.14} color={LEGO_COLORS.pinkCushion} />
      <Tile position={[-0.36, 0.26, 0.22]} size={[0.48, 0.34]} height={0.14} color={LEGO_COLORS.mintTile} />

      {/* Colorful tiny soap bricks & shampoo bottles */}
      <Tile position={[0.18, 0.12, 0.24]} size={[0.24, 0.18]} height={0.12} color={LEGO_COLORS.orange} />
      <mesh geometry={bottleGeo} material={yellowMat} position={[0.45, 0.24, 0.2]} />
      <mesh geometry={bottleGeo} material={turquoiseMat} position={[0.64, 0.26, 0.22]} scale={[0.9, 1.15, 0.9]} />
    </group>
  );
};

/** Mint & white ceramic tile wainscot accent band along a bathroom wall (front faces +Z) */
export const BathroomWainscot: React.FC<{ position?: Vec3; rotation?: Vec3; length?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 3.2,
}) => {
  const tileCount = Math.max(2, Math.round(length / 0.65));
  const step = length / tileCount;

  return (
    <group position={position} rotation={rotation}>
      {/* Base mint wainscot strip */}
      <Tile position={[0, 0.02, 0]} size={[length, 0.08]} height={1.85} color={LEGO_COLORS.mintLight} />
      {/* Checker accent ceramic tiles along top band */}
      {Array.from({ length: tileCount }).map((_, i) => {
        const x = -length / 2 + (i + 0.5) * step;
        return (
          <Tile
            key={i}
            position={[x, 1.5, 0.04]}
            size={[step - 0.04, 0.06]}
            height={0.34}
            color={i % 2 === 0 ? LEGO_COLORS.mintTile : LEGO_COLORS.white}
          />
        );
      })}
      {/* Crisp white top bullnose rail */}
      <Tile position={[0, 1.86, 0.05]} size={[length + 0.04, 0.12]} height={0.12} color={LEGO_COLORS.white} />
    </group>
  );
};
