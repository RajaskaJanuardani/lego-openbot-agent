import React from 'react';
import { Bot, Settings2, X } from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { useUIStore } from '../store/uiStore';

export const StatusBadge: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const connectionState = useAgentStore((s) => s.connectionState);
  const agents = useAgentStore((s) => s.agents);
  const onboardingDismissed = useAgentStore((s) => s.onboardingDismissed);
  const dismissOnboarding = useAgentStore((s) => s.dismissOnboarding);
  const openOpenBotSettings = useUIStore((s) => s.openOpenBotSettings);

  // Only show helpful empty-house hint when 0 OpenBot agents exist
  const showEmptyHint =
    !onboardingDismissed && connectionState === 'connected' && agents.length === 0;

  const label =
    connectionState === 'connected'
      ? agents.length > 0
        ? `OpenBot: Terhubung (${agents.length})`
        : 'OpenBot: 0 Agent'
      : 'OpenBot: Offline';

  const dotClass =
    connectionState === 'connected'
      ? agents.length > 0
        ? 'bg-emerald-500 animate-pulse'
        : 'bg-sky-400'
      : 'bg-slate-400';

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div
        className={[
          'inline-flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold backdrop-blur-xl shadow-sm transition-colors',
          isNight
            ? 'border-indigo-400/30 bg-slate-900/80 text-slate-200'
            : 'border-white/85 bg-white/85 text-slate-700',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={openOpenBotSettings}
          title="Buka Pengaturan OpenBot"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-0.5 hover:bg-indigo-500/10"
        >
          <Bot className="h-3.5 w-3.5 text-indigo-500" />
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span>{label}</span>
        </button>

        <button
          type="button"
          onClick={openOpenBotSettings}
          title="Pengaturan OpenBot"
          className={[
            'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold transition-all',
            isNight
              ? 'bg-indigo-500/25 text-indigo-200 hover:bg-indigo-500/40'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
          ].join(' ')}
        >
          <Settings2 className="h-2.5 w-2.5" />
          <span>Atur</span>
        </button>
      </div>

      {/* Friendly empty-state hint ONLY when user has 0 OpenBot agents */}
      {showEmptyHint && (
        <div
          className={[
            'max-w-[290px] rounded-2xl border p-2.5 text-[11px] shadow-lg backdrop-blur-xl transition-all',
            isNight
              ? 'border-indigo-400/35 bg-slate-900/90 text-slate-100'
              : 'border-indigo-200 bg-white/95 text-slate-800',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold leading-snug">Belum ada agent di rumah (0 agent)</p>
            <button
              type="button"
              onClick={dismissOnboarding}
              aria-label="Tutup saran"
              className="shrink-0 cursor-pointer rounded-md p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p
            className={[
              'mt-0.5 text-[10.5px] leading-snug',
              isNight ? 'text-slate-300' : 'text-slate-500',
            ].join(' ')}
          >
            Buat agent di aplikasi OpenBot Desktop agar minifigure-nya langsung muncul otomatis di sini.
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                dismissOnboarding();
                openOpenBotSettings();
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[10.5px] font-extrabold text-white shadow-sm hover:bg-indigo-700"
            >
              <Settings2 className="h-3 w-3" />
              <span>Atur Lokasi OpenBot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
