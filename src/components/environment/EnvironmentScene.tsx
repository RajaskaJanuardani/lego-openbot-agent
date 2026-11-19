import React from 'react';
import { LEGO_COLORS } from '../../lib/colors';
import { GROUND_Y } from '../../lib/layout';
import { Baseplate } from './Baseplate';
import { Sea } from './Sea';
import { PalmTree, type PalmTreeProps } from './PalmTree';
import { BushField, type BushProps } from './Bush';
import { Flowers } from './Flowers';
import { TukTuk } from './TukTuk';
import { LoungeChair } from './LoungeChair';

export interface EnvironmentSceneProps {
  isNight: boolean;
}

const PALM_TREES: PalmTreeProps[] = [
  // Left-back sand
  { position: [-23, GROUND_Y, -16], height: 11.4, lean: [1.2, 0.8], rotationY: 0.4 },
  // Left-mid sand
  { position: [-22, GROUND_Y, 2], height: 9.8, lean: [-1.1, 0.7], rotationY: 1.7 },
  // Back-center sand
  { position: [-4, GROUND_Y, -18], height: 10.6, lean: [0.5, -1.1], rotationY: 2.5 },
  // Beach edge north (leaning toward sea)
  { position: [10, GROUND_Y, -18], height: 11.0, lean: [1.5, -0.7], rotationY: 0.9 },
  // Beach edge east (leaning toward sea corner)
  { position: [23, GROUND_Y, -4], height: 10.0, lean: [1.3, -1.3], rotationY: 3.8 },
  // Front-right corner
  { position: [24, GROUND_Y, 17], height: 9.6, lean: [-0.9, -0.8], rotationY: 4.9 },
  // Front-left sand (slightly lower & outward-leaning to keep isometric cutaway view clear)
  { position: [-22, GROUND_Y, 16], height: 8.6, lean: [-1.1, 0.8], rotationY: 5.5 },
];

const TROPICAL_BUSHES: BushProps[] = [
  // Front garden (left & right of stepping path, well clear of z <= 15.5 roof overhang)
  { position: [-13.8, GROUND_Y, 17.6], scale: 1.05, accentColor: LEGO_COLORS.red },
  { position: [-9.6, GROUND_Y, 19.6], scale: 0.92, color: LEGO_COLORS.darkGreen },
  { position: [-5.4, GROUND_Y, 18.4], scale: 0.88, accentColor: LEGO_COLORS.yellow },
  { position: [4.9, GROUND_Y, 18.5], scale: 0.9, accentColor: LEGO_COLORS.pinkCushion },
  { position: [9.6, GROUND_Y, 19.2], scale: 1.02, color: LEGO_COLORS.limeGreen },
  { position: [14.2, GROUND_Y, 17.5], scale: 0.95, accentColor: LEGO_COLORS.red },
  // Front corners & outer lawn
  { position: [-17.8, GROUND_Y, 20.2], scale: 1.08, color: LEGO_COLORS.darkGreen },
  { position: [18.6, GROUND_Y, 20.0], scale: 1.0, accentColor: LEGO_COLORS.yellow },
  { position: [25.6, GROUND_Y, 13.4], scale: 0.96, color: LEGO_COLORS.green },
  { position: [25.8, GROUND_Y, 19.8], scale: 0.85, accentColor: LEGO_COLORS.pinkCushion },
  // Left sand border along house side
  { position: [-18.6, GROUND_Y, 9.2], scale: 0.95, accentColor: LEGO_COLORS.yellow },
  { position: [-19.2, GROUND_Y, -3.5], scale: 1.05, color: LEGO_COLORS.darkGreen },
  { position: [-18.5, GROUND_Y, -13.5], scale: 0.92, accentColor: LEGO_COLORS.red },
  { position: [-25.4, GROUND_Y, -9.2], scale: 1.1, color: LEGO_COLORS.green },
  // Back sand garden strip behind house
  { position: [-12.2, GROUND_Y, -15.6], scale: 1.0, color: LEGO_COLORS.darkGreen },
  { position: [-0.8, GROUND_Y, -15.8], scale: 0.94, accentColor: LEGO_COLORS.pinkCushion },
  { position: [5.6, GROUND_Y, -15.4], scale: 0.9, color: LEGO_COLORS.limeGreen },
  // Right yard framing the Tuk-Tuk and Blue Lounge Chair
  { position: [17.8, GROUND_Y, 12.6], scale: 0.92, accentColor: LEGO_COLORS.yellow },
  { position: [25.6, GROUND_Y, 3.6], scale: 1.04, color: LEGO_COLORS.darkGreen },
  { position: [17.6, GROUND_Y, -3.6], scale: 0.86, accentColor: LEGO_COLORS.red },
];

export const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({ isNight }) => {
  return (
    <group name="tropical-environment-scene">
      <Baseplate />
      <Sea isNight={isNight} />

      {PALM_TREES.map((tree, idx) => (
        <PalmTree
          key={idx}
          position={tree.position}
          height={tree.height}
          lean={tree.lean}
          rotationY={tree.rotationY}
        />
      ))}

      <BushField items={TROPICAL_BUSHES} />
      <Flowers />

      <TukTuk position={[21.5, GROUND_Y, 7.5]} rotationY={-0.35} isNight={isNight} />
      <LoungeChair position={[21, GROUND_Y, -1.5]} rotationY={-1.25} isNight={isNight} />
    </group>
  );
};
