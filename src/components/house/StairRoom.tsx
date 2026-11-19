import React from 'react';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR2_Y, STAIR_CENTER_X, STAIR_TOP_Z } from '../../lib/constants';
import { StairwellUpperGuard } from '../../scene/floors/Stairs';
import {
  CarvedWallOrnament,
  WallSconce,
  PottedPlant,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Expanded Floor 2 Stair Room & Landing Hall: x: [-6, 3], z: [-2, 12]
 * (Absorbs the removed mint Floor 2 bathroom area for a spacious upper landing!)
 * Stairwell opening is x: [-4, -1], z: [3.5, 9.5].
 * Note: The physical connecting <Stairs /> sits in FloorGroup level={1} so it remains
 * solid in Floor 1 view, while the upper guard rail lives here in Floor 2.
 */
export const StairRoom: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-stair-room">
      {/* Upper-floor wooden baluster guard railing surrounding the stairwell opening */}
      <StairwellUpperGuard position={[STAIR_CENTER_X, FLOOR2_Y, STAIR_TOP_Z]} />

      {/* Carved wood wall ornaments on dark-brown walls */}
      <CarvedWallOrnament position={[-5.42, 11.1, 6.4]} rotation={[0, Math.PI / 2, 0]} />
      <CarvedWallOrnament position={[2.42, 11.1, 9.2]} rotation={[0, -Math.PI / 2, 0]} />
      <CarvedWallOrnament position={[2.42, 11.0, 1.0]} rotation={[0, -Math.PI / 2, 0]} />
      <CarvedWallOrnament position={[-3.2, 11.0, -1.42]} rotation={[0, 0, 0]} />

      {/* Warm glowing wall sconces */}
      <WallSconce position={[-4.2, 11.8, -1.42]} isNight={isNight} enableLight={false} />
      <WallSconce
        position={[2.42, 11.8, 7.65]}
        rotation={[0, -Math.PI / 2, 0]}
        isNight={isNight}
        enableLight={false}
      />
      <WallSconce
        position={[2.42, 11.8, -0.55]}
        rotation={[0, -Math.PI / 2, 0]}
        isNight={isNight}
        enableLight={false}
      />

      {/* Shared warm interior pointLight illuminating stairwell & expanded landing */}
      <pointLight
        position={[-1.4, 12.0, 4.5]}
        color="#FFD68A"
        intensity={isNight ? 16 : 3.2}
        distance={15}
        decay={2}
      />

      {/* Potted accent plants in spacious landing corners */}
      <PottedPlant
        position={[1.7, FLOOR2_Y, 10.4]}
        potColor={LEGO_COLORS.terracotta}
        variant="compact"
        scale={0.85}
      />
      <PottedPlant
        position={[-4.9, FLOOR2_Y, -0.8]}
        potColor={LEGO_COLORS.yellow}
        variant="tropical"
        scale={0.85}
      />
    </group>
  );
};
