import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  Palette,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  Settings2,
  Square,
  X,
} from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { getAgentCharacterId, useCharacterStore } from '../store/characterStore';
import { useUIStore } from '../store/uiStore';
import { resetAllToFreshInstall } from './autoLink';

interface SyncDiagnostics {
  enabled: boolean;
  running: boolean;
  sqliteSupported: boolean;
  resolvedDbPath: string;
  dbFound: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface AutoStartInfo {
  enabled: boolean;
  supported: boolean;
  platform: string;
  targetPath: string;
}

interface BridgeConfigResponse {
  mode: 'embedded' | 'standalone' | 'cli';
  autoSyncEnabled: boolean;
  openbotDbPath: string;
  defaultOpenBotDbPath: string;
  bridgeToken: string;
  autoStart?: AutoStartInfo | null;
  diagnostics: SyncDiagnostics | null;
}

const BASE_URL = ((import.meta.env.VITE_BRIDGE_URL as string | undefined) ?? '').replace(/\/$/, '');

export const OpenBotSettingsModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.openBotSettingsOpen);
  const close = useUIStore((s) => s.closeOpenBotSettings);
  const openCreator = useUIStore((s) => s.openCreator);
  const pushToast = useUIStore((s) => s.pushToast);

  const connectionState = useAgentStore((s) => s.connectionState);
  const agents = useAgentStore((s) => s.agents);
  const setAgents = useAgentStore((s) => s.setAgents);
  const syncAutoBindings = useAgentStore((s) => s.syncAutoBindings);
  const syncWithAgents = useCharacterStore((s) => s.syncWithAgents);

  const [config, setConfig] = useState<BridgeConfigResponse | null>(null);
  const [dbPathInput, setDbPathInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as BridgeConfigResponse;
      setConfig(data);
      setDbPathInput(data.openbotDbPath);
    } catch {
      setFetchError('Bridge lokal belum aktif. Pastikan server dijalankan dengan `npm run dev`.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfirmResetOpen(false);
      void fetchConfig();
    }
  }, [isOpen, fetchConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmResetOpen) setConfirmResetOpen(false);
        else close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, confirmResetOpen, close]);

  if (!isOpen) return null;

  const handleSaveConfig = async (patch: {
    autoSyncEnabled?: boolean;
    openbotDbPath?: string;
    regenerateToken?: boolean;
    autoStartEnabled?: boolean;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as BridgeConfigResponse & { agents?: typeof agents };
      setConfig(data);
      setDbPathInput(data.openbotDbPath);
      if (Array.isArray(data.agents)) {
        syncWithAgents(data.agents);
        syncAutoBindings(data.agents);
        setAgents(data.agents);
      }
      pushToast('Konfigurasi OpenBot disimpan!', 'info');
    } catch {
      pushToast('Gagal menyimpan konfigurasi ke Bridge lokal.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/sync-now`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        diagnostics?: SyncDiagnostics | null;
        agents?: typeof agents;
      };
      setConfig((prev) =>
        prev ? { ...prev, diagnostics: data.diagnostics ?? prev.diagnostics } : prev
      );
      if (Array.isArray(data.agents)) {
        syncWithAgents(data.agents);
        syncAutoBindings(data.agents);
        setAgents(data.agents);
      }
      pushToast(`Sinkronisasi selesai (${data.agents?.length ?? agents.length} agent aktif).`, 'info');
    } catch {
      pushToast('Gagal melakukan sinkronisasi OpenBot.', 'info');
    } finally {
      setSyncing(false);
    }
  };

  const handleSimulate = async (agentId: string, targetStatus: 'working' | 'idle') => {
    setSimulatingId(agentId);
    try {
      const res = await fetch(`${BASE_URL}/api/agents/${encodeURIComponent(agentId)}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          durationSec: 12,
          task: 'Simulasi kerja dari Pengaturan Web (12 detik)',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      pushToast('Gagal menjalankan simulasi status.', 'info');
    } finally {
      setSimulatingId(null);
    }
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    await resetAllToFreshInstall();
  };

  const handleCopy = (label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label);
      window.setTimeout(() => setCopiedKey(null), 1600);
    });
  };

  const diag = config?.diagnostics;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmResetOpen) close();
      }}
    >
      <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 text-white"
          style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 55%, #4F46E5 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-['Lilita_One',_'Fredoka',_sans-serif] text-lg leading-tight tracking-wide">
                Pengaturan OpenBot
              </h2>
              <p className="text-[11px] font-semibold text-white/90">
                Setiap agent OpenBot otomatis muncul di map — cukup jalankan{' '}
                <code className="rounded bg-black/25 px-1 py-0.5 font-mono text-[10px]">npm run dev</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup pengaturan"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="lego-thin-scroll flex-1 space-y-4 overflow-y-auto p-4 text-slate-800">
          {/* Status Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2.5">
              <span
                className={[
                  'h-2.5 w-2.5 rounded-full',
                  connectionState === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500',
                ].join(' ')}
              />
              <div className="text-xs">
                <p className="font-extrabold text-slate-800">
                  {connectionState === 'connected'
                    ? `Bridge Aktif (${
                        config?.mode === 'cli'
                          ? 'CLI openbot-lego'
                          : config?.mode === 'embedded'
                            ? 'Terintegrasi di Vite'
                            : 'Standalone'
                      })`
                    : 'Bridge Offline'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {diag?.dbFound && diag.enabled
                    ? `OpenBot Desktop terdeteksi · ${agents.length} agent aktif di map`
                    : fetchError || diag?.lastError || 'Menunggu koneksi OpenBot…'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: OpenBot Desktop Auto-Sync */}
          <div className="rounded-2xl border border-slate-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">
                    Auto-Sync OpenBot Desktop (Real-Time)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Agent baru otomatis muncul di map, agent yang dihapus otomatis keluar (read-only).
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving || !config}
                onClick={() =>
                  void handleSaveConfig({ autoSyncEnabled: !(config?.autoSyncEnabled ?? true) })
                }
                className={[
                  'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50',
                  config?.autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300',
                ].join(' ')}
                aria-label="Toggle Auto-Sync OpenBot Desktop"
              >
                <span
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    config?.autoSyncEnabled ? 'left-5' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                Lokasi <code className="font-mono">openbot.db</code> (kosongkan = deteksi otomatis)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={dbPathInput}
                  onChange={(e) => setDbPathInput(e.target.value)}
                  placeholder={
                    config?.defaultOpenBotDbPath || 'Otomatis (%APPDATA%\\OpenBot\\openbot.db)'
                  }
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={saving || loading}
                  onClick={() => void handleSaveConfig({ openbotDbPath: dbPathInput })}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  disabled={syncing || loading}
                  onClick={() => void handleSyncNow()}
                  title="Scan ulang openbot.db sekarang"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
              {diag && (
                <p
                  className={[
                    'text-[10.5px] font-semibold',
                    diag.dbFound && diag.enabled ? 'text-emerald-700' : 'text-amber-700',
                  ].join(' ')}
                >
                  {diag.dbFound
                    ? `Terdeteksi: ${diag.resolvedDbPath}`
                    : `Belum ditemukan di: ${diag.resolvedDbPath}`}
                </p>
              )}
            </div>

            {/* Auto-Start on Laptop Boot Toggle */}
            {config?.autoStart?.supported && (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-fuchsia-600" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Jalankan Otomatis Saat Laptop Hidup
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Otomatis aktif di background & System Tray saat login (tanpa jendela terminal).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleSaveConfig({
                      autoStartEnabled: !config.autoStart?.enabled,
                    })
                  }
                  className={[
                    'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50',
                    config.autoStart.enabled ? 'bg-fuchsia-600' : 'bg-slate-300',
                  ].join(' ')}
                  aria-label="Toggle Auto-Start saat laptop hidup"
                >
                  <span
                    className={[
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      config.autoStart.enabled ? 'left-5' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Active Agents Auto-Spawned on Map */}
          <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-fuchsia-600" />
                <h3 className="text-xs font-extrabold text-slate-800">
                  Agent Aktif di Map ({agents.length})
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Sinkron otomatis 1:1
              </span>
            </div>

            {agents.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                Belum ada agent OpenBot. Buat agent baru di aplikasi OpenBot Desktop agar karakternya otomatis muncul di rumah.
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((ag) => {
                  const isWorking = ag.status === 'working';
                  const charId = getAgentCharacterId(ag.agentId);
                  return (
                    <div
                      key={ag.agentId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-extrabold text-slate-900">
                            {ag.name}
                          </span>
                          <span
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase',
                              isWorking
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800',
                            ].join(' ')}
                          >
                            {isWorking && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {isWorking ? 'Working' : 'Idle'}
                          </span>
                        </div>
                        <p className="truncate text-[10.5px] text-slate-500">
                          {isWorking && ag.task ? ag.task : ag.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            openCreator(charId);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10.5px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                        >
                          <Palette className="h-3 w-3 text-amber-600" />
                          <span>Edit Outfit</span>
                        </button>

                        <button
                          type="button"
                          disabled={simulatingId === ag.agentId}
                          onClick={() =>
                            void handleSimulate(ag.agentId, isWorking ? 'idle' : 'working')
                          }
                          title={
                            isWorking
                              ? 'Kembalikan ke Idle'
                              : 'Test animasi Working selama 12 detik'
                          }
                          className={[
                            'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold transition-colors disabled:opacity-50',
                            isWorking
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700',
                          ].join(' ')}
                        >
                          {isWorking ? (
                            <>
                              <Square className="h-2.5 w-2.5 fill-current" />
                              <span>Idle</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>Test</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Optional Advanced External API Info */}
          <div className="rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs font-extrabold text-slate-700 hover:bg-slate-50"
            >
              <span>Opsi Lanjutan: API & Token Eksternal (Opsional)</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && config && (
              <div className="space-y-2.5 border-t border-slate-200 px-3.5 py-3 text-[11px]">
                <p className="text-slate-500">
                  Tidak perlu dipakai untuk OpenBot Desktop lokal (sudah otomatis lewat Auto-Sync di atas). Berguna jika ingin mengirim status dari script/webhook luar.
                </p>

                <div className="flex items-center gap-1.5">
                  <span className="w-20 shrink-0 font-bold text-slate-600">Bridge URL</span>
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10.5px]">
                    {window.location.origin}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy('url', window.location.origin)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {copiedKey === 'url' ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-20 shrink-0 font-bold text-slate-600">Bearer Token</span>
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10.5px]">
                    {config.bridgeToken}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy('token', config.bridgeToken)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {copiedKey === 'token' ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveConfig({ regenerateToken: true })}
                    className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 font-bold text-rose-700 hover:bg-rose-100"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-100/70"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset ke Awal</span>
          </button>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-extrabold text-white hover:bg-slate-800"
          >
            Selesai
          </button>
        </div>

        {/* Custom Styled LEGO Confirmation Dialog (replaces ugly native browser confirm!) */}
        {confirmResetOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !resetting) setConfirmResetOpen(false);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-confirm-title"
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-rose-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
            >
              {/* Top LEGO accent stripe */}
              <div
                className="h-2 w-full"
                style={{
                  background: 'linear-gradient(90deg, #F43F5E 0%, #EC4899 50%, #F59E0B 100%)',
                }}
              />

              <div className="p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <h3
                  id="reset-confirm-title"
                  className="font-['Lilita_One',_'Fredoka',_sans-serif] text-xl tracking-wide text-slate-900"
                >
                  Reset ke Pengaturan Awal?
                </h3>

                <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                  Seluruh konfigurasi OpenBot, outfit kustom, karakter manual, dan dekorasi Mode Bangun akan dikembalikan ke kondisi awal seperti instalasi baru.
                </p>

                <div className="mt-5 flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={() => setConfirmResetOpen(false)}
                    className="flex-1 cursor-pointer rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={() => void handleConfirmReset()}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-b-[3px] border-rose-800 bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all hover:bg-rose-500 active:translate-y-[1px] disabled:opacity-60"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>{resetting ? 'Mereset…' : 'Ya, Reset'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
