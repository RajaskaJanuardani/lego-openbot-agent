import React from 'react';
import {
  Bot,
  Crosshair,
  Eye,
  EyeOff,
  MapPin,
  Palette,
  Sparkles,
  Unplug,
  X,
} from 'lucide-react';
import type { RoomId } from '../../types';
import type { MinifigConfig } from '../../characters/minifig/types';
import { MinifigAvatar, type MinifigAvatarProps } from '../../characters/minifig/MinifigAvatar';

export { MinifigAvatar };
export type { MinifigAvatarProps };

export const ROOM_LABELS: Record<RoomId, string> = {
  overview: 'Seluruh Rumah',
  // Floor 2
  kitchen: 'Lantai 2 · Dapur',
  bedroom: 'Lantai 2 · Kamar Tidur',
  'dressing-room': 'Lantai 2 · Ruang Rias',
  'stair-room': 'Lantai 2 · Ruang Tangga',
  'living-room': 'Lantai 2 · Ruang Keluarga',
  'dining-area': 'Lantai 2 · Ruang Makan',
  terraces: 'Lantai 2 · Teras Tropis',
  // Floor 1
  foyer: 'Lantai 1 · Ruang Tamu',
  studio: 'Lantai 1 · Ruang Kerja',
  'guest-room': 'Lantai 1 · Kamar Tamu',
  'bathroom-1': 'Lantai 1 · Kamar Mandi',
  laundry: 'Lantai 1 · Laundry',
  'stair-hall-1': 'Lantai 1 · Lorong Tangga',
  'front-porch': 'Lantai 1 · Teras Depan',
  // Outdoor
  'outdoor-yard': 'Luar · Halaman',
  'outdoor-beach': 'Luar · Pantai',
  'outdoor-tuktuk': 'Luar · Dekat Bajaj',
};

export interface LinkedAgentInfo {
  agentId: string;
  name: string;
  title: string;
  status: 'working' | 'idle';
  task?: string | null;
  lastCompletedTask?: string | null;
  updatedAt?: string;
}

