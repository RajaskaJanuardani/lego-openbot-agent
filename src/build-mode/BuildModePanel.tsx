import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Paintbrush,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Sofa as SofaIcon,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import {
  ASSET_CATEGORIES,
  ASSETS_BY_ID,
  ASSETS_REGISTRY,
  type AssetCategory,
} from '../assets-registry';
import { LEGO_PALETTE_24 } from '../lib/colors';
import type { FloorPattern } from '../lib/schema';
import { useCharacterStore } from '../store/characterStore';
import { useLayoutStore } from '../store/layoutStore';
import { useUIStore } from '../store/uiStore';
import type { RoomId } from '../types';

type BuildTab = 'catalog' | 'paint' | 'save';

const WALL_GROUPS: Array<{
  label: string;
  wallIds: string[];
}> = [
  {
    label: 'Dinding Luar Lantai 2',
    wallIds: [
      'outer-f2',
      'f2-kitchen-north-ext',
      'f2-kitchen-west-ext',
      'f2-kitchen-south-ext',
      'f2-bedroom-north-ext',
      'f2-dressing-north-ext',
      'f2-dressing-east-ext',
      'f2-dressing-south-ext',
      'f2-living-east-ext',
      'f2-stair-west-ext',
    ],
  },
  { label: 'Dinding Luar Lantai 1', wallIds: ['outer-f1'] },
  {
    label: 'L2 · Dapur',
    wallIds: ['f2-kitchen-north-int', 'f2-kitchen-west-int', 'f2-kitchen-south-int', 'f2-kitchen-east-int'],
  },
  {
    label: 'L2 · Kamar Tidur',
    wallIds: ['f2-bedroom-north-int', 'f2-bedroom-west-int', 'f2-bedroom-east-int', 'f2-bedroom-south-int'],
  },
  {
    label: 'L2 · Ruang Rias',
    wallIds: ['f2-dressing-north-int', 'f2-dressing-east-int', 'f2-dressing-south-int', 'f2-dressing-west-int'],
  },
  {
    label: 'L2 · Ruang Tangga',
    wallIds: ['f2-stair-north-int', 'f2-stair-west-int', 'f2-stair-east-int', 'f2-stair-south-int'],
  },
  {
    label: 'L2 · Ruang Keluarga & Makan',
    wallIds: ['f2-living-north-int', 'f2-living-west-int', 'f2-living-east-int', 'f2-dining-south-int'],
  },
  {
    label: 'L1 · Ruang Kerja (Studio)',
    wallIds: ['f1-studio-west', 'f1-studio-south'],
  },
  {
    label: 'L1 · Foyer & Lorong',
    wallIds: ['f1-foyer-north', 'f1-hall-north', 'f1-stair1-west'],
  },
  {
    label: 'L1 · Kamar Tamu & Laundry',
    wallIds: ['f1-guest-east', 'f1-guest-south', 'f1-laundry-north', 'f1-laundry-east'],
  },
  {
    label: 'L1 · Kamar Mandi',
    wallIds: ['f1-bath-west', 'f1-bath-south', 'f1-bath-east'],
  },
];

const FLOOR_ROOMS: Array<{ id: RoomId; label: string }> = [
  { id: 'living-room', label: 'L2 · Kayu Interior' },
  { id: 'stair-room', label: 'L2 · Ruang Tangga' },
  { id: 'foyer', label: 'L1 · Foyer & Lorong' },
  { id: 'studio', label: 'L1 · Ruang Kerja' },
  { id: 'guest-room', label: 'L1 · Kamar Tamu' },
  { id: 'bathroom-1', label: 'L1 · Kamar Mandi' },
];

