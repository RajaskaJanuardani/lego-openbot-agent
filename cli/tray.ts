import { spawn } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { getDataDir } from '../bridge/config.js';

export interface DaemonPidRecord {
  pid: number;
  trayPid?: number;
  port: number;
  host: string;
  url: string;
  startedAt: string;
}

export function getPidFilePath(): string {
  return join(getDataDir(), 'server.pid.json');
}

export function getLogFilePath(): string {
  return join(getDataDir(), 'server.log');
}

export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readRunningDaemon(): DaemonPidRecord | null {
  const file = getPidFilePath();
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as DaemonPidRecord;
    if (parsed && isProcessAlive(parsed.pid)) {
      return parsed;
    }
    // Stale PID file -> clean up
    rmSync(file, { force: true });
    return null;
  } catch {
    return null;
  }
}

export function writePidRecord(rec: DaemonPidRecord): void {
  const dir = getDataDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(getPidFilePath(), JSON.stringify(rec, null, 2), 'utf-8');
}

export function removePidRecord(): void {
  try {
    if (existsSync(getPidFilePath())) {
      rmSync(getPidFilePath(), { force: true });
    }
  } catch {
    // ignore
  }
}

/**
 * Generates and launches a zero-dependency native Windows System Tray icon
 * (System.Windows.Forms.NotifyIcon) with a procedurally drawn LEGO OpenBot icon,
 * double-click to open browser, right-click menu to Open / Stop, and auto-exit
 * when the background server stops.
 */
export function launchWindowsTrayIcon(url: string, serverPid: number): number | undefined {
  if (process.platform !== 'win32') return undefined;

  const dir = getDataDir();
  mkdirSync(dir, { recursive: true });
  const scriptPath = join(dir, 'tray-icon.ps1');

  const safeUrl = url.replace(/'/g, "''");
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Draw 16x16 LEGO OpenBot mascot icon (purple-pink brick + 2 top studs + twin white pill eyes)
$bmp = New-Object System.Drawing.Bitmap 16, 16
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)

$studBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 232, 121, 249))
$bodyBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 147, 51, 234))
$topBrush  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 244, 114, 182))
$eyeBrush  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

# Two LEGO top studs
$g.FillRectangle($studBrush, 3, 1, 3, 2)
$g.FillRectangle($studBrush, 10, 1, 3, 2)
# Main glossy brick body
$g.FillRectangle($bodyBrush, 1, 3, 14, 12)
$g.FillRectangle($topBrush, 2, 4, 12, 3)
# Twin vertical OpenBot pill eyes
$g.FillRectangle($eyeBrush, 4, 7, 2, 5)
$g.FillRectangle($eyeBrush, 10, 7, 2, 5)
$g.Dispose()

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = $icon
$notify.Text = 'LEGO OpenBot Agent (${safeUrl})'
$notify.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$openItem = $menu.Items.Add('Buka LEGO OpenBot Agent')
$openItem.Add_Click({
  Start-Process '${safeUrl}'
})

$null = $menu.Items.Add('-')

$stopItem = $menu.Items.Add('Hentikan Server & Keluar')
$stopItem.Add_Click({
  try { Invoke-RestMethod -Uri '${safeUrl}/api/shutdown' -Method Post -TimeoutSec 2 | Out-Null } catch {}
  try { Stop-Process -Id ${serverPid} -Force -ErrorAction SilentlyContinue } catch {}
  $notify.Visible = $false
  $notify.Dispose()
  [System.Windows.Forms.Application]::Exit()
})

$notify.ContextMenuStrip = $menu
$notify.Add_DoubleClick({
  Start-Process '${safeUrl}'
})

# Watch background server PID: auto-close tray icon if server exits via CLI 'openbot-lego stop'
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 2500
$timer.Add_Tick({
  $proc = Get-Process -Id ${serverPid} -ErrorAction SilentlyContinue
  if (-not $proc) {
    $timer.Stop()
    $notify.Visible = $false
    $notify.Dispose()
    [System.Windows.Forms.Application]::Exit()
  }
})
$timer.Start()

[System.Windows.Forms.Application]::Run()
`.trim();

  writeFileSync(scriptPath, psScript, 'utf-8');

  try {
    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-WindowStyle',
        'Hidden',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        scriptPath,
      ],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }
    );
    child.unref();
    return child.pid;
  } catch {
    return undefined;
  }
}

async function waitForServerHealth(url: string, timeoutMs = 6000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/**
 * Spawns `openbot-lego` as a detached background daemon + optional Windows System Tray icon,
 * returning once `/api/health` is ready.
 */
export async function startBackgroundDaemon(options: {
  cliScriptPath: string;
  port: number;
  host: string;
  withTray?: boolean;
}): Promise<DaemonPidRecord> {
  const existing = readRunningDaemon();
  if (existing) {
    return existing;
  }

  const dir = getDataDir();
  mkdirSync(dir, { recursive: true });
  const logFd = openSync(getLogFilePath(), 'a');

  const child = spawn(
    process.execPath,
    [
      options.cliScriptPath,
      '__daemon',
      '--port',
      String(options.port),
      '--host',
      options.host,
    ],
    {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
    }
  );
  child.unref();
  closeSync(logFd);

  const pid = child.pid ?? 0;
  const url = `http://localhost:${options.port}`;
  await waitForServerHealth(url, 6000);

  let trayPid: number | undefined;
  if (options.withTray !== false && process.platform === 'win32' && pid > 0) {
    trayPid = launchWindowsTrayIcon(url, pid);
  }

  const record: DaemonPidRecord = {
    pid,
    trayPid,
    port: options.port,
    host: options.host,
    url,
    startedAt: new Date().toISOString(),
  };
  writePidRecord(record);
  return record;
}

export async function stopBackgroundDaemon(): Promise<{ stopped: boolean; prev?: DaemonPidRecord }> {
  const existing = readRunningDaemon();
  if (!existing) {
    removePidRecord();
    return { stopped: false };
  }

  // Ask cleanly via HTTP shutdown first
  try {
    await fetch(`${existing.url}/api/shutdown`, { method: 'POST' });
    await new Promise((r) => setTimeout(r, 250));
  } catch {
    // ignore
  }

  if (isProcessAlive(existing.pid)) {
    try {
      process.kill(existing.pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
  if (existing.trayPid && isProcessAlive(existing.trayPid)) {
    try {
      process.kill(existing.trayPid, 'SIGTERM');
    } catch {
      // ignore
    }
  }

  removePidRecord();
  return { stopped: true, prev: existing };
}
