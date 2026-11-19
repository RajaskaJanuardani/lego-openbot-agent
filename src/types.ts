export type Vec3 = [number, number, number];

export type FloorLevel = 1 | 2;
export type FloorViewMode = 'all' | 'floor2' | 'floor1';

export type RoomId =
  | 'overview'
  // Floor 2 rooms
  | 'kitchen'
  | 'bedroom'
  | 'dressing-room'
  | 'stair-room'
  | 'living-room'
  | 'dining-area'
  | 'terraces'
  // Floor 1 rooms
  | 'foyer'
  | 'studio'
  | 'guest-room'
  | 'bathroom-1'
  | 'laundry'
  | 'stair-hall-1'
  | 'front-porch'
  // Outdoor areas
  | 'outdoor-yard'
  | 'outdoor-beach'
  | 'outdoor-tuktuk';

export type PresetId =
  | 'overview'
  | 'kitchen'
  | 'bedroom'
  | 'living-room'
  | 'terraces'
  | 'foyer'
  | 'studio'
  | 'guest-room';

export type CharacterId = string;

export interface CameraTarget {
  position: Vec3;
  target: Vec3;
}

export interface CameraPreset extends CameraTarget {
  id: PresetId;
  label: string;
  color: string;
  floor: FloorLevel | 'all';
}

export type PersonalityType = 'diligent' | 'relaxed' | 'chatty' | 'shy';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  role: string;
  quote: string;
  roomId: RoomId;
  personality?: PersonalityType;
  startPosition: Vec3;
  rotationY: number;
  waypoints?: Vec3[];
  walkSpeed?: number;
  sitting?: boolean;
  skinColor: string;
  torsoColor: string;
  armColor: string;
  hipColor: string;
  legColor: string;
  accentColor: string;
  hairOrHat: 'chef-hat' | 'bucket-hat' | 'brown-hair' | 'sanggul';
  accessory: 'spatula' | 'camera' | 'headphones' | 'batik-fan';
  torsoPattern: 'chef-apron' | 'hawaiian' | 'hoodie' | 'kebaya';
  legPattern?: 'solid' | 'shorts' | 'jeans' | 'batik';
  avatarBg: string;
}

export interface ToastNotice {
  id: string;
  message: string;
  tone?: 'info' | 'working' | 'idle' | 'warn';
  createdAt: number;
}
