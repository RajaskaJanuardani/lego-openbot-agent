import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Plate, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface TableProps {
  position?: Vec3;
  rotation?: Vec3;
  size?: [number, number]; // [width, depth]
  height?: number;
  color?: string;
  legColor?: string;
}

export const DiningTable: React.FC<TableProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [3.4, 2.2],
  height = 1.65,
  color = LEGO_COLORS.brownWood,
  legColor = LEGO_COLORS.darkWood,
}) => {
  const [w, d] = size;
  const legH = Math.max(0.4, height - 0.24);
  const legX = w / 2 - 0.28;
  const legZ = d / 2 - 0.28;

  return (
    <group position={position} rotation={rotation}>
      {/* Four sturdy legs */}
      <Tile position={[-legX, 0, -legZ]} size={[0.26, 0.26]} height={legH} color={legColor} />
      <Tile position={[legX, 0, -legZ]} size={[0.26, 0.26]} height={legH} color={legColor} />
      <Tile position={[-legX, 0, legZ]} size={[0.26, 0.26]} height={legH} color={legColor} />
      <Tile position={[legX, 0, legZ]} size={[0.26, 0.26]} height={legH} color={legColor} />

      {/* Under-table apron frame */}
      <Tile position={[0, legH - 0.2, 0]} size={[w - 0.36, d - 0.36]} height={0.22} color={legColor} />

      {/* Smooth tabletop */}
      <Tile position={[0, legH, 0]} size={[w, d]} height={0.24} color={color} />
    </group>
  );
};

export interface CoffeeTableProps {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}

const mugGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.22, 10);

export const CoffeeTable: React.FC<CoffeeTableProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.brownWood,
}) => {
  const turquoiseMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);

  return (
    <group position={position} rotation={rotation}>
      {/* 4 low angled/tapered wood legs */}
      <Tile position={[-1.08, 0, -0.52]} size={[0.22, 0.22]} height={0.82} color={LEGO_COLORS.darkWood} />
      <Tile position={[1.08, 0, -0.52]} size={[0.22, 0.22]} height={0.82} color={LEGO_COLORS.darkWood} />
      <Tile position={[-1.08, 0, 0.52]} size={[0.22, 0.22]} height={0.82} color={LEGO_COLORS.darkWood} />
      <Tile position={[1.08, 0, 0.52]} size={[0.22, 0.22]} height={0.82} color={LEGO_COLORS.darkWood} />

      {/* Lower slatted shelf */}
      <Tile position={[0, 0.28, 0]} size={[2.0, 0.92]} height={0.12} color={LEGO_COLORS.rattan} />

      {/* Main tabletop */}
      <Tile position={[0, 0.82, 0]} size={[2.5, 1.35]} height={0.2} color={color} />

      {/* Cute tabletop decor: colorful LEGO magazine & 2 tropical tea mugs */}
      <Tile position={[-0.55, 1.02, 0.08]} size={[0.72, 0.52]} height={0.07} color={LEGO_COLORS.orange} rotation={[0, 0.15, 0]} />
      <Tile position={[-0.52, 1.09, 0.05]} size={[0.62, 0.44]} height={0.06} color={LEGO_COLORS.yellow} rotation={[0, -0.1, 0]} />

      {/* Wooden serving coaster + mugs */}
      <Tile position={[0.58, 1.02, -0.05]} size={[0.85, 0.55]} height={0.06} color={LEGO_COLORS.rattan} />
      <mesh geometry={mugGeo} material={turquoiseMat} position={[0.38, 1.19, -0.05]} castShadow />
      <mesh geometry={mugGeo} material={whiteMat} position={[0.76, 1.19, -0.02]} castShadow />
    </group>
  );
};

export interface NightstandProps {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}

const knobGeo = new THREE.SphereGeometry(0.08, 8, 8);

