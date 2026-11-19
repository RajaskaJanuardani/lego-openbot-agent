import React from 'react';
import { Brick, Plate, Tile } from '../components/lego';
import {
  BedsideLantern,
  CarvedWoodPanel,
  CoffeeTable,
  DiningTable,
  FramedPainting,
  Fridge,
  KitchenLowerCabinet,
  KitchenSink,
  PendantLamp,
  PatternedRug,
  PlasticChair,
  PottedPlant,
  RattanArmchair,
  RattanSideboard,
  RoundWallPlates,
  ShelvingUnit,
  Sofa,
  StoveOven,
  WallSconce,
  WoodChair,
} from '../components/furniture';
import { LoungeChair, PalmTree, TukTuk } from '../components/environment';
import { LEGO_COLORS } from '../lib/colors';
import type { Vec3 } from '../types';

export type AssetCategory =
  | 'furniture'
  | 'kitchen'
  | 'plants'
  | 'lighting'
  | 'wall-decor'
  | 'floor'
  | 'outdoor';

export interface AssetInteractionSpec {
  offset: [number, number];
  kind:
    | 'sit'
    | 'work'
    | 'cook'
    | 'drink'
    | 'wash'
    | 'sleep'
    | 'hammock'
    | 'watch-tv'
    | 'shower'
    | 'sunbathe';
  facingOffset: number;
  seatOffsetY?: number;
}

export interface AssetRenderProps {
  color: string;
  accentColor: string;
  isNight: boolean;
}

export interface AssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  /** Footprint in studs [widthX, depthZ] */
  footprint: [number, number];
  mountType: 'floor' | 'wall';
  /** Default wall mount elevation above active floor (if mountType === 'wall') */
  wallMountHeight?: number;
  colorable: boolean;
  defaultColor: string;
  defaultAccentColor: string;
  icon: string;
  interactionPoint?: AssetInteractionSpec;
  render: (props: AssetRenderProps) => React.ReactElement;
}

export const ASSET_CATEGORIES: Array<{ id: AssetCategory; label: string }> = [
  { id: 'furniture', label: 'Furnitur' },
  { id: 'kitchen', label: 'Dapur' },
  { id: 'plants', label: 'Tanaman' },
  { id: 'lighting', label: 'Lampu' },
  { id: 'wall-decor', label: 'Dinding' },
  { id: 'floor', label: 'Lantai' },
  { id: 'outdoor', label: 'Outdoor' },
];

/** Reusable compact procedural LEGO assets for registry items not yet standalone */
const MiniComputerDesk: React.FC<AssetRenderProps> = ({ color, accentColor, isNight }) => (
  <group>
    <Tile position={[-0.95, 0, -0.4]} size={[0.16, 0.16]} height={1.4} color={LEGO_COLORS.darkGray} />
    <Tile position={[0.95, 0, -0.4]} size={[0.16, 0.16]} height={1.4} color={LEGO_COLORS.darkGray} />
    <Tile position={[-0.95, 0, 0.4]} size={[0.16, 0.16]} height={1.4} color={LEGO_COLORS.darkGray} />
    <Tile position={[0.95, 0, 0.4]} size={[0.16, 0.16]} height={1.4} color={LEGO_COLORS.darkGray} />
    <Tile position={[0, 1.4, 0]} size={[2.2, 1.15]} height={0.15} color={color} />
    <Brick position={[0, 1.55, -0.28]} size={[1.1, 0.65, 0.14]} color={LEGO_COLORS.black} studs={false} />
    <Tile
      position={[0, 1.68, -0.19]}
      size={[0.94, 0.04]}
      height={0.5}
      color={accentColor}
      materialOpts={{ emissive: accentColor, emissiveIntensity: isNight ? 1.4 : 0.6 }}
    />
    <Tile position={[0, 1.55, 0.22]} size={[0.7, 0.26]} height={0.07} color={LEGO_COLORS.darkGray} />
    {/* Office Chair positioned at z = +0.9 */}
    <group position={[0, 0, 0.9]}>
      <Tile position={[0, 0, 0]} size={[0.65, 0.65]} height={0.14} color={LEGO_COLORS.black} />
      <Tile position={[0, 0.14, 0]} size={[0.18, 0.18]} height={0.56} color={LEGO_COLORS.black} />
      <Tile position={[0, 0.7, 0]} size={[0.85, 0.8]} height={0.15} color={accentColor} />
      <Tile position={[0, 0.85, 0.34]} size={[0.82, 0.14]} height={0.95} color={accentColor} />
    </group>
  </group>
);

