import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { BridgeConfigStore, getDefaultOpenBotDbPath } from './config.js';
import { startOpenBotSync, type OpenBotSyncHandle } from './openbotSync.js';
import { AgentBridgeStore } from './store.js';

export interface BridgeRuntimeOptions {
  mode: 'embedded' | 'standalone';
  allowedOrigin?: string;
}

export interface BridgeRuntime {
  app: Hono;
  store: AgentBridgeStore;
  stop: () => void;
}

function sanitizeText(raw: string, maxLen: number): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

const RegisterSchema = z.object({
  agentId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().min(1).max(48),
  title: z.string().min(1).max(64),
  avatarUrl: z.string().url().max(300).optional(),
});

const StatusSchema = z.object({
  status: z.enum(['working', 'idle']),
  task: z.string().max(240).optional(),
});

const ConfigPatchSchema = z.object({
  autoSyncEnabled: z.boolean().optional(),
  openbotDbPath: z.string().max(400).optional(),
  regenerateToken: z.boolean().optional(),
});

const SimulateSchema = z.object({
  status: z.enum(['working', 'idle']),
  task: z.string().max(160).optional(),
  durationSec: z.number().min(2).max(120).optional(),
});

export function createBridgeRuntime(options: BridgeRuntimeOptions): BridgeRuntime {
  const allowedOrigin = options.allowedOrigin ?? process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const configStore = new BridgeConfigStore();
  const store = new AgentBridgeStore();

  let openBotSync: OpenBotSyncHandle | null = null;
  const simulateTimers = new Map<string, ReturnType<typeof setTimeout>>();

  void startOpenBotSync(store, () => configStore.get()).then((handle) => {
    openBotSync = handle;
  });

  // Periodically expire stale working agents (> 20 min without update)
  const staleTimer = setInterval(() => {
    const expired = store.checkStale();
    if (expired > 0) {
      console.log(`[bridge] Marked ${expired} stale agent(s) as idle ("tidak ada kabar").`);
    }
  }, 30_000);

  // Simple per-IP sliding window rate limiter (240 req/min)
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (bucket.count >= 240) return false;
    bucket.count += 1;
    return true;
  }

  function requireBearer(authHeader: string | undefined): boolean {
    const activeToken = configStore.get().bridgeToken;
    if (!activeToken) return false;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    return authHeader.slice(7).trim() === activeToken;
  }

  function isLocalOrigin(origin: string | undefined, host: string | undefined): boolean {
    if (!origin) {
      return !host || host.startsWith('localhost') || host.startsWith('127.0.0.1');
    }
    return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  }

  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: (origin) => {
        if (!origin) return allowedOrigin;
        const allowedList = allowedOrigin.split(',').map((s) => s.trim());
        if (
          allowedList.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return origin;
        }
        return '';
      },
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use('/api/*', async (c, next) => {
    const ip = c.req.header('x-forwarded-for') ?? 'local';
    if (!checkRateLimit(ip)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    await next();
  });

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      mode: options.mode,
      agents: store.list().length,
      sync: openBotSync?.getDiagnostics() ?? null,
    })
  );

  app.get('/api/agents', (c) => {
    return c.json({ agents: store.list() });
  });

  // Web UI Configuration & Diagnostics API (localhost only)
  app.get('/api/config', (c) => {
    if (!isLocalOrigin(c.req.header('origin'), c.req.header('host'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const cfg = configStore.get();
    return c.json({
      mode: options.mode,
      autoSyncEnabled: cfg.autoSyncEnabled,
      openbotDbPath: cfg.openbotDbPath,
      defaultOpenBotDbPath: getDefaultOpenBotDbPath(),
      bridgeToken: cfg.bridgeToken,
      diagnostics: openBotSync?.getDiagnostics() ?? null,
    });
  });

  app.post('/api/config', async (c) => {
    if (!isLocalOrigin(c.req.header('origin'), c.req.header('host'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = ConfigPatchSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }
    const updated = configStore.update(parsed.data);
    openBotSync?.reload();
    return c.json({
      mode: options.mode,
      autoSyncEnabled: updated.autoSyncEnabled,
      openbotDbPath: updated.openbotDbPath,
      defaultOpenBotDbPath: getDefaultOpenBotDbPath(),
      bridgeToken: updated.bridgeToken,
      diagnostics: openBotSync?.getDiagnostics() ?? null,
      agents: store.list(),
    });
  });

  app.post('/api/sync-now', (c) => {
    if (!isLocalOrigin(c.req.header('origin'), c.req.header('host'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const diagnostics = openBotSync?.syncNow() ?? null;
    return c.json({
      ok: true,
      diagnostics,
      agents: store.list(),
    });
  });

  app.post('/api/reset-config', (c) => {
    if (!isLocalOrigin(c.req.header('origin'), c.req.header('host'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    simulateTimers.forEach((t) => clearTimeout(t));
    simulateTimers.clear();
    store.clear();
    const freshCfg = configStore.reset();
    openBotSync?.reload();
    return c.json({
      ok: true,
      mode: options.mode,
      autoSyncEnabled: freshCfg.autoSyncEnabled,
      openbotDbPath: freshCfg.openbotDbPath,
      defaultOpenBotDbPath: getDefaultOpenBotDbPath(),
      bridgeToken: freshCfg.bridgeToken,
      diagnostics: openBotSync?.getDiagnostics() ?? null,
      agents: store.list(),
    });
  });

  // One-click Web UI test button ("Test Working" / "Set Idle" without terminal script)
  app.post('/api/agents/:agentId/simulate', async (c) => {
    if (!isLocalOrigin(c.req.header('origin'), c.req.header('host'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const agentId = c.req.param('agentId');
    if (!/^[a-zA-Z0-9._-]{1,64}$/.test(agentId)) {
      return c.json({ error: 'Invalid agentId' }, 400);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = SimulateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed' }, 400);
    }

    const prevTimer = simulateTimers.get(agentId);
    if (prevTimer) {
      clearTimeout(prevTimer);
      simulateTimers.delete(agentId);
    }

    const durationSec = parsed.data.durationSec ?? 12;
    if (parsed.data.status === 'working') {
      const task = sanitizeText(
        parsed.data.task || 'Simulasi bekerja dari panel konfigurasi web',
        140
      );
      openBotSync?.markManualUpdate(agentId, (durationSec + 2) * 1000);
      const rec = store.updateStatus(agentId, 'working', task);
      const timer = setTimeout(() => {
        simulateTimers.delete(agentId);
        const cur = store.get(agentId);
        if (cur && cur.status === 'working' && cur.task === task) {
          store.updateStatus(agentId, 'idle');
        }
      }, durationSec * 1000);
      simulateTimers.set(agentId, timer);
      return c.json({ agent: rec });
    }

    openBotSync?.markManualUpdate(agentId, 2_000);
    const rec = store.updateStatus(agentId, 'idle');
    return c.json({ agent: rec });
  });

  app.get('/api/events', (c) => {
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: 'snapshot',
        data: JSON.stringify({ agents: store.list() }),
      });

      const unsubscribe = store.subscribe((agents) => {
        void stream.writeSSE({
          event: 'agents',
          data: JSON.stringify({ agents }),
        });
      });

      const keepAlive = setInterval(() => {
        void stream.writeSSE({ event: 'ping', data: String(Date.now()) });
      }, 20_000);

      stream.onAbort(() => {
        clearInterval(keepAlive);
        unsubscribe();
      });

      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    });
  });

  app.post('/api/agents/register', async (c) => {
    if (!requireBearer(c.req.header('authorization'))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }
    const rec = store.register({
      agentId: parsed.data.agentId,
      name: sanitizeText(parsed.data.name, 48),
      title: sanitizeText(parsed.data.title, 64),
      avatarUrl: parsed.data.avatarUrl,
    });
    return c.json({ agent: rec });
  });

  app.post('/api/agents/:agentId/status', async (c) => {
    if (!requireBearer(c.req.header('authorization'))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const agentId = c.req.param('agentId');
    if (!/^[a-zA-Z0-9._-]{1,64}$/.test(agentId)) {
      return c.json({ error: 'Invalid agentId' }, 400);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }
    const cleanTask = parsed.data.task ? sanitizeText(parsed.data.task, 140) : undefined;
    openBotSync?.markManualUpdate(agentId);
    const rec = store.updateStatus(agentId, parsed.data.status, cleanTask);
    return c.json({ agent: rec });
  });

  app.post('/api/agents/:agentId/heartbeat', (c) => {
    if (!requireBearer(c.req.header('authorization'))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const agentId = c.req.param('agentId');
    const rec = store.heartbeat(agentId);
    if (!rec) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json({ ok: true, agent: rec });
  });

  return {
    app,
    store,
    stop: () => {
      clearInterval(staleTimer);
      simulateTimers.forEach((t) => clearTimeout(t));
      simulateTimers.clear();
      openBotSync?.stop();
    },
  };
}
