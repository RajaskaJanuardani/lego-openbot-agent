import React, { useEffect, useState } from 'react';
import {
  EyeOff,
  Hammer,
  Home,
  Layers,
  Moon,
  MousePointerClick,
  Plus,
  RotateCw,
  Sun,
  Users,
} from 'lucide-react';
import type {
  CameraPreset,
  CharacterId,
  FloorViewMode,
  PresetId,
  RoomId,
} from '../../types';
import type { MinifigConfig } from '../../characters/minifig/types';
import { MAX_CHARACTERS } from '../../characters/minifig/types';
import { CAMERA_PRESETS } from '../camera/presets';
import { characterRuntimeMap } from '../../lib/characterRuntime';
import { Minimap } from '../../scene/camera/Minimap';
import { useUIStore } from '../../store/uiStore';
import {
  CharacterCard,
  MinifigAvatar,
  type LinkedAgentInfo,
} from './CharacterCard';

export interface OverlayProps {
  characters: MinifigConfig[];
  isNight: boolean;
  onToggleNight: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showCharacters: boolean;
  onToggleCharacters: () => void;
  floorViewMode: FloorViewMode;
  onChangeFloorViewMode: (mode: FloorViewMode) => void;
  buildMode: boolean;
  onToggleBuildMode?: () => void;
  onResetView: () => void;
  activePreset: PresetId | null;
  onSelectPreset: (preset: CameraPreset) => void;
  selectedCharacter: MinifigConfig | null;
  followCharacterId: CharacterId | null;
  onToggleFollowCharacter: (character: MinifigConfig) => void;
  onStopFollow: () => void;
  onSelectCharacterFromUI: (character: MinifigConfig) => void;
  onFocusCharacter: (character: MinifigConfig) => void;
  onEditOutfit: (character: MinifigConfig) => void;
  onCreateCharacter: () => void;
  onCloseCharacterCard: () => void;
  hasInteracted: boolean;
  /** Optional OpenBot props wired in Fase 6 */
  getLinkedAgent?: (charId: CharacterId) => LinkedAgentInfo | null;
  onConnectAgent?: (character: MinifigConfig) => void;
  onDisconnectAgent?: (character: MinifigConfig) => void;
  openBotStatusPill?: React.ReactNode;
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

function adjustHexBrightness(hex: string, factor: number): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((v) =>
    Math.max(0, Math.min(255, Math.round(factor < 1 ? v * factor : v + (255 - v) * (factor - 1))))
  );
  return `rgb(${r}, ${g}, ${b})`;
}

function isLightColor(hex: string): boolean {
  const rgb = parseHexRgb(hex);
  if (!rgb) return false;
  return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 176;
}

