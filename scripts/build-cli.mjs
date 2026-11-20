import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const outFile = resolve(process.cwd(), 'dist-cli/cli.mjs');
mkdirSync(dirname(outFile), { recursive: true });

await build({
  entryPoints: [resolve(process.cwd(), 'cli/index.ts')],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['hono', '@hono/node-server', 'zod', 'node:*'],
  sourcemap: false,
  minify: false,
});

try {
  chmodSync(outFile, 0o755);
} catch {
  // chmod is a no-op on Windows
}

console.log('[build-cli] Built executable CLI -> dist-cli/cli.mjs');
