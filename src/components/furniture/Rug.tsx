import React from 'react';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import type { Vec3 } from '../../types';

export type RugPattern =
  | 'kitchen-blue-yellow'
  | 'ethnic-living'
  | 'red-dressing'
  | 'bedroom-mint'
  | 'bath-mat';

export interface RugProps {
  position?: Vec3;
  rotation?: Vec3;
  pattern: RugPattern;
}

const RUG_H = 0.08;

/** Procedural multi-tile smooth LEGO patterned rug (sits flush at y + 0.01 to prevent z-fighting) */
export const PatternedRug: React.FC<RugProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pattern,
}) => {
  if (pattern === 'kitchen-blue-yellow') {
    // 4x3 blue-yellow checkered/geometric kitchen tile rug
    const cols = 4;
    const rows = 3;
    const tileW = 0.92;
    const tileD = 0.92;
    return (
      <group position={[position[0], position[1] + 0.01, position[2]]} rotation={rotation}>
        {/* Outer border base */}
        <Tile position={[0, 0, 0]} size={[cols * tileW + 0.28, rows * tileD + 0.28]} height={RUG_H * 0.6} color={LEGO_COLORS.navyBlue} />
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const x = (c - (cols - 1) / 2) * tileW;
            const z = (r - (rows - 1) / 2) * tileD;
            const isYellow = (r + c) % 2 === 0;
            const color = isYellow ? LEGO_COLORS.yellow : LEGO_COLORS.lightBlue;
            return (
              <Tile
                key={`${r}-${c}`}
                position={[x, RUG_H * 0.45, z]}
                size={[tileW - 0.06, tileD - 0.06]}
                height={RUG_H * 0.65}
                color={color}
              />
            );
          })
        )}
        {/* Center cream diamond accent */}
        <Tile position={[0, RUG_H * 1.05, 0]} size={[0.8, 0.8]} height={0.03} color={LEGO_COLORS.white} rotation={[0, Math.PI / 4, 0]} />
      </group>
    );
  }

  if (pattern === 'ethnic-living') {
    // Large 5.2 x 4.0 colorful Indonesian ikat/ethnic patterned Living Room rug
    const stripeColors = [
      LEGO_COLORS.red,
      LEGO_COLORS.warmYellow,
      LEGO_COLORS.turquoise,
      LEGO_COLORS.orange,
      LEGO_COLORS.royalBlue,
      LEGO_COLORS.orange,
      LEGO_COLORS.turquoise,
      LEGO_COLORS.warmYellow,
      LEGO_COLORS.red,
    ];
    return (
      <group position={[position[0], position[1] + 0.01, position[2]]} rotation={rotation}>
        {/* Deep navy woven base */}
        <Tile position={[0, 0, 0]} size={[5.2, 4.0]} height={RUG_H * 0.65} color={LEGO_COLORS.navyBlue} />

        {/* Colorful ethnic bands */}
        {stripeColors.map((col, idx) => {
          const z = (idx - 4) * 0.4;
          return (
            <Tile
              key={idx}
              position={[0, RUG_H * 0.55, z]}
              size={[4.75, 0.34]}
              height={RUG_H * 0.55}
              color={col}
            />
          );
        })}

        {/* Geometric center medallion & flanking diamonds */}
        <Tile position={[0, RUG_H * 1.0, 0]} size={[1.35, 1.35]} height={0.035} color={LEGO_COLORS.creamWall} rotation={[0, Math.PI / 4, 0]} />
        <Tile position={[0, RUG_H * 1.3, 0]} size={[0.78, 0.78]} height={0.03} color={LEGO_COLORS.magentaTrim} rotation={[0, Math.PI / 4, 0]} />
        <Tile position={[-1.65, RUG_H * 1.0, 0]} size={[0.72, 0.72]} height={0.03} color={LEGO_COLORS.yellow} rotation={[0, Math.PI / 4, 0]} />
        <Tile position={[1.65, RUG_H * 1.0, 0]} size={[0.72, 0.72]} height={0.03} color={LEGO_COLORS.yellow} rotation={[0, Math.PI / 4, 0]} />

        {/* Decorative cream fringe studs along left & right ends */}
        {[-1.5, -0.75, 0, 0.75, 1.5].map((fz) => (
          <React.Fragment key={fz}>
            <Tile position={[-2.72, 0, fz]} size={[0.22, 0.24]} height={0.05} color={LEGO_COLORS.creamWall} />
            <Tile position={[2.72, 0, fz]} size={[0.22, 0.24]} height={0.05} color={LEGO_COLORS.creamWall} />
          </React.Fragment>
        ))}
      </group>
    );
  }

  if (pattern === 'red-dressing') {
    // Rich red LEGO tile rug with gold & pink trim for Dressing Room
    return (
      <group position={[position[0], position[1] + 0.01, position[2]]} rotation={rotation}>
        <Tile position={[0, 0, 0]} size={[4.4, 3.4]} height={RUG_H * 0.7} color={LEGO_COLORS.red} />
        {/* Gold inner border */}
        <Tile position={[0, RUG_H * 0.65, -1.4]} size={[3.9, 0.2]} height={0.035} color={LEGO_COLORS.gold} />
        <Tile position={[0, RUG_H * 0.65, 1.4]} size={[3.9, 0.2]} height={0.035} color={LEGO_COLORS.gold} />
        <Tile position={[-1.85, RUG_H * 0.65, 0]} size={[0.2, 2.9]} height={0.035} color={LEGO_COLORS.gold} />
        <Tile position={[1.85, RUG_H * 0.65, 0]} size={[0.2, 2.9]} height={0.035} color={LEGO_COLORS.gold} />
        {/* Center ornamental motif */}
        <Tile position={[0, RUG_H * 0.72, 0]} size={[1.1, 1.1]} height={0.03} color={LEGO_COLORS.warmYellow} rotation={[0, Math.PI / 4, 0]} />
        <Tile position={[0, RUG_H * 1.0, 0]} size={[0.62, 0.62]} height={0.025} color={LEGO_COLORS.magentaTrim} rotation={[0, Math.PI / 4, 0]} />
      </group>
    );
  }

  if (pattern === 'bedroom-mint') {
    // Soft bedroom foot-of-bed woven runner rug
    return (
      <group position={[position[0], position[1] + 0.01, position[2]]} rotation={rotation}>
        <Tile position={[0, 0, 0]} size={[3.8, 1.45]} height={RUG_H * 0.7} color={LEGO_COLORS.creamTile} />
        <Tile position={[0, RUG_H * 0.65, 0]} size={[3.35, 1.0]} height={0.035} color={LEGO_COLORS.lightBlue} />
        <Tile position={[0, RUG_H * 0.95, 0]} size={[2.7, 0.45]} height={0.03} color={LEGO_COLORS.royalBlue} />
      </group>
    );
  }

  // bath-mat
  return (
    <group position={[position[0], position[1] + 0.01, position[2]]} rotation={rotation}>
      <Tile position={[0, 0, 0]} size={[1.35, 1.85]} height={RUG_H * 0.7} color={LEGO_COLORS.white} />
      <Tile position={[0, RUG_H * 0.65, 0]} size={[1.05, 1.5]} height={0.035} color={LEGO_COLORS.mintTile} />
      <Tile position={[0, RUG_H * 0.95, 0]} size={[0.65, 1.05]} height={0.03} color={LEGO_COLORS.turquoise} />
    </group>
  );
};
