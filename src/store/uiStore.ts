import { create } from 'zustand';
import type {
  CameraTarget,
  CharacterId,
  FloorViewMode,
  PresetId,
  ToastNotice,
} from '../types';

export interface UIState {
  isNight: boolean;
  autoRotate: boolean;
  showCharacters: boolean;
  floorViewMode: FloorViewMode;
  activePreset: PresetId | null;
  cameraTarget: CameraTarget | null;
  cameraRequestNonce: number;
  selectedCharacterId: CharacterId | null;
  followCharacterId: CharacterId | null;
  buildMode: boolean;
  creatorOpen: boolean;
  creatorEditingId: CharacterId | null;
  connectModalCharacterId: CharacterId | null;
  openBotSettingsOpen: boolean;
  showMinimap: boolean;
  showNavDebug: boolean;
  hasInteracted: boolean;
  sceneReady: boolean;
  toasts: ToastNotice[];

  setIsNight: (v: boolean) => void;
  toggleNight: () => void;
  setAutoRotate: (v: boolean) => void;
  toggleAutoRotate: () => void;
  setShowCharacters: (v: boolean) => void;
  toggleCharacters: () => void;
  setFloorViewMode: (mode: FloorViewMode) => void;
  setActivePreset: (preset: PresetId | null) => void;
  requestCameraMove: (target: CameraTarget) => void;
  clearCameraTarget: () => void;
  setSelectedCharacterId: (id: CharacterId | null) => void;
  setFollowCharacterId: (id: CharacterId | null) => void;
  setBuildMode: (v: boolean) => void;
  toggleBuildMode: () => void;
  openCreator: (editingId: CharacterId | null) => void;
  closeCreator: () => void;
  openConnectModal: (charId: CharacterId) => void;
  closeConnectModal: () => void;
  openOpenBotSettings: () => void;
  closeOpenBotSettings: () => void;
  toggleMinimap: () => void;
  toggleNavDebug: () => void;
  markInteracted: () => void;
  setSceneReady: (ready: boolean) => void;
  pushToast: (message: string, tone?: ToastNotice['tone']) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNight: false,
  autoRotate: true,
  showCharacters: true,
  floorViewMode: 'all',
  activePreset: 'overview',
  cameraTarget: null,
  cameraRequestNonce: 0,
  selectedCharacterId: null,
  followCharacterId: null,
  buildMode: false,
  creatorOpen: false,
  creatorEditingId: null,
  connectModalCharacterId: null,
  openBotSettingsOpen: false,
  showMinimap: true,
  showNavDebug: false,
  hasInteracted: false,
  sceneReady: false,
  toasts: [],

  setIsNight: (isNight) => set({ isNight }),
  toggleNight: () => set((s) => ({ isNight: !s.isNight, hasInteracted: true })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  toggleAutoRotate: () =>
    set((s) => ({ autoRotate: !s.autoRotate, hasInteracted: true })),
  setShowCharacters: (showCharacters) => set({ showCharacters }),
  toggleCharacters: () =>
    set((s) => ({
      showCharacters: !s.showCharacters,
      selectedCharacterId: s.showCharacters ? null : s.selectedCharacterId,
      followCharacterId: s.showCharacters ? null : s.followCharacterId,
      hasInteracted: true,
    })),
  setFloorViewMode: (floorViewMode) =>
    set({ floorViewMode, hasInteracted: true }),
  setActivePreset: (activePreset) => set({ activePreset }),
  requestCameraMove: (target) =>
    set((s) => ({
      cameraTarget: {
        position: [...target.position],
        target: [...target.target],
      },
      cameraRequestNonce: s.cameraRequestNonce + 1,
    })),
  clearCameraTarget: () => set({ cameraTarget: null }),
  setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
  setFollowCharacterId: (followCharacterId) =>
    set((s) => ({
      followCharacterId,
      autoRotate: followCharacterId ? false : s.autoRotate,
    })),
  setBuildMode: (buildMode) =>
    set((s) => ({
      buildMode,
      autoRotate: buildMode ? false : s.autoRotate,
      followCharacterId: buildMode ? null : s.followCharacterId,
      selectedCharacterId: buildMode ? null : s.selectedCharacterId,
      hasInteracted: true,
    })),
  toggleBuildMode: () =>
    set((s) => {
      const next = !s.buildMode;
      return {
        buildMode: next,
        autoRotate: next ? false : s.autoRotate,
        followCharacterId: next ? null : s.followCharacterId,
        selectedCharacterId: next ? null : s.selectedCharacterId,
        hasInteracted: true,
      };
    }),
  openCreator: (editingId) =>
    set({
      creatorOpen: true,
      creatorEditingId: editingId,
      autoRotate: false,
      hasInteracted: true,
    }),
  closeCreator: () => set({ creatorOpen: false, creatorEditingId: null }),
  openConnectModal: (charId) => set({ connectModalCharacterId: charId }),
  closeConnectModal: () => set({ connectModalCharacterId: null }),
  openOpenBotSettings: () => set({ openBotSettingsOpen: true }),
  closeOpenBotSettings: () => set({ openBotSettingsOpen: false }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleNavDebug: () => set((s) => ({ showNavDebug: !s.showNavDebug })),
  markInteracted: () => set({ hasInteracted: true }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  pushToast: (message, tone = 'info') =>
    set((s) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const next = [...s.toasts.slice(-3), { id, message, tone, createdAt: Date.now() }];
      return { toasts: next };
    }),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
