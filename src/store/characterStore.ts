import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEGO_COLORS } from '../lib/colors';
import { FLOOR1_Y, FLOOR2_Y } from '../lib/constants';
import { MAX_CHARACTERS, type MinifigConfig } from '../characters/minifig/types';
import type { CharacterId, PersonalityType, RoomId, Vec3 } from '../types';

export interface SyncAgentInput {
  agentId: string;
  name: string;
  title: string;
}

/**
 * Empty by default! Characters in the house are automatically spawned 1-to-1
 * from detected OpenBot agents (or Mode Demo), and stay empty if 0 agents exist.
 */
export const DEFAULT_MINIFIGS: MinifigConfig[] = [];

type OutfitTemplate = Omit<
  MinifigConfig,
  'id' | 'name' | 'role' | 'quote' | 'favoriteRoom' | 'personality' | 'startPosition'
>;

const AGENT_OUTFIT_TEMPLATES: OutfitTemplate[] = [
  // 0: Royal Blue Hoodie + Headphones (Tech/Dev vibe)
  {
    avatarBg: LEGO_COLORS.royalBlue,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'dot',
      eyebrows: 'normal',
      mouth: 'smile',
      blush: false,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'short',
    hairColor: LEGO_COLORS.brownWood,
    headwear: 'none',
    headwearColor: LEGO_COLORS.black,
    torsoStyle: 'hoodie',
    torsoColor: LEGO_COLORS.royalBlue,
    torsoSecondaryColor: LEGO_COLORS.lightBlue,
    torsoPattern: 'solid',
    armColor: LEGO_COLORS.royalBlue,
    shortSleeves: false,
    handColor: 'skin',
    bottomStyle: 'pants',
    bottomColor: LEGO_COLORS.denim,
    bottomPattern: 'jeans',
    shoeStyle: 'sneakers',
    shoeColor: LEGO_COLORS.white,
    height: 'standard',
    build: 'standard',
    accessories: {
      headSlot: 'headphones',
      faceSlot: 'none',
      neckSlot: 'none',
      leftHandSlot: 'none',
      rightHandSlot: 'none',
      backSlot: 'none',
    },
  },
  // 1: Turquoise Tropical Shirt + Bucket Hat + Camera
  {
    avatarBg: LEGO_COLORS.turquoise,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'dot',
      eyebrows: 'raised',
      mouth: 'laugh',
      blush: false,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'short',
    hairColor: LEGO_COLORS.darkWood,
    headwear: 'bucket-hat',
    headwearColor: LEGO_COLORS.creamWall,
    torsoStyle: 'hawaiian',
    torsoColor: LEGO_COLORS.turquoise,
    torsoSecondaryColor: LEGO_COLORS.yellow,
    torsoPattern: 'floral',
    armColor: LEGO_COLORS.turquoise,
    shortSleeves: true,
    handColor: 'skin',
    bottomStyle: 'shorts',
    bottomColor: LEGO_COLORS.khaki,
    bottomPattern: 'solid',
    shoeStyle: 'sandals',
    shoeColor: LEGO_COLORS.brownWood,
    height: 'standard',
    build: 'standard',
    accessories: {
      headSlot: 'none',
      faceSlot: 'none',
      neckSlot: 'camera',
      leftHandSlot: 'none',
      rightHandSlot: 'none',
      backSlot: 'none',
    },
  },
  // 2: Pink Kebaya + Batik Skirt
  {
    avatarBg: LEGO_COLORS.pinkExterior,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'oval',
      eyebrows: 'normal',
      mouth: 'smile',
      blush: true,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'sanggul',
    hairColor: LEGO_COLORS.black,
    headwear: 'none',
    headwearColor: LEGO_COLORS.gold,
    torsoStyle: 'kebaya',
    torsoColor: LEGO_COLORS.pinkExterior,
    torsoSecondaryColor: LEGO_COLORS.pinkLight,
    torsoPattern: 'solid',
    armColor: LEGO_COLORS.pinkExterior,
    shortSleeves: false,
    handColor: 'skin',
    bottomStyle: 'batik',
    bottomColor: LEGO_COLORS.brownWood,
    bottomPattern: 'batik',
    shoeStyle: 'sandals',
    shoeColor: LEGO_COLORS.gold,
    height: 'standard',
    build: 'slim',
    accessories: {
      headSlot: 'none',
      faceSlot: 'none',
      neckSlot: 'necklace',
      leftHandSlot: 'none',
      rightHandSlot: 'none',
      backSlot: 'none',
    },
  },
  // 3: Orange Casual T-Shirt + Backpack + Coffee Cup
  {
    avatarBg: LEGO_COLORS.orange,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'dot',
      eyebrows: 'normal',
      mouth: 'smile',
      blush: false,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'curly',
    hairColor: LEGO_COLORS.black,
    headwear: 'none',
    headwearColor: LEGO_COLORS.orange,
    torsoStyle: 'tshirt',
    torsoColor: LEGO_COLORS.orange,
    torsoSecondaryColor: LEGO_COLORS.white,
    torsoPattern: 'logo',
    armColor: LEGO_COLORS.orange,
    shortSleeves: true,
    handColor: 'skin',
    bottomStyle: 'pants',
    bottomColor: LEGO_COLORS.darkGray,
    bottomPattern: 'solid',
    shoeStyle: 'sneakers',
    shoeColor: LEGO_COLORS.white,
    height: 'standard',
    build: 'standard',
    accessories: {
      headSlot: 'none',
      faceSlot: 'none',
      neckSlot: 'none',
      leftHandSlot: 'coffee-cup',
      rightHandSlot: 'none',
      backSlot: 'backpack',
    },
  },
  // 4: Purple Smart Jacket + Glasses
  {
    avatarBg: LEGO_COLORS.purple,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'dot',
      eyebrows: 'normal',
      mouth: 'smile',
      blush: false,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'bangs',
    hairColor: LEGO_COLORS.darkWood,
    headwear: 'none',
    headwearColor: LEGO_COLORS.purple,
    torsoStyle: 'jacket',
    torsoColor: LEGO_COLORS.purple,
    torsoSecondaryColor: LEGO_COLORS.white,
    torsoPattern: 'solid',
    armColor: LEGO_COLORS.purple,
    shortSleeves: false,
    handColor: 'skin',
    bottomStyle: 'pants',
    bottomColor: LEGO_COLORS.black,
    bottomPattern: 'solid',
    shoeStyle: 'formal',
    shoeColor: LEGO_COLORS.black,
    height: 'standard',
    build: 'standard',
    accessories: {
      headSlot: 'none',
      faceSlot: 'glasses',
      neckSlot: 'none',
      leftHandSlot: 'none',
      rightHandSlot: 'none',
      backSlot: 'none',
    },
  },
  // 5: Red Chef / Creative Apron + Cap
  {
    avatarBg: LEGO_COLORS.red,
    skinColor: LEGO_COLORS.minifigYellow,
    headShape: 'cylinder',
    headScale: 1.0,
    face: {
      eyes: 'dot',
      eyebrows: 'normal',
      mouth: 'smile',
      blush: true,
      freckles: false,
      facialHair: 'none',
    },
    hairStyle: 'short',
    hairColor: LEGO_COLORS.brownWood,
    headwear: 'baseball-cap',
    headwearColor: LEGO_COLORS.red,
    torsoStyle: 'shirt',
    torsoColor: LEGO_COLORS.red,
    torsoSecondaryColor: LEGO_COLORS.white,
    torsoPattern: 'stripes',
    armColor: LEGO_COLORS.red,
    shortSleeves: true,
    handColor: 'skin',
    bottomStyle: 'pants',
    bottomColor: LEGO_COLORS.denim,
    bottomPattern: 'jeans',
    shoeStyle: 'sneakers',
    shoeColor: LEGO_COLORS.white,
    height: 'standard',
    build: 'standard',
    accessories: {
      headSlot: 'none',
      faceSlot: 'none',
      neckSlot: 'none',
      leftHandSlot: 'none',
      rightHandSlot: 'none',
      backSlot: 'none',
    },
  },
];

