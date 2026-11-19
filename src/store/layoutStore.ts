import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEGO_COLORS } from '../lib/colors';
import { FLOOR1_Y, FLOOR2_Y, GROUND_Y } from '../lib/constants';
import {
  LayoutDataSchema,
  type FloorPattern,
  type LayoutExportData,
  type PlacedObject,
} from '../lib/schema';
import type { RoomId } from '../types';

export interface FloorSetting {
  color: string;
  pattern: FloorPattern;
}

interface LayoutSnapshot {
  wallColors: Record<string, string>;
  trimColors: { left: string; right: string };
  floorSettings: Partial<Record<RoomId, FloorSetting>>;
  placedObjects: PlacedObject[];
}

export const DEFAULT_WALL_COLORS: Record<string, string> = {
  'outer-f1': LEGO_COLORS.mintWall,
  'outer-f2': LEGO_COLORS.pinkExterior,
};

export const DEFAULT_TRIM_COLORS = {
  left: LEGO_COLORS.darkBlueTrim,
  right: LEGO_COLORS.magentaTrim,
};

/** Default data-driven editable decorative assets (fully movable/recolorable/deletable in Build Mode!) */
export const DEFAULT_PLACED_OBJECTS: PlacedObject[] = [
  {
    id: 'default-bike-yard',
    assetId: 'bicycle',
    floor: 0,
    position: [-19, GROUND_Y, 13],
    rotationQuarter: 1,
    color: LEGO_COLORS.red,
    accentColor: LEGO_COLORS.black,
  },
  {
    id: 'default-picnic-yard',
    assetId: 'picnic-table',
    floor: 0,
    position: [-21, GROUND_Y, -3],
    rotationQuarter: 0,
    color: LEGO_COLORS.brownWood,
    accentColor: LEGO_COLORS.rattan,
  },
  {
    id: 'default-cactus-terrace',
    assetId: 'cactus',
    floor: 2,
    position: [-14, FLOOR2_Y, 10],
    rotationQuarter: 0,
    color: LEGO_COLORS.green,
    accentColor: LEGO_COLORS.terracotta,
  },
  {
    id: 'default-clock-studio',
    assetId: 'wall-clock',
    floor: 1,
    position: [13, FLOOR1_Y + 3.4, -10.92],
    rotationQuarter: 0,
    color: LEGO_COLORS.turquoise,
    accentColor: LEGO_COLORS.navyBlue,
  },
];

const MAX_HISTORY = 60;

interface LayoutStoreState extends LayoutSnapshot {
  past: LayoutSnapshot[];
  future: LayoutSnapshot[];

  // Build Mode editor UI transient state (not persisted)
  activeEditFloor: 0 | 1 | 2;
  placingAssetId: string | null;
  placingRotation: number;
  selectedObjectId: string | null;
  movingObjectId: string | null;
  selectedWallId: string | null;
  selectedFloorRoomId: RoomId | null;

  setActiveEditFloor: (floor: 0 | 1 | 2) => void;
  setPlacingAssetId: (assetId: string | null) => void;
  rotatePlacing: () => void;
  setSelectedObjectId: (id: string | null) => void;
  setMovingObjectId: (id: string | null) => void;
  setSelectedWallId: (id: string | null) => void;
  setSelectedFloorRoomId: (roomId: RoomId | null) => void;

  // Mutating actions (recorded in Undo/Redo history!)
  addPlacedObject: (obj: PlacedObject) => void;
  updatePlacedObject: (id: string, patch: Partial<PlacedObject>) => void;
  deletePlacedObject: (id: string) => void;
  duplicatePlacedObject: (id: string) => PlacedObject | null;
  setWallColor: (wallId: string, color: string) => void;
  applyRoomWallColors: (wallIds: string[], color: string) => void;
  setTrimColor: (side: 'left' | 'right', color: string) => void;
  setFloorSetting: (roomId: RoomId, setting: Partial<FloorSetting>) => void;

  undo: () => void;
  redo: () => void;
  resetToDefault: () => void;
  exportJson: (characters?: unknown[]) => string;
  importJson: (raw: string) => { ok: boolean; error?: string; characters?: unknown[] };
}

function captureSnapshot(s: LayoutSnapshot): LayoutSnapshot {
  return {
    wallColors: { ...s.wallColors },
    trimColors: { ...s.trimColors },
    floorSettings: structuredClone(s.floorSettings),
    placedObjects: structuredClone(s.placedObjects),
  };
}

function pushHistory(s: LayoutStoreState): { past: LayoutSnapshot[]; future: LayoutSnapshot[] } {
  const snap = captureSnapshot(s);
  const nextPast = [...s.past.slice(-(MAX_HISTORY - 1)), snap];
  return { past: nextPast, future: [] };
}

