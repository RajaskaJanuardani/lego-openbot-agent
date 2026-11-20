import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AutoStartStatus {
  enabled: boolean;
  supported: boolean;
  platform: NodeJS.Platform;
  targetPath: string;
}

function getStartupEntryPath(): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(
      appData,
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'Startup',
      'openbot-lego.vbs'
    );
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'LaunchAgents', 'com.openbot.lego.plist');
  }
  return join(homedir(), '.config', 'autostart', 'openbot-lego.desktop');
}

function resolveCliEntryPath(explicitPath?: string): string {
  if (explicitPath && existsSync(explicitPath)) {
    return explicitPath;
  }
  // Check sibling dist-cli/cli.mjs relative to current module (works for both global npm & local repo)
  const fromModule = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist-cli', 'cli.mjs');
  if (existsSync(fromModule)) {
    return fromModule;
  }
  const fromCwd = resolve(process.cwd(), 'dist-cli', 'cli.mjs');
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  return fromModule;
}

export function getAutoStartStatus(): AutoStartStatus {
  const targetPath = getStartupEntryPath();
  const supported =
    process.platform === 'win32' ||
    process.platform === 'darwin' ||
    process.platform === 'linux';
  return {
    enabled: supported && existsSync(targetPath),
    supported,
    platform: process.platform,
    targetPath,
  };
}

/**
 * Registers `openbot-lego` to launch silently in background (with System Tray on Windows)
 * automatically whenever the user logs into their laptop/PC.
 */
export function enableAutoStart(options?: {
  port?: number;
  cliScriptPath?: string;
}): AutoStartStatus {
  const targetPath = getStartupEntryPath();
  const port = options?.port ?? 4310;
  const cliPath = resolveCliEntryPath(options?.cliScriptPath);
  const nodeExe = process.execPath;

  mkdirSync(dirname(targetPath), { recursive: true });

  if (process.platform === 'win32') {
    // Hidden VBScript launcher -> zero black console flash on Windows login + launches background & tray!
    const escapedNode = nodeExe.replace(/"/g, '""');
    const escapedCli = cliPath.replace(/"/g, '""');
    const vbs = [
      'Set WshShell = CreateObject("WScript.Shell")',
      `WshShell.Run """${escapedNode}"" ""${escapedCli}"" background --no-open --port ${port}", 0, False`,
      '',
    ].join('\r\n');
    writeFileSync(targetPath, vbs, 'utf-8');
  } else if (process.platform === 'darwin') {
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.openbot.lego</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeExe}</string>
    <string>${cliPath}</string>
    <string>__daemon</string>
    <string>--port</string>
    <string>${port}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>
`;
    writeFileSync(targetPath, plist, 'utf-8');
  } else {
    const desktop = `[Desktop Entry]
Type=Application
Name=LEGO OpenBot Agent
Comment=Markas 3D Interaktif untuk OpenBot Desktop
Exec="${nodeExe}" "${cliPath}" background --no-open --port ${port}
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
`;
    writeFileSync(targetPath, desktop, 'utf-8');
  }

  return getAutoStartStatus();
}

export function disableAutoStart(): AutoStartStatus {
  const targetPath = getStartupEntryPath();
  try {
    if (existsSync(targetPath)) {
      rmSync(targetPath, { force: true });
    }
  } catch {
    // ignore
  }
  return getAutoStartStatus();
}
