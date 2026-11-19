import React from 'react';
import { Brick, Plate, Tile } from '../../../components/lego';
import {
  BedsideLantern,
  FramedPainting,
  Nightstand,
  PatternedRug,
  PottedPlant,
} from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y } from '../../../lib/constants';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Kamar Tamu (Floor 1, back-left): x: [-15, -5], z: [-11, 1]
 * Cozy guest bedroom with single LEGO bed, wooden wardrobe, nightstand + lantern, and rug.
 */
export const GuestRoom: React.FC<Floor1RoomProps> = ({ isNight }) => {
  return (
    <group name="room-guest-room">
      {/* LEGO Single Bed (3.0 x 5.2 studs) against north wall */}
      <group position={[-11.8, FLOOR1_Y, -7.8]}>
        {/* Wooden bed frame */}
        <Brick position={[0, 0, 0]} size={[2.9, 0.65, 5.0]} color={LEGO_COLORS.brownWood} studs={false} />
        {/* Headboard against north wall */}
        <Brick position={[0, 0.78, -2.35]} size={[2.95, 1.65, 0.35]} color={LEGO_COLORS.darkWood} studs={false} />
        {/* Footboard */}
        <Brick position={[0, 0.78, 2.35]} size={[2.95, 0.65, 0.3]} color={LEGO_COLORS.darkWood} studs={false} />
        {/* Crisp white mattress & sheet */}
        <Tile position={[0, 0.78, -0.1]} size={[2.65, 4.4]} height={0.34} color={LEGO_COLORS.white} />
        {/* Cozy warm terracotta/orange folded quilt */}
        <Tile position={[0, 1.12, 0.65]} size={[2.72, 2.9]} height={0.22} color={LEGO_COLORS.orange} />
        <Tile position={[0, 1.32, 0.2]} size={[2.74, 0.55]} height={0.12} color={LEGO_COLORS.warmYellow} />
        {/* White LEGO pillow */}
        <Plate position={[0, 1.12, -1.65]} size={[1.8, 0.85, 0.95]} color={LEGO_COLORS.offWhite} studs={false} />
      </group>

      {/* Bedside nightstand with glowing warm lantern */}
      <Nightstand position={[-9.2, FLOOR1_Y, -9.8]} />
      <BedsideLantern position={[-9.2, FLOOR1_Y + 1.5, -9.8]} isNight={isNight} enableLight={false} />

      {/* Tall Wooden Wardrobe (Lemari) against east partition wall (x = -6.0, z = -7.6) */}
      <group position={[-6.05, FLOOR1_Y, -7.6]}>
        <Brick position={[0, 0, 0]} size={[1.3, 3.8, 3.0]} color={LEGO_COLORS.brownWood} studs={false} />
        {/* Wardrobe crown */}
        <Tile position={[0, 4.56, 0]} size={[1.42, 3.16]} height={0.16} color={LEGO_COLORS.darkWood} />
        {/* Double door recessed panels + brass knobs facing west (-X) */}
        <Tile position={[-0.66, 0.45, -0.7]} size={[0.08, 1.25]} height={3.6} color={LEGO_COLORS.rattan} />
        <Tile position={[-0.66, 0.45, 0.7]} size={[0.08, 1.25]} height={3.6} color={LEGO_COLORS.rattan} />
        <Plate position={[-0.72, 2.2, -0.15]} size={[0.14, 0.35, 0.14]} color={LEGO_COLORS.gold} studs={false} />
        <Plate position={[-0.72, 2.2, 0.15]} size={[0.14, 0.35, 0.14]} color={LEGO_COLORS.gold} studs={false} />
      </group>

      {/* Guest bedside patterned rug */}
      <PatternedRug position={[-9.5, FLOOR1_Y, -3.6]} pattern="bedroom-mint" />

      {/* Framed artwork on south wall */}
      <FramedPainting position={[-11.5, FLOOR1_Y + 2.8, 0.4]} rotation={[0, Math.PI, 0]} />

      {/* Potted corner plant */}
      <PottedPlant position={[-14.0, FLOOR1_Y, -0.6]} potColor={LEGO_COLORS.turquoise} variant="compact" scale={0.9} />

      {/* Warm Guest Room ambient pointLight */}
      <pointLight
        position={[-10.2, FLOOR1_Y + 4.8, -5.2]}
        color="#FFDAA0"
        intensity={isNight ? 16 : 3.5}
        distance={14}
        decay={2}
      />
    </group>
  );
};
