import React, { useMemo } from 'react';
import { Brick, Plate, Tile } from '../../../components/lego';
import { PatternedRug, PottedPlant } from '../../../components/furniture';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y, STUDIO_WORKSTATIONS } from '../../../lib/constants';
import { getEmissiveMaterial, getLegoMaterial } from '../../../lib/materials';
import type { Vec3 } from '../../../types';

export interface Floor1RoomProps {
  isNight: boolean;
}

const AgentWorkstation: React.FC<{
  deskPosition: Vec3;
  chairPosition: Vec3;
  screenColor: string;
  isNight: boolean;
}> = ({ deskPosition, chairPosition, screenColor, isNight }) => {
  const screenMat = useMemo(
    () => getEmissiveMaterial(screenColor, isNight ? 1.55 : 0.7),
    [screenColor, isNight]
  );
  const lampHeadMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.warmYellow, 1.5)
        : getLegoMaterial(LEGO_COLORS.yellow),
    [isNight]
  );
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.35 }), []);

  return (
    <group>
      {/* LEGO Desk (2.5 x 1.3 studs, height 1.5) */}
      <group position={deskPosition}>
        {/* Steel desk legs */}
        <Tile position={[-1.08, 0, -0.45]} size={[0.18, 0.18]} height={1.42} color={LEGO_COLORS.darkGray} />
        <Tile position={[1.08, 0, -0.45]} size={[0.18, 0.18]} height={1.42} color={LEGO_COLORS.darkGray} />
        <Tile position={[-1.08, 0, 0.45]} size={[0.18, 0.18]} height={1.42} color={LEGO_COLORS.darkGray} />
        <Tile position={[1.08, 0, 0.45]} size={[0.18, 0.18]} height={1.42} color={LEGO_COLORS.darkGray} />
        {/* Warm wooden desktop */}
        <Tile position={[0, 1.42, 0]} size={[2.45, 1.25]} height={0.16} color={LEGO_COLORS.rattan} />

        {/* LEGO Monitor + glowing screen facing South (+Z) toward seated agent */}
        <mesh position={[0, 1.72, -0.32]} material={silverMat}>
          <boxGeometry args={[0.16, 0.32, 0.16]} />
        </mesh>
        <Tile position={[0, 1.58, -0.32]} size={[0.46, 0.34]} height={0.08} color={LEGO_COLORS.darkGray} />
        <mesh position={[0, 2.24, -0.32]} material={blackMat} castShadow>
          <boxGeometry args={[1.15, 0.72, 0.1]} />
        </mesh>
        <mesh position={[0, 2.24, -0.26]} material={screenMat}>
          <boxGeometry args={[1.02, 0.58, 0.03]} />
        </mesh>

        {/* Keyboard & mouse */}
        <Tile position={[-0.08, 1.58, 0.22]} size={[0.78, 0.28]} height={0.07} color={LEGO_COLORS.darkGray} />
        <Tile position={[0.52, 1.58, 0.24]} size={[0.18, 0.24]} height={0.07} color={LEGO_COLORS.lightGray} />

        {/* Mini desk lamp on left edge */}
        <Tile position={[-0.92, 1.58, -0.25]} size={[0.28, 0.28]} height={0.08} color={LEGO_COLORS.darkGray} />
        <mesh position={[-0.92, 1.98, -0.25]} rotation={[0, 0, -0.22]} material={silverMat}>
          <cylinderGeometry args={[0.04, 0.04, 0.78, 8]} />
        </mesh>
        <mesh position={[-0.78, 2.34, -0.25]} rotation={[0, 0, 0.45]} material={lampHeadMat}>
          <coneGeometry args={[0.2, 0.26, 10]} />
        </mesh>

        {/* Coffee mug */}
        <Tile position={[0.92, 1.58, 0.22]} size={[0.2, 0.2]} height={0.24} color={LEGO_COLORS.white} />
      </group>

      {/* Swivel Office Chair facing North (-Z) toward monitor */}
      <group position={chairPosition}>
        {/* Star wheel base + pneumatic stem */}
        <Tile position={[0, 0, 0]} size={[0.76, 0.16]} height={0.14} color={LEGO_COLORS.black} />
        <Tile position={[0, 0, 0]} size={[0.16, 0.76]} height={0.14} color={LEGO_COLORS.black} />
        <mesh position={[0, 0.42, 0]} material={blackMat}>
          <cylinderGeometry args={[0.09, 0.09, 0.62, 10]} />
        </mesh>
        {/* Seat cushion at y = 0.74 (matches seated minifigure height!) */}
        <Tile position={[0, 0.72, 0]} size={[0.92, 0.88]} height={0.16} color={LEGO_COLORS.navyBlue} />
        {/* Backrest on South side (+Z) so agent sits facing North (-Z) */}
        <Tile position={[0, 0.86, 0.38]} size={[0.88, 0.16]} height={1.08} color={LEGO_COLORS.royalBlue} />
      </group>
    </group>
  );
};

/**
 * Ruang Kerja Agent / Studio (Floor 1, back-right): x: [2, 15], z: [-11, 3]
 * Features 6 LEGO workstations, whiteboard with Kanban notes, tall bookshelf, and warm studio light.
 */