export interface CharacterCardProps {
  character: MinifigConfig;
  isNight: boolean;
  isFollowing?: boolean;
  liveRoomId?: RoomId;
  linkedAgent?: LinkedAgentInfo | null;
  onFocusCamera: (character: MinifigConfig) => void;
  onToggleFollow?: (character: MinifigConfig) => void;
  onEditOutfit?: (character: MinifigConfig) => void;
  onConnectAgent?: (character: MinifigConfig) => void;
  onDisconnectAgent?: (character: MinifigConfig) => void;
  onClose: () => void;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'baru saja';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `mulai ${diffSec} detik lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `mulai ${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  return `mulai ${diffHr} jam lalu`;
}

const CARD_ANIMATION_STYLE = `
@keyframes legoCardPop {
  0%   { opacity: 0; transform: translateY(14px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
`;

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isNight,
  isFollowing = false,
  liveRoomId,
  linkedAgent = null,
  onFocusCamera,
  onToggleFollow,
  onEditOutfit,
  onConnectAgent,
  onDisconnectAgent,
  onClose,
}) => {
  const effectiveRoomId = liveRoomId ?? character.favoriteRoom;
  const roomLabel = ROOM_LABELS[effectiveRoomId] ?? effectiveRoomId;
  const displayName = linkedAgent?.name ?? character.name;
  const displayRole = linkedAgent?.title ?? character.role;
  const themeColor = character.torsoColor || character.avatarBg || '#F6C915';

  return (
    <aside
      aria-label={`Kartu karakter ${displayName}`}
      className={[
        'pointer-events-auto relative w-full max-w-[360px] rounded-2xl border-2 backdrop-blur-xl transition-colors duration-300',
        isNight
          ? 'border-indigo-400/35 bg-slate-900/92 text-slate-100 shadow-[0_16px_40px_rgba(2,6,23,0.65)]'
          : 'border-white/90 bg-white/94 text-slate-800 shadow-[0_16px_38px_rgba(15,23,42,0.2)]',
      ].join(' ')}
      style={{ animation: 'legoCardPop 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
    >
      <style>{CARD_ANIMATION_STYLE}</style>

      {/* Raised LEGO brick studs along top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[7px] left-6 flex items-center gap-2.5"
      >
        {[0, 1, 2, 3].map((stud) => (
          <span
            key={stud}
            className="block h-[7px] w-4 rounded-t-[3px]"
            style={{
              backgroundColor: themeColor,
              boxShadow:
                'inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.22)',
            }}
          />
        ))}
      </div>

      {/* Top trim bar */}
      <div
        className="h-2 w-full rounded-t-[14px]"
        style={{
          backgroundColor: themeColor,
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.14)',
        }}
      />

      <div className="p-4">
        {/* Header: Portrait + Name + Status Badge + Role + Close */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <MinifigAvatar
              character={character}
              size={62}
              className="ring-2 ring-amber-300/80 shadow-md"
            />
            <span
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
              aria-hidden="true"
            >
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h2
                className={[
                  "truncate font-['Lilita_One',_'Fredoka',_sans-serif] text-xl leading-tight tracking-wide",
                  isNight ? 'text-amber-200' : 'text-slate-900',
                ].join(' ')}
              >
                {displayName}
              </h2>
              {linkedAgent ? (
                linkedAgent.status === 'working' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-500 ring-1 ring-emerald-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Working
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 ring-1 ring-amber-300/60">
                    Idle
                  </span>
                )
              ) : null}
            </div>
            <span
              className="mt-1 inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm"
              style={{
                backgroundColor: themeColor,
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              {displayRole}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kartu karakter"
            className={[
              'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95',
              isNight
                ? 'border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-slate-100/90 text-slate-500 hover:bg-rose-50 hover:text-rose-600',
            ].join(' ')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description: Custom quote OR OpenBot live task summary */}
        <div className="relative mt-3.5">
          <div
            aria-hidden="true"
            className={[
              'absolute -top-1.5 left-7 h-3 w-3 rotate-45 border-l border-t',
              linkedAgent?.status === 'working'
                ? isNight
                  ? 'border-emerald-500/40 bg-emerald-950/75'
                  : 'border-emerald-300 bg-emerald-50'
                : isNight
                  ? 'border-indigo-400/30 bg-slate-800/95'
                  : 'border-amber-200 bg-amber-50/95',
            ].join(' ')}
          />
          {linkedAgent && linkedAgent.status === 'working' ? (
            <div
              className={[
                'relative rounded-xl border px-3.5 py-2.5',
                isNight
                  ? 'border-emerald-500/40 bg-emerald-950/75 text-emerald-100'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-950',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                <span>Sedang mengerjakan</span>
                <span className="font-semibold normal-case opacity-80">
                  {formatRelativeTime(linkedAgent.updatedAt)}
                </span>
              </div>
              <p className="font-['Fredoka',_sans-serif] text-sm font-semibold leading-snug">
                {linkedAgent.task || 'Menjalankan task OpenBot di Ruang Kerja…'}
              </p>
            </div>
          ) : linkedAgent && linkedAgent.status === 'idle' ? (
            <div
              className={[
                'relative rounded-xl border px-3.5 py-2.5',
                isNight
                  ? 'border-indigo-400/30 bg-slate-800/95 text-sky-100'
                  : 'border-amber-200 bg-amber-50/95 text-slate-700',
              ].join(' ')}
            >
              <p className="font-['Fredoka',_sans-serif] text-xs font-bold">
                Idle: menunggu task berikutnya
              </p>
              {linkedAgent.lastCompletedTask && (
                <p className="mt-1 text-[11px] opacity-70">
                  Terakhir selesai: {linkedAgent.lastCompletedTask}
                </p>
              )}
            </div>
          ) : (
            <blockquote
              className={[
                "relative rounded-xl border px-3.5 py-2.5 font-['Fredoka',_sans-serif] text-sm font-medium leading-snug italic",
                isNight
                  ? 'border-indigo-400/30 bg-slate-800/95 text-sky-100'
                  : 'border-amber-200 bg-amber-50/95 text-slate-700',
              ].join(' ')}
            >
              &ldquo;{character.quote}&rdquo;
            </blockquote>
          )}
        </div>

        {/* Live Room Location Pin */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div
            className={[
              'inline-flex min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
              isNight
                ? 'border-slate-700 bg-slate-800/80 text-sky-200'
                : 'border-slate-200/90 bg-slate-100/90 text-slate-700',
            ].join(' ')}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span className="truncate">{roomLabel}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleFollow && (
              <button
                type="button"
                onClick={() => onToggleFollow(character)}
                className={[
                  'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border-b-[3px] px-2.5 py-1.5 text-xs font-bold shadow-sm transition-all active:translate-y-[1.5px] active:border-b',
                  isFollowing
                    ? 'border-rose-700 bg-rose-500 text-white hover:bg-rose-400'
                    : 'border-sky-700 bg-sky-500 text-white hover:bg-sky-400',
                ].join(' ')}
              >
                {isFollowing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{isFollowing ? 'Lepas' : 'Ikuti'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onFocusCamera(character)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border-b-[3px] border-amber-600 bg-amber-400 px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition-all hover:bg-amber-300 active:translate-y-[1.5px] active:border-b"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Fokus</span>
            </button>
          </div>
        </div>

        {/* Action Row: Edit Outfit (+ manual agent link ONLY for custom non-agent characters) */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-400/20 pt-2.5">
          {onEditOutfit && (
            <button
              type="button"
              onClick={() => onEditOutfit(character)}
              className={[
                'inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors',
                isNight
                  ? 'border-slate-700 bg-slate-800 text-amber-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-amber-100',
              ].join(' ')}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Edit Outfit</span>
            </button>
          )}
          {!character.id.startsWith('agent-') && onConnectAgent && (
            <button
              type="button"
              onClick={() => onConnectAgent(character)}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-b-2 border-indigo-800 bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{linkedAgent ? 'Ganti Agent' : 'Hubungkan Agent'}</span>
            </button>
          )}
          {!character.id.startsWith('agent-') && linkedAgent && onDisconnectAgent && (
            <button
              type="button"
              onClick={() => onDisconnectAgent(character)}
              title="Putuskan koneksi OpenBot"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
            >
              <Unplug className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
