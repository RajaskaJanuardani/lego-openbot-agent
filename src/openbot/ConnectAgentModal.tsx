import React, { useMemo, useState } from 'react';
import { Bot, Check, Search, Unplug, X } from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { useCharacterStore } from '../store/characterStore';
import { useUIStore } from '../store/uiStore';

export const ConnectAgentModal: React.FC = () => {
  const connectModalCharacterId = useUIStore((s) => s.connectModalCharacterId);
  const closeConnectModal = useUIStore((s) => s.closeConnectModal);
  const pushToast = useUIStore((s) => s.pushToast);

  const characters = useCharacterStore((s) => s.characters);
  const agents = useAgentStore((s) => s.agents);
  const connectionState = useAgentStore((s) => s.connectionState);
  const characterToAgent = useAgentStore((s) => s.characterToAgent);
  const linkCharacterToAgent = useAgentStore((s) => s.linkCharacterToAgent);
  const unlinkCharacter = useAgentStore((s) => s.unlinkCharacter);

  const [query, setQuery] = useState('');

  const targetChar = connectModalCharacterId
    ? characters.find((c) => c.id === connectModalCharacterId) ?? null
    : null;

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.agentId.toLowerCase().includes(q)
    );
  }, [agents, query]);

  if (!targetChar) return null;

  const currentAgentId = characterToAgent[targetChar.id] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-white/85 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <h2 className="font-['Lilita_One',_'Fredoka',_sans-serif] text-lg leading-tight">
                Pilih Agent OpenBot
              </h2>
              <p className="text-[11px] opacity-90">
                Hubungkan ke karakter: <strong>{targetChar.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConnectModal}
            className="cursor-pointer rounded-xl bg-white/20 p-1.5 hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Offline Demo Prompt */}
        <div className="space-y-2 border-b border-slate-200 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau role agent OpenBot..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {connectionState === 'offline' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              Bridge lokal belum aktif. Jalankan <code className="rounded bg-amber-100 px-1 font-bold">npm run dev</code> dan pastikan OpenBot Desktop terpasang.
            </div>
          )}
        </div>

        {/* Agent List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {filteredAgents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              Belum ada agent OpenBot yang terdeteksi. Buat agent baru di aplikasi OpenBot Desktop agar otomatis muncul.
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const ownerCharId = Object.entries(characterToAgent).find(
                ([, aid]) => aid === agent.agentId
              )?.[0];
              const isMine = ownerCharId === targetChar.id;
              const takenByOther = ownerCharId && !isMine;
              const ownerCharName = takenByOther
                ? characters.find((c) => c.id === ownerCharId)?.name ?? 'karakter lain'
                : null;

              return (
                <button
                  key={agent.agentId}
                  type="button"
                  disabled={Boolean(takenByOther)}
                  onClick={() => {
                    linkCharacterToAgent(targetChar.id, agent.agentId);
                    pushToast(
                      `${agent.name} (${agent.title}) terhubung ke minifigure!`,
                      agent.status === 'working' ? 'working' : 'info'
                    );
                    closeConnectModal();
                  }}
                  className={[
                    'flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all',
                    isMine
                      ? 'border-indigo-500 bg-indigo-50/90'
                      : takenByOther
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-55'
                        : 'cursor-pointer border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {/* Avatar circle */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 font-['Lilita_One',_sans-serif] text-base text-white shadow-sm">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-slate-900">
                        {agent.name}
                      </span>
                      {agent.status === 'working' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Working
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                          Idle
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs font-semibold text-slate-500">
                      {agent.title}
                    </div>
                    {agent.status === 'working' && agent.task && (
                      <div className="mt-0.5 truncate text-[11px] text-emerald-700">
                        Task: {agent.task}
                      </div>
                    )}
                    {takenByOther && (
                      <div className="mt-0.5 text-[10px] font-bold text-rose-500">
                        Sudah dipakai oleh {ownerCharName}
                      </div>
                    )}
                  </div>

                  {isMine && <Check className="h-5 w-5 shrink-0 text-indigo-600" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          {currentAgentId ? (
            <button
              type="button"
              onClick={() => {
                unlinkCharacter(targetChar.id);
                pushToast(`Koneksi OpenBot ${targetChar.name} diputuskan.`);
                closeConnectModal();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
            >
              <Unplug className="h-3.5 w-3.5" />
              Putuskan
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">1 agent = 1 karakter</span>
          )}
          <button
            type="button"
            onClick={closeConnectModal}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
