import React from 'react';
import { FLOOR_Y } from '../../lib/layout';
import {
  Sofa,
  RattanArmchair,
  CoffeeTable,
  PatternedRug,
  CarvedWoodPanel,
  RoundWallPlates,
  RattanSideboard,
  ShelvingUnit,
  PendantLamp,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Living Room (Ruang Keluarga) — interior floor x: [4, 11], z: [-1, 5], open south side to Dining Area.
 * Brown wood sofa is positioned at [7.5, FLOOR_Y, -0.15] facing +Z so Gamer minifigure (Rafi)
 * sitting at [7.5, FLOOR_Y + 0.85, 0.0] facing +Z sits cleanly on the patterned pink cushions!
 */
export const LivingRoom: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-living-room">
      {/* Brown wooden sofa with patterned pink cushions facing +Z South */}
      <Sofa position={[7.5, FLOOR_Y, -0.15]} rotation={[0, 0, 0]} />

      {/* Large carved wooden wall panel (panel ukir kayu besar) centered on solid north wall above sofa (clear of doorway x=9..11) */}
      <CarvedWoodPanel position={[6.9, 11.4, -1.42]} />

      {/* Rattan armchair angled toward coffee table */}
      <RattanArmchair position={[4.85, FLOOR_Y, 2.5]} rotation={[0, Math.PI * 0.36, 0]} />

      {/* Wooden coffee table with tea mugs & colorful LEGO magazines */}
      <CoffeeTable position={[7.5, FLOOR_Y, 2.5]} />

      {/* Large colorful ethnic patterned LEGO tile rug */}
      <PatternedRug position={[7.5, FLOOR_Y, 2.5]} pattern="ethnic-living" />

      {/* Rattan sideboard/buffet (bufet rotan) against east wall north of terrace door */}
      <RattanSideboard position={[10.85, FLOOR_Y, 1.8]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Shelving unit with small potted plants & colorful LEGO books */}
      <ShelvingUnit position={[4.05, FLOOR_Y, 0.15]} rotation={[0, Math.PI / 2, 0]} />

      {/* Decorative round wall plates / wheel discs on west & east walls */}
      <RoundWallPlates position={[3.58, 11.4, 2.4]} rotation={[0, Math.PI / 2, 0]} />
      <RoundWallPlates position={[11.42, 11.4, 1.8]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Colorful multi-color LEGO pendant lamp with warm living room pointLight */}
      <PendantLamp
        position={[7.5, 13.6, 2.4]}
        isNight={isNight}
        variant="colorful"
        lightIntensityDay={4.5}
        lightIntensityNight={20}
        lightDistance={16}
      />
    </group>
  );
};
