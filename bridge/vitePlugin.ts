import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { getRequestListener } from '@hono/node-server';
import { createBridgeRuntime, type BridgeRuntime } from './app.js';

/**
 * Vite Plugin that embeds the LEGO OpenBot Bridge & live OpenBot Desktop Auto-Sync
 * directly inside `npm run dev` (and `npm run preview`), so the user ONLY needs
 * a single terminal command (`npm run dev`) with zero extra bridge server or env vars!
 */
export function legoOpenBotBridgePlugin(): Plugin {
  let runtime: BridgeRuntime | null = null;

  const attachMiddleware = (
    middlewares: {
      use: (
        fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
      ) => void;
    },
    httpServer: { once?: (event: string, listener: () => void) => void } | null
  ) => {
    if (!runtime) {
      runtime = createBridgeRuntime({ mode: 'embedded' });
      console.log(
        '[bridge] Embedded LEGO OpenBot Bridge aktif langsung di Vite (/api/*) — cukup jalankan npm run dev!'
      );
    }

    const listener = getRequestListener(runtime.app.fetch);

    middlewares.use((req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) {
        next();
        return;
      }
      void listener(req, res);
    });

    httpServer?.once?.('close', () => {
      runtime?.stop();
      runtime = null;
    });
  };

  return {
    name: 'lego-openbot-bridge',
    configureServer(server) {
      attachMiddleware(server.middlewares, server.httpServer);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares, server.httpServer);
    },
  };
}