const MiniSingleBed: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Brick position={[0, 0, 0]} size={[2.4, 0.6, 4.2]} color={color} studs={false} />
    <Brick position={[0, 0.72, -1.95]} size={[2.45, 1.4, 0.3]} color={color} studs={false} />
    <Tile position={[0, 0.72, -0.05]} size={[2.2, 3.8]} height={0.3} color={LEGO_COLORS.white} />
    <Tile position={[0, 1.02, 0.55]} size={[2.25, 2.5]} height={0.2} color={accentColor} />
    <Plate position={[0, 1.02, -1.35]} size={[1.5, 0.7, 0.8]} color={LEGO_COLORS.offWhite} studs={false} />
  </group>
);

const MiniTvStand: React.FC<AssetRenderProps> = ({ color, accentColor, isNight }) => (
  <group>
    {/* Media console table */}
    <Tile position={[-1.4, 0, -0.32]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
    <Tile position={[1.4, 0, -0.32]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
    <Tile position={[-1.4, 0, 0.32]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
    <Tile position={[1.4, 0, 0.32]} size={[0.18, 0.18]} height={0.42} color={LEGO_COLORS.darkWood} />
    <Brick position={[0, 0.42, 0]} size={[3.2, 0.65, 1.0]} color={color} studs={false} />
    <Tile position={[0, 1.2, 0]} size={[3.3, 1.1]} height={0.14} color={LEGO_COLORS.darkWood} />
    {/* Flatscreen LEGO TV */}
    <Tile position={[0, 1.34, 0]} size={[1.1, 0.52]} height={0.12} color={LEGO_COLORS.black} />
    <Tile position={[0, 1.46, -0.05]} size={[0.3, 0.2]} height={0.34} color={LEGO_COLORS.darkGray} />
    <Brick position={[0, 1.78, -0.04]} size={[2.9, 1.4, 0.2]} color={LEGO_COLORS.black} studs={false} />
    <Tile
      position={[0, 1.9, 0.08]}
      size={[2.6, 0.05]}
      height={1.38}
      color={accentColor}
      materialOpts={{ emissive: accentColor, emissiveIntensity: isNight ? 1.5 : 0.7 }}
    />
  </group>
);

const MiniWardrobe: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Brick position={[0, 0, 0]} size={[2.2, 3.4, 1.1]} color={color} studs={false} />
    <Tile position={[0, 4.08, 0]} size={[2.3, 1.2]} height={0.16} color={accentColor} />
    <Plate position={[-0.18, 2.0, 0.58]} size={[0.14, 0.35, 0.12]} color={LEGO_COLORS.gold} studs={false} />
    <Plate position={[0.18, 2.0, 0.58]} size={[0.14, 0.35, 0.12]} color={LEGO_COLORS.gold} studs={false} />
  </group>
);

const MiniCactus: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Brick position={[0, 0, 0]} size={[0.85, 0.7, 0.85]} color={accentColor} studs={false} />
    <Brick position={[0, 0.84, 0]} size={[0.45, 1.35, 0.45]} color={color} />
    <Brick position={[-0.42, 1.5, 0]} size={[0.32, 0.55, 0.32]} color={color} />
    <Brick position={[0.42, 1.75, 0]} size={[0.32, 0.5, 0.32]} color={color} />
    <Plate position={[0, 2.48, 0]} size={[0.32, 0.3, 0.32]} color={LEGO_COLORS.pinkExterior} studs={false} />
  </group>
);

const MiniDeskLamp: React.FC<AssetRenderProps> = ({ color, accentColor, isNight }) => (
  <group>
    <Plate position={[0, 0, 0]} size={[0.6, 0.3, 0.6]} color={accentColor} studs={false} />
    <Tile position={[0, 0.12, 0]} size={[0.14, 0.14]} height={0.95} color={LEGO_COLORS.silver} />
    <Brick
      position={[0, 1.05, 0]}
      size={[0.58, 0.42, 0.58]}
      color={color}
      studs={false}
      materialOpts={isNight ? { emissive: color, emissiveIntensity: 1.4 } : undefined}
    />
    <pointLight
      position={[0, 1.2, 0]}
      color="#FFE19C"
      intensity={isNight ? 10 : 1.5}
      distance={9}
      decay={2}
    />
  </group>
);

const MiniWallClock: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Brick position={[0, 0, 0]} size={[1.15, 0.95, 0.22]} color={color} studs={false} />
    <Tile position={[0, 0.14, 0.12]} size={[0.86, 0.06]} height={0.86} color={LEGO_COLORS.white} />
    <Tile position={[0, 0.55, 0.16]} size={[0.08, 0.05]} height={0.32} color={accentColor} />
    <Tile position={[0.15, 0.52, 0.16]} size={[0.28, 0.05]} height={0.08} color={LEGO_COLORS.black} />
  </group>
);

