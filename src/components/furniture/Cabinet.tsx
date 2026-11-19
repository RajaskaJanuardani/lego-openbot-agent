import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface CabinetProps {
  position?: Vec3;
  rotation?: Vec3;
  width?: number;
  depth?: number;
  height?: number;
  color?: string;
  counterColor?: string;
  doors?: number;
}

const knobGeo = new THREE.SphereGeometry(0.06, 8, 8);
const handleBarGeo = new THREE.BoxGeometry(0.06, 0.32, 0.08);
const miniPotGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.24, 8);
const miniLeafGeo = new THREE.DodecahedronGeometry(0.22, 0);

/** Lower white LEGO kitchen cabinet with countertop & chrome handles (front faces +Z) */
export const KitchenLowerCabinet: React.FC<CabinetProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2.0,
  depth = 1.35,
  height = 1.9,
  color = LEGO_COLORS.white,
  counterColor = LEGO_COLORS.lightGray,
  doors = 2,
}) => {
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.55, roughness: 0.22 }), []);
  const doorWidth = (width - 0.16 - (doors - 1) * 0.08) / doors;

  return (
    <group position={position} rotation={rotation}>
      {/* Toe kick recess */}
      <Tile position={[0, 0, -0.06]} size={[width - 0.08, depth - 0.14]} height={0.2} color={LEGO_COLORS.darkGray} />

      {/* Main cabinet body */}
      <Tile position={[0, 0.2, 0]} size={[width, depth]} height={height - 0.38} color={color} />

      {/* Countertop overhang */}
      <Tile position={[0, height - 0.18, 0.04]} size={[width + 0.08, depth + 0.12]} height={0.18} color={counterColor} />

      {/* Door panels & silver handles */}
      {Array.from({ length: doors }).map((_, i) => {
        const dx = -width / 2 + 0.08 + doorWidth / 2 + i * (doorWidth + 0.08);
        return (
          <group key={i}>
            <Tile
              position={[dx, 0.28, depth / 2 + 0.03]}
              size={[doorWidth, 0.06]}
              height={height - 0.56}
              color={LEGO_COLORS.offWhite}
            />
            <mesh
              geometry={handleBarGeo}
              material={silverMat}
              position={[dx + (i % 2 === 0 ? doorWidth * 0.3 : -doorWidth * 0.3), height * 0.62, depth / 2 + 0.09]}
            />
          </group>
        );
      })}
    </group>
  );
};

/** Upper wall-mounted white LEGO kitchen cabinet (front faces +Z) */
export const KitchenUpperCabinet: React.FC<CabinetProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2.0,
  depth = 0.85,
  height = 1.75,
  color = LEGO_COLORS.white,
  doors = 2,
}) => {
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.55, roughness: 0.22 }), []);
  const doorWidth = (width - 0.14 - (doors - 1) * 0.08) / doors;

  return (
    <group position={position} rotation={rotation}>
      <Tile position={[0, 0, 0]} size={[width, depth]} height={height} color={color} />
      {/* Crown molding strip */}
      <Tile position={[0, height, 0.04]} size={[width + 0.08, depth + 0.08]} height={0.14} color={LEGO_COLORS.offWhite} />

      {Array.from({ length: doors }).map((_, i) => {
        const dx = -width / 2 + 0.07 + doorWidth / 2 + i * (doorWidth + 0.08);
        return (
          <group key={i}>
            <Tile
              position={[dx, 0.1, depth / 2 + 0.03]}
              size={[doorWidth, 0.06]}
              height={height - 0.2}
              color={LEGO_COLORS.offWhite}
            />
            <mesh
              geometry={knobGeo}
              material={silverMat}
              position={[dx + (i % 2 === 0 ? doorWidth * 0.3 : -doorWidth * 0.3), 0.35, depth / 2 + 0.09]}
            />
          </group>
        );
      })}
    </group>
  );
};

