import type { CharacterId, PersonalityType, RoomId, Vec3 } from '../../types';

export type HeadShape = 'cylinder' | 'round' | 'chibi' | 'small';
export type EyeStyle = 'dot' | 'oval' | 'sleepy' | 'wink' | 'glasses';
export type EyebrowStyle = 'normal' | 'thick' | 'angry' | 'raised';
export type MouthStyle = 'smile' | 'laugh' | 'neutral' | 'surprised' | 'tongue';
export type FacialHairStyle = 'none' | 'mustache' | 'beard';

export type HairStyle =
  | 'none'
  | 'short'
  | 'buzz'
  | 'bangs'
  | 'curly'
  | 'long'
  | 'ponytail'
  | 'sanggul'
  | 'hijab'
  | 'mohawk';

export type HeadwearStyle =
  | 'none'
  | 'chef-hat'
  | 'bucket-hat'
  | 'baseball-cap'
  | 'helmet'
  | 'peci'
  | 'crown'
  | 'bandana';

export type TorsoStyle =
  | 'tshirt'
  | 'shirt'
  | 'hawaiian'
  | 'hoodie'
  | 'jacket'
  | 'suit'
  | 'kebaya'
  | 'apron'
  | 'school-uniform'
  | 'jersey';

export type TorsoPattern = 'solid' | 'stripes' | 'floral' | 'batik' | 'logo';

export type BottomStyle = 'pants' | 'shorts' | 'skirt' | 'batik' | 'overalls';
export type BottomPattern = 'solid' | 'jeans' | 'stripes' | 'batik';

export type ShoeStyle = 'sneakers' | 'sandals' | 'boots' | 'formal' | 'barefoot';

export type BodyHeight = 'child' | 'standard' | 'tall';
export type BodyBuild = 'slim' | 'standard' | 'broad';

export interface MinifigAccessories {
  headSlot: 'none' | 'headphones';
  faceSlot: 'none' | 'glasses' | 'sunglasses';
  neckSlot: 'none' | 'camera' | 'necklace' | 'scarf';
  leftHandSlot: 'none' | 'coffee-cup' | 'laptop' | 'watch';
  rightHandSlot: 'none' | 'spatula' | 'fan' | 'coffee-cup';
  backSlot: 'none' | 'backpack';
}

export interface MinifigFaceConfig {
  eyes: EyeStyle;
  eyebrows: EyebrowStyle;
  mouth: MouthStyle;
  blush: boolean;
  freckles: boolean;
  facialHair: FacialHairStyle;
}

export interface MinifigConfig {
  id: CharacterId;
  name: string;
  role: string;
  quote: string;
  favoriteRoom: RoomId;
  personality: PersonalityType;
  startPosition: Vec3;
  avatarBg: string;

  skinColor: string;
  headShape: HeadShape;
  headScale: number; // 0.85..1.20
  face: MinifigFaceConfig;

  hairStyle: HairStyle;
  hairColor: string;
  headwear: HeadwearStyle;
  headwearColor: string;

  torsoStyle: TorsoStyle;
  torsoColor: string;
  torsoSecondaryColor: string;
  torsoPattern: TorsoPattern;

  armColor: string;
  shortSleeves: boolean;
  /** 'skin' follows skinColor, otherwise custom glove hex color */
  handColor: string;

  bottomStyle: BottomStyle;
  bottomColor: string;
  bottomPattern: BottomPattern;

  shoeStyle: ShoeStyle;
  shoeColor: string;

  height: BodyHeight;
  build: BodyBuild;

  accessories: MinifigAccessories;
}

export const MAX_CHARACTERS = 12;