const OVERLAY_STYLES = `
.lego-preset-scroll::-webkit-scrollbar { display: none; }
.lego-preset-scroll { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes legoSpinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export const Overlay: React.FC<OverlayProps> = ({
  characters,
  isNight,
  onToggleNight,
  autoRotate,
  onToggleAutoRotate,
  showCharacters,
  onToggleCharacters,
  floorViewMode,
  onChangeFloorViewMode,
  buildMode,
  onToggleBuildMode,
  onResetView,
  activePreset,
  onSelectPreset,
  selectedCharacter,
  followCharacterId,
  onToggleFollowCharacter,
  onStopFollow,
  onSelectCharacterFromUI,
  onFocusCharacter,
  onEditOutfit,
  onCreateCharacter,
  onCloseCharacterCard,
  hasInteracted,
  getLinkedAgent,
  onConnectAgent,
  onDisconnectAgent,
  openBotStatusPill,
}) => {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const [liveRoomId, setLiveRoomId] = useState<RoomId | undefined>(undefined);

  // Auto-dismiss toasts after 4.2 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      for (const t of useUIStore.getState().toasts) {
        if (now - t.createdAt > 4200) {
          dismissToast(t.id);
        }
      }
    }, 600);
    return () => window.clearInterval(timer);
  }, [toasts.length, dismissToast]);

  useEffect(() => {
    if (!selectedCharacter) {
      setLiveRoomId(undefined);
      return;
    }
    const update = () => {
      const snap = characterRuntimeMap.get(selectedCharacter.id);
      setLiveRoomId(snap?.roomId ?? selectedCharacter.favoriteRoom);
    };
    update();
    const timer = window.setInterval(update, 350);
    return () => window.clearInterval(timer);
  }, [selectedCharacter]);

  const followedCharacter = followCharacterId
    ? characters.find((c) => c.id === followCharacterId) ?? null
    : null;
  const followedName = followedCharacter
    ? getLinkedAgent?.(followedCharacter.id)?.name ?? followedCharacter.name
    : null;

  const glassSurface = isNight
    ? 'border-indigo-400/30 bg-slate-900/78 text-slate-100 shadow-[0_10px_28px_rgba(2,6,23,0.5)]'
    : 'border-white/85 bg-white/82 text-slate-800 shadow-[0_10px_26px_rgba(15,23,42,0.14)]';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      <style>{OVERLAY_STYLES}</style>

      {/* TOP BAR */}
      <header className="flex w-full items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left Title Badge + OpenBot Indicator */}
        <div className="flex flex-col gap-1.5">
          <div
            className={[
              'pointer-events-auto flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl transition-colors duration-300',
              glassSurface,
            ].join(' ')}
          >
            {/* OpenBot Logo — LEGO Brick Edition */}
            <div
              aria-hidden="true"
              className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center"
            >
              <svg
                viewBox="0 0 44 44"
                className="h-full w-full drop-shadow-[0_4px_8px_rgba(147,51,234,0.38)]"
              >
                <defs>
                  <linearGradient id="legoOpenBotBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="52%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="legoOpenBotStud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FBCFE8" />
                    <stop offset="45%" stopColor="#E879F9" />
                    <stop offset="100%" stopColor="#7E22CE" />
                  </linearGradient>
                  <linearGradient id="legoOpenBotGloss" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Left & Right LEGO top studs */}
                <rect x="9.5" y="3.5" width="9.5" height="6.5" rx="2.5" fill="url(#legoOpenBotStud)" />
                <rect x="10.8" y="4.3" width="6.9" height="1.8" rx="0.9" fill="#FFFFFF" fillOpacity="0.55" />
                <rect x="25" y="3.5" width="9.5" height="6.5" rx="2.5" fill="url(#legoOpenBotStud)" />
                <rect x="26.3" y="4.3" width="6.9" height="1.8" rx="0.9" fill="#FFFFFF" fillOpacity="0.55" />

                {/* Main glossy LEGO brick OpenBot head */}
                <rect x="4" y="8.5" width="36" height="31.5" rx="9.5" fill="url(#legoOpenBotBody)" />
                {/* Bottom 3D LEGO bevel shadow */}
                <path
                  d="M4 31.5 C4 36.8 8.2 40 13.5 40 L30.5 40 C35.8 40 40 36.8 40 31.5 L40 34 C40 37.9 36.8 40 32.5 40 L11.5 40 C7.2 40 4 37.9 4 34 Z"
                  fill="#1E1B4B"
                  fillOpacity="0.35"
                />
                {/* Top specular plastic gloss */}
                <rect x="7" y="10.2" width="30" height="7" rx="3.5" fill="url(#legoOpenBotGloss)" />

                {/* Iconic OpenBot twin vertical pill eyes */}
                <rect x="14.2" y="18.2" width="5.4" height="11" rx="2.7" fill="#1E1B4B" fillOpacity="0.22" transform="translate(0, 1.2)" />
                <rect x="24.4" y="18.2" width="5.4" height="11" rx="2.7" fill="#1E1B4B" fillOpacity="0.22" transform="translate(0, 1.2)" />
                <rect x="14.2" y="18" width="5.4" height="11" rx="2.7" fill="#FFFFFF" />
                <rect x="24.4" y="18" width="5.4" height="11" rx="2.7" fill="#FFFFFF" />
                {/* Cute glossy eye highlights */}
                <circle cx="16.2" cy="21" r="1.1" fill="#F9A8D4" fillOpacity="0.65" />
                <circle cx="26.4" cy="21" r="1.1" fill="#F9A8D4" fillOpacity="0.65" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 rounded-md border border-white bg-[#D92B2B] px-1 py-[1px] text-[9px] font-extrabold leading-none tracking-wider text-white shadow-sm">
                3D
              </span>
            </div>

            <div className="min-w-0">
              <h1
                className={[
                  "font-['Lilita_One',_'Fredoka',_sans-serif] text-base sm:text-xl md:text-2xl leading-none tracking-wide",
                  isNight ? 'text-amber-200' : 'text-slate-900',
                ].join(' ')}
              >
                LEGO OpenBot Agent
              </h1>
              <p
                className={[
                  "mt-0.5 truncate font-['Fredoka',_sans-serif] text-[10px] sm:text-xs font-semibold",
                  isNight ? 'text-sky-200/85' : 'text-slate-600',
                ].join(' ')}
              >
                Markas 3D Interaktif OpenBot
              </p>
            </div>
          </div>

          {openBotStatusPill && <div className="pointer-events-auto">{openBotStatusPill}</div>}
        </div>

        {/* Top-Right Controls */}
        <div
          aria-label="Kontrol tampilan"
          className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
        >
          {/* Segmented Floor Selector */}
          <div
            role="group"
            aria-label="Mode tampilan lantai"
            className={[
              'relative inline-flex items-center gap-1 rounded-xl border-2 p-1 backdrop-blur-xl transition-colors duration-300',
              glassSurface,
            ].join(' ')}
          >
            <span
              className={[
                'hidden xl:inline-flex items-center gap-1 pl-1.5 pr-0.5 text-[11px] font-bold uppercase tracking-wider',
                isNight ? 'text-sky-300/80' : 'text-slate-500',
              ].join(' ')}
            >
              <Layers className="h-3.5 w-3.5" />
              Lantai
            </span>
            {(
              [
                { id: 'all', label: 'Semua', color: '#1E70C1' },
                { id: 'floor2', label: 'Lantai 2', color: '#F07DA8' },
                { id: 'floor1', label: 'Lantai 1', color: '#2E9E47' },
              ] as const
            ).map((opt) => {
              const active = floorViewMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeFloorViewMode(opt.id)}
                  aria-pressed={active}
                  className={[
                    'relative cursor-pointer rounded-lg px-2 py-1 sm:px-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200',
                    active
                      ? 'text-white shadow-sm -translate-y-[1px]'
                      : isNight
                        ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900',
                  ].join(' ')}
                  style={
                    active
                      ? {
                          backgroundColor: opt.color,
                          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -2.5px 0 ${adjustHexBrightness(opt.color, 0.72)}`,
                        }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Mode Bangun Toggle */}
          {onToggleBuildMode && (
            <button
              type="button"
              onClick={onToggleBuildMode}
              aria-pressed={buildMode}
              title="Aktifkan/Matikan Mode Bangun"
              className={[
                'relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:translate-y-[1.5px] active:border-b backdrop-blur-md',
                buildMode
                  ? 'border-orange-700 bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.42)] hover:bg-orange-400'
                  : isNight
                    ? 'border-slate-950 bg-slate-800/88 text-amber-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white/88 text-slate-800 hover:bg-white',
              ].join(' ')}
            >
              <Hammer className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Mode Bangun</span>
            </button>
          )}

          {/* Siang / Malam */}
          <button
            type="button"
            onClick={onToggleNight}
            aria-pressed={isNight}
            title={isNight ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
            className={[
              'relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:translate-y-[1.5px] active:border-b backdrop-blur-md',
              isNight
                ? 'border-indigo-950 bg-indigo-600/95 text-amber-200 hover:bg-indigo-500'
                : 'border-amber-600 bg-amber-400/95 text-slate-900 hover:bg-amber-300',
            ].join(' ')}
          >
            {isNight ? <Moon className="h-4 w-4 shrink-0 text-amber-200" /> : <Sun className="h-4 w-4 shrink-0 text-amber-900" />}
            <span className="hidden sm:inline">{isNight ? 'Malam' : 'Siang'}</span>
          </button>

          {/* Auto-Rotate */}
          <button
            type="button"
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            title={autoRotate ? 'Matikan Auto-Rotate' : 'Aktifkan Auto-Rotate'}
            className={[
              'relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:translate-y-[1.5px] active:border-b backdrop-blur-md',
              autoRotate
                ? 'border-emerald-700 bg-emerald-500/95 text-white hover:bg-emerald-400'
                : isNight
                  ? 'border-slate-950 bg-slate-800/85 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 bg-white/85 text-slate-700 hover:bg-white',
            ].join(' ')}
          >
            <RotateCw
              className="h-4 w-4 shrink-0"
              style={autoRotate ? { animation: 'legoSpinSlow 5.5s linear infinite' } : undefined}
            />
            <span className="hidden xl:inline">Auto-Rotate</span>
          </button>

          {/* Karakter Toggle */}
          <button
            type="button"
            onClick={onToggleCharacters}
            aria-pressed={showCharacters}
            title={showCharacters ? 'Sembunyikan Karakter' : 'Tampilkan Karakter'}
            className={[
              'relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:translate-y-[1.5px] active:border-b backdrop-blur-md',
              showCharacters
                ? 'border-pink-700 bg-[#F07DA8] text-white hover:bg-[#f48cb3]'
                : isNight
                  ? 'border-slate-950 bg-slate-800/85 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 bg-white/85 text-slate-700 hover:bg-white',
            ].join(' ')}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline">Karakter</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={onResetView}
            title="Reset kamera ke sudut isometrik default"
            className={[
              'relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] px-2.5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:translate-y-[1.5px] active:border-b backdrop-blur-md',
              isNight
                ? 'border-slate-950 bg-slate-800/88 text-sky-200 hover:bg-slate-700'
                : 'border-slate-300 bg-white/88 text-slate-700 hover:bg-white',
            ].join(' ')}
          >
            <Home className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </header>

      {/* LEFT RAIL: Unified vertical stack (Character Panel capped at 5 visible + scroll, Minimap safely anchored below with ZERO overlap!) */}
      {!buildMode && (
        <div className="pointer-events-none fixed left-3 sm:left-5 top-[120px] sm:top-[130px] bottom-[84px] z-20 flex flex-col items-start justify-between gap-3">
          {/* CHARACTER DOCK (shows up to 5 rows, scrolls smoothly for 6+) */}
          <nav
            aria-label="Daftar karakter LEGO"
            className="pointer-events-none flex min-h-0 flex-initial flex-col"
          >
            <div
              className={[
                'pointer-events-auto flex min-h-0 flex-col gap-1.5 rounded-2xl border-2 p-1.5 sm:p-2 backdrop-blur-xl transition-colors duration-300',
                glassSurface,
              ].join(' ')}
            >
              <div className="hidden sm:flex shrink-0 items-center justify-between px-1.5 pt-0.5">
                <span
                  className={[
                    'text-[10px] font-bold uppercase tracking-wider',
                    isNight ? 'text-sky-300/80' : 'text-slate-500',
                  ].join(' ')}
                >
                  Karakter ({characters.length})
                </span>
                {characters.length > 5 && (
                  <span
                    className={[
                      'text-[9px] font-semibold',
                      isNight ? 'text-sky-300/60' : 'text-slate-400',
                    ].join(' ')}
                  >
                    Scroll ↓
                  </span>
                )}
              </div>

              <div className="lego-thin-scroll flex max-h-[244px] min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
                {characters.length === 0 ? (
                  <div
                    className={[
                      'max-w-[168px] rounded-xl px-2 py-2.5 text-center text-[10.5px] leading-snug',
                      isNight ? 'bg-slate-800/70 text-slate-300' : 'bg-slate-100/80 text-slate-500',
                    ].join(' ')}
                  >
                    <p className="font-bold">Belum ada agent</p>
                    <p className="mt-0.5 opacity-85">
                      Buat agent di OpenBot Desktop agar otomatis muncul.
                    </p>
                  </div>
                ) : (
                  characters.map((char) => {
                    const isSelected = selectedCharacter?.id === char.id;
                    const linked = getLinkedAgent?.(char.id) ?? null;
                    const displayName = linked?.name ?? char.name;
                    const displayRole = linked?.title ?? char.role;
                    const shortName =
                      displayName.length > 14 ? displayName.split(' ')[0] : displayName;

                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => onSelectCharacterFromUI(char)}
                        aria-pressed={isSelected}
                        title={`${displayName} — ${displayRole}`}
                        className={[
                          'group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl p-1 sm:pr-2.5 text-left transition-all duration-200',
                          isSelected
                            ? isNight
                              ? 'bg-amber-400/20 ring-2 ring-amber-300 shadow-md'
                              : 'bg-amber-100/95 ring-2 ring-amber-400 shadow-md'
                            : isNight
                              ? 'hover:bg-slate-800/85'
                              : 'hover:bg-slate-100/90',
                          !showCharacters && !isSelected ? 'opacity-65 hover:opacity-100' : '',
                        ].join(' ')}
                      >
                        <div className="relative">
                          <MinifigAvatar
                            character={char}
                            size={36}
                            className="transition-transform duration-200 group-hover:scale-105"
                          />
                          {linked && (
                            <span
                              aria-label={linked.status}
                              className={[
                                'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm',
                                linked.status === 'working'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-amber-400',
                              ].join(' ')}
                            />
                          )}
                        </div>

                        <div className="hidden md:flex min-w-0 flex-col leading-tight">
                          <div className="flex items-center gap-1">
                            <span
                              className={[
                                'max-w-[96px] truncate text-xs font-bold',
                                isNight ? 'text-slate-100' : 'text-slate-800',
                              ].join(' ')}
                            >
                              {shortName}
                            </span>
                            {linked && (
                              <span
                                className={[
                                  'rounded-full px-1.5 py-[1px] text-[8px] font-extrabold uppercase',
                                  linked.status === 'working'
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : 'bg-amber-200/80 text-amber-800',
                                ].join(' ')}
                              >
                                {linked.status === 'working' ? 'Working' : 'Idle'}
                              </span>
                            )}
                          </div>
                          <span
                            className={[
                              'max-w-[116px] truncate text-[10px] font-medium',
                              isNight ? 'text-sky-200/75' : 'text-slate-500',
                            ].join(' ')}
                          >
                            {displayRole}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* + Karakter Baru Button (always pinned & clear of minimap) */}
              <button
                type="button"
                onClick={onCreateCharacter}
                disabled={characters.length >= MAX_CHARACTERS}
                title={
                  characters.length >= MAX_CHARACTERS
                    ? `Maksimal ${MAX_CHARACTERS} karakter`
                    : 'Buat karakter minifigure LEGO baru'
                }
                className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl border-b-2 border-amber-600 bg-amber-400 px-2 py-1.5 text-[11px] font-extrabold text-slate-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">Karakter Baru</span>
              </button>
            </div>
          </nav>

          {/* MINIMAP (Bottom-Left inside same vertical column — zero collision!) */}
          <div className="pointer-events-none shrink-0 hidden sm:block">
            <Minimap
              isNight={isNight}
              characters={characters.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.avatarBg,
              }))}
            />
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS (Top-Center, clear of header cards) */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed top-[104px] lg:top-[76px] inset-x-0 z-40 flex flex-col items-center gap-1.5 px-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[
                'pointer-events-auto rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-xl',
                t.tone === 'working'
                  ? 'border-emerald-400 bg-emerald-600/95 text-white'
                  : t.tone === 'warn'
                    ? 'border-amber-400 bg-amber-500/95 text-slate-950'
                    : isNight
                      ? 'border-indigo-400/40 bg-slate-900/92 text-sky-100'
                      : 'border-white/90 bg-white/95 text-slate-800',
              ].join(' ')}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* FOLLOW MODE BANNER */}
      {followedName && (
        <div className="pointer-events-none fixed top-[116px] inset-x-0 z-30 flex justify-center px-3">
          <div
            className={[
              'pointer-events-auto inline-flex items-center gap-2.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold backdrop-blur-xl shadow-lg',
              isNight
                ? 'border-sky-400/40 bg-slate-900/90 text-sky-100'
                : 'border-sky-300 bg-white/95 text-slate-800',
            ].join(' ')}
          >
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Mengikuti {followedName}</span>
            <button
              type="button"
              onClick={onStopFollow}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-rose-400"
            >
              <EyeOff className="h-3 w-3" />
              Lepas
            </button>
          </div>
        </div>
      )}

      {/* CHARACTER CARD (Bottom-Right) */}
      {!buildMode && selectedCharacter && (
        <div className="pointer-events-none fixed bottom-[86px] sm:bottom-24 left-3 right-3 sm:left-auto sm:right-5 z-30 flex justify-center sm:justify-end">
          <CharacterCard
            character={selectedCharacter}
            isNight={isNight}
            isFollowing={followCharacterId === selectedCharacter.id}
            liveRoomId={liveRoomId}
            linkedAgent={getLinkedAgent?.(selectedCharacter.id) ?? null}
            onFocusCamera={onFocusCharacter}
            onToggleFollow={onToggleFollowCharacter}
            onEditOutfit={onEditOutfit}
            onConnectAgent={onConnectAgent}
            onDisconnectAgent={onDisconnectAgent}
            onClose={onCloseCharacterCard}
          />
        </div>
      )}

      {/* BOTTOM REGION: Control Hint + LEGO Brick Camera Preset Bar */}
      <footer className="flex w-full flex-col items-center gap-2">
        <div
          aria-hidden={hasInteracted}
          className={[
            'pointer-events-none flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-center text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all duration-500 ease-out',
            isNight
              ? 'border-indigo-400/30 bg-slate-900/75 text-sky-100 shadow-lg'
              : 'border-white/85 bg-white/85 text-slate-700 shadow-md',
            hasInteracted || selectedCharacter || buildMode
              ? 'opacity-0 translate-y-2 scale-95'
              : 'opacity-100 translate-y-0 scale-100',
          ].join(' ')}
        >
          <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Drag kiri: putar • Drag kanan / Shift+drag / WASD: geser • Q/E: rotasi • Double-click: fokus
          </span>
        </div>

        <nav
          aria-label="Preset kamera ruangan"
          className={[
            'pointer-events-auto max-w-full rounded-2xl border-2 backdrop-blur-xl transition-colors duration-300',
            glassSurface,
          ].join(' ')}
        >
          <div className="lego-preset-scroll flex items-end gap-1.5 sm:gap-2 overflow-x-auto px-2 pb-2 pt-2.5 sm:px-3 sm:pb-2 sm:pt-3">
            {CAMERA_PRESETS.map((preset: CameraPreset) => {
              const isActive = activePreset === preset.id;
              const brickColor = preset.color || '#1E70C1';
              const shadowShade = adjustHexBrightness(brickColor, 0.72);
              const highlightShade = adjustHexBrightness(brickColor, 1.32);
              const lightBg = isLightColor(brickColor);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  aria-pressed={isActive}
                  className={[
                    'group relative shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 sm:px-3 text-[11px] sm:text-xs font-bold tracking-wide transition-all duration-200',
                    lightBg ? 'text-slate-900' : 'text-white',
                    isActive
                      ? '-translate-y-1 ring-2 ring-white shadow-[0_8px_18px_rgba(15,23,42,0.32)]'
                      : 'opacity-90 hover:-translate-y-0.5 hover:opacity-100 hover:brightness-105 active:translate-y-0.5',
                  ].join(' ')}
                  style={{
                    backgroundColor: brickColor,
                    boxShadow: isActive
                      ? `inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -4px 0 ${shadowShade}, 0 0 0 3px rgba(246,201,21,0.85), 0 8px 18px rgba(15,23,42,0.32)`
                      : `inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -4px 0 ${shadowShade}, 0 3px 8px rgba(15,23,42,0.18)`,
                    textShadow: lightBg ? 'none' : '0 1px 2px rgba(0,0,0,0.28)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-[6px] inset-x-2 flex items-center justify-around gap-1"
                  >
                    {[0, 1, 2].map((stud) => (
                      <span
                        key={stud}
                        className="block h-[6px] w-3 rounded-t-full"
                        style={{
                          backgroundColor: brickColor,
                          boxShadow: `inset 0 1.5px 0 ${highlightShade}, inset -1px 0 0 ${shadowShade}, 0 -0.5px 0 rgba(0,0,0,0.1)`,
                        }}
                      />
                    ))}
                  </span>

                  <span className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap">
                    {preset.floor !== 'all' && (
                      <span
                        className={[
                          'rounded px-1 py-[1px] text-[9px] font-extrabold leading-none',
                          lightBg ? 'bg-slate-900/15 text-slate-900' : 'bg-black/25 text-white',
                        ].join(' ')}
                      >
                        L{preset.floor}
                      </span>
                    )}
                    <span>{preset.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </footer>
    </div>
  );
};