export const BuildModePanel: React.FC = () => {
  const buildMode = useUIStore((s) => s.buildMode);
  const isNight = useUIStore((s) => s.isNight);
  const setBuildMode = useUIStore((s) => s.setBuildMode);
  const setFloorViewMode = useUIStore((s) => s.setFloorViewMode);
  const pushToast = useUIStore((s) => s.pushToast);

  const activeEditFloor = useLayoutStore((s) => s.activeEditFloor);
  const setActiveEditFloor = useLayoutStore((s) => s.setActiveEditFloor);
  const placingAssetId = useLayoutStore((s) => s.placingAssetId);
  const setPlacingAssetId = useLayoutStore((s) => s.setPlacingAssetId);
  const rotatePlacing = useLayoutStore((s) => s.rotatePlacing);
  const selectedObjectId = useLayoutStore((s) => s.selectedObjectId);
  const placedObjects = useLayoutStore((s) => s.placedObjects);
  const updatePlacedObject = useLayoutStore((s) => s.updatePlacedObject);
  const trimColors = useLayoutStore((s) => s.trimColors);
  const setTrimColor = useLayoutStore((s) => s.setTrimColor);
  const applyRoomWallColors = useLayoutStore((s) => s.applyRoomWallColors);
  const floorSettings = useLayoutStore((s) => s.floorSettings);
  const setFloorSetting = useLayoutStore((s) => s.setFloorSetting);
  const pastCount = useLayoutStore((s) => s.past.length);
  const futureCount = useLayoutStore((s) => s.future.length);
  const undo = useLayoutStore((s) => s.undo);
  const redo = useLayoutStore((s) => s.redo);
  const resetToDefault = useLayoutStore((s) => s.resetToDefault);
  const exportJson = useLayoutStore((s) => s.exportJson);
  const importJson = useLayoutStore((s) => s.importJson);

  const characters = useCharacterStore((s) => s.characters);
  const importCharacters = useCharacterStore((s) => s.importCharacters);

  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<BuildTab>('catalog');
  const [category, setCategory] = useState<AssetCategory>('furniture');
  const [selectedWallGroupIdx, setSelectedWallGroupIdx] = useState(0);
  const [selectedFloorRoom, setSelectedFloorRoom] = useState<RoomId>('living-room');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!buildMode) return null;

  const selectedObj = placedObjects.find((o) => o.id === selectedObjectId) ?? null;
  const selectedObjDef = selectedObj ? ASSETS_BY_ID.get(selectedObj.assetId) ?? null : null;

  const handleSelectEditFloor = (f: 0 | 1 | 2) => {
    setActiveEditFloor(f);
    if (f === 1) setFloorViewMode('floor1');
    else if (f === 2) setFloorViewMode('floor2');
    else setFloorViewMode('all');
  };

  const handleExportDownload = () => {
    const json = exportJson(characters);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lego-tropical-house-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Layout & karakter diexport ke JSON!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const res = importJson(text);
      if (!res.ok) {
        setImportError(res.error ?? 'Gagal membaca JSON');
        pushToast('Validasi JSON gagal!', 'warn');
      } else {
        setImportError(null);
        if (res.characters && Array.isArray(res.characters) && res.characters.length > 0) {
          importCharacters(res.characters as typeof characters);
        }
        pushToast('Layout berhasil diimport!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 top-20 z-30 inline-flex cursor-pointer items-center gap-1 rounded-l-2xl border-2 border-r-0 border-orange-400 bg-orange-500 px-3 py-2.5 text-xs font-extrabold text-white shadow-xl hover:bg-orange-400"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Editor</span>
      </button>
    );
  }

  const surface = isNight
    ? 'border-indigo-400/35 bg-slate-900/92 text-slate-100'
    : 'border-white/90 bg-white/94 text-slate-800';

  const currentFloorSetting = floorSettings[selectedFloorRoom] ?? {
    color: '#7B4B2A',
    pattern: 'solid' as FloorPattern,
  };

  return (
    <aside
      aria-label="Panel Mode Bangun"
      className={[
        'fixed right-3 top-[104px] lg:top-[82px] bottom-[92px] z-30 flex w-[300px] sm:w-[325px] flex-col overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-xl',
        surface,
      ].join(' ')}
    >
      {/* Header + Undo/Redo + Collapse/Close */}
      <div className="flex items-center justify-between border-b border-slate-400/20 bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2.5 text-white">
        <div className="flex items-center gap-1.5">
          <span className="font-['Lilita_One',_'Fredoka',_sans-serif] text-base tracking-wide">
            Mode Bangun
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={pastCount === 0}
            title="Undo (Ctrl+Z)"
            className="cursor-pointer rounded-lg bg-white/20 p-1.5 hover:bg-white/30 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={futureCount === 0}
            title="Redo (Ctrl+Shift+Z)"
            className="cursor-pointer rounded-lg bg-white/20 p-1.5 hover:bg-white/30 disabled:opacity-40"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Ciutkan panel"
            className="cursor-pointer rounded-lg bg-white/20 p-1.5 hover:bg-white/30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setBuildMode(false)}
            title="Keluar Mode Bangun"
            className="cursor-pointer rounded-lg bg-black/25 p-1.5 hover:bg-black/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Active Edit Floor Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-400/20 px-2.5 py-2 text-[11px] font-bold">
        <span className="mr-1 opacity-70">Edit:</span>
        {(
          [
            { f: 2, label: 'Lantai 2' },
            { f: 1, label: 'Lantai 1' },
            { f: 0, label: 'Halaman' },
          ] as const
        ).map((item) => (
          <button
            key={item.f}
            type="button"
            onClick={() => handleSelectEditFloor(item.f)}
            className={[
              'flex-1 cursor-pointer rounded-lg px-2 py-1 transition-all',
              activeEditFloor === item.f
                ? 'bg-orange-500 text-white shadow-sm'
                : isNight
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main 3 Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-slate-400/20 p-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={[
            'inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl py-1.5',
            tab === 'catalog'
              ? 'bg-sky-600 text-white'
              : isNight
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700',
          ].join(' ')}
        >
          <SofaIcon className="h-3.5 w-3.5" />
          Katalog
        </button>
        <button
          type="button"
          onClick={() => setTab('paint')}
          className={[
            'inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl py-1.5',
            tab === 'paint'
              ? 'bg-sky-600 text-white'
              : isNight
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700',
          ].join(' ')}
        >
          <Paintbrush className="h-3.5 w-3.5" />
          Warna
        </button>
        <button
          type="button"
          onClick={() => setTab('save')}
          className={[
            'inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl py-1.5',
            tab === 'save'
              ? 'bg-sky-600 text-white'
              : isNight
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700',
          ].join(' ')}
        >
          <Save className="h-3.5 w-3.5" />
          Simpan
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tab === 'catalog' && (
          <>
            {/* Placement Active Banner */}
            {placingAssetId && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-2 text-[11px] font-bold">
                <span>
                  Menempatkan: <strong>{ASSETS_BY_ID.get(placingAssetId)?.name}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={rotatePlacing}
                    title="Putar 90° (R)"
                    className="cursor-pointer rounded bg-emerald-600 px-1.5 py-1 text-white"
                  >
                    <RotateCw className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacingAssetId(null)}
                    className="cursor-pointer rounded bg-slate-600 px-1.5 py-1 text-white"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Selected Object Recolor Inspector */}
            {selectedObj && selectedObjDef && (
              <div className="space-y-2 rounded-xl border border-amber-400/60 bg-amber-400/10 p-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Terpilih: {selectedObjDef.name}</span>
                  <span className="text-[10px] opacity-75">R: putar • Del: hapus</span>
                </div>
                {selectedObjDef.colorable && (
                  <>
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase opacity-75">Warna Utama</div>
                      <div className="flex flex-wrap gap-1">
                        {LEGO_PALETTE_24.slice(0, 12).map((sw) => (
                          <button
                            key={sw.hex}
                            type="button"
                            title={sw.name}
                            onClick={() => updatePlacedObject(selectedObj.id, { color: sw.hex })}
                            className="h-5 w-5 cursor-pointer rounded border border-black/20 hover:scale-110"
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase opacity-75">Warna Aksen</div>
                      <div className="flex flex-wrap gap-1">
                        {LEGO_PALETTE_24.slice(12).map((sw) => (
                          <button
                            key={sw.hex}
                            type="button"
                            title={sw.name}
                            onClick={() =>
                              updatePlacedObject(selectedObj.id, { accentColor: sw.hex })
                            }
                            className="h-5 w-5 cursor-pointer rounded border border-black/20 hover:scale-110"
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 7 Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {ASSET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={[
                    'cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold',
                    category === cat.id
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : isNight
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Cards */}
            <div className="grid grid-cols-2 gap-2">
              {ASSETS_REGISTRY.filter((a) => a.category === category).map((asset) => {
                const isPlacing = placingAssetId === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      if (asset.category === 'outdoor') handleSelectEditFloor(0);
                      setPlacingAssetId(isPlacing ? null : asset.id);
                    }}
                    className={[
                      'flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 p-2 text-left transition-all hover:scale-[1.02]',
                      isPlacing
                        ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-400/40'
                        : isNight
                          ? 'border-slate-700 bg-slate-800/80 hover:border-amber-400'
                          : 'border-slate-200 bg-white hover:border-amber-400',
                    ].join(' ')}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg shadow-inner"
                        style={{ backgroundColor: `${asset.defaultColor}33` }}
                      >
                        {asset.icon}
                      </span>
                      <span className="rounded bg-slate-500/15 px-1.5 py-0.5 text-[9px] font-bold">
                        {asset.footprint[0]}×{asset.footprint[1]}
                      </span>
                    </div>
                    <span className="truncate text-xs font-bold">{asset.name}</span>
                    <span className="text-[10px] opacity-65">
                      {asset.mountType === 'wall' ? 'Tempel dinding' : 'Snap lantai'}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === 'paint' && (
          <div className="space-y-4">
            {/* Wall Color Selector */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                Warna Dinding (Palet 24 Bata LEGO)
              </div>
              <select
                value={selectedWallGroupIdx}
                onChange={(e) => setSelectedWallGroupIdx(Number(e.target.value))}
                className={[
                  'w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold',
                  isNight
                    ? 'border-slate-700 bg-slate-800 text-slate-100'
                    : 'border-slate-300 bg-white text-slate-800',
                ].join(' ')}
              >
                {WALL_GROUPS.map((g, i) => (
                  <option key={g.label} value={i}>
                    {g.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-6 gap-1.5">
                {LEGO_PALETTE_24.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    onClick={() => {
                      applyRoomWallColors(WALL_GROUPS[selectedWallGroupIdx].wallIds, sw.hex);
                      pushToast(`Warna ${WALL_GROUPS[selectedWallGroupIdx].label} diubah ke ${sw.name}!`);
                    }}
                    className="relative h-7 cursor-pointer rounded-md border border-black/20 shadow-sm transition-transform hover:scale-110"
                    style={{
                      backgroundColor: sw.hex,
                      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.22)',
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const outerF2 = WALL_GROUPS[0].wallIds;
                    const chosen = useLayoutStore.getState().wallColors['outer-f2'] ?? '#F07DA8';
                    applyRoomWallColors([...outerF2, 'outer-f1'], chosen);
                    pushToast('Diterapkan ke seluruh dinding luar!');
                  }}
                  className="flex-1 cursor-pointer rounded-lg border border-sky-400/50 bg-sky-500/15 px-2 py-1 text-[10px] font-bold hover:bg-sky-500/25"
                >
                  Terapkan ke Dinding Luar
                </button>
              </div>
            </div>

            {/* Top Wall Trim Colors (Left Blue / Right Magenta) */}
            <div className="space-y-2 border-t border-slate-400/20 pt-3">
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                List Atas Dinding (Sayap Kiri & Kanan)
              </div>
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>List Kiri</span>
                <div className="flex gap-1">
                  {['#1B3E7A', '#C21878', '#2E9E47', '#F6C915', '#D92B2B', '#202226'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setTrimColor('left', hex)}
                      className={[
                        'h-5 w-5 cursor-pointer rounded border-2',
                        trimColors.left === hex ? 'border-amber-400 scale-110' : 'border-black/20',
                      ].join(' ')}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>List Kanan</span>
                <div className="flex gap-1">
                  {['#C21878', '#1B3E7A', '#F07818', '#2DB5A8', '#7E4BB8', '#F7F7F5'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setTrimColor('right', hex)}
                      className={[
                        'h-5 w-5 cursor-pointer rounded border-2',
                        trimColors.right === hex ? 'border-amber-400 scale-110' : 'border-black/20',
                      ].join(' ')}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Room Floor Color & Pattern */}
            <div className="space-y-2 border-t border-slate-400/20 pt-3">
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                Warna & Pola Lantai
              </div>
              <select
                value={selectedFloorRoom}
                onChange={(e) => setSelectedFloorRoom(e.target.value as RoomId)}
                className={[
                  'w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold',
                  isNight
                    ? 'border-slate-700 bg-slate-800 text-slate-100'
                    : 'border-slate-300 bg-white text-slate-800',
                ].join(' ')}
              >
                {FLOOR_ROOMS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: 'solid', label: 'Polos' },
                    { id: 'checker', label: 'Kotak' },
                    { id: 'mosaic', label: 'Mosaik' },
                    { id: 'wood', label: 'Kayu' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFloorSetting(selectedFloorRoom, { pattern: p.id })}
                    className={[
                      'cursor-pointer rounded-lg py-1 text-[11px] font-bold',
                      currentFloorSetting.pattern === p.id
                        ? 'bg-amber-400 text-slate-900'
                        : isNight
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-700',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {LEGO_PALETTE_24.slice(0, 12).map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    onClick={() => setFloorSetting(selectedFloorRoom, { color: sw.hex })}
                    className="h-6 cursor-pointer rounded border border-black/20 hover:scale-110"
                    style={{ backgroundColor: sw.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'save' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs">
              <div className="font-bold text-emerald-500">Tersimpan Otomatis</div>
              <p className="mt-1 opacity-80">
                Semua perubahan dinding, lantai, {placedObjects.length} objek dekorasi, dan{' '}
                {characters.length} karakter otomatis disimpan di browser (localStorage).
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportDownload}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-b-[3px] border-sky-700 bg-sky-500 py-2.5 text-xs font-extrabold text-white hover:bg-sky-400"
            >
              <Download className="h-4 w-4" />
              Export Layout & Karakter (JSON)
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-b-[3px] border-indigo-700 bg-indigo-500 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-400"
            >
              <Upload className="h-4 w-4" />
              Import Layout JSON (Validasi Zod)
            </button>

            {importError && (
              <div className="rounded-xl border border-rose-400 bg-rose-500/15 p-2 text-[11px] font-semibold text-rose-400">
                Error skema: {importError}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                resetToDefault();
                pushToast('Layout dikembalikan ke default!');
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ke Default
            </button>
          </div>
        )}
      </div>

      {/* Footer shortcut legend */}
      <div className="border-t border-slate-400/20 px-3 py-1.5 text-center text-[10px] font-semibold opacity-70">
        Klik: tempatkan • R: putar • Ctrl+D: duplikat • Del: hapus • Ctrl+Z: undo
      </div>
    </aside>
  );
};
