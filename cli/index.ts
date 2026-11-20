import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { createBridgeRuntime } from '../bridge/app.js';
import {
  disableAutoStart,
  enableAutoStart,
  getAutoStartStatus,
} from '../bridge/autostart.js';
import { BridgeConfigStore, getDataDir } from '../bridge/config.js';
import { AgentBridgeStore } from '../bridge/store.js';
import {
  getLogFilePath,
  readRunningDaemon,
  removePidRecord,
  startBackgroundDaemon,
  stopBackgroundDaemon,
} from './tray.js';

// ANSI color palette matching LEGO OpenBot branding
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  stud: '\x1b[38;5;218m', // Soft glossy pink-lavender LEGO studs
  pink: '\x1b[38;5;212m', // OpenBot vibrant pink
  violet: '\x1b[38;5;141m', // OpenBot bright violet
  indigo: '\x1b[38;5;99m', // Deep indigo LEGO bevel
  eye: '\x1b[97m', // Crisp pure white OpenBot twin pill eyes
  redBadge: '\x1b[48;5;160m\x1b[97m\x1b[1m', // Classic LEGO red 3D pill
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const CLI_SCRIPT_PATH = fileURLToPath(import.meta.url);
const PKG_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST_DIR = join(PKG_ROOT, 'dist');

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? '1.1.0';
  } catch {
    return '1.1.0';
  }
}

/**
 * Renders the iconic LEGO OpenBot mascot logo (2 top studs + glossy pink-violet-indigo
 * LEGO brick head + twin glowing white vertical pill eyes) next to the CLI title.
 */
function printBanner(version: string): void {
  const logo = [
    `   ${C.stud}▄██▄  ▄██▄${C.reset}   `,
    `  ${C.pink}▄██████████▄${C.reset}  `,
    `  ${C.violet}██ ${C.eye}█${C.violet}    ${C.eye}█${C.violet} ██${C.reset}  `,
    `  ${C.violet}██ ${C.eye}█${C.violet}    ${C.eye}█${C.violet} ██${C.reset}  `,
    `  ${C.indigo}▀████████${C.redBadge}3D${C.reset}  `,
  ];

  console.log('');
  console.log(`${logo[0]} ${C.pink}${C.bold}LEGO OpenBot Agent${C.reset}  ${C.dim}v${version}${C.reset}`);
  console.log(`${logo[1]} ${C.dim}Markas 3D Interaktif Real-Time untuk OpenBot Desktop${C.reset}`);
  console.log(`${logo[2]} ${C.violet}────────────────────────────────────────────────────${C.reset}`);
  console.log(`${logo[3]} ${C.dim}Command:${C.reset} ${C.cyan}openbot-lego${C.reset}  ${C.dim}·  Tray / Auto-Start Ready${C.reset}`);
  console.log(`${logo[4]}`);
  console.log('');
}

function printHelp(version: string): void {
  printBanner(version);
  console.log(`  ${C.bold}Perintah:${C.reset}`);
  console.log(`    ${C.cyan}openbot-lego${C.reset}                       Jalankan Markas 3D & buka browser`);
  console.log(`    ${C.cyan}openbot-lego background${C.reset}            Jalankan di background + Hide to Tray`);
  console.log(`    ${C.cyan}openbot-lego tray${C.reset}                  Alias untuk background + System Tray`);
  console.log(`    ${C.cyan}openbot-lego stop${C.reset}                  Hentikan server background & tutup tray`);
  console.log(`    ${C.cyan}openbot-lego autostart on|off${C.reset}      Aktifkan/Matikan auto-jalan saat laptop hidup`);
  console.log(`    ${C.cyan}openbot-lego status${C.reset}                Lihat daftar agent OpenBot & status server`);
  console.log(`    ${C.cyan}openbot-lego doctor${C.reset}                Cek Node.js, openbot.db, & auto-start`);
  console.log(`    ${C.cyan}openbot-lego logs${C.reset}                  Tampilkan log server background`);
  console.log(`    ${C.cyan}openbot-lego reset${C.reset}                 Reset konfigurasi & cache lokal`);
  console.log('');
  console.log(`  ${C.bold}Opsi:${C.reset}`);
  console.log(`    ${C.yellow}-d, --daemon, --tray${C.reset}   Langsung jalan di background + System Tray`);
  console.log(`    ${C.yellow}-p, --port <port>${C.reset}      Port HTTP server (default: 4310)`);
  console.log(`    ${C.yellow}--host <host>${C.reset}          Host bind address (default: 127.0.0.1)`);
  console.log(`    ${C.yellow}--no-open${C.reset}              Jangan buka browser secara otomatis`);
  console.log(`    ${C.yellow}-v, --version${C.reset}          Tampilkan versi`);
  console.log(`    ${C.yellow}-h, --help${C.reset}             Tampilkan bantuan ini`);
  console.log('');
}

