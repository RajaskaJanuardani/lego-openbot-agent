import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OpenBotAgent,
  OpenBotConnectionState,
} from '../openbot/AgentSource';
import type { CharacterId } from '../types';
import { getAgentCharacterId, isAutoSyncedAgentCharacter } from './characterStore';

interface AgentStoreState {
  onboardingDismissed: boolean;
  connectionState: OpenBotConnectionState;
  agents: OpenBotAgent[];
  /** 1-to-1 mapping: characterId -> OpenBot agentId */
  characterToAgent: Record<CharacterId, string>;

  dismissOnboarding: () => void;
  resetBindings: () => void;
  setConnectionState: (state: OpenBotConnectionState) => void;
  setAgents: (agents: OpenBotAgent[]) => void;
  syncAutoBindings: (agents: OpenBotAgent[]) => void;
  linkCharacterToAgent: (charId: CharacterId, agentId: string) => void;
  unlinkCharacter: (charId: CharacterId) => void;
  getAgentForCharacter: (charId: CharacterId) => OpenBotAgent | null;
  getCharacterForAgent: (agentId: string) => CharacterId | null;
}

export const useAgentStore = create<AgentStoreState>()(
  persist(
    (set, get) => ({
      onboardingDismissed: false,
      connectionState: 'offline',
      agents: [],
      characterToAgent: {},

      dismissOnboarding: () => set({ onboardingDismissed: true }),
      resetBindings: () =>
        set({
          onboardingDismissed: false,
          characterToAgent: {},
        }),
      setConnectionState: (connectionState) => set({ connectionState }),
      setAgents: (agents) => set({ agents }),

      syncAutoBindings: (agents) =>
        set((s) => {
          const next: Record<CharacterId, string> = {};
          const activeIds = new Set(agents.map((a) => a.agentId));
          for (const [cid, aid] of Object.entries(s.characterToAgent)) {
            if (!isAutoSyncedAgentCharacter(cid) && activeIds.has(aid)) {
              next[cid] = aid;
            }
          }
          for (const ag of agents) {
            next[getAgentCharacterId(ag.agentId)] = ag.agentId;
          }
          return { characterToAgent: next };
        }),

      linkCharacterToAgent: (charId, agentId) =>
        set((s) => {
          const next: Record<CharacterId, string> = {};
          for (const [cid, aid] of Object.entries(s.characterToAgent)) {
            if (aid !== agentId) next[cid] = aid;
          }
          next[charId] = agentId;
          return { characterToAgent: next };
        }),

      unlinkCharacter: (charId) =>
        set((s) => {
          const next = { ...s.characterToAgent };
          delete next[charId];
          return { characterToAgent: next };
        }),

      getAgentForCharacter: (charId) => {
        const s = get();
        const aid = s.characterToAgent[charId];
        if (!aid) return null;
        return s.agents.find((a) => a.agentId === aid) ?? null;
      },

      getCharacterForAgent: (agentId) => {
        const entries = Object.entries(get().characterToAgent);
        const hit = entries.find(([, aid]) => aid === agentId);
        return hit ? hit[0] : null;
      },
    }),
    {
      name: 'lego-openbot-state-v3',
      partialize: (s) => ({
        onboardingDismissed: s.onboardingDismissed,
      }),
    }
  )
);
