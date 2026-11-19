import React from 'react';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y } from '../../lib/layout';
import {
  KitchenLowerCabinet,
  KitchenUpperCabinet,
  StoveOven,
  KitchenSink,
  Fridge,
  DiningTable,
  WoodChair,
  PatternedRug,
  PottedPlant,
  PendantLamp,
  Curtains,
} from '../furniture';

export interface RoomProps {
  isNight: boolean;
}

/**
 * Kitchen (Dapur) — interior floor x: [-15, -7], z: [-11, 0], y = FLOOR_Y (7.6)
 * Keeps Chef Budi's standing/pacing lane (x: -12..-9, z: -7.5..-5.5) and terrace doorway (x: -11..-9, z: 1) clear.
 */
export const Kitchen: React.FC<RoomProps> = ({ isNight }) => {
  return (
    <group name="room-kitchen">
      {/* === NORTH WALL COUNTER RUN (against z = -11.0 inner wall face) === */}
      {/* Corner white lower cabinet */}
      <KitchenLowerCabinet
        position={[-13.9, FLOOR_Y, -10.3]}
        width={2.0}
        depth={1.35}
        doors={2}
      />

      {/* Kitchen sink centered beneath north window (x = -13..-10) */}
      <KitchenSink position={[-11.65, FLOOR_Y, -10.3]} />

      {/* Prep cabinet between sink and stove */}
      <KitchenLowerCabinet
        position={[-9.65, FLOOR_Y, -10.3]}
        width={1.65}
        depth={1.35}
        doors={2}
      />
      {/* Cutting board & veggies on prep counter */}
      <Tile position={[-9.65, FLOOR_Y + 1.9, -10.2]} size={[0.76, 0.54]} height={0.07} color={LEGO_COLORS.rattan} />
      <Tile position={[-9.78, FLOOR_Y + 1.97, -10.22]} size={[0.18, 0.18]} height={0.14} color={LEGO_COLORS.brightGreen} />
      <Tile position={[-9.52, FLOOR_Y + 1.97, -10.18]} size={[0.16, 0.16]} height={0.14} color={LEGO_COLORS.red} />

      {/* Stove with 4 black burners + oven with dark glass door & silver handle */}
      <StoveOven position={[-7.7, FLOOR_Y, -10.3]} />

      {/* === NORTH WALL UPPER WHITE CABINETS (flanking north window x = -13..-10) === */}
      <KitchenUpperCabinet
        position={[-14.1, FLOOR_Y + 3.85, -10.55]}
        width={1.6}
        doors={2}
      />
      <KitchenUpperCabinet
        position={[-8.2, FLOOR_Y + 3.85, -10.55]}
        width={2.9}
        doors={3}
      />

      {/* === WEST WALL CABINETS & SILVER REFRIGERATOR (against x = -15.0 inner face) === */}
      <KitchenLowerCabinet
        position={[-14.28, FLOOR_Y, -7.75]}
        rotation={[0, Math.PI / 2, 0]}
        width={2.6}
        depth={1.32}
        doors={2}
      />
      {/* Mini coffee maker & colorful spice jars on west countertop */}
      <Tile position={[-14.4, FLOOR_Y + 1.9, -8.35]} size={[0.5, 0.56]} height={0.65} color={LEGO_COLORS.black} />
      <Tile position={[-14.2, FLOOR_Y + 1.9, -8.35]} size={[0.24, 0.28]} height={0.34} color={LEGO_COLORS.silver} />
      <Tile position={[-14.35, FLOOR_Y + 1.9, -7.1]} size={[0.22, 0.22]} height={0.3} color={LEGO_COLORS.red} />
      <Tile position={[-14.35, FLOOR_Y + 1.9, -6.78]} size={[0.22, 0.22]} height={0.3} color={LEGO_COLORS.yellow} />

      <KitchenUpperCabinet
        position={[-14.55, FLOOR_Y + 3.85, -7.75]}
        rotation={[0, Math.PI / 2, 0]}
        width={2.5}
        doors={2}
      />

      {/* Tall silver refrigerator (kulkas silver) with chrome handles */}
      <Fridge position={[-14.2, FLOOR_Y, -2.9]} rotation={[0, Math.PI / 2, 0]} />

      {/* === BLUE-WHITE PATTERNED CURTAINS (North window x=-13..-10 & South window x=-9..-7) === */}
      <Curtains position={[-11.5, 11.75, -10.92]} width={2.6} variant="blue-white" />
      <Curtains
        position={[-8.0, 11.35, 0.42]}
        rotation={[0, Math.PI, 0]}
        width={1.9}
        variant="blue-white"
      />

      {/* === SMALL WOODEN DINING TABLE WITH 2 CHAIRS === */}
      <DiningTable
        position={[-8.1, FLOOR_Y, -2.9]}
        size={[2.0, 1.75]}
        height={1.55}
        color={LEGO_COLORS.brownWood}
      />
      {/* Breakfast mugs & small plate on kitchen table */}
      <Tile position={[-8.1, FLOOR_Y + 1.55, -2.9]} size={[0.52, 0.52]} height={0.07} color={LEGO_COLORS.white} />
      <Tile position={[-8.48, FLOOR_Y + 1.55, -2.5]} size={[0.24, 0.24]} height={0.24} color={LEGO_COLORS.lightBlue} />
      <Tile position={[-7.72, FLOOR_Y + 1.55, -3.28]} size={[0.24, 0.24]} height={0.24} color={LEGO_COLORS.yellow} />

      <WoodChair position={[-8.1, FLOOR_Y, -4.25]} rotation={[0, 0, 0]} cushionColor={LEGO_COLORS.lightBlue} />
      <WoodChair position={[-8.1, FLOOR_Y, -1.55]} rotation={[0, Math.PI, 0]} cushionColor={LEGO_COLORS.lightBlue} />

      {/* === BLUE-YELLOW PATTERNED LEGO TILE RUG (thin so Chef stands cleanly on it) === */}
      <PatternedRug position={[-10.5, FLOOR_Y, -6.2]} pattern="kitchen-blue-yellow" />

      {/* === POTTED TROPICAL PLANT IN SW CORNER === */}
      <PottedPlant
        position={[-14.1, FLOOR_Y, -0.45]}
        potColor={LEGO_COLORS.terracotta}
        variant="tropical"
        scale={0.95}
      />

      {/* === YELLOW HANGING PENDANT LAMP WITH WARM POINT LIGHT === */}
      <PendantLamp
        position={[-10.5, 13.6, -5.6]}
        isNight={isNight}
        shadeColor={LEGO_COLORS.yellow}
        lightIntensityDay={4}
        lightIntensityNight={18}
        lightDistance={14}
      />
    </group>
  );
};
