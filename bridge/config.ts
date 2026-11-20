import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface BridgeConfig {
  autoSyncEnabled: boolean;
  /** Custom openbot.db path; empty string means auto-detect OS default */
  openbotDbPath: string;
  /** Bearer token for optional external HTTP API calls */
  bridgeToken: string;
}

export function getDataDir(): string {
  if (process.env.OPENBOT_LEGO_DATA_DIR?.trim()) {
    return process.env.OPENBOT_LEGO_DATA_DIR.trim();
  }
  return join(homedir(), '.openbot-lego');
}

const CONFIG_FILE = join(getDataDir(), 'config.json');

export function getDefaultOpenBotDbPath(): string {
  if (process.env.OPENBOT_DB_PATH) {
    return process.env.OPENBOT_DB_PATH;
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'OpenBot', 'openbot.db');
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'OpenBot', 'openbot.db');
  }
  return join(homedir(), '.config', 'OpenBot', 'openbot.db');
}

export function resolveEffectiveOpenBotDbPath(cfg: BridgeConfig): string {
  const custom = cfg.openbotDbPath.trim();
  return custom ? custom : getDefaultOpenBotDbPath();
}

function generateLocalToken(): string {
  return `lego-${randomBytes(12).toString('hex')}`;
}

export class BridgeConfigStore {
  private config: BridgeConfig;

  constructor() {
    this.config = this.load();
  }

  private load(): BridgeConfig {
    const envToken = process.env.BRIDGE_TOKEN?.trim() || '';
    const envDbPath = process.env.OPENBOT_DB_PATH?.trim() || '';
    const defaults: BridgeConfig = {
      autoSyncEnabled: process.env.DISABLE_OPENBOT_SYNC !== '1',
      openbotDbPath: envDbPath,
      bridgeToken: envToken || generateLocalToken(),
    };

    try {
      if (!existsSync(CONFIG_FILE)) {
        this.persist(defaults);
        return defaults;
      }
      const raw = readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<BridgeConfig>;
      const merged: BridgeConfig = {
        autoSyncEnabled:
          typeof parsed.autoSyncEnabled === 'boolean'
            ? parsed.autoSyncEnabled
            : defaults.autoSyncEnabled,
        openbotDbPath:
          typeof parsed.openbotDbPath === 'string'
            ? parsed.openbotDbPath
            : defaults.openbotDbPath,
        bridgeToken:
          envToken ||
          (typeof parsed.bridgeToken === 'string' && parsed.bridgeToken.trim()
            ? parsed.bridgeToken.trim()
            : defaults.bridgeToken),
      };
      return merged;
    } catch {
      return defaults;
    }
  }

  private persist(cfg: BridgeConfig): void {
    try {
      mkdirSync(dirname(CONFIG_FILE), { recursive: true });
      writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    } catch (err) {
      console.error('[bridge] Gagal menyimpan bridge/data/config.json:', err);
    }
  }

  get(): BridgeConfig {
    return { ...this.config };
  }

  update(patch: {
    autoSyncEnabled?: boolean;
    openbotDbPath?: string;
    regenerateToken?: boolean;
  }): BridgeConfig {
    const next: BridgeConfig = {
      ...this.config,
      ...(typeof patch.autoSyncEnabled === 'boolean'
        ? { autoSyncEnabled: patch.autoSyncEnabled }
        : {}),
      ...(typeof patch.openbotDbPath === 'string'
        ? { openbotDbPath: patch.openbotDbPath.trim().slice(0, 400) }
        : {}),
      ...(patch.regenerateToken ? { bridgeToken: generateLocalToken() } : {}),
    };
    this.config = next;
    this.persist(next);
    return this.get();
  }

  reset(): BridgeConfig {
    try {
      if (existsSync(CONFIG_FILE)) rmSync(CONFIG_FILE, { force: true });
    } catch {
      // ignore
    }
    this.config = this.load();
    return this.get();
  }
}