export const Nightstand: React.FC<NightstandProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.darkWood,
}) => {
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35, roughness: 0.22 }), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Base legs */}
      <Plate position={[-0.45, 0, -0.42]} size={[0.2, 0.5, 0.2]} color={LEGO_COLORS.black} studs={false} />
      <Plate position={[0.45, 0, -0.42]} size={[0.2, 0.5, 0.2]} color={LEGO_COLORS.black} studs={false} />
      <Plate position={[-0.45, 0, 0.42]} size={[0.2, 0.5, 0.2]} color={LEGO_COLORS.black} studs={false} />
      <Plate position={[0.45, 0, 0.42]} size={[0.2, 0.5, 0.2]} color={LEGO_COLORS.black} studs={false} />

      {/* Cabinet box */}
      <Brick position={[0, 0.2, 0]} size={[1.15, 0.95, 1.05]} color={color} studs={false} />

      {/* Two drawer fronts */}
      <Tile position={[0, 0.3, 0.54]} size={[0.96, 0.08]} height={0.42} color={LEGO_COLORS.brownWood} />
      <Tile position={[0, 0.8, 0.54]} size={[0.96, 0.08]} height={0.42} color={LEGO_COLORS.brownWood} />

      {/* Gold drawer knobs */}
      <mesh geometry={knobGeo} material={goldMat} position={[0, 0.51, 0.6]} />
      <mesh geometry={knobGeo} material={goldMat} position={[0, 1.01, 0.6]} />

      {/* Smooth tabletop */}
      <Tile position={[0, 1.34, 0]} size={[1.25, 1.15]} height={0.16} color={LEGO_COLORS.brownWood} />
    </group>
  );
};

export interface FruitBowlProps {
  position?: Vec3;
}

const bowlGeo = new THREE.CylinderGeometry(0.46, 0.24, 0.28, 12);
const fruitSphereGeo = new THREE.SphereGeometry(0.14, 10, 8);
const smallFruitGeo = new THREE.SphereGeometry(0.11, 8, 8);

export const FruitBowl: React.FC<FruitBowlProps> = ({ position = [0, 0, 0] }) => {
  const bowlMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const redMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const orangeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.orange), []);
  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brightGreen), []);
  const purpleMat = useMemo(() => getLegoMaterial(LEGO_COLORS.purple), []);
  const warmYellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.warmYellow), []);

  return (
    <group position={position}>
      {/* Yellow LEGO fruit bowl */}
      <mesh geometry={bowlGeo} material={bowlMat} position={[0, 0.14, 0]} castShadow receiveShadow />
      {/* Colorful LEGO fruits piled inside */}
      <mesh geometry={fruitSphereGeo} material={redMat} position={[-0.14, 0.32, 0.06]} castShadow />
      <mesh geometry={fruitSphereGeo} material={orangeMat} position={[0.14, 0.32, 0.08]} castShadow />
      <mesh geometry={fruitSphereGeo} material={greenMat} position={[0.02, 0.33, -0.14]} castShadow />
      <mesh geometry={smallFruitGeo} material={purpleMat} position={[-0.16, 0.38, -0.1]} castShadow />
      <mesh geometry={smallFruitGeo} material={warmYellowMat} position={[0.14, 0.39, -0.1]} castShadow />
      <mesh geometry={fruitSphereGeo} material={redMat} position={[0.0, 0.44, 0.02]} castShadow />
    </group>
  );
};

export interface SmallKitchenCounterProps {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}

const pitcherGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.45, 10);

export const SmallKitchenCounter: React.FC<SmallKitchenCounterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.black,
}) => {
  const pitcherMat = useMemo(() => getLegoMaterial(LEGO_COLORS.lightBlue, { transparent: true, opacity: 0.72, roughness: 0.15 }), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Black metal/wood frame legs */}
      <Tile position={[-0.65, 0, -0.85]} size={[0.18, 0.18]} height={1.6} color={color} />
      <Tile position={[0.65, 0, -0.85]} size={[0.18, 0.18]} height={1.6} color={color} />
      <Tile position={[-0.65, 0, 0.85]} size={[0.18, 0.18]} height={1.6} color={color} />
      <Tile position={[0.65, 0, 0.85]} size={[0.18, 0.18]} height={1.6} color={color} />

      {/* Lower storage shelf */}
      <Tile position={[0, 0.45, 0]} size={[1.38, 1.75]} height={0.12} color={LEGO_COLORS.darkGray} />

      {/* Main black countertop */}
      <Tile position={[0, 1.6, 0]} size={[1.55, 1.95]} height={0.2} color={color} />

      {/* Serving accessories: white stacked plates & blue water pitcher */}
      <Tile position={[0.05, 1.8, -0.42]} size={[0.55, 0.55]} height={0.08} color={LEGO_COLORS.white} />
      <Tile position={[0.05, 1.89, -0.42]} size={[0.5, 0.5]} height={0.08} color={LEGO_COLORS.offWhite} />
      <mesh geometry={pitcherGeo} material={pitcherMat} position={[0, 2.02, 0.35]} castShadow />
      {/* Serving tray on bottom shelf */}
      <Tile position={[0, 0.57, 0]} size={[0.95, 1.1]} height={0.08} color={LEGO_COLORS.rattan} />
    </group>
  );
};
