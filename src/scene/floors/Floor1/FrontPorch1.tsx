import React from 'react';
import { Tile } from '../../../components/lego';
import {
  PottedPlant,
  RattanArmchair,
  WallSconce,
} from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { GROUND_Y, PLATE_H } from '../../../lib/constants';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Teras Depan Lantai 1 (under terracotta roof overhang, x: [-16, 16], z: [12.0, 15.2])
 * Porch seating chairs, small tea table, tropical flower pots, outdoor welcome mat, and porch sconces.
 */
export const FrontPorch1: React.FC<Floor1RoomProps> = ({ isNight }) => {
  const porchY = GROUND_Y + PLATE_H; // 0.4 (top of cream verandah tile)

  return (
    <group name="room-front-porch">
      {/* Welcome mat outside front double door */}
      <Tile position={[0, porchY, 13.0]} size={[3.4, 1.25]} height={0.07} color={LEGO_COLORS.terracotta} />
      <Tile position={[0, porchY + 0.06, 13.0]} size={[2.7, 0.8]} height={0.04} color={LEGO_COLORS.warmYellow} />

      {/* Left Porch Seating Nook (x = -12..-8, z = 13.4) */}
      <RattanArmchair position={[-12.2, porchY, 13.3]} rotation={[0, 0.45, 0]} />
      <RattanArmchair position={[-7.8, porchY, 13.3]} rotation={[0, -0.45, 0]} />
      {/* Round wooden porch tea table */}
      <group position={[-10.0, porchY, 13.4]}>
        <Tile position={[0, 0, 0]} size={[0.45, 0.45]} height={0.12} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 0.12, 0]} size={[0.18, 0.18]} height={1.08} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 1.2, 0]} size={[1.25, 1.25]} height={0.12} color={LEGO_COLORS.brownWood} />
        <Tile position={[-0.25, 1.32, 0.1]} size={[0.22, 0.22]} height={0.22} color={LEGO_COLORS.white} />
        <Tile position={[0.25, 1.32, -0.1]} size={[0.22, 0.22]} height={0.22} color={LEGO_COLORS.turquoise} />
      </group>

      {/* Right Porch Seating Nook (x = 7..12, z = 13.4) */}
      <RattanArmchair position={[7.4, porchY, 13.3]} rotation={[0, 0.35, 0]} />
      <RattanArmchair position={[11.6, porchY, 13.3]} rotation={[0, -0.4, 0]} />
      <group position={[9.5, porchY, 13.4]}>
        <Tile position={[0, 0, 0]} size={[0.45, 0.45]} height={0.12} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 0.12, 0]} size={[0.18, 0.18]} height={1.08} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 1.2, 0]} size={[1.2, 1.2]} height={0.12} color={LEGO_COLORS.rattan} />
      </group>

      {/* Colorful Porch Flower Pots flanking entrance & verandah ends */}
      <PottedPlant position={[-4.5, porchY, 13.5]} potColor={LEGO_COLORS.terracotta} variant="flowering" scale={0.95} />
      <PottedPlant position={[4.5, porchY, 13.5]} potColor={LEGO_COLORS.yellow} variant="flowering" scale={0.95} />
      <PottedPlant position={[-14.3, porchY, 13.4]} potColor={LEGO_COLORS.turquoise} variant="tropical" scale={0.9} />
      <PottedPlant position={[14.3, porchY, 13.4]} potColor={LEGO_COLORS.pinkExterior} variant="tropical" scale={0.9} />

      {/* Warm Porch Sconces flanking main double wooden door */}
      <WallSconce position={[-2.5, porchY + 3.4, 12.15]} isNight={isNight} enableLight={false} />
      <WallSconce position={[2.5, porchY + 3.4, 12.15]} isNight={isNight} enableLight={false} />
    </group>
  );
};
