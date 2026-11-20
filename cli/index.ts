import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { createBridgeRuntime } from '../bridge/app.js';
import { BridgeConfigStore, getDataDir } from '../bridge/config.js';
import { AgentBridgeStore } from '../bridge/store.js';

// ANSI color helpers (zero external dependencies)
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  pink: '\x1b[38;5;212m',
  violet: '\x1b[38;5;141m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[97m',
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

const PKG_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST_DIR = join(PKG_ROOT, 'dist');

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function printBanner(version: string): void {
  const innerWidth = 56;
  const line1Plain = `  LEGO OpenBot Agent  v${version}`;
  const line2Plain = '  Markas 3D Interaktif Real-Time untuk OpenBot Desktop';
  const pad1 = ' '.repeat(Math.max(1, innerWidth - line1Plain.length));
  const pad2 = ' '.repeat(Math.max(1, innerWidth - line2Plain.length));

  console.log('');
  console.log(`  ${C.violet}╭${'─'.repeat(innerWidth)}╮${C.reset}`);
  console.log(
    `  ${C.violet}│${C.reset}  ${C.pink}${C.bold}LEGO OpenBot Agent${C.reset}  ${C.dim}v${version}${C.reset}${pad1}${C.violet}│${C.reset}`
  );
  console.log(
    `  ${C.violet}│${C.reset}  ${C.dim}Markas 3D Interaktif Real-Time untuk OpenBot Desktop${C.reset}${pad2}${C.violet}│${C.reset}`
  );
  console.log(`  ${C.violet}╰${'─'.repeat(innerWidth)}╯${C.reset}`);
  console.log('');
}

function printHelp(version: string): void {
  printBanner(version);
  console.log(`  ${C.bold}Pemakaian:${C.reset}`);
  console.log(`    ${C.cyan}openbot-lego${C.reset}                     Jalankan Markas 3D & buka browser`);
  console.log(`    ${C.cyan}openbot-lego start${C.reset} [opsi]        Sama dengan perintah default`);
  console.log(`    ${C.cyan}openbot-lego status${C.reset}              Tampilkan daftar agent OpenBot & statusnya`);
  console.log(`    ${C.cyan}openbot-lego doctor${C.reset}              Cek versi Node.js & koneksi openbot.db`);
  console.log(`    ${C.cyan}openbot-lego reset${C.reset}               Reset konfigurasi & cache lokal`);
  console.log('');
  console.log(`  ${C.bold}Opsi:${C.reset}`);
  console.log(`    ${C.yellow}-p, --port <port>${C.reset}   Port HTTP server (default: 4310)`);
  console.log(`    ${C.yellow}--host <host>${C.reset}       Host bind address (default: 127.0.0.1)`);
  console.log(`    ${C.yellow}--no-open${C.reset}           Jangan buka browser secara otomatis`);
  console.log(`    ${C.yellow}-v, --version${C.reset}       Tampilkan versi`);
  console.log(`    ${C.yellow}-h, --help${C.reset}          Tampilkan bantuan ini`);
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
    // Non-fatal if browser cannot be opened automatically
  }
}

function parseArgs(argv: string[]) {
  let command = 'start';
  let port = Number(process.env.PORT ?? process.env.BRIDGE_PORT ?? 4310);
  let host = '127.0.0.1';
  let shouldOpen = true;
  let showHelp = false;
  let showVersion = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      showHelp = true;
    } else if (arg === '-v' || arg === '--version') {
      showVersion = true;
    } else if (arg === '--no-open') {
      shouldOpen = false;
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
    } else if (!arg.startsWith('-') && i === 0) {
      command = arg;
    }
  }

  return { command, port, host, shouldOpen, showHelp, showVersion };
}

async function runDoctor(version: string): Promise<void> {
  printBanner(version);
  const nodeCheck = checkNodeVersion();
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
  const runtime = createBridgeRuntime({ mode: 'cli' });
  await runtime.ready;
  const agents = runtime.store.list();
  const diag = runtime.getDiagnostics();
  runtime.stop();

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

function runReset(version: string): void {
  printBanner(version);
  const cfg = new BridgeConfigStore();
  const store = new AgentBridgeStore();
  store.clear();
  cfg.reset();
  console.log(`  ${C.green}✔${C.reset} Konfigurasi & cache lokal di ${C.dim}${getDataDir()}${C.reset} sudah di-reset.`);
  console.log(
    `  ${C.dim}Tips: buka http://localhost:4310/?reset=1 jika ingin mereset outfit & dekorasi di browser.${C.reset}`
  );
  console.log('');
}

async function runStart(
  version: string,
  requestedPort: number,
  host: string,
  shouldOpen: boolean
): Promise<void> {
  printBanner(version);

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

  const runtime = createBridgeRuntime({
    mode: 'cli',
    allowedOrigin: url,
  });

  // Serve built 3D web frontend (`dist/`) directly on the same Hono server!
  runtime.app.get('*', (c) => {
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

  // Wait for initial OpenBot DB poll so banner prints live agent count immediately
  await runtime.ready;
  const diag = runtime.getDiagnostics();
  const agents = runtime.store.list();

  const server = serve({
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
    `  ${C.green}✔${C.reset} ${C.bold}Markas 3D${C.reset}     ${C.cyan}${C.bold}${url}${C.reset}`
  );
  console.log('');

  if (shouldOpen) {
    console.log(`  ${C.pink}➜${C.reset} Membuka browser... ${C.dim}(Tekan Ctrl+C untuk berhenti)${C.reset}`);
    openBrowser(url);
  } else {
    console.log(`  ${C.dim}Tekan Ctrl+C untuk menghentikan server.${C.reset}`);
  }
  console.log('');

  const shutdown = () => {
    console.log(`\n  ${C.dim}Menutup LEGO OpenBot Agent...${C.reset}`);
    runtime.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

async function main() {
  const version = readPackageVersion();
  const opts = parseArgs(process.argv.slice(2));

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
  if (opts.command === 'reset') {
    runReset(version);
    return;
  }

  await runStart(version, opts.port, opts.host, opts.shouldOpen);
}

void main().catch((err) => {
  console.error(`${C.red}✖ Error:${C.reset}`, err);
  process.exit(1);
});