export const StudioRoom: React.FC<Floor1RoomProps> = ({ isNight }) => {
  return (
    <group name="room-studio">
      {/* Studio floor area rug under center aisle */}
      <PatternedRug position={[8.4, FLOOR1_Y, -5.6]} pattern="kitchen-blue-yellow" />

      {/* 6 Agent Workstations matching STUDIO_WORKSTATIONS */}
      {STUDIO_WORKSTATIONS.map((ws) => (
        <AgentWorkstation
          key={ws.id}
          deskPosition={ws.deskPosition}
          chairPosition={ws.chairPosition}
          screenColor={ws.screenColor}
          isNight={isNight}
        />
      ))}

      {/* Large Studio Whiteboard on North wall (z = -10.9, x = 8.4) */}
      <group position={[8.4, FLOOR1_Y + 2.3, -10.9]}>
        <Brick position={[0, 0, 0]} size={[5.2, 2.1, 0.18]} color={LEGO_COLORS.silver} studs={false} />
        <Tile position={[0, 0.18, 0.09]} size={[4.85, 0.08]} height={2.15} color={LEGO_COLORS.white} />
        {/* Colorful Kanban sticky-note LEGO tiles */}
        <Tile position={[-1.7, 1.55, 0.14]} size={[0.55, 0.06]} height={0.45} color={LEGO_COLORS.yellow} />
        <Tile position={[-1.7, 0.95, 0.14]} size={[0.55, 0.06]} height={0.45} color={LEGO_COLORS.pinkExterior} />
        <Tile position={[-0.4, 1.55, 0.14]} size={[0.65, 0.06]} height={0.45} color={LEGO_COLORS.lightBlue} />
        <Tile position={[-0.4, 0.95, 0.14]} size={[0.65, 0.06]} height={0.45} color={LEGO_COLORS.brightGreen} />
        <Tile position={[1.0, 1.55, 0.14]} size={[0.65, 0.06]} height={0.45} color={LEGO_COLORS.orange} />
        <Tile position={[1.0, 0.95, 0.14]} size={[0.65, 0.06]} height={0.45} color={LEGO_COLORS.brightGreen} />
        {/* Marker tray */}
        <Tile position={[0, 0.02, 0.2]} size={[3.6, 0.22]} height={0.12} color={LEGO_COLORS.darkGray} />
      </group>

      {/* Tall Bookshelf against East wall (x = 14.55, z = -6.0) */}
      <group position={[14.5, FLOOR1_Y, -6.0]}>
        <Brick position={[0, 0, 0]} size={[0.85, 3.6, 3.4]} color={LEGO_COLORS.brownWood} studs={false} />
        {/* Colorful LEGO books lined across 3 shelves */}
        {[0.55, 1.75, 2.95].map((sy, rowIdx) => (
          <group key={sy} position={[-0.22, sy, 0]}>
            <Tile position={[0, -0.1, 0]} size={[0.68, 3.1]} height={0.12} color={LEGO_COLORS.darkWood} />
            {[
              LEGO_COLORS.red,
              LEGO_COLORS.blue,
              LEGO_COLORS.yellow,
              LEGO_COLORS.green,
              LEGO_COLORS.orange,
              LEGO_COLORS.purple,
              LEGO_COLORS.turquoise,
              LEGO_COLORS.pinkExterior,
            ].map((bc, bi) => (
              <Tile
                key={bi}
                position={[0, 0.04, -1.25 + bi * 0.35]}
                size={[0.45, 0.24]}
                height={0.72 + ((bi + rowIdx) % 3) * 0.12}
                color={bc}
              />
            ))}
          </group>
        ))}
      </group>

      {/* Studio corner plant & coffee bar counter near south wall */}
      <PottedPlant position={[14.1, FLOOR1_Y, 1.5]} potColor={LEGO_COLORS.mintWall} variant="tropical" scale={0.95} />
      <group position={[11.2, FLOOR1_Y, 1.7]}>
        <Brick position={[0, 0, 0]} size={[2.2, 1.35, 0.9]} color={LEGO_COLORS.white} studs={false} />
        <Tile position={[0, 1.62, 0]} size={[2.3, 0.98]} height={0.12} color={LEGO_COLORS.darkWood} />
        {/* Espresso machine */}
        <Brick position={[-0.5, 1.74, 0]} size={[0.7, 0.65, 0.6]} color={LEGO_COLORS.red} studs={false} />
        <Tile position={[0.45, 1.74, 0.1]} size={[0.22, 0.22]} height={0.25} color={LEGO_COLORS.white} />
        <Tile position={[0.78, 1.74, -0.05]} size={[0.22, 0.22]} height={0.25} color={LEGO_COLORS.yellow} />
      </group>

      {/* Warm Studio lighting */}
      <pointLight
        position={[8.4, FLOOR1_Y + 5.0, -5.5]}
        color="#FFF1CC"
        intensity={isNight ? 20 : 5.5}
        distance={18}
        decay={2}
      />
    </group>
  );
};
