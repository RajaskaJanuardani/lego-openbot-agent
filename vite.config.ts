import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { legoOpenBotBridgePlugin } from './bridge/vitePlugin';

// Embedded OpenBot Bridge & live SQLite Auto-Sync (single-command `npm run dev`)
const externalBridgeUrl = process.env.VITE_BRIDGE_URL?.trim();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(!externalBridgeUrl ? [legoOpenBotBridgePlugin()] : []),
  ],
  server: {
    watch: {
      ignored: ['**/bridge/**', '**/openbot/**', '**/scripts/**'],
    },
    ...(externalBridgeUrl
      ? {
          proxy: {
            '/api': {
              target: externalBridgeUrl,
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
});