function checkNodeVersion(): { ok: boolean; raw: string } {
  const raw = process.versions.node;
  const [major, minor] = raw.split('.').map(Number);
  const ok = major > 22 || (major === 22 && minor >= 5);
  return { ok, raw };
}

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolvePort) => {
    const srv = createServer();
    srv.unref();
    srv.once('error', () => resolvePort(false));
    srv.once('listening', () => {
      srv.close(() => resolvePort(true));
    });
    srv.listen(port, host);
  });
}

async function findFreePort(startPort: number, host: string): Promise<number> {
  for (let p = startPort; p < startPort + 25; p++) {
    if (await isPortAvailable(p, host)) return p;
  }
  return startPort;
}

function openBrowser(url: string): void {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // Non-fatal
  }
}

function parseArgs(argv: string[]) {
  let command = 'start';
  let subArg = '';
  let port = Number(process.env.PORT ?? process.env.BRIDGE_PORT ?? 4310);
  let host = '127.0.0.1';
  let shouldOpen = true;
  let daemon = false;
  let showHelp = false;
  let showVersion = false;

  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      showHelp = true;
    } else if (arg === '-v' || arg === '--version') {
      showVersion = true;
    } else if (arg === '--no-open') {
      shouldOpen = false;
    } else if (arg === '-d' || arg === '--daemon' || arg === '--background' || arg === '--tray') {
      daemon = true;
    } else if (arg === '-p' || arg === '--port') {
      const next = Number(argv[++i]);
      if (Number.isInteger(next) && next > 0 && next < 65536) {
        port = next;
      }
    } else if (arg.startsWith('--port=')) {
      const next = Number(arg.slice('--port='.length));
      if (Number.isInteger(next) && next > 0 && next < 65536) {
        port = next;
      }
    } else if (arg === '--host' && argv[i + 1]) {
      host = argv[++i];
    } else if (arg.startsWith('--host=')) {
      host = arg.slice('--host='.length);
    } else if (!arg.startsWith('-')) {
      positionals.push(arg);
    }
  }

  if (positionals.length > 0) {
    command = positionals[0];
    subArg = positionals[1] ?? '';
  }

  return { command, subArg, port, host, shouldOpen, daemon, showHelp, showVersion };
}

