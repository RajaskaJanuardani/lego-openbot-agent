import type { CameraPreset, CameraTarget, FloorLevel, RoomId } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';

export const INITIAL_CAMERA: CameraTarget = {
  position: [-30, 29, 30],
  target: [0, 8.5, 0],
};

export const FLOOR1_OVERVIEW_CAMERA: CameraTarget = {
  position: [-26, 20, 28],
  target: [0, 2.4, 0],
};

export const ROOM_FLOOR_MAP: Record<RoomId, FloorLevel | 'all'> = {
  overview: 'all',
  // Floor 2
  kitchen: 2,
  bedroom: 2,
  'dressing-room': 2,
  'stair-room': 2,
  'living-room': 2,
  'dining-area': 2,
  terraces: 2,
  // Floor 1
  foyer: 1,
  studio: 1,
  'guest-room': 1,
  'bathroom-1': 1,
  laundry: 1,
  'stair-hall-1': 1,
  'front-porch': 1,
  // Outdoor
  'outdoor-yard': 'all',
  'outdoor-beach': 'all',
  'outdoor-tuktuk': 'all',
};

export const ROOM_CAMERA_TARGETS: Record<RoomId, CameraTarget> = {
  overview: INITIAL_CAMERA,
  // Floor 2
  kitchen: {
    position: [-23, 21, 10],
    target: [-11, 9.2, -5.5],
  },
  bedroom: {
    position: [-7, 22, 10],
    target: [-1, 9.4, -7],
  },
  'dressing-room': {
    position: [12, 22, 10],
    target: [10, 9.4, -7],
  },
  'stair-room': {
    position: [-8, 21, 22],
    target: [-1.5, 8.6, 5.5],
  },
  'living-room': {
    position: [7, 21, 22],
    target: [7.5, 9.2, 3.5],
  },
  'dining-area': {
    position: [11, 19, 22],
    target: [7.5, 9.0, 8.5],
  },
  terraces: {
    position: [-25, 20, 22],
    target: [-11, 8.8, 6.5],
  },
  // Floor 1
  foyer: {
    position: [6, 14, 24],
    target: [8.5, 2.2, 7.2],
  },
  studio: {
    position: [11, 18.5, 9],
    target: [8.4, 2.2, -5.5],
  },
  'guest-room': {
    position: [-21, 14, 10],
    target: [-10.5, 2.2, -5.5],
  },
  'bathroom-1': {
    position: [-6, 15, 7],
    target: [-1.5, 2.2, -7.2],
  },
  laundry: {
    position: [-22, 14, 20],
    target: [-11, 2.2, 6.0],
  },
  'stair-hall-1': {
    position: [-8, 14, 20],
    target: [-2.0, 2.2, 5.5],
  },
  'front-porch': {
    position: [-10, 12, 27],
    target: [0, 2.0, 13.5],
  },
  // Outdoor
  'outdoor-yard': {
    position: [28, 16, 26],
    target: [18, 2.0, 12],
  },
  'outdoor-beach': {
    position: [32, 18, 8],
    target: [20, 1.5, -12],
  },
  'outdoor-tuktuk': {
    position: [31, 12, 18],
    target: [21.5, 1.8, 7.5],
  },
};

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    label: 'Overview',
    color: LEGO_COLORS.blue,
    floor: 'all',
    ...ROOM_CAMERA_TARGETS.overview,
  },
  // Floor 2 presets
  {
    id: 'kitchen',
    label: 'Dapur',
    color: LEGO_COLORS.yellow,
    floor: 2,
    ...ROOM_CAMERA_TARGETS.kitchen,
  },
  {
    id: 'bedroom',
    label: 'Kamar Tidur',
    color: LEGO_COLORS.turquoise,
    floor: 2,
    ...ROOM_CAMERA_TARGETS.bedroom,
  },
  {
    id: 'living-room',
    label: 'Ruang Keluarga',
    color: LEGO_COLORS.red,
    floor: 2,
    ...ROOM_CAMERA_TARGETS['living-room'],
  },
  {
    id: 'terraces',
    label: 'Teras',
    color: LEGO_COLORS.pinkExterior,
    floor: 2,
    ...ROOM_CAMERA_TARGETS.terraces,
  },
  // Floor 1 presets (auto-activates Floor 1 transparent mode!)
  {
    id: 'foyer',
    label: 'Ruang Tamu',
    color: LEGO_COLORS.green,
    floor: 1,
    ...ROOM_CAMERA_TARGETS.foyer,
  },
  {
    id: 'studio',
    label: 'Ruang Kerja',
    color: LEGO_COLORS.purple,
    floor: 1,
    ...ROOM_CAMERA_TARGETS.studio,
  },
  {
    id: 'guest-room',
    label: 'Kamar Tamu',
    color: LEGO_COLORS.orange,
    floor: 1,
    ...ROOM_CAMERA_TARGETS['guest-room'],
  },
];
