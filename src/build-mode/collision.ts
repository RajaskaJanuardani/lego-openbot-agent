import {
  ASSETS_BY_ID,
  getRotatedFootprint,
  rotateOffset,
} from '../assets-registry';
import type { DynamicObstacle } from '../characters/ai/navGraph';
import { detectRoomFromPosition } from '../lib/characterRuntime';
import { FLOOR1_Y, FLOOR2_Y, GROUND_Y, STAIRWELL_HOLE } from '../lib/constants';
import type { PlacedObject } from '../lib/schema';

export interface AABB2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WallSegment2D {
  id: string;
  floor: 1 | 2;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Normal direction facing interior/front for wall-mounted decor snapping */
  axis: 'x' | 'z';
}

/** Major structural wall segments used for AABB collision & wall-mount snapping */
export const STRUCTURAL_WALLS: WallSegment2D[] = [
  // Floor 2 outer & interior walls
  { id: 'f2-north', floor: 2, minX: -16, maxX: 16, minZ: -12, maxZ: -11, axis: 'x' },
  { id: 'f2-kitchen-west', floor: 2, minX: -16, maxX: -15, minZ: -11, maxZ: 1, axis: 'z' },
  { id: 'f2-kitchen-south', floor: 2, minX: -16, maxX: -6, minZ: 0.5, maxZ: 1.5, axis: 'x' },
  { id: 'f2-dressing-east', floor: 2, minX: 15, maxX: 16, minZ: -11, maxZ: -2, axis: 'z' },
  { id: 'f2-living-east', floor: 2, minX: 11.5, maxX: 12.5, minZ: -2, maxZ: 11, axis: 'z' },
  { id: 'f2-spine-x6', floor: 2, minX: -6.5, maxX: -5.5, minZ: -11, maxZ: 11, axis: 'z' },
  { id: 'f2-part-x4', floor: 2, minX: 3.5, maxX: 4.5, minZ: -11, maxZ: -2, axis: 'z' },
  { id: 'f2-part-z-2', floor: 2, minX: -5.5, maxX: 16, minZ: -2.5, maxZ: -1.5, axis: 'x' },
  { id: 'f2-part-x3', floor: 2, minX: 2.5, maxX: 3.5, minZ: -1.5, maxZ: 11, axis: 'z' },

  // Floor 1 outer & interior walls
  { id: 'f1-north', floor: 1, minX: -16, maxX: 16, minZ: -12, maxZ: -11, axis: 'x' },
  { id: 'f1-south', floor: 1, minX: -16, maxX: 16, minZ: 11, maxZ: 12, axis: 'x' },
  { id: 'f1-west', floor: 1, minX: -16, maxX: -15, minZ: -11, maxZ: 11, axis: 'z' },
  { id: 'f1-east', floor: 1, minX: 15, maxX: 16, minZ: -11, maxZ: 11, axis: 'z' },
  { id: 'f1-guest-east', floor: 1, minX: -5.5, maxX: -4.5, minZ: -11, maxZ: 1, axis: 'z' },
  { id: 'f1-guest-south', floor: 1, minX: -15, maxX: -5.5, minZ: 0.5, maxZ: 1.5, axis: 'x' },
  { id: 'f1-laundry-east', floor: 1, minX: -6.5, maxX: -5.5, minZ: 1.5, maxZ: 11, axis: 'z' },
  { id: 'f1-bath-south', floor: 1, minX: -4.5, maxX: 1.5, minZ: -3.5, maxZ: -2.5, axis: 'x' },
  { id: 'f1-studio-west', floor: 1, minX: 1.5, maxX: 2.5, minZ: -11, maxZ: 3, axis: 'z' },
  { id: 'f1-studio-south', floor: 1, minX: 2, maxX: 15, minZ: 2.5, maxZ: 3.5, axis: 'x' },
];

export function getFloorBaseY(floor: 0 | 1 | 2): number {
  if (floor === 2) return FLOOR2_Y;
  if (floor === 1) return FLOOR1_Y;
  return GROUND_Y;
}

export function aabbOverlap(a: AABB2D, b: AABB2D, pad = 0.08): boolean {
  return (
    a.minX + pad < b.maxX &&
    a.maxX - pad > b.minX &&
    a.minZ + pad < b.maxZ &&
    a.maxZ - pad > b.minZ
  );
}

export function computeObjectAABB(
  assetId: string,
  cx: number,
  cz: number,
  rotationQuarter: number
): AABB2D {
  const def = ASSETS_BY_ID.get(assetId);
  const [w, d] = def ? getRotatedFootprint(def.footprint, rotationQuarter) : [1, 1];
  return {
    minX: cx - w * 0.5,
    maxX: cx + w * 0.5,
    minZ: cz - d * 0.5,
    maxZ: cz + d * 0.5,
  };
}

/**
 * Validates whether placing `assetId` at `[x, y, z]` on `floor` is valid
 * (inside diorama bounds, not clipping structural walls/stairwell, not overlapping other objects).
 */