export const useLayoutStore = create<LayoutStoreState>()(
  persist(
    (set, get) => ({
      wallColors: { ...DEFAULT_WALL_COLORS },
      trimColors: { ...DEFAULT_TRIM_COLORS },
      floorSettings: {},
      placedObjects: structuredClone(DEFAULT_PLACED_OBJECTS),
      past: [],
      future: [],

      activeEditFloor: 2,
      placingAssetId: null,
      placingRotation: 0,
      selectedObjectId: null,
      movingObjectId: null,
      selectedWallId: null,
      selectedFloorRoomId: null,

      setActiveEditFloor: (activeEditFloor) => set({ activeEditFloor }),
      setPlacingAssetId: (placingAssetId) =>
        set({
          placingAssetId,
          selectedObjectId: null,
          movingObjectId: null,
          placingRotation: 0,
        }),
      rotatePlacing: () => set((s) => ({ placingRotation: (s.placingRotation + 1) % 4 })),
      setSelectedObjectId: (selectedObjectId) =>
        set({
          selectedObjectId,
          placingAssetId: null,
          movingObjectId: null,
        }),
      setMovingObjectId: (movingObjectId) => set({ movingObjectId }),
      setSelectedWallId: (selectedWallId) => set({ selectedWallId }),
      setSelectedFloorRoomId: (selectedFloorRoomId) => set({ selectedFloorRoomId }),

      addPlacedObject: (obj) =>
        set((s) => ({
          ...pushHistory(s),
          placedObjects: [...s.placedObjects, obj],
        })),

      updatePlacedObject: (id, patch) =>
        set((s) => ({
          ...pushHistory(s),
          placedObjects: s.placedObjects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),

      deletePlacedObject: (id) =>
        set((s) => ({
          ...pushHistory(s),
          placedObjects: s.placedObjects.filter((o) => o.id !== id),
          selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
          movingObjectId: s.movingObjectId === id ? null : s.movingObjectId,
        })),

      duplicatePlacedObject: (id) => {
        const st = get();
        const src = st.placedObjects.find((o) => o.id === id);
        if (!src) return null;
        const copy: PlacedObject = {
          ...structuredClone(src),
          id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          position: [src.position[0] + 1, src.position[1], src.position[2] + 1],
        };
        set((s) => ({
          ...pushHistory(s),
          placedObjects: [...s.placedObjects, copy],
          selectedObjectId: copy.id,
        }));
        return copy;
      },

      setWallColor: (wallId, color) =>
        set((s) => ({
          ...pushHistory(s),
          wallColors: { ...s.wallColors, [wallId]: color },
        })),

      applyRoomWallColors: (wallIds, color) =>
        set((s) => {
          const next = { ...s.wallColors };
          for (const id of wallIds) next[id] = color;
          return { ...pushHistory(s), wallColors: next };
        }),

      setTrimColor: (side, color) =>
        set((s) => ({
          ...pushHistory(s),
          trimColors: { ...s.trimColors, [side]: color },
        })),

      setFloorSetting: (roomId, setting) =>
        set((s) => {
          const prev = s.floorSettings[roomId] ?? {
            color: LEGO_COLORS.brownFloor,
            pattern: 'solid' as FloorPattern,
          };
          return {
            ...pushHistory(s),
            floorSettings: {
              ...s.floorSettings,
              [roomId]: { ...prev, ...setting },
            },
          };
        }),

      undo: () =>
        set((s) => {
          if (s.past.length === 0) return s;
          const prev = s.past[s.past.length - 1];
          const cur = captureSnapshot(s);
          return {
            ...prev,
            past: s.past.slice(0, -1),
            future: [cur, ...s.future].slice(0, MAX_HISTORY),
          };
        }),

      redo: () =>
        set((s) => {
          if (s.future.length === 0) return s;
          const next = s.future[0];
          const cur = captureSnapshot(s);
          return {
            ...next,
            past: [...s.past, cur].slice(-MAX_HISTORY),
            future: s.future.slice(1),
          };
        }),

      resetToDefault: () =>
        set((s) => ({
          ...pushHistory(s),
          wallColors: { ...DEFAULT_WALL_COLORS },
          trimColors: { ...DEFAULT_TRIM_COLORS },
          floorSettings: {},
          placedObjects: structuredClone(DEFAULT_PLACED_OBJECTS),
          selectedObjectId: null,
          placingAssetId: null,
          movingObjectId: null,
        })),

      exportJson: (characters) => {
        const s = get();
        const payload: LayoutExportData = {
          version: 2,
          wallColors: s.wallColors,
          trimColors: s.trimColors,
          floorSettings: s.floorSettings as Record<string, FloorSetting>,
          placedObjects: s.placedObjects,
          ...(characters ? { characters } : {}),
        };
        return JSON.stringify(payload, null, 2);
      },

      importJson: (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const validated = LayoutDataSchema.safeParse(parsed);
          if (!validated.success) {
            return {
              ok: false,
              error: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
            };
          }
          const data = validated.data;
          set((s) => ({
            ...pushHistory(s),
            wallColors: data.wallColors,
            trimColors: data.trimColors,
            floorSettings: data.floorSettings as Partial<Record<RoomId, FloorSetting>>,
            placedObjects: data.placedObjects,
            selectedObjectId: null,
            placingAssetId: null,
            movingObjectId: null,
          }));
          return { ok: true, characters: data.characters };
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : 'Format JSON tidak valid',
          };
        }
      },
    }),
    {
      name: 'lego-tropical-house-layout-v2',
      partialize: (s) => ({
        wallColors: s.wallColors,
        trimColors: s.trimColors,
        floorSettings: s.floorSettings,
        placedObjects: s.placedObjects,
      }),
    }
  )
);
