import { spawnSync } from 'node:child_process';

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
}

/**
 * Compares two semver strings (e.g. "1.2.0" vs "1.1.0").
 * Returns > 0 if a > b, 0 if equal, < 0 if a < b.
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('-')[0].split('.').map(Number);
  const pb = b.replace(/^v/, '').split('-')[0].split('.').map(Number);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const na = Number.isFinite(pa[i]) ? pa[i] : 0;
    const nb = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

/**
 * Fetches latest published version of `openbot-lego` from npm registry
 * with a short timeout so offline environments are never slowed down.
 */
export async function checkForUpdate(
  currentVersion: string,
  timeoutMs = 2500
): Promise<UpdateCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://registry.npmjs.org/openbot-lego/latest', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { currentVersion, latestVersion: null, hasUpdate: false };
    }
    const data = (await res.json()) as { version?: unknown };
    const latest = typeof data.version === 'string' ? data.version.trim() : null;
    if (!latest) {
      return { currentVersion, latestVersion: null, hasUpdate: false };
    }
    return {
      currentVersion,
      latestVersion: latest,
      hasUpdate: compareSemver(latest, currentVersion) > 0,
    };
  } catch {
    return { currentVersion, latestVersion: null, hasUpdate: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs `npm install -g openbot-lego@latest` synchronously with live output.
 */
export function runGlobalSelfUpdate(): boolean {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '-g', 'openbot-lego@latest'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}
