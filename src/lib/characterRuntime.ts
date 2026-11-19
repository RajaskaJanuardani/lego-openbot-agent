import type { CharacterId, RoomId, Vec3 } from '../types';
import { FLOOR2_Y } from './constants';

export type CharacterActivity =
  | 'idle'
  | 'walking'
  | 'sitting'
  | 'working'
  | 'cooking'
  | 'drinking'
  | 'washing'
  | 'sleeping'
  | 'hammock'
  | 'watching-tv'
  | 'showering'
  | 'swimming'
  | 'sunbathing'
  | 'hopscotch'
  | 'mirror'
  | 'chatting';

export interface CharacterRuntimeSnapshot {
  id: CharacterId;
  position: Vec3;
  rotationY: number;
  roomId: RoomId;
  activity: CharacterActivity;
  speechText: string | null;
  speechUntil: number;
  isWorkingAtDesk: boolean;
}

/**
 * High-frequency mutable runtime store updated inside useFrame (zero React re-renders).
 * Consumed by Camera Follow Target, Minimap, AI separation & conversation logic, and throttled UI room badges.
 */
export const characterRuntimeMap = new Map<CharacterId, CharacterRuntimeSnapshot>();

export const cameraRuntime = {
  position: [-30, 29, 30] as Vec3,
  target: [0, 8.5, 0] as Vec3,
  azimuth: -Math.PI / 4,
};

/**
 * Classifies any 3D world point [x, y, z] into the exact RoomId (Floor 2, Floor 1, or Outdoor)
 * for real-time room badges and auto-floor switching.
 */
export function detectRoomFromPosition(pos: Vec3): RoomId {
  const [x, y, z] = pos;
  const inHouseXZ = x >= -16 && x <= 16 && z >= -12 && z <= 12;

  if (inHouseXZ && y >= FLOOR2_Y - 2.4) {
    // Floor 2 rooms
    if (x < -6 && z <= 1) return 'kitchen';
    if (x < -6 && z > 1) return 'terraces';
    if (x >= -6 && x < 4 && z <= -2) return 'bedroom';
    if (x >= 4 && z <= -2) return 'dressing-room';
    if (x >= -6 && x < 3 && z > -2) return 'stair-room';
    if (x >= 12 && z > -2) return 'terraces';
    if (x >= 3 && x < 12 && z <= 6) return 'living-room';
    return 'dining-area';
  }

  if (inHouseXZ) {
    // Floor 1 rooms
    if (x < -5 && z <= 1) return 'guest-room';
    if (x >= -5 && x < 2 && z <= -3) return 'bathroom-1';
    if (x < -6 && z > 1) return 'laundry';
    if (x >= 2 && z <= 3) return 'studio';
    if (x >= -6 && x < 1 && z > -3) return 'stair-hall-1';
    return 'foyer';
  }

  // Front porch under terracotta roof
  if (x >= -16 && x <= 16 && z > 12 && z <= 15.6) {
    return 'front-porch';
  }

  // Outdoor zones
  if (x >= 11 && z <= -5) return 'outdoor-beach';
  if (x >= 17 && z >= 3 && z <= 13) return 'outdoor-tuktuk';
  return 'outdoor-yard';
}