function attachStaticFrontend(
  app: ReturnType<typeof createBridgeRuntime>['app'],
  indexHtmlPath: string
) {
  app.get('*', (c) => {
    const reqPath = c.req.path === '/' ? '/index.html' : c.req.path;
    const safeRel = normalize(reqPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
    const candidate = join(DIST_DIR, safeRel);

    let filePath = indexHtmlPath;
    if (candidate.startsWith(DIST_DIR) && existsSync(candidate)) {
      try {
        if (statSync(candidate).isFile()) {
          filePath = candidate;
        }
      } catch {
        filePath = indexHtmlPath;
      }
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    const body = readFileSync(filePath);
    const cacheControl = reqPath.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  });
}

async function runDoctor(version: string): Promise<void> {
  printBanner(version);
  const nodeCheck = checkNodeVersion();
  const autoStart = getAutoStartStatus();
  const daemonRec = readRunningDaemon();
  const runtime = createBridgeRuntime({ mode: 'cli' });
  await runtime.ready;
  const diag = runtime.getDiagnostics();
  const agents = runtime.store.list();
  runtime.stop();

  console.log(
    `  ${nodeCheck.ok ? `${C.green}✔${C.reset}` : `${C.red}✖${C.reset}`} ${C.bold}Node.js${C.reset}       v${nodeCheck.raw} ${nodeCheck.ok ? `${C.dim}(SQLite siap)${C.reset}` : `${C.red}(butuh >= 22.5.0)${C.reset}`}`
  );
  console.log(
    `  ${existsSync(join(DIST_DIR, 'index.html')) ? `${C.green}✔${C.reset}` : `${C.red}✖${C.reset}`} ${C.bold}Web Bundle${C.reset}    ${DIST_DIR}`
  );
  console.log(
    `  ${diag?.dbFound ? `${C.green}✔${C.reset}` : `${C.yellow}⚠${C.reset}`} ${C.bold}OpenBot DB${C.reset}    ${diag?.resolvedDbPath ?? 'tidak diketahui'}`
  );
  console.log(
    `  ${daemonRec ? `${C.green}✔${C.reset}` : `${C.dim}○${C.reset}`} ${C.bold}Background${C.reset}    ${daemonRec ? `${C.green}Aktif${C.reset} (${daemonRec.url}, PID ${daemonRec.pid})` : `${C.dim}Tidak berjalan${C.reset}`}`
  );
  console.log(
    `  ${autoStart.enabled ? `${C.green}✔${C.reset}` : `${C.dim}○${C.reset}`} ${C.bold}Auto-Start${C.reset}    ${autoStart.enabled ? `${C.green}ON${C.reset} (${autoStart.targetPath})` : `${C.dim}OFF${C.reset} (aktifkan: ${C.cyan}openbot-lego autostart on${C.reset})`}`
  );
  console.log(
    `  ${C.cyan}ℹ${C.reset} ${C.bold}Agent Aktif${C.reset}   ${agents.length} agent terdeteksi`
  );
  console.log(
    `  ${C.cyan}ℹ${C.reset} ${C.bold}Data Lokal${C.reset}    ${getDataDir()}`
  );
  if (diag?.lastError) {
    console.log(`  ${C.yellow}⚠${C.reset} ${C.bold}Catatan${C.reset}       ${diag.lastError}`);
  }
  console.log('');
}

async function runStatus(version: string): Promise<void> {
  printBanner(version);
  const daemonRec = readRunningDaemon();
  const autoStart = getAutoStartStatus();
  const runtime = createBridgeRuntime({ mode: 'cli' });
  await runtime.ready;
  const agents = runtime.store.list();
  const diag = runtime.getDiagnostics();
  runtime.stop();

  console.log(
    `  ${C.bold}Server Background:${C.reset} ${daemonRec ? `${C.green}● Aktif${C.reset} (${C.cyan}${daemonRec.url}${C.reset}, PID ${daemonRec.pid})` : `${C.dim}○ Tidak berjalan${C.reset}`}`
  );
  console.log(
    `  ${C.bold}Auto-Start Boot  :${C.reset} ${autoStart.enabled ? `${C.green}ON${C.reset}` : `${C.dim}OFF${C.reset}`}\n`
  );

  if (agents.length === 0) {
    console.log(`  ${C.yellow}Belum ada agent OpenBot terdeteksi.${C.reset}`);
    if (diag?.resolvedDbPath) {
      console.log(`  ${C.dim}Lokasi openbot.db: ${diag.resolvedDbPath}${C.reset}`);
    }
    console.log('');
    return;
  }

  console.log(`  ${C.bold}Daftar Agent OpenBot (${agents.length}):${C.reset}\n`);
  for (const ag of agents) {
    const statusBadge =
      ag.status === 'working'
        ? `${C.green}${C.bold}● WORKING${C.reset}`
        : `${C.yellow}○ IDLE   ${C.reset}`;
    const detail = ag.status === 'working' && ag.task ? ` — ${C.cyan}${ag.task}${C.reset}` : '';
    console.log(
      `  ${statusBadge}  ${C.bold}${ag.name.padEnd(14)}${C.reset} ${C.dim}${ag.title}${C.reset}${detail}`
    );
  }
  console.log('');
}

function runAutoStartCommand(version: string, action: string, port: number): void {
  printBanner(version);
  const act = action.toLowerCase();
  if (act === 'on' || act === 'enable') {
    const st = enableAutoStart({ port, cliScriptPath: CLI_SCRIPT_PATH });
    console.log(`  ${C.green}✔${C.reset} ${C.bold}Auto-Start saat laptop hidup: AKTIF!${C.reset}`);
    console.log(`  ${C.dim}Startup entry: ${st.targetPath}${C.reset}`);
    console.log(
      `  ${C.dim}Saat laptop menyala, server otomatis jalan diam-diam di background & System Tray.${C.reset}\n`
    );
    return;
  }
  if (act === 'off' || act === 'disable') {
    const st = disableAutoStart();
    console.log(`  ${C.yellow}○${C.reset} ${C.bold}Auto-Start saat laptop hidup: NONAKTIF.${C.reset}`);
    console.log(`  ${C.dim}Dihapus dari: ${st.targetPath}${C.reset}\n`);
    return;
  }

  const st = getAutoStartStatus();
  console.log(
    `  ${st.enabled ? `${C.green}✔${C.reset}` : `${C.dim}○${C.reset}`} ${C.bold}Status Auto-Start:${C.reset} ${st.enabled ? `${C.green}AKTIF (ON)${C.reset}` : `${C.dim}NONAKTIF (OFF)${C.reset}`}`
  );
  console.log(`  ${C.dim}Lokasi: ${st.targetPath}${C.reset}`);
  console.log(
    `  ${C.dim}Ubah dengan: ${C.cyan}openbot-lego autostart on${C.reset} atau ${C.cyan}openbot-lego autostart off${C.reset}\n`
  );
}

function runLogs(version: string): void {
  printBanner(version);
  const logFile = getLogFilePath();
  if (!existsSync(logFile)) {
    console.log(`  ${C.dim}Belum ada log background (${logFile}).${C.reset}\n`);
    return;
  }
  const lines = readFileSync(logFile, 'utf-8').trim().split(/\r?\n/);
  const tail = lines.slice(-30);
  console.log(`  ${C.bold}Log Terakhir (${logFile}):${C.reset}\n`);
  for (const line of tail) {
    console.log(`  ${C.dim}${line}${C.reset}`);
  }
  console.log('');
}

function runReset(version: string): void {
  printBanner(version);
  const cfg = new BridgeConfigStore();
  const store = new AgentBridgeStore();
  store.clear();
  cfg.reset();
  console.log(
    `  ${C.green}✔${C.reset} Konfigurasi & cache lokal di ${C.dim}${getDataDir()}${C.reset} sudah di-reset.`
  );
  console.log(
    `  ${C.dim}Tips: buka http://localhost:4310/?reset=1 jika ingin mereset outfit & dekorasi di browser.${C.reset}\n`
  );
}

async function runStop(version: string): Promise<void> {
  printBanner(version);
  const res = await stopBackgroundDaemon();
  if (res.stopped && res.prev) {
    console.log(
      `  ${C.green}✔${C.reset} Server background (${C.cyan}${res.prev.url}${C.reset}, PID ${res.prev.pid}) & System Tray berhasil dihentikan.\n`
    );
  } else {
    console.log(`  ${C.dim}Tidak ada server background openbot-lego yang sedang berjalan.${C.reset}\n`);
  }
}

async function runDaemonChild(port: number, host: string): Promise<void> {
  const indexHtmlPath = join(DIST_DIR, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    console.error(`[daemon] Web bundle missing at ${DIST_DIR}`);
    process.exit(1);
  }

  const url = `http://localhost:${port}`;
  let serverRef: ReturnType<typeof serve> | null = null;
  let runtimeRef: ReturnType<typeof createBridgeRuntime> | null = null;

  const shutdown = () => {
    runtimeRef?.stop();
    removePidRecord();
    if (serverRef) {
      serverRef.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
    setTimeout(() => process.exit(0), 1200).unref();
  };

  runtimeRef = createBridgeRuntime({
    mode: 'cli',
    allowedOrigin: url,
    onShutdown: shutdown,
  });

  attachStaticFrontend(runtimeRef.app, indexHtmlPath);
  await runtimeRef.ready;

  serverRef = serve({
    fetch: runtimeRef.app.fetch,
    port,
    hostname: host,
  });

  console.log(`[daemon] LEGO OpenBot Agent running in background on ${url} (PID ${process.pid})`);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

async function runBackgroundStart(
  version: string,
  requestedPort: number,
  host: string,
  shouldOpen: boolean
): Promise<void> {
  printBanner(version);
  const existing = readRunningDaemon();
  if (existing) {
    console.log(
      `  ${C.green}✔${C.reset} Server sudah berjalan di background: ${C.cyan}${C.bold}${existing.url}${C.reset} ${C.dim}(PID ${existing.pid})${C.reset}`
    );
    if (shouldOpen) openBrowser(existing.url);
    console.log('');
    return;
  }

  const port = await findFreePort(requestedPort, host);
  const rec = await startBackgroundDaemon({
    cliScriptPath: CLI_SCRIPT_PATH,
    port,
    host,
    withTray: true,
  });

  console.log(
    `  ${C.green}✔${C.reset} ${C.bold}Berjalan di Background${C.reset} ${C.cyan}${C.bold}${rec.url}${C.reset} ${C.dim}(PID ${rec.pid})${C.reset}`
  );
  if (process.platform === 'win32') {
    console.log(
      `  ${C.green}✔${C.reset} ${C.bold}System Tray Aktif${C.reset}      ${C.dim}Cek ikon LEGO OpenBot ungu di pojok kanan bawah (double-click untuk buka)${C.reset}`
    );
  }
  console.log(
    `  ${C.dim}Terminal ini sekarang bebas ditutup. Hentikan kapan saja dengan: ${C.cyan}openbot-lego stop${C.reset}\n`
  );
  if (shouldOpen) openBrowser(rec.url);
}

async function runStart(
  version: string,
  requestedPort: number,
  host: string,
  shouldOpen: boolean
): Promise<void> {
  printBanner(version);

  // If a background daemon is already running, reuse it seamlessly!
  const existing = readRunningDaemon();
  if (existing) {
    console.log(
      `  ${C.green}✔${C.reset} Server sudah aktif di background: ${C.cyan}${C.bold}${existing.url}${C.reset} ${C.dim}(PID ${existing.pid})${C.reset}`
    );
    if (shouldOpen) {
      console.log(`  ${C.pink}➜${C.reset} Membuka browser...\n`);
      openBrowser(existing.url);
    }
    return;
  }

  const indexHtmlPath = join(DIST_DIR, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    console.error(
      `  ${C.red}✖${C.reset} Folder build web (${DIST_DIR}) belum tersedia. Jalankan ${C.cyan}npm run build${C.reset} terlebih dahulu.`
    );
    process.exit(1);
  }

  const nodeCheck = checkNodeVersion();
  const port = await findFreePort(requestedPort, host);
  const url = `http://localhost:${port}`;
  let autoStart = getAutoStartStatus();

  let server: ReturnType<typeof serve> | null = null;
  const runtime = createBridgeRuntime({
    mode: 'cli',
    allowedOrigin: url,
    onShutdown: () => shutdown(),
  });

  attachStaticFrontend(runtime.app, indexHtmlPath);

  await runtime.ready;
  const diag = runtime.getDiagnostics();
  const agents = runtime.store.list();

  server = serve({
    fetch: runtime.app.fetch,
    port,
    hostname: host,
  });

  console.log(
    `  ${nodeCheck.ok ? `${C.green}✔${C.reset}` : `${C.yellow}⚠${C.reset}`} ${C.bold}Node.js${C.reset}       v${nodeCheck.raw}`
  );
  console.log(
    `  ${diag?.dbFound ? `${C.green}✔${C.reset}` : `${C.yellow}⚠${C.reset}`} ${C.bold}OpenBot DB${C.reset}    ${
      diag?.dbFound
        ? `${C.green}Terdeteksi${C.reset} ${C.dim}(${agents.length} agent aktif)${C.reset}`
        : `${C.yellow}Belum ditemukan${C.reset} ${C.dim}(bisa diatur lewat tombol Atur di web)${C.reset}`
    }`
  );
  console.log(
    `  ${autoStart.enabled ? `${C.green}✔${C.reset}` : `${C.dim}○${C.reset}`} ${C.bold}Auto-Start${C.reset}    ${autoStart.enabled ? `${C.green}Aktif saat laptop hidup${C.reset}` : `${C.dim}Nonaktif${C.reset}`}`
  );
  console.log(
    `  ${C.green}✔${C.reset} ${C.bold}Markas 3D${C.reset}     ${C.cyan}${C.bold}${url}${C.reset}`
  );
  console.log('');

  if (shouldOpen) {
    console.log(`  ${C.pink}➜${C.reset} Membuka browser...`);
    openBrowser(url);
  }

  console.log(
    `  ${C.dim}Pintasan:${C.reset}  ${C.yellow}[H]${C.reset} Hide to Tray (Background)  ${C.yellow}[A]${C.reset} Toggle Auto-Start  ${C.yellow}[O]${C.reset} Buka Web  ${C.yellow}[Q]${C.reset} Keluar`
  );
  console.log('');

  let closing = false;
  const cleanupStdin = () => {
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      } catch {
        // ignore
      }
    }
  };

  const shutdown = () => {
    if (closing) return;
    closing = true;
    cleanupStdin();
    console.log(`\n  ${C.dim}Menutup LEGO OpenBot Agent...${C.reset}`);
    runtime.stop();
    if (server) {
      server.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
    setTimeout(() => process.exit(0), 1200).unref();
  };

  const hideToTray = async () => {
    if (closing) return;
    closing = true;
    cleanupStdin();
    console.log(`\n  ${C.violet}➜${C.reset} Memindahkan server ke background & System Tray...`);
    runtime.stop();
    await new Promise<void>((resolveClose) => {
      if (server) {
        server.close(() => resolveClose());
        setTimeout(resolveClose, 500).unref();
      } else {
        resolveClose();
      }
    });
    const rec = await startBackgroundDaemon({
      cliScriptPath: CLI_SCRIPT_PATH,
      port,
      host,
      withTray: true,
    });
    console.log(
      `  ${C.green}✔${C.reset} ${C.bold}Berhasil disembunyikan ke Tray / Background!${C.reset} (${C.cyan}${rec.url}${C.reset}, PID ${rec.pid})`
    );
    console.log(
      `  ${C.dim}Terminal ini aman ditutup. Hentikan kapan saja lewat klik kanan ikon Tray atau ${C.cyan}openbot-lego stop${C.reset}.\n`
    );
    process.exit(0);
  };

  // Interactive single-key shortcuts when attached to a TTY terminal
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (key: string) => {
        if (key === '\u0003' || key === 'q' || key === 'Q') {
          shutdown();
        } else if (key === 'h' || key === 'H') {
          void hideToTray();
        } else if (key === 'o' || key === 'O') {
          console.log(`  ${C.pink}➜${C.reset} Membuka ${C.cyan}${url}${C.reset}...`);
          openBrowser(url);
        } else if (key === 'a' || key === 'A') {
          autoStart = autoStart.enabled
            ? disableAutoStart()
            : enableAutoStart({ port, cliScriptPath: CLI_SCRIPT_PATH });
          console.log(
            `  ${autoStart.enabled ? `${C.green}✔${C.reset}` : `${C.yellow}○${C.reset}`} Auto-Start saat laptop hidup: ${
              autoStart.enabled ? `${C.green}${C.bold}AKTIF (ON)${C.reset}` : `${C.dim}NONAKTIF (OFF)${C.reset}`
            }`
          );
        }
      });
    } catch {
      // Ignore if raw mode is unsupported
    }
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

async function main() {
  const version = readPackageVersion();
  const opts = parseArgs(process.argv.slice(2));

  if (opts.command === '__daemon') {
    await runDaemonChild(opts.port, opts.host);
    return;
  }
  if (opts.showVersion) {
    console.log(version);
    return;
  }
  if (opts.showHelp || opts.command === 'help') {
    printHelp(version);
    return;
  }
  if (opts.command === 'doctor') {
    await runDoctor(version);
    return;
  }
  if (opts.command === 'status' || opts.command === 'list') {
    await runStatus(version);
    return;
  }
  if (opts.command === 'autostart') {
    runAutoStartCommand(version, opts.subArg, opts.port);
    return;
  }
  if (opts.command === 'logs') {
    runLogs(version);
    return;
  }
  if (opts.command === 'reset') {
    runReset(version);
    return;
  }
  if (opts.command === 'stop') {
    await runStop(version);
    return;
  }
  if (opts.command === 'background' || opts.command === 'tray' || opts.daemon) {
    await runBackgroundStart(version, opts.port, opts.host, opts.shouldOpen);
    return;
  }

  await runStart(version, opts.port, opts.host, opts.shouldOpen);
}

void main().catch((err) => {
  console.error(`${C.red}✖ Error:${C.reset}`, err);
  process.exit(1);
});
