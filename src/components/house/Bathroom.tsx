import React from 'react';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y } from '../../lib/layout';
import {
  Toilet,
  PedestalSink,
  BathroomWallShelf,
  BathroomWainscot,
  WallSconce,
  PatternedRug,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Small Bathroom (Kamar Mandi) — interior floor x: [-5, -2], z: [-1, 3], y = FLOOR_Y (7.6)
 * White door on east wall x = -1 (z = 0..2).
 */
export const Bathroom: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-bathroom">
      {/* Mint & white ceramic tile wainscot accents along west, north & south interior walls */}
      <BathroomWainscot
        position={[-5.44, FLOOR_Y, 1.0]}
        rotation={[0, Math.PI / 2, 0]}
        length={4.75}
      />
      <BathroomWainscot
        position={[-3.5, FLOOR_Y, -1.44]}
        length={3.75}
      />
      <BathroomWainscot
        position={[-3.5, FLOOR_Y, 3.44]}
        rotation={[0, Math.PI, 0]}
        length={3.75}
      />

      {/* Compact white LEGO toilet against west wall (south side, clear of east doorway) */}
      <Toilet position={[-4.75, FLOOR_Y, 2.3]} rotation={[0, Math.PI / 2, 0]} />

      {/* Pedestal sink with chrome faucet & framed mirror above against west wall */}
      <PedestalSink position={[-4.95, FLOOR_Y, -0.3]} rotation={[0, Math.PI / 2, 0]} />

      {/* Small wall shelf (rak kecil) with colorful soaps & folded towels on north wall */}
      <BathroomWallShelf position={[-3.3, 10.35, -1.42]} />

      {/* Small warm wall lamp mounted above bathroom mirror */}
      <WallSconce
        position={[-5.4, 12.15, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        isNight={isNight}
        mountColor={LEGO_COLORS.white}
        enableLight
        lightIntensityDay={2}
        lightIntensityNight={11}
        lightDistance={9}
      />

      {/* Mint & white bath mat in center */}
      <PatternedRug position={[-3.3, FLOOR_Y, 0.9]} pattern="bath-mat" />
    </group>
  );
};
