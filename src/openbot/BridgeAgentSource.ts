import type {
  AgentSource,
  OpenBotAgent,
  OpenBotConnectionState,
} from './AgentSource';

const DEFAULT_BASE = (import.meta.env.VITE_BRIDGE_URL as string | undefined) ?? '';

/**
 * Connects to the local/remote LEGO Bridge via REST (`/api/agents`) and
 * real-time Server-Sent Events (`/api/events`) with automatic exponential backoff reconnect.
 */
export class BridgeAgentSource implements AgentSource {
  private baseUrl: string;

  constructor(baseUrl = DEFAULT_BASE) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async listAgents(): Promise<OpenBotAgent[]> {
    const res = await fetch(`${this.baseUrl}/api/agents`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Bridge GET /api/agents failed (${res.status})`);
    }
    const json = (await res.json()) as { agents?: OpenBotAgent[] };
    return Array.isArray(json.agents) ? json.agents : [];
  }

  subscribe(
    onChange: (agents: OpenBotAgent[]) => void,
    onConnectionChange?: (state: OpenBotConnectionState) => void
  ): () => void {
    let closed = false;
    let es: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let backoffMs = 1500;

    const connect = () => {
      if (closed) return;
      try {
        es = new EventSource(`${this.baseUrl}/api/events`);

        es.onopen = () => {
          backoffMs = 1500;
          onConnectionChange?.('connected');
        };

        const handlePayload = (ev: MessageEvent) => {
          try {
            const parsed = JSON.parse(String(ev.data)) as { agents?: OpenBotAgent[] };
            if (Array.isArray(parsed.agents)) {
              onChange(parsed.agents);
            }
          } catch {
            // Ignore malformed keepalive packets
          }
        };

        es.addEventListener('snapshot', handlePayload);
        es.addEventListener('agents', handlePayload);

        es.onerror = () => {
          onConnectionChange?.('offline');
          if (es) {
            es.close();
            es = null;
          }
          if (!closed) {
            reconnectTimer = window.setTimeout(connect, backoffMs);
            backoffMs = Math.min(20_000, Math.round(backoffMs * 1.7));
          }
        };
      } catch {
        onConnectionChange?.('offline');
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, backoffMs);
          backoffMs = Math.min(20_000, Math.round(backoffMs * 1.7));
        }
      }
    };

    // Attempt initial fetch + open SSE stream
    this.listAgents()
      .then((list) => {
        if (!closed) {
          onChange(list);
          onConnectionChange?.('connected');
        }
      })
      .catch(() => {
        if (!closed) onConnectionChange?.('offline');
      });

    connect();

    return () => {
      closed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }
}
