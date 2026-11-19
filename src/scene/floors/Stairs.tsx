import React from 'react';
import { Tile, Plate } from '../../components/lego';
import { LEGO_COLORS } from '../../lib/colors';
import {
  FLOOR2_Y,
  STAIR_CENTER_X,
  STAIR_STEP_DEPTH,
  STAIR_STEP_DROP,
  STAIR_STEPS,
  STAIR_TOP_Z,
  STAIR_WIDTH,
} from '../../lib/constants';
import type { Vec3 } from '../../types';

export interface StairsProps {
  /** World position of TOP-NORTH center at Floor 2 (defaults to canonical stairwell coords) */
  position?: Vec3;
  rotation?: Vec3;
  steps?: number;
  width?: number;
  stepDrop?: number;
  stepDepth?: number;
  /** Whether to render the upper Floor-2 stairwell guard railing (rendered separately in Floor 2 so it fades cleanly!) */
  includeUpperGuard?: boolean;
}

/**
 * Precision 12-step wooden LEGO staircase connecting Floor 2 (y = 7.6, z = 3.5)
 * seamlessly down to Floor 1 (y = 0.4, z = 9.5).
 * Every step has identical rise = FLOOR_HEIGHT / 12 = 0.6 units.
 */
export const Stairs: React.FC<StairsProps> = ({
  position = [STAIR_CENTER_X, FLOOR2_Y, STAIR_TOP_Z],
  rotation = [0, 0, 0],
  steps = STAIR_STEPS,
  width = STAIR_WIDTH,
  stepDrop = STAIR_STEP_DROP,
  stepDepth = STAIR_STEP_DEPTH,
  includeUpperGuard = false,
}) => {
  const halfW = width / 2;
  const totalRun = steps * stepDepth;
  const totalDrop = steps * stepDrop;

  return (
    <group name="connecting-stairs" position={position} rotation={rotation}>
      {/* 12 equal wooden treads & risers descending along +Z from y=0 down to y=-7.2 (Floor 1!) */}
      {Array.from({ length: steps }).map((_, i) => {
        // Tread top sits cleanly at -(i + 1) * stepDrop:
        // Step 0 top = -0.6 (7.0), ..., Step 11 top = -7.2 (0.4 = FLOOR1_Y!)
        const treadTopY = -(i + 1) * stepDrop;
        const zCenter = (i + 0.5) * stepDepth;
        const treadH = 0.14;
        const riserH = stepDrop;
        return (
          <group key={i}>
            {/* Dark wood structural riser/stringer block */}
            <Tile
              position={[0, treadTopY - treadH - (riserH - treadH), zCenter]}
              size={[width, stepDepth + 0.04]}
              height={riserH}
              color={LEGO_COLORS.darkWood}
            />
            {/* Warm wood tread plate with top surface flush at treadTopY */}
            <Tile
              position={[0, treadTopY - treadH, zCenter]}
              size={[width + 0.08, stepDepth + 0.06]}
              height={treadH}
              color={LEGO_COLORS.brownWood}
            />
            {/* Side wooden balusters every 2 steps */}
            {i % 2 === 0 && (
              <>
                <Tile
                  position={[-halfW + 0.1, treadTopY, zCenter]}
                  size={[0.14, 0.14]}
                  height={1.85}
                  color={LEGO_COLORS.brownWood}
                />
                <Tile
                  position={[halfW - 0.1, treadTopY, zCenter]}
                  size={[0.14, 0.14]}
                  height={1.85}
                  color={LEGO_COLORS.brownWood}
                />
              </>
            )}
          </group>
        );
      })}

      {/* Sloped left & right wooden handrails following exact stair pitch */}
      {[-halfW + 0.1, halfW - 0.1].map((rx, idx) => {
        const pitch = Math.atan2(totalDrop, totalRun);
        const railLen = Math.hypot(totalRun, totalDrop) + 0.35;
        const midZ = totalRun / 2;
        const midY = -totalDrop / 2 + 1.55;
        return (
          <group key={idx} position={[rx, midY, midZ]} rotation={[pitch, 0, 0]}>
            <Tile
              position={[0, -0.09, 0]}
              size={[0.2, railLen]}
              height={0.18}
              color={LEGO_COLORS.darkWood}
            />
          </group>
        );
      })}

      {/* Bottom Floor-1 newel posts flanking stair landing */}
      <Tile
        position={[-halfW + 0.1, -totalDrop, totalRun + 0.08]}
        size={[0.26, 0.26]}
        height={2.05}
        color={LEGO_COLORS.darkWood}
      />
      <Plate
        position={[-halfW + 0.1, -totalDrop + 2.05, totalRun + 0.08]}
        size={[0.32, 0.3, 0.32]}
        color={LEGO_COLORS.gold}
        studs={false}
      />
      <Tile
        position={[halfW - 0.1, -totalDrop, totalRun + 0.08]}
        size={[0.26, 0.26]}
        height={2.05}
        color={LEGO_COLORS.darkWood}
      />
      <Plate
        position={[halfW - 0.1, -totalDrop + 2.05, totalRun + 0.08]}
        size={[0.32, 0.3, 0.32]}
        color={LEGO_COLORS.gold}
        studs={false}
      />

      {/* Side stringer support skirts under the upper half of stairs */}
      <Tile
        position={[-halfW + 0.05, -totalDrop, 1.2]}
        size={[0.24, 2.2]}
        height={totalDrop - 1.5}
        color={LEGO_COLORS.darkWood}
      />
      <Tile
        position={[halfW - 0.05, -totalDrop, 1.2]}
        size={[0.24, 2.2]}
        height={totalDrop - 1.5}
        color={LEGO_COLORS.darkWood}
      />

      {includeUpperGuard && (
        <StairwellUpperGuard width={width} totalRun={totalRun} />
      )}
    </group>
  );
};