const MiniWallShelf: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Tile position={[0, 0, 0.25]} size={[2.2, 0.62]} height={0.16} color={color} />
    <Brick position={[-0.6, 0.16, 0.25]} size={[0.42, 0.45, 0.42]} color={accentColor} />
    <Brick position={[0.45, 0.16, 0.25]} size={[0.55, 0.35, 0.4]} color={LEGO_COLORS.yellow} />
  </group>
);

const MiniBeachUmbrella: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Plate position={[0, 0, 0]} size={[0.9, 0.4, 0.9]} color={LEGO_COLORS.offWhite} studs={false} />
    <Tile position={[0, 0.16, 0]} size={[0.18, 0.18]} height={3.5} color={LEGO_COLORS.brownWood} />
    <Tile position={[0, 3.6, 0]} size={[3.2, 3.2]} height={0.28} color={color} />
    <Tile position={[0, 3.88, 0]} size={[2.1, 2.1]} height={0.26} color={accentColor} />
    <Plate position={[0, 4.14, 0]} size={[0.7, 0.4, 0.7]} color={LEGO_COLORS.white} studs={false} />
  </group>
);

const MiniPicnicTable: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Tile position={[0, 1.32, 0]} size={[3.0, 1.5]} height={0.18} color={color} />
    <Tile position={[0, 0.68, -1.25]} size={[3.0, 0.6]} height={0.16} color={accentColor} />
    <Tile position={[0, 0.68, 1.25]} size={[3.0, 0.6]} height={0.16} color={accentColor} />
    <Tile position={[-1.05, 0, 0]} size={[0.24, 2.6]} height={1.32} color={LEGO_COLORS.darkWood} />
    <Tile position={[1.05, 0, 0]} size={[0.24, 2.6]} height={1.32} color={LEGO_COLORS.darkWood} />
  </group>
);

const MiniBicycle: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    {/* Front & rear tires */}
    <Tile position={[-0.78, 0, 0]} size={[0.72, 0.22]} height={0.72} color={LEGO_COLORS.black} />
    <Tile position={[0.78, 0, 0]} size={[0.72, 0.22]} height={0.72} color={LEGO_COLORS.black} />
    {/* Frame & handlebars */}
    <Tile position={[0, 0.56, 0]} size={[1.4, 0.18]} height={0.24} color={color} />
    <Tile position={[0.62, 0.72, 0]} size={[0.18, 0.75]} height={0.62} color={LEGO_COLORS.silver} />
    <Tile position={[-0.3, 0.85, 0]} size={[0.42, 0.28]} height={0.14} color={accentColor} />
  </group>
);

const MiniWoodenFence: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Tile position={[-1.2, 0, 0]} size={[0.26, 0.26]} height={1.65} color={accentColor} />
    <Tile position={[0, 0, 0]} size={[0.26, 0.26]} height={1.65} color={accentColor} />
    <Tile position={[1.2, 0, 0]} size={[0.26, 0.26]} height={1.65} color={accentColor} />
    <Tile position={[0, 0.45, 0]} size={[2.9, 0.16]} height={0.22} color={color} />
    <Tile position={[0, 1.15, 0]} size={[2.9, 0.16]} height={0.22} color={color} />
  </group>
);

