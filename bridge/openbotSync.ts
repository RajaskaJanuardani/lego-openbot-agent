import { existsSync } from 'node:fs';
import {
  resolveEffectiveOpenBotDbPath,
  type BridgeConfig,
} from './config.js';
import type { AgentBridgeStore } from './store.js';

interface SqliteStatement {
  all(...params: unknown[]): Array<Record<string, unknown>>;
  get(...params: unknown[]): Record<string, unknown> | undefined;
}

interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface SqliteModule {
  DatabaseSync: new (
    path: string,
    options?: { readOnly?: boolean; timeout?: number }
  ) => SqliteDatabase;
}

const POLL_INTERVAL_MS = 800;
const STALE_TURN_MS = 25 * 60 * 1000;
const IDLE_DEBOUNCE_MS = 1800;
const MANUAL_OVERRIDE_MS = 12_000;

function toSlug(name: string, fallbackId: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || fallbackId.slice(0, 48);
}

function sanitizeSnippet(raw: string, maxLen = 110): string {
  return raw
    .replace(
      /(?:Bearer\s+[A-Za-z0-9._-]{8,}|sk-[A-Za-z0-9_-]{12,}|[A-Za-z0-9+/=_-]{36,})/g,
      '[redacted]'
    )
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function parseIsoMs(iso: unknown): number {
  if (typeof iso !== 'string' || !iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export interface OpenBotSyncDiagnostics {
  enabled: boolean;
  running: boolean;
  sqliteSupported: boolean;
  resolvedDbPath: string;
  dbFound: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface OpenBotSyncHandle {
  stop: () => void;
  reload: () => void;
  syncNow: () => OpenBotSyncDiagnostics;
  getDiagnostics: () => OpenBotSyncDiagnostics;
  markManualUpdate: (agentId: string, durationMs?: number) => void;
}

/**
 * Automatic, hot-reconfigurable read-only OpenBot Desktop live status watcher.
 * Polls `openbot.db` (strictly readOnly, WAL-safe) every 800ms:
 *  - Auto-syncs all OpenBot agents (name & title)
 *  - Immediately flips an agent to `working` on active turns or routine runs
 *  - Smoothly flips back to `idle` once finished
 */
export async function startOpenBotSync(
  store: AgentBridgeStore,
  getConfig: () => BridgeConfig
): Promise<OpenBotSyncHandle> {
  const manualOverrides = new Map<string, number>();
  const lastActiveSeenAt = new Map<string, number>();
  const syncedDbSlugs = new Set<string>();

  let sqliteMod: SqliteModule | null = null;
  let sqliteSupported = true;
  try {
    // Dynamic specifier prevents Vite's config esbuild bundler from trying to inline node:sqlite
    const specifier = 'node:' + 'sqlite';
    sqliteMod = (await import(specifier)) as unknown as SqliteModule;
  } catch {
    sqliteSupported = false;
    console.warn(
      '[openbot-sync] Module node:sqlite tidak tersedia (butuh Node 22.5+).'
    );
  }

  let db: SqliteDatabase | null = null;
  let openedPath: string | null = null;
  let lastSyncAt: string | null = null;
  let lastError: string | null = null;
  let loggedError = false;

  const closeDb = () => {
    if (db) {
      try {
        db.close();
      } catch {
        // ignore
      }
      db = null;
      openedPath = null;
    }
  };

  const pollOnce = (): OpenBotSyncDiagnostics => {
    const cfg = getConfig();
    const resolvedDbPath = resolveEffectiveOpenBotDbPath(cfg);
    const dbFound = existsSync(resolvedDbPath);

    if (!cfg.autoSyncEnabled) {
      closeDb();
      lastError = null;
      return {
        enabled: false,
        running: false,
        sqliteSupported,
        resolvedDbPath,
        dbFound,
        lastSyncAt,
        lastError,
      };
    }

    if (!sqliteSupported || !sqliteMod) {
      lastError = 'Node.js versi 22.5+ diperlukan untuk auto-sync SQLite.';
      return {
        enabled: true,
        running: false,
        sqliteSupported: false,
        resolvedDbPath,
        dbFound,
        lastSyncAt,
        lastError,
      };
    }

    if (!dbFound) {
      closeDb();
      lastError = `File openbot.db tidak ditemukan di ${resolvedDbPath}`;
      return {
        enabled: true,
        running: false,
        sqliteSupported: true,
        resolvedDbPath,
        dbFound: false,
        lastSyncAt,
        lastError,
      };
    }

    if (db && openedPath !== resolvedDbPath) {
      closeDb();
    }

    if (!db) {
      try {
        db = new sqliteMod.DatabaseSync(resolvedDbPath, {
          readOnly: true,
          timeout: 1000,
        });
        openedPath = resolvedDbPath;
        console.log(
          `[openbot-sync] Auto-sync OpenBot Desktop aktif (read-only): ${resolvedDbPath}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = `Gagal membuka openbot.db: ${msg}`;
        if (!loggedError) {
          console.warn('[openbot-sync]', lastError);
          loggedError = true;
        }
        return {
          enabled: true,
          running: false,
          sqliteSupported: true,
          resolvedDbPath,
          dbFound: true,
          lastSyncAt,
          lastError,
        };
      }
    }

    const now = Date.now();
    try {
      // 1. Read all OpenBot agents
      const agentRows = db
        .prepare('SELECT agent_id, thread_id, agent_json FROM projection_agents')
        .all();

      const agentsByRawId = new Map<
        string,
        { slug: string; name: string; title: string; primaryThreadId: string | null }
      >();
      const threadToRawAgent = new Map<string, string>();

      for (const row of agentRows) {
        const rawId = String(row.agent_id ?? '');
        if (!rawId) continue;
        let name = rawId;
        let title = 'OpenBot Agent';
        try {
          const parsed = JSON.parse(String(row.agent_json ?? '{}')) as {
            name?: unknown;
            title?: unknown;
          };
          if (typeof parsed.name === 'string' && parsed.name.trim()) name = parsed.name.trim();
          if (typeof parsed.title === 'string' && parsed.title.trim()) title = parsed.title.trim();
        } catch {
          // ignore malformed json
        }
        const slug = toSlug(name, rawId);
        const primaryThreadId = typeof row.thread_id === 'string' ? row.thread_id : null;
        agentsByRawId.set(rawId, { slug, name, title, primaryThreadId });
        syncedDbSlugs.add(slug);
        if (primaryThreadId) {
          threadToRawAgent.set(primaryThreadId, rawId);
        }

        const existing = store.get(slug);
        if (!existing || existing.name !== name || existing.title !== title) {
          store.register({
            agentId: slug,
            name: sanitizeSnippet(name, 48),
            title: sanitizeSnippet(title, 64),
          });
        }
      }

      // Remove agents that were previously synced from OpenBot DB but deleted in OpenBot Desktop
      const activeDbSlugs = new Set(Array.from(agentsByRawId.values()).map((a) => a.slug));
      for (const prevSlug of Array.from(syncedDbSlugs)) {
        if (!activeDbSlugs.has(prevSlug)) {
          syncedDbSlugs.delete(prevSlug);
          if (store.remove(prevSlug)) {
            console.log(`[openbot-sync] Agent dihapus di OpenBot -> keluar dari rumah: ${prevSlug}`);
          }
        }
      }

      try {
        const subThreads = db
          .prepare('SELECT thread_id, agent_id FROM projection_agent_threads')
          .all();
        for (const st of subThreads) {
          if (typeof st.thread_id === 'string' && typeof st.agent_id === 'string') {
            threadToRawAgent.set(st.thread_id, st.agent_id);
          }
        }
      } catch {
        // Optional table
      }

      // 2. Detect active threads
      const activeByRawAgent = new Map<string, { threadId?: string; task?: string }>();

      const activeThreads = db
        .prepare(
          'SELECT thread_id, agent_id, active_turn_id, updated_at FROM projection_threads WHERE active_turn_id IS NOT NULL'
        )
        .all();

      for (const tr of activeThreads) {
        const threadId = typeof tr.thread_id === 'string' ? tr.thread_id : '';
        const rawAgentId =
          (typeof tr.agent_id === 'string' && tr.agent_id) ||
          threadToRawAgent.get(threadId) ||
          '';
        if (!rawAgentId || !agentsByRawId.has(rawAgentId)) continue;
        const updatedMs = parseIsoMs(tr.updated_at);
        if (updatedMs > 0 && now - updatedMs > STALE_TURN_MS) continue;
        activeByRawAgent.set(rawAgentId, { threadId });
      }

      // 3. Detect in-progress turns directly
      const runningTurns = db
        .prepare(
          `SELECT t.turn_id, t.thread_id, t.status, t.started_at, th.agent_id
           FROM projection_turns t
           LEFT JOIN projection_threads th ON th.thread_id = t.thread_id
           WHERE t.completed_at IS NULL
             AND (t.status IS NULL OR t.status NOT IN ('completed', 'interrupted', 'failed', 'cancelled'))`
        )
        .all();

      for (const rt of runningTurns) {
        const startedMs = parseIsoMs(rt.started_at);
        if (startedMs > 0 && now - startedMs > STALE_TURN_MS) continue;
        const threadId = typeof rt.thread_id === 'string' ? rt.thread_id : '';
        const rawAgentId =
          (typeof rt.agent_id === 'string' && rt.agent_id) ||
          threadToRawAgent.get(threadId) ||
          '';
        if (!rawAgentId || !agentsByRawId.has(rawAgentId)) continue;
        if (!activeByRawAgent.has(rawAgentId)) {
          activeByRawAgent.set(rawAgentId, { threadId });
        }
      }

      // 4. Detect active routine runs
      try {
        const activeRoutines = db
          .prepare(
            `SELECT agent_id, routine_name, updated_at
             FROM projection_routine_runs
             WHERE status IN ('running', 'in_progress', 'started')`
          )
          .all();
        for (const rr of activeRoutines) {
          const updatedMs = parseIsoMs(rr.updated_at);
          if (updatedMs > 0 && now - updatedMs > STALE_TURN_MS) continue;
          const rawAgentId = typeof rr.agent_id === 'string' ? rr.agent_id : '';
          if (!rawAgentId || !agentsByRawId.has(rawAgentId)) continue;
          const rName =
            typeof rr.routine_name === 'string' ? rr.routine_name : 'Routine otomatis';
          if (!activeByRawAgent.has(rawAgentId)) {
            activeByRawAgent.set(rawAgentId, {
              task: sanitizeSnippet(`Menjalankan routine: ${rName}`, 120),
            });
          }
        }
      } catch {
        // Optional table
      }

      // 5. Sync status into BridgeStore
      for (const [rawId, info] of agentsByRawId.entries()) {
        const activeInfo = activeByRawAgent.get(rawId);
        const existing = store.get(info.slug);

        if (activeInfo) {
          lastActiveSeenAt.set(info.slug, now);

          let taskText = activeInfo.task;
          if (!taskText && activeInfo.threadId) {
            try {
              const msgRow = db
                .prepare(
                  `SELECT message_json FROM projection_thread_messages
                   WHERE thread_id = ? AND author = 'user'
                   ORDER BY rowid DESC LIMIT 1`
                )
                .get(activeInfo.threadId);
              if (msgRow && typeof msgRow.message_json === 'string') {
                const parsed = JSON.parse(msgRow.message_json) as { text?: unknown };
                if (typeof parsed.text === 'string' && parsed.text.trim()) {
                  const rawPrompt = parsed.text.trim();
                  if (
                    rawPrompt.startsWith('OpenBot sent this setup message') ||
                    rawPrompt.includes('The user does not see it')
                  ) {
                    taskText = 'Menyiapkan profil agent baru…';
                  } else {
                    taskText = `Memproses: ${sanitizeSnippet(rawPrompt, 96)}`;
                  }
                }
              }
            } catch {
              // ignore snippet lookup error
            }
          }
          const finalTask = taskText || 'Sedang memproses pesan di OpenBot…';

          if (!existing || existing.status !== 'working' || existing.task !== finalTask) {
            store.updateStatus(info.slug, 'working', finalTask);
            console.log(`[openbot-sync] ${info.name} -> WORKING ("${finalTask}")`);
          }
        } else {
          const overrideUntil = manualOverrides.get(info.slug) ?? 0;
          if (now < overrideUntil) continue;

          const lastSeen = lastActiveSeenAt.get(info.slug) ?? 0;
          if (lastSeen > 0 && now - lastSeen < IDLE_DEBOUNCE_MS) continue;

          if (existing && existing.status === 'working') {
            store.updateStatus(info.slug, 'idle');
            console.log(`[openbot-sync] ${info.name} -> IDLE`);
          }
        }
      }

      lastSyncAt = new Date(now).toISOString();
      lastError = null;
      loggedError = false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `Gagal membaca openbot.db: ${msg}`;
      if (!loggedError) {
        console.warn('[openbot-sync] Transient DB read notice:', msg);
        loggedError = true;
      }
      closeDb();
    }

    return {
      enabled: true,
      running: db !== null,
      sqliteSupported: true,
      resolvedDbPath,
      dbFound: true,
      lastSyncAt,
      lastError,
    };
  };

  const getDiagnostics = (): OpenBotSyncDiagnostics => {
    const cfg = getConfig();
    const resolvedDbPath = resolveEffectiveOpenBotDbPath(cfg);
    return {
      enabled: cfg.autoSyncEnabled,
      running: cfg.autoSyncEnabled && db !== null,
      sqliteSupported,
      resolvedDbPath,
      dbFound: existsSync(resolvedDbPath),
      lastSyncAt,
      lastError,
    };
  };

  pollOnce();
  const timer = setInterval(pollOnce, POLL_INTERVAL_MS);

  return {
    stop: () => {
      clearInterval(timer);
      closeDb();
    },
    reload: () => {
      closeDb();
      loggedError = false;
      pollOnce();
    },
    syncNow: () => {
      loggedError = false;
      return pollOnce();
    },
    getDiagnostics,
    markManualUpdate: (agentId: string, durationMs = MANUAL_OVERRIDE_MS) => {
      manualOverrides.set(agentId, Date.now() + durationMs);
    },
  };
}
