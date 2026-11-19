export {
  STUD_UNIT,
  PLATE_H,
  BRICK_H,
  STUD_RADIUS,
  STUD_HEIGHT,
  BRICK_GAP,
  GROUND_Y,
  FLOOR1_Y,
  GROUND_FLOOR_H,
  FLOOR2_Y,
  FLOOR_Y,
  FLOOR_HEIGHT,
  WALL_TOP_Y,
  STAIR_STEPS,
  STAIR_STEP_DROP,
  STAIR_STEP_DEPTH,
  STAIR_WIDTH,
  STAIR_CENTER_X,
  STAIR_TOP_Z,
  STAIR_BOTTOM_Z,
  STAIRWELL_HOLE,
  STUDIO_WORKSTATIONS,
  getStairStepPoints,
} from './constants';

export interface GridBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const HOUSE_BOUNDS: GridBounds = {
  minX: -16,
  maxX: 16,
  minZ: -12,
  maxZ: 12,
};

export const WORLD_BOUNDS: GridBounds = {
  minX: -28,
  maxX: 28,
  minZ: -23,
  maxZ: 23,
};

export const ROOM_BOUNDS = {
  // Floor 2 rooms (bathroom removed & merged into spacious stairRoom!)
  kitchen: { minX: -16, maxX: -6, minZ: -12, maxZ: 1 },
  leftTerrace: { minX: -16, maxX: -6, minZ: 1, maxZ: 12 },
  bedroom: { minX: -6, maxX: 4, minZ: -12, maxZ: -2 },
  stairRoom: { minX: -6, maxX: 3, minZ: -2, maxZ: 12 },
  dressingRoom: { minX: 4, maxX: 16, minZ: -12, maxZ: -2 },
  livingRoom: { minX: 3, maxX: 12, minZ: -2, maxZ: 6 },
  diningArea: { minX: 3, maxX: 12, minZ: 6, maxZ: 12 },
  rightTerrace: { minX: 12, maxX: 16, minZ: -2, maxZ: 12 },

  // Floor 1 rooms
  guestRoom: { minX: -16, maxX: -5, minZ: -12, maxZ: 1 },
  bathroom1: { minX: -5, maxX: 2, minZ: -12, maxZ: -3 },
  laundry: { minX: -16, maxX: -6, minZ: 1, maxZ: 12 },
  stairHall1: { minX: -6, maxX: 1, minZ: 2, maxZ: 12 },
  studio: { minX: 2, maxX: 16, minZ: -12, maxZ: 3 },
  foyer: { minX: 1, maxX: 16, minZ: 3, maxZ: 12 },
  frontPorch: { minX: -16, maxX: 16, minZ: 12, maxZ: 15.4 },
} as const satisfies Record<string, GridBounds>;
