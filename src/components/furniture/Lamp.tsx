import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial, getEmissiveMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

const cordGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10);
const domeShadeGeo = new THREE.CylinderGeometry(0.28, 0.65, 0.56, 12);
const bulbGeo = new THREE.SphereGeometry(0.2, 10, 8);
const lanternCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 8);
const lanternCapGeo = new THREE.ConeGeometry(0.28, 0.2, 8);
const ringShadeGeo = new THREE.CylinderGeometry(0.42, 0.56, 0.18, 12);

export interface PendantLampProps {
  position: Vec3;
  isNight: boolean;
  shadeColor?: string;
  variant?: 'standard' | 'colorful';
  cordLength?: number;
  lightIntensityDay?: number;
  lightIntensityNight?: number;
  lightDistance?: number;
  enableLight?: boolean;
}

/** Hanging LEGO pendant lamp with emissive glowing bulb & warm pointLight (brighter at night) */
export const PendantLamp: React.FC<PendantLampProps> = ({
  position,
  isNight,
  shadeColor = LEGO_COLORS.yellow,
  variant = 'standard',
  cordLength = 1.15,
  lightIntensityDay = 4,
  lightIntensityNight = 18,
  lightDistance = 14,
  enableLight = true,
}) => {
  const cordMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);
  const shadeMat = useMemo(() => getLegoMaterial(shadeColor), [shadeColor]);
  const redMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const turquoiseMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);
  const pinkMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkCushion), []);

  const bulbMat = useMemo(
    () => getEmissiveMaterial(LEGO_COLORS.warmYellow, isNight ? 3.2 : 0.7),
    [isNight]
  );

  const shadeY = -cordLength;

  return (
    <group position={position}>
      {/* Ceiling canopy cap */}
      <mesh geometry={capGeo} material={cordMat} position={[0, 0.07, 0]} />

      {/* Hanging cord rod */}
      <mesh
        geometry={cordGeo}
        material={cordMat}
        position={[0, -cordLength / 2, 0]}
        scale={[1, cordLength / 1.2, 1]}
      />

      {variant === 'colorful' ? (
        /* Multi-color stacked tropical LEGO pendant shade */
        <group position={[0, shadeY, 0]}>
          <mesh geometry={ringShadeGeo} material={redMat} position={[0, 0.2, 0]} scale={[0.7, 1, 0.7]} />
          <mesh geometry={ringShadeGeo} material={yellowMat} position={[0, 0.04, 0]} scale={[0.92, 1, 0.92]} />
          <mesh geometry={ringShadeGeo} material={turquoiseMat} position={[0, -0.12, 0]} scale={[1.1, 1, 1.1]} />
          <mesh geometry={ringShadeGeo} material={pinkMat} position={[0, -0.28, 0]} scale={[1.22, 0.9, 1.22]} />
          <mesh geometry={bulbGeo} material={bulbMat} position={[0, -0.34, 0]} />
        </group>
      ) : (
        /* Classic smooth LEGO dome pendant shade */
        <group position={[0, shadeY, 0]}>
          <mesh geometry={domeShadeGeo} material={shadeMat} position={[0, 0, 0]} />
          <mesh geometry={bulbGeo} material={bulbMat} position={[0, -0.26, 0]} />
        </group>
      )}

      {enableLight && (
        <pointLight
          position={[0, shadeY - 0.5, 0]}
          color="#FFD88A"
          intensity={isNight ? lightIntensityNight : lightIntensityDay}
          distance={lightDistance}
          decay={2}
        />
      )}
    </group>
  );
};

export interface BedsideLanternProps {
  position: Vec3;
  isNight: boolean;
  frameColor?: string;
  enableLight?: boolean;
}

/** Small glowing warm bedside LEGO lantern (lentera kecil) */
export const BedsideLantern: React.FC<BedsideLanternProps> = ({
  position,
  isNight,
  frameColor = LEGO_COLORS.darkWood,
  enableLight = false,
}) => {
  const frameMat = useMemo(() => getLegoMaterial(frameColor), [frameColor]);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35, roughness: 0.25 }), []);
  const glowMat = useMemo(
    () => getEmissiveMaterial(LEGO_COLORS.warmYellow, isNight ? 3.0 : 0.65),
    [isNight]
  );

  return (
    <group position={position}>
      {/* Base plate */}
      <Tile position={[0, 0, 0]} size={[0.48, 0.48]} height={0.12} color={frameColor} />
      {/* Glowing warm glass core */}
      <mesh geometry={lanternCoreGeo} material={glowMat} position={[0, 0.3, 0]} />
      {/* Corner lantern struts */}
      {[
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ].map(([lx, lz], i) => (
        <Tile key={i} position={[lx, 0.12, lz]} size={[0.06, 0.06]} height={0.38} color={frameColor} />
      ))}
      {/* Conical cap + gold ring */}
      <mesh geometry={lanternCapGeo} material={frameMat} position={[0, 0.6, 0]} />
      <mesh geometry={bulbGeo} material={goldMat} position={[0, 0.73, 0]} scale={[0.32, 0.32, 0.32]} />

      {enableLight && (
        <pointLight
          position={[0, 0.65, 0]}
          color="#FFD27F"
          intensity={isNight ? 15 : 3}
          distance={12}
          decay={2}
        />
      )}
    </group>
  );
};

export interface WallSconceProps {
  position: Vec3;
  rotation?: Vec3;
  isNight: boolean;
  mountColor?: string;
  enableLight?: boolean;
  lightIntensityNight?: number;
  lightIntensityDay?: number;
  lightDistance?: number;
}

/** Warm glowing LEGO wall sconce (lampu dinding) — backplate faces -Z, bulb extends +Z */
export const WallSconce: React.FC<WallSconceProps> = ({
  position,
  rotation = [0, 0, 0],
  isNight,
  mountColor = LEGO_COLORS.darkWood,
  enableLight = false,
  lightIntensityNight = 11,
  lightIntensityDay = 2,
  lightDistance = 10,
}) => {
  const glowMat = useMemo(
    () => getEmissiveMaterial(LEGO_COLORS.warmYellow, isNight ? 2.8 : 0.6),
    [isNight]
  );
  const capMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.4, roughness: 0.25 }), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Wall backplate */}
      <Tile position={[0, -0.25, 0]} size={[0.38, 0.1]} height={0.62} color={mountColor} />
      {/* Horizontal bracket arm */}
      <Tile position={[0, -0.05, 0.18]} size={[0.14, 0.34]} height={0.12} color={LEGO_COLORS.gold} />
      {/* Glowing vertical glass lantern cylinder */}
      <mesh geometry={lanternCoreGeo} material={glowMat} position={[0, 0.22, 0.3]} scale={[0.85, 1.05, 0.85]} />
      <mesh geometry={lanternCapGeo} material={capMat} position={[0, 0.46, 0.3]} scale={[0.8, 0.75, 0.8]} />

      {enableLight && (
        <pointLight
          position={[0, 0.25, 0.75]}
          color="#FFD98E"
          intensity={isNight ? lightIntensityNight : lightIntensityDay}
          distance={lightDistance}
          decay={2}
        />
      )}
    </group>
  );
};
