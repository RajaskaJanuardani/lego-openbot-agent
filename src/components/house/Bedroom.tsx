import React from 'react';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y } from '../../lib/layout';
import {
  Bed,
  Nightstand,
  BedsideLantern,
  FramedPainting,
  WindowTrim,
  PatternedRug,
  PottedPlant,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Master Bedroom (Kamar Tidur Utama) — interior floor x: [-5, 3], z: [-11, -3], y = FLOOR_Y (7.6)
 * Features dark wood 4-poster canopy bed with royal-blue bedspread & 2 white pillows,
 * framed colorful LEGO painting on west wall, white window trim on north wall,
 * and bedside nightstands with warm glowing lanterns.
 */
export const Bedroom: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-bedroom">
      {/* Dark wood four-poster canopy bed centered cleanly away from doorway (x: -1..1, z: -2) */}
      <Bed
        position={[-1.0, FLOOR_Y, -7.65]}
        woodColor={LEGO_COLORS.darkWood}
        spreadColor={LEGO_COLORS.royalBlue}
      />

      {/* Left & Right dark wood bedside nightstands with small glowing warm lanterns */}
      <Nightstand position={[-4.35, FLOOR_Y, -9.6]} />
      <BedsideLantern position={[-4.35, FLOOR_Y + 1.5, -9.6]} isNight={isNight} enableLight={false} />

      <Nightstand position={[2.35, FLOOR_Y, -9.6]} />
      <BedsideLantern position={[2.35, FLOOR_Y + 1.5, -9.6]} isNight={isNight} enableLight={false} />

      {/* Shared warm bedroom glow from the bedside lanterns (brighter at night!) */}
      <pointLight
        position={[-1.0, FLOOR_Y + 3.4, -7.8]}
        color="#FFD485"
        intensity={isNight ? 16 : 3.5}
        distance={14}
        decay={2}
      />

      {/* Framed colorful tropical LEGO painting mounted on west wall (inner face x = -5.5) */}
      <FramedPainting position={[-5.42, 10.7, -7.0]} rotation={[0, Math.PI / 2, 0]} />

      {/* White window trim & sill framing north window (x = -3..0, center x = -1.5, inner face z = -11.0) */}
      <WindowTrim position={[-1.5, 9.82, -10.95]} width={3.1} />

      {/* Cozy foot-of-bed woven LEGO runner rug */}
      <PatternedRug position={[-1.0, FLOOR_Y, -3.85]} pattern="bedroom-mint" />

      {/* Tropical potted plant in SE bedroom corner */}
      <PottedPlant
        position={[2.55, FLOOR_Y, -3.7]}
        potColor={LEGO_COLORS.terracotta}
        variant="tropical"
        scale={0.88}
      />
    </group>
  );
};
