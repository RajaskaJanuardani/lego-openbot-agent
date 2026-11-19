import { serve } from '@hono/node-server';
import { createBridgeRuntime } from './app.js';

const PORT = Number(process.env.BRIDGE_PORT ?? 4310);
const runtime = createBridgeRuntime({ mode: 'standalone' });

console.log(`[bridge] Standalone LEGO OpenBot Bridge listening on http://localhost:${PORT}`);
serve({ fetch: runtime.app.fetch, port: PORT });
