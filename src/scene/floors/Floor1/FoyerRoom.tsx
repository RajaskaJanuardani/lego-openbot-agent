import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Brick, Plate, Tile } from '../../../components/lego';
import {
  CoffeeTable,
  PatternedRug,
  PottedPlant,
  RattanArmchair,
  Sofa,
} from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y } from '../../../lib/constants';
import { getEmissiveMaterial, getLegoMaterial } from '../../../lib/materials';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Procedural LEGO Flat-Screen TV + Wooden Media Console with lively animated screen glow!
 */
const LegoTvConsole: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bar1Ref = useRef<THREE.Mesh>(null);
  const bar2Ref = useRef<THREE.Mesh>(null);
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.4 }), []);
  const greenLedMat = useMemo(() => getEmissiveMaterial('#22C55E', 1.6), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (screenMatRef.current) {
      // Gentle color-shifting TV broadcast ambiance
      const hue = (0.55 + Math.sin(t * 0.55) * 0.14 + 1) % 1;
      screenMatRef.current.color.setHSL(hue, 0.72, 0.62);
      screenMatRef.current.emissive.setHSL(hue, 0.8, 0.52);
      screenMatRef.current.emissiveIntensity = isNight ? 1.25 : 0.65;
    }
    if (bar1Ref.current) {
      bar1Ref.current.position.x = Math.sin(t * 1.9) * 0.65;
    }
    if (bar2Ref.current) {
      bar2Ref.current.position.x = Math.cos(t * 1.45) * 0.52;
    }
  });

  return (
    <group name="foyer-tv-console" position={[10.8, FLOOR1_Y, 10.2]} rotation={[0, Math.PI, 0]}>
      {/* Wooden LEGO TV media cabinet (3.4 x 1.0 studs) */}
      <Brick position={[0, 0, 0]} size={[3.4, 0.95, 0.95]} color={LEGO_COLORS.darkWood} studs={false} />
      <Tile position={[0, 1.14, 0]} size={[3.5, 1.05]} height={0.14} color={LEGO_COLORS.brownWood} />
      {/* Media shelf recess & set-top box */}
      <Tile position={[-0.75, 0.42, 0.48]} size={[1.2, 0.08]} height={0.55} color={LEGO_COLORS.rattan} />
      <Tile position={[0.75, 0.42, 0.48]} size={[1.2, 0.08]} height={0.55} color={LEGO_COLORS.rattan} />
      <Brick position={[0.95, 1.28, 0.15]} size={[0.72, 0.2, 0.45]} color={LEGO_COLORS.black} studs={false} />
      <mesh position={[1.18, 1.4, 0.39]} material={greenLedMat}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
      </mesh>

      {/* TV Pedestal Base & Stand */}
      <Tile position={[0, 1.28, -0.08]} size={[1.1, 0.52]} height={0.1} color={LEGO_COLORS.darkGray} />
      <mesh position={[0, 1.56, -0.1]} material={silverMat}>
        <boxGeometry args={[0.24, 0.42, 0.16]} />
      </mesh>

      {/* Wide Flat-Screen LEGO TV Frame (2.9 x 1.75) */}
      <mesh position={[0, 2.52, -0.06]} material={blackMat} castShadow>
        <boxGeometry args={[2.95, 1.76, 0.16]} />
      </mesh>

      {/* Animated Glowing TV Screen facing the Sofa */}
      <mesh position={[0, 2.52, 0.03]}>
        <planeGeometry args={[2.68, 1.48]} />
        <meshStandardMaterial
          ref={screenMatRef}
          color="#38BDF8"
          emissive="#38BDF8"
          emissiveIntensity={isNight ? 1.25 : 0.65}
          roughness={0.15}
        />
      </mesh>
      {/* Cute moving LEGO broadcast graphics on screen */}
      <mesh ref={bar1Ref} position={[0, 2.75, 0.045]}>
        <planeGeometry args={[0.8, 0.34]} />
        <meshBasicMaterial color="#FDE047" transparent opacity={0.85} />
      </mesh>
      <mesh ref={bar2Ref} position={[0, 2.25, 0.045]}>
        <planeGeometry args={[1.1, 0.24]} />
        <meshBasicMaterial color="#F472B6" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

/**
 * Foyer / Ruang Tamu Depan (Floor 1, front-right & entry): x: [1, 15], z: [3, 11]
 * Opens directly from the double wooden main entry door (x: -2..2, z: 11.5).
 * Includes rattan sofa facing the new animated LEGO TV console, coffee table, shoe rack & rug.
 */
export const FoyerRoom: React.FC<Floor1RoomProps> = ({ isNight }) => {
  const lampShadeMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.warmYellow, 1.5)
        : getLegoMaterial(LEGO_COLORS.creamWall),
    [isNight]
  );
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);

  return (
    <group name="room-foyer">
      {/* Welcome mat just inside main double wooden front entry door (x = 0, z = 10.2) */}
      <Tile position={[0, FLOOR1_Y, 10.1]} size={[3.2, 1.4]} height={0.07} color={LEGO_COLORS.rattan} />
      <Tile position={[0, FLOOR1_Y + 0.06, 10.1]} size={[2.6, 0.9]} height={0.04} color={LEGO_COLORS.brownWood} />

      {/* Wooden Shoe Rack (Rak Sepatu) beside entry door (x = 3.6, z = 10.2) */}
      <group position={[3.6, FLOOR1_Y, 10.2]}>
        <Brick position={[0, 0, 0]} size={[2.2, 0.2, 0.8]} color={LEGO_COLORS.darkWood} studs={false} />
        <Brick position={[-0.95, 0.24, 0]} size={[0.18, 1.15, 0.72]} color={LEGO_COLORS.darkWood} studs={false} />
        <Brick position={[0.95, 0.24, 0]} size={[0.18, 1.15, 0.72]} color={LEGO_COLORS.darkWood} studs={false} />
        <Tile position={[0, 0.78, 0]} size={[1.9, 0.72]} height={0.12} color={LEGO_COLORS.brownWood} />
        <Tile position={[0, 1.52, 0]} size={[2.2, 0.85]} height={0.14} color={LEGO_COLORS.brownWood} />
        <Tile position={[-0.55, 0.24, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.red} />
        <Tile position={[-0.1, 0.24, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.red} />
        <Tile position={[0.45, 0.24, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.blue} />
        <Tile position={[-0.55, 0.9, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.yellow} />
        <Tile position={[-0.1, 0.9, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.yellow} />
        <Tile position={[0.45, 0.9, 0.05]} size={[0.36, 0.55]} height={0.26} color={LEGO_COLORS.white} />
        <Plate position={[0.45, 1.66, 0]} size={[0.6, 0.35, 0.5]} color={LEGO_COLORS.turquoise} studs={false} />
      </group>

      {/* Main Foyer Guest Seating Area facing the LEGO TV Console */}
      <PatternedRug position={[10.5, FLOOR1_Y, 7.2]} pattern="ethnic-living" />

      {/* Rattan-toned Sofa facing South (+Z) straight at the TV */}
      <Sofa
        position={[10.8, FLOOR1_Y, 4.4]}
        rotation={[0, 0, 0]}
        woodColor={LEGO_COLORS.rattan}
        cushionColor={LEGO_COLORS.turquoise}
      />

      {/* NEW: Animated LEGO Flat-Screen TV & Console on South Wall facing Sofa */}
      <LegoTvConsole isNight={isNight} />

      {/* Side Rattan Armchair facing West (-X) */}
      <RattanArmchair position={[13.6, FLOOR1_Y, 7.6]} rotation={[0, -Math.PI * 0.55, 0]} />

      {/* Coffee table in center of seating */}
      <CoffeeTable position={[10.5, FLOOR1_Y, 7.2]} color={LEGO_COLORS.brownWood} />

      {/* Tall Floor Lamp in NE corner */}
      <group position={[13.9, FLOOR1_Y, 4.4]}>
        <Plate position={[0, 0, 0]} size={[0.9, 0.35, 0.9]} color={LEGO_COLORS.darkWood} studs={false} />
        <mesh position={[0, 2.0, 0]} material={darkWoodMat} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 3.8, 10]} />
        </mesh>
        <mesh position={[0, 3.9, 0]} material={lampShadeMat}>
          <cylinderGeometry args={[0.42, 0.68, 0.95, 14]} />
        </mesh>
      </group>

      {/* Potted tropical plants */}
      <PottedPlant position={[14.0, FLOOR1_Y, 10.2]} potColor={LEGO_COLORS.terracotta} variant="tropical" scale={1.0} />
      <PottedPlant position={[1.8, FLOOR1_Y, 4.2]} potColor={LEGO_COLORS.yellow} variant="compact" scale={0.9} />

      {/* Warm Foyer ambient pointLight */}
      <pointLight
        position={[9.0, FLOOR1_Y + 4.8, 7.2]}
        color="#FFE0A3"
        intensity={isNight ? 18 : 4.5}
        distance={16}
        decay={2}
      />
    </group>
  );
};