export function isPlacementValid(
  assetId: string,
  floor: 0 | 1 | 2,
  cx: number,
  cz: number,
  rotationQuarter: number,
  existingObjects: PlacedObject[],
  ignoreObjectId?: string
): boolean {
  const def = ASSETS_BY_ID.get(assetId);
  if (!def) return false;

  const box = computeObjectAABB(assetId, cx, cz, rotationQuarter);

  // 1. Check outer floor boundaries
  if (floor === 0) {
    if (box.minX < -27 || box.maxX > 27 || box.minZ < -22 || box.maxZ > 22) return false;
    // Outdoor floor objects cannot clip inside the house interior footprint
    const houseBox: AABB2D = { minX: -16, maxX: 16, minZ: -12, maxZ: 12 };
    if (aabbOverlap(box, houseBox, 0.05)) return false;
  } else {
    // Indoor Floor 1 or Floor 2 must stay inside the 32x24 house footprint
    if (box.minX < -15.5 || box.maxX > 15.5 || box.minZ < -11.5 || box.maxZ > 11.5) {
      return false;
    }
    // Floor 2 cannot place inside stairwell opening
    if (floor === 2 && def.mountType === 'floor') {
      if (aabbOverlap(box, STAIRWELL_HOLE, 0.05)) return false;
    }
  }

  // 2. Wall-mounted decor requires proximity to a structural wall on Floor 1 or 2
  if (def.mountType === 'wall') {
    if (floor === 0) return false;
    const nearWall = STRUCTURAL_WALLS.some(
      (w) =>
        w.floor === floor &&
        cx >= w.minX - 1.2 &&
        cx <= w.maxX + 1.2 &&
        cz >= w.minZ - 1.2 &&
        cz <= w.maxZ + 1.2
    );
    if (!nearWall) return false;
  } else if (floor === 1 || floor === 2) {
    // Floor objects cannot overlap structural walls (rugs exempt from slight margin)
    const isRug = def.category === 'floor';
    if (!isRug) {
      for (const w of STRUCTURAL_WALLS) {
        if (w.floor !== floor) continue;
        if (aabbOverlap(box, w, 0.12)) return false;
      }
    }
  }

  // 3. Check collision against existing placed objects on the same floor
  for (const obj of existingObjects) {
    if (obj.id === ignoreObjectId) continue;
    if (obj.floor !== floor) continue;
    const otherDef = ASSETS_BY_ID.get(obj.assetId);
    // Allow placing furniture ON TOP of flat floor rugs!
    if (def.category === 'floor' || otherDef?.category === 'floor') continue;
    const otherBox = computeObjectAABB(
      obj.assetId,
      obj.position[0],
      obj.position[2],
      obj.rotationQuarter
    );
    if (aabbOverlap(box, otherBox, 0.1)) return false;
  }

  return true;
}

/** Snaps a wall-mounted asset onto the closest structural wall face */
export function snapToNearestWall(
  floor: 1 | 2,
  wx: number,
  wz: number
): { x: number; z: number; rotationQuarter: number } | null {
  let bestDist = Infinity;
  let result: { x: number; z: number; rotationQuarter: number } | null = null;

  for (const w of STRUCTURAL_WALLS) {
    if (w.floor !== floor) continue;
    const clampedX = Math.max(w.minX + 0.5, Math.min(w.maxX - 0.5, wx));
    const clampedZ = Math.max(w.minZ + 0.5, Math.min(w.maxZ - 0.5, wz));
    const d = Math.hypot(wx - clampedX, wz - clampedZ);
    if (d < bestDist && d < 2.4) {
      bestDist = d;
      if (w.axis === 'x') {
        const southSide = wz >= (w.minZ + w.maxZ) * 0.5;
        result = {
          x: Math.round(clampedX),
          z: southSide ? w.maxZ + 0.08 : w.minZ - 0.08,
          rotationQuarter: southSide ? 0 : 2,
        };
      } else {
        const eastSide = wx >= (w.minX + w.maxX) * 0.5;
        result = {
          x: eastSide ? w.maxX + 0.08 : w.minX - 0.08,
          z: Math.round(clampedZ),
          rotationQuarter: eastSide ? 1 : 3,
        };
      }
    }
  }
  return result;
}

/**
 * Converts placed Build Mode objects into DynamicObstacles for characterBrain.rebuildGraph()
 * so AI characters walk around new obstacles AND use new interaction points!
 */
export function buildDynamicObstacles(placedObjects: PlacedObject[]): DynamicObstacle[] {
  const obstacles: DynamicObstacle[] = [];

  for (const obj of placedObjects) {
    const def = ASSETS_BY_ID.get(obj.assetId);
    if (!def || def.mountType === 'wall' || def.category === 'floor') continue;

    const box = computeObjectAABB(
      obj.assetId,
      obj.position[0],
      obj.position[2],
      obj.rotationQuarter
    );

    let interactionPoint: DynamicObstacle['interactionPoint'];
    if (def.interactionPoint) {
      const [ox, oz] = rotateOffset(def.interactionPoint.offset, obj.rotationQuarter);
      const ipPos: [number, number, number] = [
        obj.position[0] + ox,
        getFloorBaseY(obj.floor),
        obj.position[2] + oz,
      ];
      const baseAngle = obj.rotationQuarter * (Math.PI / 2);
      interactionPoint = {
        position: ipPos,
        kind: def.interactionPoint.kind,
        facingY: baseAngle + def.interactionPoint.facingOffset,
        seatOffsetY: def.interactionPoint.seatOffsetY,
        roomId: detectRoomFromPosition(ipPos),
      };
    }

    obstacles.push({
      id: obj.id,
      minX: box.minX,
      maxX: box.maxX,
      minZ: box.minZ,
      maxZ: box.maxZ,
      floor: obj.floor,
      interactionPoint,
    });
  }

  return obstacles;
}