const AGENT_SPAWN_SPOTS: Array<{ pos: Vec3; room: RoomId; personality: PersonalityType }> = [
  { pos: [6.5, FLOOR1_Y, 7.6], room: 'foyer', personality: 'chatty' },
  { pos: [7.5, FLOOR2_Y, 4.8], room: 'living-room', personality: 'relaxed' },
  { pos: [-10.5, FLOOR2_Y, -6.2], room: 'kitchen', personality: 'diligent' },
  { pos: [10.0, FLOOR2_Y, -6.0], room: 'dressing-room', personality: 'chatty' },
  { pos: [-11.0, FLOOR2_Y, 3.2], room: 'terraces', personality: 'relaxed' },
  { pos: [4.8, FLOOR1_Y, -0.5], room: 'studio', personality: 'diligent' },
  { pos: [-9.2, FLOOR1_Y, -3.2], room: 'guest-room', personality: 'shy' },
  { pos: [0.0, FLOOR1_Y, 10.1], room: 'foyer', personality: 'chatty' },
];

function hashSlug(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getAgentCharacterId(agentId: string): CharacterId {
  return `agent-${agentId}`;
}

export function isAutoSyncedAgentCharacter(charId: CharacterId): boolean {
  return charId.startsWith('agent-');
}

export function buildDefaultAgentMinifig(agent: SyncAgentInput, slotIndex: number): MinifigConfig {
  const hash = hashSlug(agent.agentId);
  const template = AGENT_OUTFIT_TEMPLATES[(hash + slotIndex) % AGENT_OUTFIT_TEMPLATES.length];
  const spot = AGENT_SPAWN_SPOTS[slotIndex % AGENT_SPAWN_SPOTS.length];
  return {
    ...structuredClone(template),
    id: getAgentCharacterId(agent.agentId),
    name: agent.name,
    role: agent.title,
    quote: `Siap bantu sebagai ${agent.title}!`,
    favoriteRoom: spot.room,
    personality: spot.personality,
    startPosition: [...spot.pos],
  };
}

export function createBlankMinifig(index: number): MinifigConfig {
  const template = AGENT_OUTFIT_TEMPLATES[index % AGENT_OUTFIT_TEMPLATES.length];
  return {
    ...structuredClone(template),
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `Tamu ${index}`,
    role: 'Penghuni Baru',
    quote: 'Halo semua! Senang banget bisa tinggal di rumah LEGO ini!',
    favoriteRoom: 'foyer',
    personality: 'chatty',
    startPosition: [0, FLOOR1_Y, 10.2],
  };
}

interface CharacterStoreState {
  characters: MinifigConfig[];
  /** Custom outfits edited by user, remembered per OpenBot agentId */
  savedAgentOutfits: Record<string, MinifigConfig>;
  syncWithAgents: (agents: SyncAgentInput[]) => void;
  addCharacter: (config: MinifigConfig) => boolean;
  updateCharacter: (id: CharacterId, next: MinifigConfig) => void;
  duplicateCharacter: (id: CharacterId) => MinifigConfig | null;
  deleteCharacter: (id: CharacterId) => boolean;
  importCharacters: (list: MinifigConfig[]) => void;
  resetCharacters: () => void;
}

export const useCharacterStore = create<CharacterStoreState>()(
  persist(
    (set, get) => ({
      characters: [],
      savedAgentOutfits: {},

      syncWithAgents: (agents) =>
        set((s) => {
          // Preserve any user-created non-agent characters
          const customChars = s.characters.filter((c) => !isAutoSyncedAgentCharacter(c.id));
          const existingById = new Map(s.characters.map((c) => [c.id, c]));
          const maxAgents = Math.max(0, MAX_CHARACTERS - customChars.length);
          const limitedAgents = agents.slice(0, maxAgents);

          const syncedChars: MinifigConfig[] = limitedAgents.map((ag, idx) => {
            const charId = getAgentCharacterId(ag.agentId);
            const base =
              existingById.get(charId) ??
              s.savedAgentOutfits[ag.agentId] ??
              buildDefaultAgentMinifig(ag, idx);

            return {
              ...base,
              id: charId,
              name: ag.name,
              role: ag.title,
            };
          });

          const nextCharacters = [...syncedChars, ...customChars];

          // Avoid unnecessary React state updates if IDs, names, and roles are unchanged
          if (
            nextCharacters.length === s.characters.length &&
            nextCharacters.every((c, i) => {
              const prev = s.characters[i];
              return prev && prev.id === c.id && prev.name === c.name && prev.role === c.role;
            })
          ) {
            return s;
          }

          return { characters: nextCharacters };
        }),

      addCharacter: (config) => {
        if (get().characters.length >= MAX_CHARACTERS) return false;
        const spawned: MinifigConfig = {
          ...config,
          startPosition: [0, FLOOR1_Y, 10.2],
        };
        set((s) => ({ characters: [...s.characters, spawned] }));
        return true;
      },

      updateCharacter: (id, next) =>
        set((s) => {
          const updated: MinifigConfig = { ...next, id };
          const nextSaved = { ...s.savedAgentOutfits };
          if (isAutoSyncedAgentCharacter(id)) {
            const agentId = id.slice('agent-'.length);
            nextSaved[agentId] = updated;
          }
          return {
            characters: s.characters.map((c) => (c.id === id ? updated : c)),
            savedAgentOutfits: nextSaved,
          };
        }),

      duplicateCharacter: (id) => {
        const state = get();
        if (state.characters.length >= MAX_CHARACTERS) return null;
        const src = state.characters.find((c) => c.id === id);
        if (!src) return null;
        const copy: MinifigConfig = {
          ...structuredClone(src),
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${src.name} (Salinan)`,
          startPosition: [0, FLOOR1_Y, 10.2],
        };
        set((s) => ({ characters: [...s.characters, copy] }));
        return copy;
      },

      deleteCharacter: (id) => {
        set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }));
        return true;
      },

      importCharacters: (list) => {
        if (!Array.isArray(list)) return;
        set({ characters: list.slice(0, MAX_CHARACTERS) });
      },

      resetCharacters: () => set({ characters: [], savedAgentOutfits: {} }),
    }),
    {
      name: 'lego-openbot-characters-v3',
      partialize: (s) => ({
        // Persist custom characters + custom outfits for OpenBot agents; live agent list re-syncs cleanly from OpenBot
        characters: s.characters.filter((c) => !isAutoSyncedAgentCharacter(c.id)),
        savedAgentOutfits: s.savedAgentOutfits,
      }),
    }
  )
);
