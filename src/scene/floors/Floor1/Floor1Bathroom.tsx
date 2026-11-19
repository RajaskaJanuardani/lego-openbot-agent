import React, { useMemo } from 'react';
import { Brick, Plate, Tile } from '../../../components/lego';
import {
  BathroomWallShelf,
  PedestalSink,
  Toilet,
} from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y } from '../../../lib/constants';
import { getEmissiveMaterial, getLegoMaterial } from '../../../lib/materials';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Kamar Mandi Lantai 1 (replaces removed Floor 2 bathroom): x: [-5, 2], z: [-11, -3]
 * Mint & white ceramic aesthetic with toilet, walk-in glass shower, vanity sink, and warm light.
 */
export const Floor1Bathroom: React.FC<Floor1RoomProps> = ({ isNight }) => {
  const glassMat = useMemo(
    () =>
      getLegoMaterial('#C9F0FF', {
        roughness: 0.08,
        metalness: 0.05,
        transparent: true,
        opacity: 0.34,
      }),
    []
  );
  const chromeMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.55, roughness: 0.2 }),
    []
  );
  const lampMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial('#FFF3C4', 1.6)
        : getLegoMaterial(LEGO_COLORS.white),
    [isNight]
  );

  return (
    <group name="room-bathroom-1">
      {/* Walk-in Glass Shower Stall in NE corner (x: -0.6..1.5, z: -10.7..-7.4) */}
      <group position={[0.4, FLOOR1_Y, -9.1]}>
        {/* Raised tiled shower tray */}
        <Tile position={[0, 0, 0]} size={[2.2, 2.8]} height={0.18} color={LEGO_COLORS.lightBlue} />
        <Tile position={[0, 0.18, 0]} size={[1.95, 2.55]} height={0.04} color={LEGO_COLORS.seaBlue} />
        {/* Drain stud */}
        <mesh position={[0, 0.23, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 12]} />
        </mesh>
        {/* Shower glass enclosure wall facing West (-X) */}
        <mesh position={[-1.08, 2.15, -0.25]} material={glassMat}>
          <boxGeometry args={[0.08, 4.0, 2.2]} />
        </mesh>
        {/* Chrome shower riser pipe + rainfall head on East wall */}
        <mesh position={[0.92, 2.2, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.05, 0.05, 3.6, 8]} />
        </mesh>
        <mesh position={[0.52, 3.95, 0]} rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.045, 0.045, 0.8, 8]} />
        </mesh>
        <mesh position={[0.14, 3.85, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.28, 0.2, 0.1, 14]} />
        </mesh>
        {/* Mixer tap */}
        <Plate position={[0.85, 1.8, 0]} size={[0.22, 0.4, 0.45]} color={LEGO_COLORS.silver} studs={false} />
      </group>

      {/* Toilet in NW corner (x = -3.6, z = -9.6, facing South +Z) */}
      <Toilet position={[-3.6, FLOOR1_Y, -9.6]} rotation={[0, 0, 0]} />

      {/* Pedestal Sink & Mirror against West wall (x = -4.2, z = -6.0, facing East +X) */}
      <PedestalSink position={[-4.15, FLOOR1_Y, -6.0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Wall Shelf with towels & toiletries */}
      <BathroomWallShelf position={[-4.4, FLOOR1_Y + 2.8, -8.0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Bath mat beside shower */}
      <Tile position={[-1.6, FLOOR1_Y, -7.8]} size={[1.4, 2.0]} height={0.07} color={LEGO_COLORS.turquoise} />

      {/* Towel rack on East wall */}
      <group position={[1.4, FLOOR1_Y + 2.0, -5.2]}>
        <Brick position={[0, 0, 0]} size={[0.18, 0.18, 1.4]} color={LEGO_COLORS.silver} studs={false} />
        <Tile position={[-0.1, -0.7, 0]} size={[0.14, 0.95]} height={0.85} color={LEGO_COLORS.pinkLight} />
      </group>

      {/* Bright Vanity Mirror Light */}
      <mesh position={[-4.35, FLOOR1_Y + 3.85, -6.0]} material={lampMat}>
        <boxGeometry args={[0.16, 0.22, 1.1]} />
      </mesh>
      <pointLight
        position={[-1.6, FLOOR1_Y + 4.8, -7.0]}
        color="#E8F9FF"
        intensity={isNight ? 14 : 3.5}
        distance={11}
        decay={2}
      />
    </group>
  );
};
