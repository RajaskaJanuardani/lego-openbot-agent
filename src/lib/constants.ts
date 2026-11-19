import type { Vec3 } from '../types';

export const STUD_UNIT = 1;
export const PLATE_H = 0.4;
export const BRICK_H = 1.2;
export const STUD_RADIUS = 0.3;
export const STUD_HEIGHT = 0.22;
export const BRICK_GAP = 0.02;

/** Exterior world baseplate top surface */
export const GROUND_Y = 0;
/** Floor 1 interior plate top surface (1 plate above baseplate) */
export const FLOOR1_Y = PLATE_H; // 0.4
/** Ground floor structural wall height (6 bricks = 18 plates) */
export const GROUND_FLOOR_H = 6 * BRICK_H; // 7.2
/** Floor 2 interior plate top surface (slab 7.2..7.6) */
export const FLOOR2_Y = GROUND_FLOOR_H + PLATE_H; // 7.6
/** Legacy alias for Floor 2 top surface */
export const FLOOR_Y = FLOOR2_Y;
/** Consistent inter-floor vertical distance (FLOOR2_Y - FLOOR1_Y = 7.2 = 6 bricks = 18 plates) */
export const FLOOR_HEIGHT = FLOOR2_Y - FLOOR1_Y; // 7.2
/** Floor 2 full cutaway wall top */
export const WALL_TOP_Y = FLOOR2_Y + 6 * BRICK_H; // 14.8

/** Precision connecting staircase geometry (12 equal steps from Floor 2 down to Floor 1) */
export const STAIR_STEPS = 12;
export const STAIR_STEP_DROP = FLOOR_HEIGHT / STAIR_STEPS; // 0.6 exactly
export const STAIR_STEP_DEPTH = 0.5;
export const STAIR_WIDTH = 2.7;
export const STAIR_CENTER_X = -2.5;
export const STAIR_TOP_Z = 3.5; // Step 0 starts descending at z = 3.5
export const STAIR_BOTTOM_Z = STAIR_TOP_Z + STAIR_STEPS * STAIR_STEP_DEPTH; // 9.5

/** Stairwell cutout bounds in Floor 2 slab */
export const STAIRWELL_HOLE = {
  minX: -4,
  maxX: -1,
  minZ: 3.5,
  maxZ: 9.5,
} as const;

export interface StairStepPoint {
  index: number;
  position: Vec3;
}

/**
 * Exact walkable step-by-step center points from Floor 2 top landing
 * down each of the 12 treads to Floor 1 bottom landing.
 */
export function getStairStepPoints(): StairStepPoint[] {
  const pts: StairStepPoint[] = [];
  // Upper Floor 2 entry landing just north of step 0
  pts.push({
    index: -1,
    position: [STAIR_CENTER_X, FLOOR2_Y, STAIR_TOP_Z - 0.6],
  });
  for (let i = 0; i < STAIR_STEPS; i++) {
    const y = Number((FLOOR2_Y - (i + 1) * STAIR_STEP_DROP).toFixed(4));
    const z = Number((STAIR_TOP_Z + (i + 0.5) * STAIR_STEP_DEPTH).toFixed(4));
    pts.push({
      index: i,
      position: [STAIR_CENTER_X, y, z],
    });
  }
  // Lower Floor 1 landing just south of step 11
  pts.push({
    index: STAIR_STEPS,
    position: [STAIR_CENTER_X, FLOOR1_Y, STAIR_BOTTOM_Z + 0.7],
  });
  return pts;
}

export interface StudioWorkstationSpec {
  id: string;
  deskPosition: Vec3;
  chairPosition: Vec3;
  /** Y rotation for the seated agent facing the monitor */
  facingY: number;
  screenColor: string;
}

/**
 * 6 Agent Workstations in Floor 1 Studio (x: [2, 15], z: [-11, 3]).
 * Shared by StudioRoom 3D rendering AND character AI "working" navigation.
 */
export const STUDIO_WORKSTATIONS: StudioWorkstationSpec[] = [
  // North desk row (facing North / -Z toward monitors at z = -8.6)
  {
    id: 'desk-1',
    deskPosition: [4.8, FLOOR1_Y, -8.5],
    chairPosition: [4.8, FLOOR1_Y, -7.2],
    facingY: Math.PI,
    screenColor: '#38BDF8',
  },
  {
    id: 'desk-2',
    deskPosition: [8.4, FLOOR1_Y, -8.5],
    chairPosition: [8.4, FLOOR1_Y, -7.2],
    facingY: Math.PI,
    screenColor: '#34D399',
  },
  {
    id: 'desk-3',
    deskPosition: [12.0, FLOOR1_Y, -8.5],
    chairPosition: [12.0, FLOOR1_Y, -7.2],
    facingY: Math.PI,
    screenColor: '#F472B6',
  },
  // South desk row (facing North / -Z toward monitors at z = -3.8)
  {
    id: 'desk-4',
    deskPosition: [4.8, FLOOR1_Y, -3.7],
    chairPosition: [4.8, FLOOR1_Y, -2.4],
    facingY: Math.PI,
    screenColor: '#FBBF24',
  },
  {
    id: 'desk-5',
    deskPosition: [8.4, FLOOR1_Y, -3.7],
    chairPosition: [8.4, FLOOR1_Y, -2.4],
    facingY: Math.PI,
    screenColor: '#A78BFA',
  },
  {
    id: 'desk-6',
    deskPosition: [12.0, FLOOR1_Y, -3.7],
    chairPosition: [12.0, FLOOR1_Y, -2.4],
    facingY: Math.PI,
    screenColor: '#2DD4BF',
  },
];
