import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface ApplianceProps {
  position?: Vec3;
  rotation?: Vec3;
}

const burnerGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.08, 12);
const burnerCoreGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10);
const knobGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10);
const ovenHandleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8);
const panBodyGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.14, 12);
const panHandleGeo = new THREE.BoxGeometry(0.45, 0.06, 0.09);
const faucetPostGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.52, 8);
const faucetSpoutGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8);
const soapGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.26, 8);

/** LEGO Stove with 4 black burners + oven with dark glass door, silver handle & red frying pan (front faces +Z) */
export const StoveOven: React.FC<ApplianceProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black, { roughness: 0.35 }), []);
  const darkGrayMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.65, roughness: 0.18 }), []);
  const glassMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black, { roughness: 0.1, metalness: 0.35 }), []);
  const redPanMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const yellowFoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.warmYellow), []);

  const burnerCoords: [number, number][] = [
    [-0.45, -0.28],
    [0.45, -0.28],
    [-0.45, 0.32],
    [0.45, 0.32],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Base plinth */}
      <Tile position={[0, 0, -0.05]} size={[1.82, 1.32]} height={0.18} color={LEGO_COLORS.darkGray} />

      {/* Main white stove chassis */}
      <Tile position={[0, 0.18, 0]} size={[1.9, 1.4]} height={1.58} color={LEGO_COLORS.white} />

      {/* Dark metallic cooktop surface */}
      <Tile position={[0, 1.76, 0.02]} size={[1.92, 1.44]} height={0.14} color={LEGO_COLORS.silver} materialOpts={{ metalness: 0.4, roughness: 0.25 }} />

      {/* Back splash control riser */}
      <Tile position={[0, 1.9, -0.6]} size={[1.9, 0.2]} height={0.46} color={LEGO_COLORS.white} />
      <Tile position={[0, 2.04, -0.49]} size={[0.56, 0.04]} height={0.2} color={LEGO_COLORS.black} />

      {/* 4 Black Stove Burners */}
      {burnerCoords.map(([bx, bz], i) => (
        <group key={i} position={[bx, 1.93, bz]}>
          <mesh geometry={burnerGeo} material={blackMat} castShadow />
          <mesh geometry={burnerCoreGeo} material={darkGrayMat} position={[0, 0.02, 0]} />
        </group>
      ))}

      {/* Cute red LEGO frying pan with sunny-side egg / fried rice on front-left burner */}
      <group position={[-0.45, 2.02, 0.32]} rotation={[0, 0.45, 0]}>
        <mesh geometry={panBodyGeo} material={redPanMat} castShadow />
        <mesh geometry={panHandleGeo} material={blackMat} position={[0.45, 0.04, 0]} />
        <mesh geometry={burnerCoreGeo} material={yellowFoodMat} position={[0, 0.04, 0]} />
      </group>

      {/* Oven door frame & dark glossy glass window */}
      <Tile position={[0, 0.28, 0.72]} size={[1.66, 0.08]} height={1.12} color={LEGO_COLORS.offWhite} />
      <mesh material={glassMat} position={[0, 0.82, 0.77]}>
        <boxGeometry args={[1.34, 0.72, 0.05]} />
      </mesh>

      {/* Horizontal silver oven handle */}
      <mesh
        geometry={ovenHandleGeo}
        material={silverMat}
        position={[0, 1.32, 0.85]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />

      {/* Four stove control knobs across front control bezel */}
      {[-0.6, -0.2, 0.2, 0.6].map((kx) => (
        <mesh
          key={kx}
          geometry={knobGeo}
          material={blackMat}
          position={[kx, 1.6, 0.75]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
};

/** LEGO Kitchen Sink Counter Unit with stainless basin & silver gooseneck faucet (front faces +Z) */
export const KitchenSink: React.FC<ApplianceProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const chromeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.72, roughness: 0.16 }), []);
  const basinMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray, { metalness: 0.55, roughness: 0.25 }), []);
  const soapMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Toe kick */}
      <Tile position={[0, 0, -0.06]} size={[2.12, 1.24]} height={0.2} color={LEGO_COLORS.darkGray} />

      {/* Lower white cabinet box */}
      <Tile position={[0, 0.2, 0]} size={[2.2, 1.35]} height={1.52} color={LEGO_COLORS.white} />

      {/* Double cabinet doors under sink */}
      <Tile position={[-0.52, 0.28, 0.7]} size={[0.96, 0.06]} height={1.34} color={LEGO_COLORS.offWhite} />
      <Tile position={[0.52, 0.28, 0.7]} size={[0.96, 0.06]} height={1.34} color={LEGO_COLORS.offWhite} />
      <Tile position={[-0.14, 1.12, 0.75]} size={[0.06, 0.06]} height={0.3} color={LEGO_COLORS.silver} />
      <Tile position={[0.14, 1.12, 0.75]} size={[0.06, 0.06]} height={0.3} color={LEGO_COLORS.silver} />

      {/* Countertop rim surrounding recessed sink */}
      <Tile position={[0, 1.72, 0.04]} size={[2.28, 1.46]} height={0.18} color={LEGO_COLORS.lightGray} />

      {/* Stainless steel sink rim & recessed basin */}
      <Tile position={[0, 1.88, 0.06]} size={[1.48, 1.04]} height={0.06} color={LEGO_COLORS.silver} materialOpts={{ metalness: 0.65, roughness: 0.2 }} />
      <mesh material={basinMat} position={[0, 1.93, 0.06]}>
        <boxGeometry args={[1.26, 0.04, 0.82]} />
      </mesh>

      {/* Silver faucet assembly */}
      <group position={[0, 1.9, -0.48]}>
        <mesh geometry={faucetPostGeo} material={chromeMat} position={[0, 0.26, 0]} castShadow />
        <mesh geometry={faucetSpoutGeo} material={chromeMat} position={[0, 0.5, 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        {/* Downward nozzle tip */}
        <mesh geometry={knobGeo} material={chromeMat} position={[0, 0.44, 0.32]} />
        {/* Hot & cold handles */}
        <mesh geometry={knobGeo} material={chromeMat} position={[-0.22, 0.08, 0.02]} />
        <mesh geometry={knobGeo} material={chromeMat} position={[0.22, 0.08, 0.02]} />
      </group>

      {/* Dish soap bottle & yellow sponge */}
      <mesh geometry={soapGeo} material={soapMat} position={[0.88, 2.03, -0.35]} castShadow />
      <Tile position={[-0.86, 1.9, -0.32]} size={[0.26, 0.18]} height={0.1} color={LEGO_COLORS.yellow} />
    </group>
  );
};