/** Rattan sideboard / buffet for Living Room (front faces +Z) */
export const RattanSideboard: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35, roughness: 0.25 }), []);
  const vaseMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Legs */}
      <Tile position={[-1.25, 0, -0.45]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
      <Tile position={[1.25, 0, -0.45]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
      <Tile position={[-1.25, 0, 0.45]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
      <Tile position={[1.25, 0, 0.45]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />

      {/* Main wood carcass */}
      <Brick position={[0, 0.42, 0]} size={[2.8, 1.15, 1.1]} color={LEGO_COLORS.brownWood} studs={false} />

      {/* 3 woven rattan cabinet doors */}
      {[-0.86, 0, 0.86].map((dx, i) => (
        <group key={i}>
          <Tile position={[dx, 0.52, 0.57]} size={[0.74, 0.07]} height={1.16} color={LEGO_COLORS.rattan} />
          {/* Horizontal weave accent lines */}
          <Tile position={[dx, 0.85, 0.61]} size={[0.64, 0.03]} height={0.07} color={LEGO_COLORS.brownWood} />
          <Tile position={[dx, 1.25, 0.61]} size={[0.64, 0.03]} height={0.07} color={LEGO_COLORS.brownWood} />
          <mesh geometry={knobGeo} material={goldMat} position={[dx + 0.24, 1.12, 0.64]} />
        </group>
      ))}

      {/* Smooth tabletop */}
      <Tile position={[0, 1.8, 0]} size={[2.92, 1.2]} height={0.18} color={LEGO_COLORS.darkWood} />

      {/* Decorative ceramic vase & framed photo on top */}
      <mesh geometry={miniPotGeo} material={vaseMat} position={[-0.8, 2.14, 0]} scale={[1.2, 1.8, 1.2]} castShadow />
      <Tile position={[0.65, 1.98, -0.15]} size={[0.55, 0.12]} height={0.62} color={LEGO_COLORS.gold} rotation={[-0.15, -0.2, 0]} />
      <Tile position={[0.65, 2.06, -0.09]} size={[0.42, 0.05]} height={0.46} color={LEGO_COLORS.lightBlue} rotation={[-0.15, -0.2, 0]} />
    </group>
  );
};

/** Tall open wooden shelving unit with colorful LEGO books & mini potted plants (front faces +Z) */
export const ShelvingUnit: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const terracottaMat = useMemo(() => getLegoMaterial(LEGO_COLORS.terracotta), []);
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.green), []);
  const brightGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brightGreen), []);
  const darkGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGreen), []);

  const shelfYs = [0.2, 1.25, 2.3, 3.35, 4.35];

  return (
    <group position={position} rotation={rotation}>
      {/* Four vertical wooden uprights */}
      <Tile position={[-0.82, 0, -0.38]} size={[0.14, 0.14]} height={4.55} color={LEGO_COLORS.darkWood} />
      <Tile position={[0.82, 0, -0.38]} size={[0.14, 0.14]} height={4.55} color={LEGO_COLORS.darkWood} />
      <Tile position={[-0.82, 0, 0.38]} size={[0.14, 0.14]} height={4.55} color={LEGO_COLORS.darkWood} />
      <Tile position={[0.82, 0, 0.38]} size={[0.14, 0.14]} height={4.55} color={LEGO_COLORS.darkWood} />

      {/* Shelves */}
      {shelfYs.map((sy) => (
        <Tile key={sy} position={[0, sy, 0]} size={[1.76, 0.88]} height={0.14} color={LEGO_COLORS.brownWood} />
      ))}

      {/* Shelf 1: woven storage basket */}
      <Tile position={[0, 0.34, 0]} size={[1.2, 0.68]} height={0.62} color={LEGO_COLORS.rattan} />

      {/* Shelf 2: colorful LEGO books */}
      <Tile position={[-0.48, 1.39, 0]} size={[0.18, 0.56]} height={0.64} color={LEGO_COLORS.red} />
      <Tile position={[-0.28, 1.39, 0]} size={[0.16, 0.56]} height={0.72} color={LEGO_COLORS.royalBlue} />
      <Tile position={[-0.08, 1.39, 0]} size={[0.18, 0.56]} height={0.58} color={LEGO_COLORS.yellow} />
      <Tile position={[0.14, 1.39, 0]} size={[0.16, 0.56]} height={0.68} color={LEGO_COLORS.turquoise} />
      <Tile position={[0.48, 1.39, 0.02]} size={[0.38, 0.45]} height={0.35} color={LEGO_COLORS.creamWall} />

      {/* Shelf 3: two small potted plants */}
      <group position={[-0.4, 2.44, 0]}>
        <mesh geometry={miniPotGeo} material={terracottaMat} position={[0, 0.12, 0]} castShadow />
        <mesh geometry={miniLeafGeo} material={brightGreenMat} position={[0, 0.38, 0]} castShadow />
      </group>
      <group position={[0.38, 2.44, 0.04]}>
        <mesh geometry={miniPotGeo} material={whiteMat} position={[0, 0.12, 0]} castShadow />
        <mesh geometry={miniLeafGeo} material={greenMat} position={[0, 0.36, 0]} scale={[1.1, 0.85, 1.1]} castShadow />
      </group>

      {/* Shelf 4: trailing plant & yellow pot */}
      <group position={[0.35, 3.49, 0]}>
        <mesh geometry={miniPotGeo} material={yellowMat} position={[0, 0.12, 0]} castShadow />
        <mesh geometry={miniLeafGeo} material={darkGreenMat} position={[0, 0.38, 0]} castShadow />
        <mesh geometry={miniLeafGeo} material={brightGreenMat} position={[0.2, 0.25, 0.22]} scale={[0.6, 0.6, 0.6]} />
      </group>
      <Tile position={[-0.36, 3.49, 0]} size={[0.45, 0.45]} height={0.45} color={LEGO_COLORS.pinkCushion} />

      {/* Top shelf: lush leafy plant */}
      <group position={[0, 4.49, 0]}>
        <mesh geometry={miniPotGeo} material={terracottaMat} position={[0, 0.15, 0]} scale={[1.25, 1.25, 1.25]} castShadow />
        <mesh geometry={miniLeafGeo} material={greenMat} position={[-0.12, 0.48, 0.05]} scale={[1.1, 1.0, 1.1]} castShadow />
        <mesh geometry={miniLeafGeo} material={brightGreenMat} position={[0.14, 0.56, -0.04]} scale={[0.95, 1.1, 0.95]} castShadow />
      </group>
    </group>
  );
};
