export type OpenBotConnectionState = 'connected' | 'offline';

export interface OpenBotAgent {
  agentId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  status: 'working' | 'idle';
  task?: string;
  lastCompletedTask?: string;
  staleNote?: string;
  updatedAt: string;
}

export interface AgentSource {
  listAgents(): Promise<OpenBotAgent[]>;
  subscribe(
    onChange: (agents: OpenBotAgent[]) => void,
    onConnectionChange?: (state: OpenBotConnectionState) => void
  ): () => void;
}
