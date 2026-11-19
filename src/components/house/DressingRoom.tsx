import React from 'react';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y } from '../../lib/layout';
import {
  Vanity,
  Hammock,
  Curtains,
  PatternedRug,
  PendantLamp,
  PottedPlant,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Dressing Room / 2nd Bedroom (Ruang Rias) — interior floor x: [5, 15], z: [-11, -3], y = FLOOR_Y (7.6)
 * Keeps center standing area around x: 9..11, z: -6..-4 clear for Ibu Sari (Kebaya minifigure)
 * and doorway on south wall z = -2 (x = 9..11) unobstructed.
 */
export const DressingRoom: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-dressing-room">
      {/* Carved dark-wood vanity dresser with reflective light-blue-silver mirror & stool against east wall */}
      <Vanity position={[14.2, FLOOR_Y, -7.0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Yellow-red batik patterned curtains framing north window (x = 8..11, center 9.5) */}
      <Curtains position={[9.5, 11.75, -10.92]} width={3.3} variant="batik-yellow-red" />

      {/* Suspended white fabric swing/hammock (ayunan/hammock kain putih) with wooden spreader bars & ropes */}
      <Hammock
        position={[7.2, FLOOR_Y, -8.6]}
        rotation={[0, 0.24, 0]}
        span={3.6}
        anchorHeight={5.85}
      />

      {/* Red LEGO tile rug in center under Ibu Sari */}
      <PatternedRug position={[9.8, FLOOR_Y, -6.0]} pattern="red-dressing" />

      {/* Red hanging pendant lamp with warm glow */}
      <PendantLamp
        position={[10.0, 13.6, -6.4]}
        isNight={isNight}
        shadeColor={LEGO_COLORS.red}
        lightIntensityDay={4}
        lightIntensityNight={18}
        lightDistance={14}
      />

      {/* Decorative potted flowering plant in SW corner */}
      <PottedPlant
        position={[5.55, FLOOR_Y, -3.55]}
        potColor={LEGO_COLORS.gold}
        variant="flowering"
        flowerColor={LEGO_COLORS.pinkCushion}
        scale={0.9}
      />
    </group>
  );
};
