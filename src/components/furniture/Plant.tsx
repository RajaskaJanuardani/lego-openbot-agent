import React, { useMemo } from 'react';
import * as THREE from 'three';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface PlantProps {
  position?: Vec3;
  rotation?: Vec3;
  potColor?: string;
  scale?: number;
  variant?: 'tropical' | 'flowering' | 'compact';
  flowerColor?: string;
}

const potBodyGeo = new THREE.CylinderGeometry(0.46, 0.34, 0.72, 10);
const potRimGeo = new THREE.CylinderGeometry(0.52, 0.48, 0.16, 10);
const soilGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 10);
const stemGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6);
const leafGeo = new THREE.BoxGeometry(0.36, 0.07, 0.72);
const bushBallGeo = new THREE.DodecahedronGeometry(0.34, 0);
const flowerHeadGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.1, 6);
const flowerCenterGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.13, 6);

/** Reusable procedural LEGO potted tropical plant / terrace flower pot */
export const PottedPlant: React.FC<PlantProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  potColor = LEGO_COLORS.yellow,
  scale = 1,
  variant = 'tropical',
  flowerColor = LEGO_COLORS.pinkCushion,
}) => {
  const potMat = useMemo(() => getLegoMaterial(potColor), [potColor]);
  const soilMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood, { roughness: 0.6 }), []);
  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.green), []);
  const brightGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brightGreen), []);
  const darkGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGreen), []);
  const flowerMat = useMemo(() => getLegoMaterial(flowerColor), [flowerColor]);
  const centerMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);

  const leafAngles = [0, 1.05, 2.1, 3.15, 4.2, 5.25];

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Tapered LEGO planter pot */}
      <mesh geometry={potBodyGeo} material={potMat} position={[0, 0.36, 0]} castShadow receiveShadow />
      <mesh geometry={potRimGeo} material={potMat} position={[0, 0.74, 0]} castShadow receiveShadow />
      <mesh geometry={soilGeo} material={soilMat} position={[0, 0.78, 0]} />

      {variant === 'tropical' && (
        <group position={[0, 0.8, 0]}>
          {/* Tall tropical fan leaves bursting from center */}
          {leafAngles.map((ang, i) => {
            const mat = i % 3 === 0 ? darkGreenMat : i % 3 === 1 ? greenMat : brightGreenMat;
            const tilt = i % 2 === 0 ? 0.55 : 0.32;
            const stemH = i % 2 === 0 ? 0.75 : 1.08;
            return (
              <group key={i} rotation={[0, ang, 0]}>
                <mesh
                  geometry={stemGeo}
                  material={greenMat}
                  position={[0, stemH * 0.45, 0.14]}
                  rotation={[tilt * 0.45, 0, 0]}
                  scale={[1, stemH / 0.9, 1]}
                />
                <mesh
                  geometry={leafGeo}
                  material={mat}
                  position={[0, stemH * 0.92, 0.42]}
                  rotation={[tilt, 0, 0]}
                  castShadow
                />
              </group>
            );
          })}
          {/* Center tall shoot */}
          <mesh geometry={stemGeo} material={brightGreenMat} position={[0, 0.65, 0]} scale={[1.1, 1.35, 1.1]} />
          <mesh geometry={leafGeo} material={brightGreenMat} position={[0, 1.28, 0.16]} rotation={[0.25, 0.3, 0]} castShadow />
        </group>
      )}

      {variant === 'flowering' && (
        <group position={[0, 0.8, 0]}>
          {/* Lush clustered LEGO foliage */}
          <mesh geometry={bushBallGeo} material={greenMat} position={[0, 0.28, 0]} scale={[1.25, 0.95, 1.25]} castShadow />
          <mesh geometry={bushBallGeo} material={brightGreenMat} position={[-0.24, 0.36, 0.16]} scale={[0.85, 0.8, 0.85]} castShadow />
          <mesh geometry={bushBallGeo} material={darkGreenMat} position={[0.22, 0.32, -0.15]} scale={[0.9, 0.85, 0.9]} castShadow />
          {/* Vibrant LEGO stud flowers blooming on top */}
          {[
            [-0.22, 0.64, 0.18],
            [0.24, 0.6, -0.12],
            [0.02, 0.72, 0.04],
            [-0.12, 0.56, -0.24],
            [0.2, 0.54, 0.22],
          ].map(([fx, fy, fz], idx) => (
            <group key={idx} position={[fx, fy, fz]}>
              <mesh geometry={flowerHeadGeo} material={flowerMat} castShadow />
              <mesh geometry={flowerCenterGeo} material={centerMat} position={[0, 0.02, 0]} />
            </group>
          ))}
        </group>
      )}

      {variant === 'compact' && (
        <group position={[0, 0.78, 0]}>
          <mesh geometry={bushBallGeo} material={brightGreenMat} position={[0, 0.26, 0]} scale={[1.0, 1.05, 1.0]} castShadow />
          <mesh geometry={bushBallGeo} material={greenMat} position={[0.18, 0.38, 0.1]} scale={[0.68, 0.72, 0.68]} castShadow />
          <mesh geometry={bushBallGeo} material={darkGreenMat} position={[-0.16, 0.4, -0.08]} scale={[0.65, 0.75, 0.65]} castShadow />
        </group>
      )}
    </group>
  );
};
