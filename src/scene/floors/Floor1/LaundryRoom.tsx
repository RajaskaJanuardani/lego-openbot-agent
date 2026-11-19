import React, { useMemo } from 'react';
import { Brick, Plate, Tile } from '../../../components/lego';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y } from '../../../lib/constants';
import { getLegoMaterial } from '../../../lib/materials';

export interface Floor1RoomProps {
  isNight: boolean;
}

/**
 * Laundry / Gudang Kecil (Floor 1, front-left): x: [-15, -6], z: [1, 11]
 * Washing machine, drying rack (jemuran) with colorful LEGO clothes, stacked cardboard boxes (kardus), detergent shelf.
 */
export const LaundryRoom: React.FC<Floor1RoomProps> = ({ isNight }) => {
  const silverMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.4, roughness: 0.25 }),
    []
  );
  const drumGlassMat = useMemo(
    () =>
      getLegoMaterial('#2B5D7C', {
        roughness: 0.12,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72,
      }),
    []
  );

  return (
    <group name="room-laundry">
      {/* Front-Loading LEGO Washing Machine (against North wall x = -13.2, z = 2.4) */}
      <group position={[-13.2, FLOOR1_Y, 2.4]}>
        <Brick position={[0, 0, 0]} size={[1.8, 1.65, 1.7]} color={LEGO_COLORS.white} studs={false} />
        {/* Top control strip */}
        <Tile position={[0, 1.62, 0.83]} size={[1.68, 0.1]} height={0.32} color={LEGO_COLORS.lightGray} />
        <Plate position={[-0.55, 1.72, 0.88]} size={[0.25, 0.3, 0.14]} color={LEGO_COLORS.blue} studs={false} />
        <Plate position={[0.45, 1.72, 0.88]} size={[0.18, 0.3, 0.14]} color={LEGO_COLORS.brightGreen} studs={false} />
        {/* Circular front drum door facing South (+Z) */}
        <mesh position={[0, 0.9, 0.87]} rotation={[Math.PI / 2, 0, 0]} material={silverMat}>
          <cylinderGeometry args={[0.56, 0.56, 0.1, 18]} />
        </mesh>
        <mesh position={[0, 0.9, 0.92]} rotation={[Math.PI / 2, 0, 0]} material={drumGlassMat}>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} />
        </mesh>
      </group>

      {/* Laundry Counter + Detergent Bottles next to Washer (x = -10.8, z = 2.4) */}
      <group position={[-10.8, FLOOR1_Y, 2.4]}>
        <Brick position={[0, 0, 0]} size={[2.2, 1.55, 1.5]} color={LEGO_COLORS.offWhite} studs={false} />
        <Tile position={[0, 1.86, 0]} size={[2.3, 1.58]} height={0.12} color={LEGO_COLORS.rattan} />
        {/* Laundry basket with folded clothes */}
        <Brick position={[-0.45, 1.98, 0.05]} size={[0.95, 0.45, 0.78]} color={LEGO_COLORS.lightBlue} studs={false} />
        <Tile position={[-0.45, 2.52, 0.05]} size={[0.78, 0.62]} height={0.18} color={LEGO_COLORS.pinkLight} />
        {/* Detergent bottles */}
        <Brick position={[0.55, 1.98, -0.25]} size={[0.35, 0.55, 0.35]} color={LEGO_COLORS.orange} studs={false} />
        <Brick position={[0.9, 1.98, 0.1]} size={[0.3, 0.45, 0.3]} color={LEGO_COLORS.turquoise} studs={false} />
      </group>

      {/* Wooden Folding Drying Rack / Jemuran (x = -11.5, z = 6.8) */}
      <group position={[-11.5, FLOOR1_Y, 6.8]}>
        {/* A-frame side legs */}
        <Tile position={[-1.4, 0, -0.45]} size={[0.14, 0.14]} height={2.3} color={LEGO_COLORS.brownWood} />
        <Tile position={[-1.4, 0, 0.45]} size={[0.14, 0.14]} height={2.3} color={LEGO_COLORS.brownWood} />
        <Tile position={[1.4, 0, -0.45]} size={[0.14, 0.14]} height={2.3} color={LEGO_COLORS.brownWood} />
        <Tile position={[1.4, 0, 0.45]} size={[0.14, 0.14]} height={2.3} color={LEGO_COLORS.brownWood} />
        {/* Drying bars */}
        <Tile position={[0, 2.25, -0.45]} size={[2.9, 0.1]} height={0.1} color={LEGO_COLORS.silver} />
        <Tile position={[0, 2.25, 0.45]} size={[2.9, 0.1]} height={0.1} color={LEGO_COLORS.silver} />
        <Tile position={[0, 2.25, 0]} size={[2.9, 0.1]} height={0.1} color={LEGO_COLORS.silver} />
        {/* Hanging colorful LEGO shirts & towels */}
        <Tile position={[-0.8, 1.25, -0.45]} size={[0.78, 0.14]} height={1.0} color={LEGO_COLORS.yellow} />
        <Tile position={[0.25, 1.35, -0.45]} size={[0.72, 0.14]} height={0.9} color={LEGO_COLORS.pinkExterior} />
        <Tile position={[-0.3, 1.2, 0.45]} size={[0.85, 0.14]} height={1.05} color={LEGO_COLORS.lightBlue} />
        <Tile position={[0.75, 1.4, 0.45]} size={[0.68, 0.14]} height={0.85} color={LEGO_COLORS.brightGreen} />
      </group>

      {/* Stacked Cardboard Storage Boxes (Kardus) in SW corner (x = -13.6, z = 9.5) */}
      <group position={[-13.5, FLOOR1_Y, 9.4]}>
        <Brick position={[0, 0, 0]} size={[1.5, 1.1, 1.4]} color={LEGO_COLORS.sandDark} studs={false} />
        <Tile position={[0, 1.32, 0]} size={[1.52, 0.16]} height={0.04} color={LEGO_COLORS.brownWood} />
        <Brick position={[1.65, 0, 0.15]} size={[1.3, 0.95, 1.2]} color={LEGO_COLORS.khaki} studs={false} />
        <Brick position={[0.15, 1.32, -0.05]} size={[1.15, 0.85, 1.1]} color={LEGO_COLORS.sand} studs={false} />
        <Brick position={[1.55, 1.14, 0.1]} size={[0.95, 0.75, 0.95]} color={LEGO_COLORS.sandDark} studs={false} />
      </group>

      {/* Utility warm ceiling light */}
      <pointLight
        position={[-10.8, FLOOR1_Y + 4.8, 6.0]}
        color="#FFF0CC"
        intensity={isNight ? 13 : 3}
        distance={13}
        decay={2}
      />
    </group>
  );
};