/**
 * Floor-2 safety wooden baluster railing surrounding the WEST, EAST, and SOUTH
 * edges of the stairwell opening (`x: [-4, -1], z: [3.5, 9.5]`).
 * Mounted inside FloorGroup level={2} so it fades cleanly in Floor 1 view!
 */
export const StairwellUpperGuard: React.FC<{
  position?: Vec3;
  width?: number;
  totalRun?: number;
}> = ({
  position = [0, 0, 0],
  width = STAIR_WIDTH,
  totalRun = STAIR_STEPS * STAIR_STEP_DEPTH,
}) => {
  const halfW = width / 2;
  const sideBalusters = [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4];

  return (
    <group name="stairwell-upper-guard" position={position}>
      {/* Top north entry newel posts */}
      <Tile
        position={[-halfW - 0.12, 0, -0.08]}
        size={[0.26, 0.26]}
        height={2.15}
        color={LEGO_COLORS.darkWood}
      />
      <Plate
        position={[-halfW - 0.12, 2.15, -0.08]}
        size={[0.32, 0.3, 0.32]}
        color={LEGO_COLORS.gold}
        studs={false}
      />
      <Tile
        position={[halfW + 0.12, 0, -0.08]}
        size={[0.26, 0.26]}
        height={2.15}
        color={LEGO_COLORS.darkWood}
      />
      <Plate
        position={[halfW + 0.12, 2.15, -0.08]}
        size={[0.32, 0.3, 0.32]}
        color={LEGO_COLORS.gold}
        studs={false}
      />

      {/* WEST guard railing */}
      <group position={[-halfW - 0.12, 0, totalRun / 2]}>
        <Tile position={[0, 1.85, 0]} size={[0.2, totalRun + 0.2]} height={0.18} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 0.08, 0]} size={[0.18, totalRun + 0.2]} height={0.16} color={LEGO_COLORS.darkWood} />
        {sideBalusters.map((bz) => (
          <Tile key={bz} position={[0, 0.2, bz]} size={[0.12, 0.12]} height={1.68} color={LEGO_COLORS.brownWood} />
        ))}
      </group>

      {/* EAST guard railing */}
      <group position={[halfW + 0.12, 0, totalRun / 2]}>
        <Tile position={[0, 1.85, 0]} size={[0.2, totalRun + 0.2]} height={0.18} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 0.08, 0]} size={[0.18, totalRun + 0.2]} height={0.16} color={LEGO_COLORS.darkWood} />
        {sideBalusters.map((bz) => (
          <Tile key={bz} position={[0, 0.2, bz]} size={[0.12, 0.12]} height={1.68} color={LEGO_COLORS.brownWood} />
        ))}
        <Tile position={[0, 0, totalRun / 2 + 0.05]} size={[0.26, 0.26]} height={2.15} color={LEGO_COLORS.darkWood} />
        <Plate position={[0, 2.15, totalRun / 2 + 0.05]} size={[0.32, 0.3, 0.32]} color={LEGO_COLORS.gold} studs={false} />
      </group>

      {/* SOUTH guard railing */}
      <group position={[0, 0, totalRun + 0.05]}>
        <Tile position={[0, 1.85, 0]} size={[width + 0.3, 0.2]} height={0.18} color={LEGO_COLORS.darkWood} />
        <Tile position={[0, 0.08, 0]} size={[width + 0.3, 0.18]} height={0.16} color={LEGO_COLORS.darkWood} />
        {[-0.9, 0, 0.9].map((bx) => (
          <Tile key={bx} position={[bx, 0.2, 0]} size={[0.12, 0.12]} height={1.68} color={LEGO_COLORS.brownWood} />
        ))}
        <Tile position={[-halfW - 0.12, 0, 0]} size={[0.26, 0.26]} height={2.15} color={LEGO_COLORS.darkWood} />
        <Plate position={[-halfW - 0.12, 2.15, 0]} size={[0.32, 0.3, 0.32]} color={LEGO_COLORS.gold} studs={false} />
      </group>
    </group>
  );
};
