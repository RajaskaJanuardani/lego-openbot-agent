import { useAgentStore } from '../store/agentStore';
import { useCharacterStore } from '../store/characterStore';
import { useLayoutStore } from '../store/layoutStore';

export const APP_STORAGE_KEYS = [
  'lego-openbot-state-v3',
  'lego-openbot-characters-v3',
  'lego-tropical-house-openbot-v2',
  'lego-tropical-house-characters-v2',
  'lego-tropical-house-layout-v2',
];

export function clearLocalAppStorageOnly(): void {
  for (const key of APP_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Wipes all browser localStorage + resets in-memory Zustand stores + resets
 * local Bridge config/data so the app starts cleanly like a fresh open-source clone.
 */
export async function resetAllToFreshInstall(): Promise<void> {
  useAgentStore.getState().resetBindings();
  useCharacterStore.getState().resetCharacters();
  useLayoutStore.getState().resetToDefault();

  clearLocalAppStorageOnly();

  try {
    await fetch('/api/reset-config', { method: 'POST' });
  } catch {
    // Ignore if bridge is offline
  }

  clearLocalAppStorageOnly();
  window.location.replace(window.location.pathname);
}
