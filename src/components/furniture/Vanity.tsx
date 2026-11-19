import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { Stool } from './Chair';
import type { Vec3 } from '../../types';

export interface VanityProps {
  position?: Vec3;
  rotation?: Vec3;
}

const knobGeo = new THREE.SphereGeometry(0.06, 8, 8);
const bottleGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.28, 8);
const capGeo = new THREE.SphereGeometry(0.06, 8, 8);

/** Carved dark-wood vanity dresser with reflective light-blue-silver mirror & cushioned stool (front faces +Z) */
export const Vanity: React.FC<VanityProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.42, roughness: 0.22 }), []);
  const mirrorMat = useMemo(
    () =>
      getLegoMaterial(LEGO_COLORS.lightBlue, {
        metalness: 0.75,
        roughness: 0.08,
      }),
    []
  );
  const pinkPerfumeMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.pinkCushion, { transparent: true, opacity: 0.85, roughness: 0.12 }),
    []
  );
  const turquoisePerfumeMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.turquoise, { transparent: true, opacity: 0.85, roughness: 0.12 }),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Left & Right carved side drawer pedestals */}
      <Brick position={[-1.08, 0.12, 0]} size={[0.78, 1.32, 1.1]} color={LEGO_COLORS.darkWood} studs={false} />
      <Brick position={[1.08, 0.12, 0]} size={[0.78, 1.32, 1.1]} color={LEGO_COLORS.darkWood} studs={false} />

      {/* Pedestal feet */}
      <Tile position={[-1.08, 0, 0]} size={[0.84, 1.16]} height={0.14} color={LEGO_COLORS.brownWood} />
      <Tile position={[1.08, 0, 0]} size={[0.84, 1.16]} height={0.14} color={LEGO_COLORS.brownWood} />

      {/* Drawer fronts + gold knobs */}
      {[-1.08, 1.08].map((dx) => (
        <group key={dx}>
          <Tile position={[dx, 0.26, 0.57]} size={[0.62, 0.06]} height={0.54} color={LEGO_COLORS.brownWood} />
          <Tile position={[dx, 0.96, 0.57]} size={[0.62, 0.06]} height={0.54} color={LEGO_COLORS.brownWood} />
          <mesh geometry={knobGeo} material={goldMat} position={[dx, 0.53, 0.63]} />
          <mesh geometry={knobGeo} material={goldMat} position={[dx, 1.23, 0.63]} />
        </group>
      ))}

      {/* Center knee-space drawer under desktop */}
      <Tile position={[0, 1.22, 0]} size={[1.4, 1.05]} height={0.48} color={LEGO_COLORS.darkWood} />
      <Tile position={[0, 1.28, 0.55]} size={[1.22, 0.06]} height={0.34} color={LEGO_COLORS.brownWood} />
      <mesh geometry={knobGeo} material={goldMat} position={[0, 1.45, 0.61]} />

      {/* Main tabletop */}
      <Tile position={[0, 1.7, 0.02]} size={[3.05, 1.24]} height={0.18} color={LEGO_COLORS.brownWood} />

      {/* Ornate carved dark-wood mirror backing & frame rising from rear of tabletop */}
      <Tile position={[0, 1.88, -0.48]} size={[2.2, 0.22]} height={2.35} color={LEGO_COLORS.darkWood} />
      {/* Carved crest crown on top of mirror */}
      <Tile position={[0, 4.23, -0.48]} size={[1.6, 0.24]} height={0.28} color={LEGO_COLORS.darkWood} />
      <Tile position={[0, 4.51, -0.48]} size={[0.92, 0.26]} height={0.22} color={LEGO_COLORS.gold} />
      {/* Gold inner molding frame */}
      <Tile position={[0, 2.02, -0.35]} size={[1.86, 0.06]} height={2.05} color={LEGO_COLORS.gold} />

      {/* Reflective light-blue-silver mirror glass surface */}
      <mesh material={mirrorMat} position={[0, 3.04, -0.3]}>
        <boxGeometry args={[1.64, 1.84, 0.06]} />
      </mesh>
      {/* Subtle diagonal specular highlight streak */}
      <Tile
        position={[-0.28, 2.95, -0.26]}
        size={[0.18, 0.02]}
        height={1.25}
        color={LEGO_COLORS.white}
        rotation={[0, 0, -0.32]}
        materialOpts={{ transparent: true, opacity: 0.35 }}
      />

      {/* Side jewelry/cosmetic mini cubbies */}
      <Tile position={[-1.25, 1.88, -0.36]} size={[0.45, 0.4]} height={0.32} color={LEGO_COLORS.gold} />
      {/* Perfume bottles on tabletop */}
      <group position={[0.92, 1.88, -0.1]}>
        <mesh geometry={bottleGeo} material={pinkPerfumeMat} position={[0, 0.14, 0]} castShadow />
        <mesh geometry={capGeo} material={goldMat} position={[0, 0.31, 0]} />
      </group>
      <group position={[1.22, 1.88, 0.08]}>
        <mesh geometry={bottleGeo} material={turquoisePerfumeMat} position={[0, 0.12, 0]} scale={[0.85, 0.85, 0.85]} castShadow />
        <mesh geometry={capGeo} material={goldMat} position={[0, 0.26, 0]} scale={[0.8, 0.8, 0.8]} />
      </group>
      {/* Little pink hand-mirror / brush tray */}
      <Tile position={[-0.78, 1.88, 0.18]} size={[0.48, 0.32]} height={0.07} color={LEGO_COLORS.pinkLight} />

      {/* Matching vanity stool tucked in front */}
      <Stool position={[0, 0, 1.15]} color={LEGO_COLORS.darkWood} cushionColor={LEGO_COLORS.pinkCushion} />
    </group>
  );
};
