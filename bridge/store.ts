import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface BridgeAgentRecord {
  agentId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  status: 'working' | 'idle';
  task?: string;
  lastCompletedTask?: string;
  staleNote?: string;
  updatedAt: string;
  lastHeartbeatAt: string;
}

const DATA_FILE = resolve(process.cwd(), 'bridge/data/agents.json');
const STALE_MS = 20 * 60 * 1000; // 20 minutes stale working timeout

type Listener = (agents: BridgeAgentRecord[]) => void;

export class AgentBridgeStore {
  private agents = new Map<string, BridgeAgentRecord>();
  private listeners = new Set<Listener>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (!existsSync(DATA_FILE)) return;
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.agentId === 'string') {
            this.agents.set(item.agentId, item as BridgeAgentRecord);
          }
        }
      }
    } catch (err) {
      console.warn('[bridge] Failed loading agents.json, starting fresh:', err);
    }
  }

  private save(): void {
    try {
      mkdirSync(dirname(DATA_FILE), { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify(this.list(), null, 2), 'utf-8');
    } catch (err) {
      console.error('[bridge] Failed persisting agents.json:', err);
    }
  }

  private notify(): void {
    const snap = this.list();
    this.listeners.forEach((fn) => fn(snap));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  get(agentId: string): BridgeAgentRecord | undefined {
    return this.agents.get(agentId);
  }

  list(): BridgeAgentRecord[] {
    return Array.from(this.agents.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  register(input: {
    agentId: string;
    name: string;
    title: string;
    avatarUrl?: string;
  }): BridgeAgentRecord {
    const now = new Date().toISOString();
    const prev = this.agents.get(input.agentId);
    const record: BridgeAgentRecord = {
      agentId: input.agentId,
      name: input.name,
      title: input.title,
      avatarUrl: input.avatarUrl ?? prev?.avatarUrl,
      status: prev?.status ?? 'idle',
      task: prev?.task,
      lastCompletedTask: prev?.lastCompletedTask,
      updatedAt: now,
      lastHeartbeatAt: now,
    };
    this.agents.set(record.agentId, record);
    this.save();
    this.notify();
    return record;
  }

  updateStatus(
    agentId: string,
    status: 'working' | 'idle',
    task?: string
  ): BridgeAgentRecord {
    const now = new Date().toISOString();
    const prev = this.agents.get(agentId);
    const lastCompletedTask =
      status === 'idle' && prev?.status === 'working' && prev.task
        ? prev.task
        : prev?.lastCompletedTask;

    const record: BridgeAgentRecord = {
      agentId,
      name: prev?.name ?? agentId,
      title: prev?.title ?? 'OpenBot Agent',
      avatarUrl: prev?.avatarUrl,
      status,
      task: status === 'working' ? task : undefined,
      lastCompletedTask,
      staleNote: undefined,
      updatedAt: now,
      lastHeartbeatAt: now,
    };
    this.agents.set(agentId, record);
    this.save();
    this.notify();
    return record;
  }

  heartbeat(agentId: string): BridgeAgentRecord | null {
    const prev = this.agents.get(agentId);
    if (!prev) return null;
    const now = new Date().toISOString();
    prev.lastHeartbeatAt = now;
    if (prev.status === 'working') {
      prev.updatedAt = now;
    }
    this.save();
    return prev;
  }

  checkStale(): number {
    const now = Date.now();
    let changed = 0;
    for (const rec of this.agents.values()) {
      if (rec.status !== 'working') continue;
      const lastMs = new Date(rec.updatedAt).getTime();
      if (now - lastMs > STALE_MS) {
        rec.lastCompletedTask = rec.task ?? rec.lastCompletedTask;
        rec.status = 'idle';
        rec.task = undefined;
        rec.staleNote = 'tidak ada kabar';
        rec.updatedAt = new Date(now).toISOString();
        changed += 1;
      }
    }
    if (changed > 0) {
      this.save();
      this.notify();
    }
    return changed;
  }

  clear(): void {
    this.agents.clear();
    try {
      if (existsSync(DATA_FILE)) rmSync(DATA_FILE, { force: true });
    } catch {
      // ignore
    }
    this.notify();
  }

  remove(agentId: string): boolean {
    if (!this.agents.delete(agentId)) return false;
    this.save();
    this.notify();
    return true;
  }
}
