import React from 'react';
import { Brick, Tile } from '../../../components/lego';
import {
  CarvedWallOrnament,
  PottedPlant,
  WallSconce,
} from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y } from '../../../lib/constants';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Lorong Tangga Bawah (Floor 1, center-front-left): x: [-6, 1], z: [2, 11]
 * plus Central Hallway x: [-5, 2], z: [-3, 2] connecting Guest Room, Bathroom, Studio, Laundry & Foyer.
 */
export const StairHall1: React.FC<Floor1RoomProps> = ({ isNight }) => {
  return (
    <group name="room-stair-hall-1">
      {/* Console side table tucked cleanly east of stairwell (x = 0.2, z = 4.6) */}
      <group position={[0.25, FLOOR1_Y, 4.6]}>
        <Tile position={[-0.35, 0, -0.7]} size={[0.16, 0.16]} height={1.45} color={LEGO_COLORS.darkWood} />
        <Tile position={[0.35, 0, -0.7]} size={[0.16, 0.16]} height={1.45} color={LEGO_COLORS.darkWood} />
        <Tile position={[-0.35, 0, 0.7]} size={[0.16, 0.16]} height={1.45} color={LEGO_COLORS.darkWood} />
        <Tile position={[0.35, 0, 0.7]} size={[0.16, 0.16]} height={1.45} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 1.45, 0]} size={[0.92, 1.75]} height={0.14} color={LEGO_COLORS.brownWood} />
        {/* Small decorative ceramic vase */}
        <Brick position={[0, 1.59, 0]} size={[0.36, 0.45, 0.36]} color={LEGO_COLORS.turquoise} studs={false} />
      </group>

      {/* Wall ornaments & sconces along central corridor */}
      <CarvedWallOrnament position={[-5.4, FLOOR1_Y + 3.0, 2.2]} rotation={[0, Math.PI / 2, 0]} />
      <WallSconce position={[-3.5, FLOOR1_Y + 3.6, -2.42]} isNight={isNight} enableLight={false} />
      <WallSconce position={[1.42, FLOOR1_Y + 3.6, 1.8]} rotation={[0, -Math.PI / 2, 0]} isNight={isNight} enableLight={false} />

      {/* Hallway corner plant */}
      <PottedPlant position={[-4.5, FLOOR1_Y, 10.1]} potColor={LEGO_COLORS.terracotta} variant="compact" scale={0.85} />

      {/* Warm hallway light */}
      <pointLight
        position={[-1.8, FLOOR1_Y + 4.8, 1.2]}
        color="#FFD89A"
        intensity={isNight ? 15 : 3.5}
        distance={14}
        decay={2}
      />
    </group>
  );
};