const MiniFlowerBush: React.FC<AssetRenderProps> = ({ color, accentColor }) => (
  <group>
    <Brick position={[0, 0, 0]} size={[1.5, 0.75, 1.5]} color={color} />
    <Brick position={[0.15, 0.85, -0.1]} size={[1.0, 0.55, 1.0]} color={LEGO_COLORS.brightGreen} />
    <Plate position={[-0.45, 1.0, 0.45]} size={[0.35, 0.35, 0.35]} color={accentColor} studs={false} />
    <Plate position={[0.45, 1.5, -0.25]} size={[0.35, 0.35, 0.35]} color={LEGO_COLORS.yellow} studs={false} />
    <Plate position={[-0.1, 1.5, 0.2]} size={[0.35, 0.35, 0.35]} color={accentColor} studs={false} />
  </group>
);

/**
 * Complete data-driven LEGO Assets Registry (28 assets across 7 categories).
 */
export const ASSETS_REGISTRY: AssetDefinition[] = [
  // ======================== FURNITURE ========================
  {
    id: 'sofa',
    name: 'Sofa Kayu',
    category: 'furniture',
    footprint: [4, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.pinkCushion,
    icon: '🛋️',
    interactionPoint: { offset: [0, 0.25], kind: 'sit', facingOffset: 0, seatOffsetY: 0.85 },
    render: ({ color, accentColor }) => (
      <Sofa position={[0, 0, 0]} woodColor={color} cushionColor={accentColor} />
    ),
  },
  {
    id: 'wood-chair',
    name: 'Kursi Kayu',
    category: 'furniture',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.lightBlue,
    icon: '🪑',
    interactionPoint: { offset: [0, 0], kind: 'sit', facingOffset: 0, seatOffsetY: 0.72 },
    render: ({ color, accentColor }) => (
      <WoodChair position={[0, 0, 0]} color={color} cushionColor={accentColor} />
    ),
  },
  {
    id: 'rattan-chair',
    name: 'Kursi Rotan',
    category: 'furniture',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.rattan,
    defaultAccentColor: LEGO_COLORS.pinkCushion,
    icon: '🪑',
    interactionPoint: { offset: [0, 0], kind: 'sit', facingOffset: 0, seatOffsetY: 0.75 },
    render: ({ color, accentColor }) => (
      <RattanArmchair position={[0, 0, 0]} color={color} cushionColor={accentColor} />
    ),
  },
  {
    id: 'plastic-chair',
    name: 'Kursi Plastik',
    category: 'furniture',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brightGreen,
    defaultAccentColor: LEGO_COLORS.white,
    icon: '🪑',
    interactionPoint: { offset: [0, 0], kind: 'sit', facingOffset: 0, seatOffsetY: 0.7 },
    render: ({ color }) => <PlasticChair position={[0, 0, 0]} color={color} />,
  },
  {
    id: 'dining-table',
    name: 'Meja Makan',
    category: 'furniture',
    footprint: [3, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.darkWood,
    icon: '🍽️',
    render: ({ color }) => <DiningTable position={[0, 0, 0]} size={[2.8, 1.8]} color={color} />,
  },
  {
    id: 'coffee-table',
    name: 'Meja Kopi',
    category: 'furniture',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.rattan,
    icon: '☕',
    render: ({ color }) => <CoffeeTable position={[0, 0, 0]} color={color} />,
  },
  {
    id: 'work-desk',
    name: 'Meja Kerja Komputer',
    category: 'furniture',
    footprint: [3, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.rattan,
    defaultAccentColor: LEGO_COLORS.lightBlue,
    icon: '💻',
    interactionPoint: { offset: [0, 0.9], kind: 'work', facingOffset: Math.PI, seatOffsetY: 0.75 },
    render: (props) => <MiniComputerDesk {...props} />,
  },
  {
    id: 'single-bed',
    name: 'Ranjang Single',
    category: 'furniture',
    footprint: [3, 4],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.blue,
    icon: '🛏️',
    interactionPoint: { offset: [0, 0], kind: 'sleep', facingOffset: 0, seatOffsetY: 1.24 },
    render: (props) => <MiniSingleBed {...props} />,
  },
  {
    id: 'tv-stand',
    name: 'TV & Meja Media',
    category: 'furniture',
    footprint: [4, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.lightBlue,
    icon: '📺',
    interactionPoint: { offset: [0, 1.8], kind: 'watch-tv', facingOffset: Math.PI, seatOffsetY: 0.72 },
    render: (props) => <MiniTvStand {...props} />,
  },
  {
    id: 'wardrobe',
    name: 'Lemari Pakaian',
    category: 'furniture',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.darkWood,
    icon: '🚪',
    render: (props) => <MiniWardrobe {...props} />,
  },
  {
    id: 'bookshelf',
    name: 'Rak Buku',
    category: 'furniture',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.darkWood,
    icon: '📚',
    render: () => <ShelvingUnit position={[0, 0, 0]} />,
  },
  {
    id: 'sideboard',
    name: 'Bufet Rotan',
    category: 'furniture',
    footprint: [3, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.rattan,
    defaultAccentColor: LEGO_COLORS.brownWood,
    icon: '🗄️',
    render: () => <RattanSideboard position={[0, 0, 0]} />,
  },

  // ======================== KITCHEN ========================
  {
    id: 'fridge',
    name: 'Kulkas Silver',
    category: 'kitchen',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.silver,
    defaultAccentColor: LEGO_COLORS.lightGray,
    icon: '🧊',
    interactionPoint: { offset: [0, 1.2], kind: 'drink', facingOffset: Math.PI },
    render: () => <Fridge position={[0, 0, 0]} />,
  },
  {
    id: 'stove',
    name: 'Kompor & Oven',
    category: 'kitchen',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.white,
    defaultAccentColor: LEGO_COLORS.black,
    icon: '🍳',
    interactionPoint: { offset: [0, 1.1], kind: 'cook', facingOffset: Math.PI },
    render: () => <StoveOven position={[0, 0, 0]} />,
  },
  {
    id: 'cabinet',
    name: 'Kabinet Dapur',
    category: 'kitchen',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.white,
    defaultAccentColor: LEGO_COLORS.lightGray,
    icon: '🧰',
    render: ({ color }) => <KitchenLowerCabinet position={[0, 0, 0]} color={color} width={1.9} depth={1.0} />,
  },
  {
    id: 'sink',
    name: 'Wastafel Dapur',
    category: 'kitchen',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.white,
    defaultAccentColor: LEGO_COLORS.silver,
    icon: '🚰',
    interactionPoint: { offset: [0, 1.0], kind: 'wash', facingOffset: Math.PI },
    render: () => <KitchenSink position={[0, 0, 0]} />,
  },

  // ======================== PLANTS ========================
  {
    id: 'small-pot',
    name: 'Pot Kecil',
    category: 'plants',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.terracotta,
    defaultAccentColor: LEGO_COLORS.green,
    icon: '🪴',
    render: ({ color }) => <PottedPlant position={[0, 0, 0]} potColor={color} variant="compact" />,
  },
  {
    id: 'monstera',
    name: 'Monstera Tropis',
    category: 'plants',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.yellow,
    defaultAccentColor: LEGO_COLORS.darkGreen,
    icon: '🌿',
    render: ({ color }) => <PottedPlant position={[0, 0, 0]} potColor={color} variant="tropical" scale={1.1} />,
  },
  {
    id: 'cactus',
    name: 'Kaktus LEGO',
    category: 'plants',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.green,
    defaultAccentColor: LEGO_COLORS.terracotta,
    icon: '🌵',
    render: (props) => <MiniCactus {...props} />,
  },
  {
    id: 'palm-tree',
    name: 'Pohon Kelapa',
    category: 'plants',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.green,
    defaultAccentColor: LEGO_COLORS.brownWood,
    icon: '🌴',
    render: () => <PalmTree position={[0, 0, 0]} height={9.5} />,
  },
  {
    id: 'flower-bush',
    name: 'Semak Bunga',
    category: 'plants',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.green,
    defaultAccentColor: LEGO_COLORS.orange,
    icon: '🌺',
    render: (props) => <MiniFlowerBush {...props} />,
  },

  // ======================== LIGHTING ========================
  {
    id: 'pendant-lamp',
    name: 'Lampu Gantung',
    category: 'lighting',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.yellow,
    defaultAccentColor: LEGO_COLORS.warmYellow,
    icon: '💡',
    render: ({ color, isNight }) => (
      <PendantLamp
        position={[0, 5.6, 0]}
        isNight={isNight}
        shadeColor={color}
        lightIntensityDay={3}
        lightIntensityNight={16}
        lightDistance={13}
      />
    ),
  },
  {
    id: 'desk-lamp',
    name: 'Lampu Meja',
    category: 'lighting',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.warmYellow,
    defaultAccentColor: LEGO_COLORS.darkGray,
    icon: '🛋️',
    render: (props) => <MiniDeskLamp {...props} />,
  },
  {
    id: 'wall-sconce',
    name: 'Lampu Dinding',
    category: 'lighting',
    footprint: [1, 1],
    mountType: 'wall',
    wallMountHeight: 3.6,
    colorable: true,
    defaultColor: LEGO_COLORS.warmYellow,
    defaultAccentColor: LEGO_COLORS.gold,
    icon: '🏮',
    render: ({ isNight }) => <WallSconce position={[0, 0, 0.25]} isNight={isNight} enableLight />,
  },
  {
    id: 'lantern',
    name: 'Lentera Tropis',
    category: 'lighting',
    footprint: [1, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.warmYellow,
    defaultAccentColor: LEGO_COLORS.darkWood,
    icon: '🕯️',
    render: ({ isNight }) => <BedsideLantern position={[0, 0, 0]} isNight={isNight} enableLight />,
  },

  // ======================== WALL DECOR ========================
  {
    id: 'painting',
    name: 'Lukisan Dinding',
    category: 'wall-decor',
    footprint: [2, 1],
    mountType: 'wall',
    wallMountHeight: 3.2,
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.turquoise,
    icon: '🖼️',
    render: () => <FramedPainting position={[0, 0, 0.14]} />,
  },
  {
    id: 'wall-clock',
    name: 'Jam Dinding',
    category: 'wall-decor',
    footprint: [1, 1],
    mountType: 'wall',
    wallMountHeight: 3.4,
    colorable: true,
    defaultColor: LEGO_COLORS.red,
    defaultAccentColor: LEGO_COLORS.blue,
    icon: '🕒',
    render: (props) => <MiniWallClock {...props} />,
  },
  {
    id: 'carved-panel',
    name: 'Panel Ukir Kayu',
    category: 'wall-decor',
    footprint: [4, 1],
    mountType: 'wall',
    wallMountHeight: 3.2,
    colorable: true,
    defaultColor: LEGO_COLORS.darkWood,
    defaultAccentColor: LEGO_COLORS.gold,
    icon: '🪵',
    render: () => <CarvedWoodPanel position={[0, 0, 0.14]} />,
  },
  {
    id: 'wall-shelf',
    name: 'Rak Dinding',
    category: 'wall-decor',
    footprint: [2, 1],
    mountType: 'wall',
    wallMountHeight: 3.0,
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.turquoise,
    icon: '📐',
    render: (props) => <MiniWallShelf {...props} />,
  },
  {
    id: 'decor-plates',
    name: 'Piring Dekor',
    category: 'wall-decor',
    footprint: [2, 1],
    mountType: 'wall',
    wallMountHeight: 3.2,
    colorable: false,
    defaultColor: LEGO_COLORS.rattan,
    defaultAccentColor: LEGO_COLORS.turquoise,
    icon: '🍽️',
    render: () => <RoundWallPlates position={[0, 0, 0.14]} />,
  },

  // ======================== FLOOR ========================
  {
    id: 'rug-ethnic',
    name: 'Karpet Etnik',
    category: 'floor',
    footprint: [5, 4],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.red,
    defaultAccentColor: LEGO_COLORS.yellow,
    icon: '🧶',
    render: () => <PatternedRug position={[0, 0, 0]} pattern="ethnic-living" />,
  },
  {
    id: 'rug-blue-yellow',
    name: 'Karpet Biru-Kuning',
    category: 'floor',
    footprint: [4, 3],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.blue,
    defaultAccentColor: LEGO_COLORS.yellow,
    icon: '🟦',
    render: () => <PatternedRug position={[0, 0, 0]} pattern="kitchen-blue-yellow" />,
  },
  {
    id: 'doormat',
    name: 'Keset Pintu',
    category: 'floor',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.terracotta,
    defaultAccentColor: LEGO_COLORS.creamWall,
    icon: '🚪',
    render: ({ color, accentColor }) => (
      <group>
        <Tile position={[0, 0, 0]} size={[1.9, 1.0]} height={0.07} color={color} />
        <Tile position={[0, 0.06, 0]} size={[1.5, 0.65]} height={0.04} color={accentColor} />
      </group>
    ),
  },

  // ======================== OUTDOOR ========================
  {
    id: 'beach-chair',
    name: 'Kursi Pantai',
    category: 'outdoor',
    footprint: [2, 3],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.blue,
    defaultAccentColor: LEGO_COLORS.white,
    icon: '🏖️',
    interactionPoint: { offset: [0, 0], kind: 'sunbathe', facingOffset: 0, seatOffsetY: 0.65 },
    render: ({ isNight }) => <LoungeChair position={[0, 0, 0]} isNight={isNight} />,
  },
  {
    id: 'beach-umbrella',
    name: 'Payung Pantai',
    category: 'outdoor',
    footprint: [2, 2],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.seaBlue,
    defaultAccentColor: LEGO_COLORS.white,
    icon: '⛱️',
    render: (props) => <MiniBeachUmbrella {...props} />,
  },
  {
    id: 'picnic-table',
    name: 'Meja Piknik',
    category: 'outdoor',
    footprint: [3, 3],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.rattan,
    icon: '🧺',
    interactionPoint: { offset: [0, 1.25], kind: 'sit', facingOffset: Math.PI, seatOffsetY: 0.72 },
    render: (props) => <MiniPicnicTable {...props} />,
  },
  {
    id: 'bicycle',
    name: 'Sepeda LEGO',
    category: 'outdoor',
    footprint: [2, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.red,
    defaultAccentColor: LEGO_COLORS.black,
    icon: '🚲',
    render: (props) => <MiniBicycle {...props} />,
  },
  {
    id: 'tuktuk',
    name: 'Bajaj Kuning',
    category: 'outdoor',
    footprint: [3, 4],
    mountType: 'floor',
    colorable: false,
    defaultColor: LEGO_COLORS.yellow,
    defaultAccentColor: LEGO_COLORS.black,
    icon: '🛺',
    render: ({ isNight }) => <TukTuk position={[0, 0, 0]} isNight={isNight} />,
  },
  {
    id: 'wooden-fence',
    name: 'Pagar Kayu',
    category: 'outdoor',
    footprint: [3, 1],
    mountType: 'floor',
    colorable: true,
    defaultColor: LEGO_COLORS.brownWood,
    defaultAccentColor: LEGO_COLORS.darkWood,
    icon: '🪵',
    render: (props) => <MiniWoodenFence {...props} />,
  },
];

export const ASSETS_BY_ID = new Map<string, AssetDefinition>(
  ASSETS_REGISTRY.map((a) => [a.id, a])
);

export function getRotatedFootprint(
  footprint: [number, number],
  rotationQuarterTurns: number
): [number, number] {
  const q = ((rotationQuarterTurns % 4) + 4) % 4;
  return q % 2 === 1 ? [footprint[1], footprint[0]] : [footprint[0], footprint[1]];
}

export function rotateOffset(
  offset: [number, number],
  rotationQuarterTurns: number
): [number, number] {
  const angle = (((rotationQuarterTurns % 4) + 4) % 4) * (Math.PI / 2);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // Three.js Y-rotation: x' = x*cos + z*sin, z' = -x*sin + z*cos
  return [offset[0] * cos + offset[1] * sin, -offset[0] * sin + offset[1] * cos];
}

export type PlacedObjectPosition = Vec3;
