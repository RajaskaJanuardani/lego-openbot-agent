import React from 'react';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y } from '../../lib/layout';
import {
  DiningTable,
  FruitBowl,
  RattanChair,
  SmallKitchenCounter,
  PendantLamp,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Dining Area (Ruang Makan) — interior floor x: [4, 11], z: [6, 11], y = FLOOR_Y (7.6)
 * Open cutaway front view with wooden dining table, yellow fruit bowl, 4 rattan chairs,
 * small black kitchen side counter, and warm hanging accent light.
 */
export const DiningArea: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-dining-area">
      {/* Wooden dining table topped with yellow LEGO fruit bowl & colorful placemats */}
      <DiningTable
        position={[7.7, FLOOR_Y, 8.6]}
        size={[3.2, 2.0]}
        height={1.65}
        color={LEGO_COLORS.brownWood}
      />
      <FruitBowl position={[7.7, FLOOR_Y + 1.65, 8.6]} />

      {/* Woven cream placemats & tiny plates at dining seats */}
      <Tile position={[6.9, FLOOR_Y + 1.65, 8.02]} size={[0.72, 0.52]} height={0.04} color={LEGO_COLORS.creamTile} />
      <Tile position={[8.5, FLOOR_Y + 1.65, 8.02]} size={[0.72, 0.52]} height={0.04} color={LEGO_COLORS.creamTile} />
      <Tile position={[8.35, FLOOR_Y + 1.65, 9.18]} size={[0.72, 0.52]} height={0.04} color={LEGO_COLORS.creamTile} />
      <Tile position={[8.9, FLOOR_Y + 1.65, 8.6]} size={[0.52, 0.72]} height={0.04} color={LEGO_COLORS.creamTile} />

      {/* 4 Rattan dining chairs neatly arranged around the table */}
      <RattanChair position={[6.9, FLOOR_Y, 7.25]} rotation={[0, 0, 0]} />
      <RattanChair position={[8.5, FLOOR_Y, 7.25]} rotation={[0, 0, 0]} />
      <RattanChair position={[9.85, FLOOR_Y, 8.6]} rotation={[0, -Math.PI / 2, 0]} />
      <RattanChair position={[8.35, FLOOR_Y, 9.95]} rotation={[0, Math.PI + 0.14, 0]} />

      {/* Small black kitchen table/counter (meja dapur hitam kecil) against west wall */}
      <SmallKitchenCounter position={[4.45, FLOOR_Y, 9.45]} />

      {/* Warm dining pendant lamp for cozy evening ambiance */}
      <PendantLamp
        position={[7.7, 13.6, 8.6]}
        isNight={isNight}
        shadeColor={LEGO_COLORS.orange}
        cordLength={1.25}
        lightIntensityDay={3}
        lightIntensityNight={15}
        lightDistance={13}
      />
    </group>
  );
};
