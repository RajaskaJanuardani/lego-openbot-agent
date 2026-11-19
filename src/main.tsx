import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const STORAGE_KEYS = [
  'lego-openbot-state-v3',
  'lego-openbot-characters-v3',
  'lego-tropical-house-openbot-v2',
  'lego-tropical-house-characters-v2',
  'lego-tropical-house-layout-v2',
];

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);

  // Cleanly handle `/?reset=1` BEFORE importing App/Zustand stores (prevents ESM hoist hydration!)
  if (params.get('reset') === '1') {
    for (const key of STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    try {
      await fetch('/api/reset-config', { method: 'POST' });
    } catch {
      // ignore if bridge offline
    }
    params.delete('reset');
    const cleanUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : '') +
      window.location.hash;
    window.location.replace(cleanUrl);
    return;
  }

  const { default: App } = await import('./App');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
