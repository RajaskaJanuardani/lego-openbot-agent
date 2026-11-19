import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Copy, Dices, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { LEGO_PALETTE_24, MINIFIG_SKIN_TONES } from '../../lib/colors';
import {
  createBlankMinifig,
  DEFAULT_MINIFIGS,
  useCharacterStore,
} from '../../store/characterStore';
import { useUIStore } from '../../store/uiStore';
import { ModularMinifigure } from '../minifig/ModularMinifigure';
import type {
  BodyBuild,
  BodyHeight,
  BottomPattern,
  BottomStyle,
  EyebrowStyle,
  EyeStyle,
  FacialHairStyle,
  HairStyle,
  HeadShape,
  HeadwearStyle,
  MinifigConfig,
  MouthStyle,
  ShoeStyle,
  TorsoPattern,
  TorsoStyle,
} from '../minifig/types';
import { MAX_CHARACTERS } from '../minifig/types';
import type { PersonalityType, RoomId } from '../../types';

type CreatorTab =
  | 'body'
  | 'face'
  | 'hair'
  | 'torso'
  | 'bottom'
  | 'shoes'
  | 'accessories'
  | 'profile';

const TABS: Array<{ id: CreatorTab; label: string }> = [
  { id: 'body', label: 'Badan' },
  { id: 'face', label: 'Wajah' },
  { id: 'hair', label: 'Rambut' },
  { id: 'torso', label: 'Baju' },
  { id: 'bottom', label: 'Celana' },
  { id: 'shoes', label: 'Sepatu' },
  { id: 'accessories', label: 'Aksesoris' },
  { id: 'profile', label: 'Profil' },
];

const FAVORITE_ROOMS: Array<{ id: RoomId; label: string }> = [
  { id: 'kitchen', label: 'L2 · Dapur' },
  { id: 'living-room', label: 'L2 · Ruang Keluarga' },
  { id: 'bedroom', label: 'L2 · Kamar Tidur' },
  { id: 'dressing-room', label: 'L2 · Ruang Rias' },
  { id: 'terraces', label: 'L2 · Teras' },
  { id: 'foyer', label: 'L1 · Ruang Tamu' },
  { id: 'studio', label: 'L1 · Ruang Kerja' },
  { id: 'guest-room', label: 'L1 · Kamar Tamu' },
  { id: 'laundry', label: 'L1 · Laundry' },
  { id: 'outdoor-beach', label: 'Luar · Pantai' },
  { id: 'outdoor-tuktuk', label: 'Luar · Bajaj' },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ColorRow: React.FC<{
  label: string;
  value: string;
  onChange: (hex: string) => void;
  palette?: Array<{ name: string; hex: string }>;
  allowCustom?: boolean;
}> = ({ label, value, onChange, palette = LEGO_PALETTE_24, allowCustom = true }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      {allowCustom && (
        <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-sky-600">
          <span>Bebas</span>
          <input
            type="color"
            value={value.startsWith('#') ? value : '#F6C915'}
            onChange={(e) => onChange(e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-slate-300 bg-transparent p-0"
          />
        </label>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {palette.map((sw) => {
        const active = value.toLowerCase() === sw.hex.toLowerCase();
        return (
          <button
            key={sw.hex}
            type="button"
            title={sw.name}
            onClick={() => onChange(sw.hex)}
            className={[
              'h-6 w-6 cursor-pointer rounded-md border-2 transition-transform hover:scale-110',
              active ? 'border-amber-400 ring-2 ring-amber-300 scale-110' : 'border-black/15',
            ].join(' ')}
            style={{ backgroundColor: sw.hex }}
          />
        );
      })}
    </div>
  </div>
);

function OptionPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (val: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold text-slate-600">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={[
                'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition-all',
                active
                  ? 'border-amber-600 bg-amber-400 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CharacterCreator: React.FC = () => {
  const creatorOpen = useUIStore((s) => s.creatorOpen);
  const creatorEditingId = useUIStore((s) => s.creatorEditingId);
  const closeCreator = useUIStore((s) => s.closeCreator);
  const setSelectedCharacterId = useUIStore((s) => s.setSelectedCharacterId);
  const pushToast = useUIStore((s) => s.pushToast);

  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const duplicateCharacter = useCharacterStore((s) => s.duplicateCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);

  const [tab, setTab] = useState<CreatorTab>('body');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<MinifigConfig>(() => createBlankMinifig(characters.length + 1));

  useEffect(() => {
    if (!creatorOpen) return;
    setConfirmDelete(false);
    setTab('body');
    if (creatorEditingId) {
      const existing = characters.find((c) => c.id === creatorEditingId);
      if (existing) {
        setDraft(structuredClone(existing));
        return;
      }
    }
    setDraft(createBlankMinifig(characters.length + 1));
  }, [creatorOpen, creatorEditingId, characters]);

  if (!creatorOpen) return null;

  const isEditing = Boolean(creatorEditingId);

  const handleRandomize = () => {
    const torsoCol = pick(LEGO_PALETTE_24).hex;
    setDraft((prev) => ({
      ...prev,
      skinColor: pick(MINIFIG_SKIN_TONES).hex,
      headShape: pick<HeadShape>(['cylinder', 'round', 'chibi', 'small']),
      headScale: Number((0.9 + Math.random() * 0.25).toFixed(2)),
      face: {
        eyes: pick<EyeStyle>(['dot', 'oval', 'sleepy', 'wink', 'glasses']),
        eyebrows: pick<EyebrowStyle>(['normal', 'thick', 'angry', 'raised']),
        mouth: pick<MouthStyle>(['smile', 'laugh', 'neutral', 'surprised', 'tongue']),
        blush: Math.random() < 0.4,
        freckles: Math.random() < 0.25,
        facialHair: pick<FacialHairStyle>(['none', 'none', 'mustache', 'beard']),
      },
      hairStyle: pick<HairStyle>(['none', 'short', 'buzz', 'bangs', 'curly', 'long', 'ponytail', 'sanggul', 'hijab', 'mohawk']),
      hairColor: pick(['#202226', '#4E2E18', '#8D5524', '#F6C915', '#D92B2B', '#F07DA8', '#2DB5A8']),
      headwear: pick<HeadwearStyle>(['none', 'none', 'chef-hat', 'bucket-hat', 'baseball-cap', 'helmet', 'peci', 'crown', 'bandana']),
      headwearColor: pick(LEGO_PALETTE_24).hex,
      torsoStyle: pick<TorsoStyle>(['tshirt', 'shirt', 'hawaiian', 'hoodie', 'jacket', 'suit', 'kebaya', 'apron', 'school-uniform', 'jersey']),
      torsoColor: torsoCol,
      torsoSecondaryColor: pick(LEGO_PALETTE_24).hex,
      torsoPattern: pick<TorsoPattern>(['solid', 'stripes', 'floral', 'batik', 'logo']),
      armColor: torsoCol,
      shortSleeves: Math.random() < 0.45,
      handColor: Math.random() < 0.85 ? 'skin' : pick(LEGO_PALETTE_24).hex,
      bottomStyle: pick<BottomStyle>(['pants', 'shorts', 'skirt', 'batik', 'overalls']),
      bottomColor: pick(LEGO_PALETTE_24).hex,
      bottomPattern: pick<BottomPattern>(['solid', 'jeans', 'stripes', 'batik']),
      shoeStyle: pick<ShoeStyle>(['sneakers', 'sandals', 'boots', 'formal', 'barefoot']),
      shoeColor: pick(LEGO_PALETTE_24).hex,
      height: pick<BodyHeight>(['child', 'standard', 'standard', 'tall']),
      build: pick<BodyBuild>(['slim', 'standard', 'broad']),
      avatarBg: torsoCol,
      accessories: {
        headSlot: Math.random() < 0.25 ? 'headphones' : 'none',
        faceSlot: pick(['none', 'none', 'glasses', 'sunglasses']),
        neckSlot: pick(['none', 'none', 'camera', 'necklace', 'scarf']),
        leftHandSlot: pick(['none', 'none', 'coffee-cup', 'laptop', 'watch']),
        rightHandSlot: pick(['none', 'none', 'spatula', 'fan', 'coffee-cup']),
        backSlot: Math.random() < 0.35 ? 'backpack' : 'none',
      },
    }));
  };

  const handleReset = () => {
    if (creatorEditingId) {
      const def = DEFAULT_MINIFIGS.find((c) => c.id === creatorEditingId);
      const cur = characters.find((c) => c.id === creatorEditingId);
      if (def) setDraft(structuredClone(def));
      else if (cur) setDraft(structuredClone(cur));
    } else {
      setDraft(createBlankMinifig(characters.length + 1));
    }
  };

  const handleSave = () => {
    const cleanName = draft.name.trim() || 'Minifig LEGO';
    const finalDraft: MinifigConfig = { ...draft, name: cleanName };
    if (isEditing && creatorEditingId) {
      updateCharacter(creatorEditingId, finalDraft);
      pushToast(`Outfit ${cleanName} disimpan!`);
    } else {
      const ok = addCharacter(finalDraft);
      if (!ok) {
        pushToast(`Maksimal ${MAX_CHARACTERS} karakter tercapai!`, 'warn');
        return;
      }
      setSelectedCharacterId(finalDraft.id);
      pushToast(`${cleanName} tiba di pintu depan lantai 1!`);
    }
    closeCreator();
  };

  const handleDuplicate = () => {
    if (!creatorEditingId) return;
    const copy = duplicateCharacter(creatorEditingId);
    if (!copy) {
      pushToast(`Maksimal ${MAX_CHARACTERS} karakter tercapai!`, 'warn');
      return;
    }
    setSelectedCharacterId(copy.id);
    pushToast(`${copy.name} berhasil diduplikat!`);
    closeCreator();
  };

  const handleDelete = () => {
    if (!creatorEditingId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const ok = deleteCharacter(creatorEditingId);
    if (!ok) {
      pushToast('Minimal harus ada 1 karakter di rumah!', 'warn');
      return;
    }
    setSelectedCharacterId(null);
    pushToast(`${draft.name} dihapus dari rumah.`);
    closeCreator();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-2 border-white/80 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-4 py-3">
          <div>
            <h2 className="font-['Lilita_One',_'Fredoka',_sans-serif] text-xl text-slate-900">
              {isEditing ? `Edit Karakter: ${draft.name}` : 'Character Creator — Buat Minifigure Baru'}
            </h2>
            <p className="text-xs font-semibold text-slate-700">
              Drag preview 3D untuk memutar 360° • ({characters.length}/{MAX_CHARACTERS} karakter)
            </p>
          </div>
          <button
            type="button"
            onClick={closeCreator}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/85 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Split: Left 3D Turntable Preview | Right 8-Tab Customizer */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-12">
          {/* Left 3D Turntable */}
          <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-gradient-to-b from-sky-100 to-amber-50 md:col-span-5">
            <div className="h-56 sm:h-64 md:h-full md:min-h-[380px] w-full">
              <Canvas camera={{ position: [0, 0.7, 5.4], fov: 36 }} dpr={[1, 2]}>
                <ambientLight intensity={0.85} />
                <directionalLight position={[4, 6, 5]} intensity={1.35} />
                <directionalLight position={[-4, 3, -4]} intensity={0.5} color="#BAE6FD" />
                <Suspense fallback={null}>
                  <ModularMinifigure config={draft} mode="preview" />
                  {/* LEGO turntable baseplate disc */}
                  <mesh position={[0, -1.62, 0]} receiveShadow>
                    <cylinderGeometry args={[1.45, 1.55, 0.24, 24]} />
                    <meshStandardMaterial color="#E8D2A0" roughness={0.35} />
                  </mesh>
                </Suspense>
                <OrbitControls enablePan={false} minDistance={3.2} maxDistance={8.0} />
              </Canvas>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-slate-200/80 bg-white/85 px-3 py-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-2 border-purple-700 bg-purple-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-400"
              >
                <Dices className="h-3.5 w-3.5" />
                Acak
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Right Tabs + Controls */}
          <div className="flex min-h-0 flex-col md:col-span-7">
            {/* 8 Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={[
                    'cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                    tab === t.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/80',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Active Tab Panel */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {tab === 'body' && (
                <>
                  <ColorRow
                    label="Warna Kulit (Kuning LEGO + 6 Natural)"
                    value={draft.skinColor}
                    onChange={(skinColor) => setDraft((d) => ({ ...d, skinColor }))}
                    palette={MINIFIG_SKIN_TONES}
                  />
                  <OptionPills
                    label="Bentuk Kepala"
                    value={draft.headShape}
                    options={[
                      { id: 'cylinder', label: 'Silinder Klasik' },
                      { id: 'round', label: 'Bulat' },
                      { id: 'chibi', label: 'Chibi' },
                      { id: 'small', label: 'Kecil' },
                    ]}
                    onChange={(headShape) => setDraft((d) => ({ ...d, headShape }))}
                  />
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
                      <span>Ukuran Kepala</span>
                      <span>{draft.headScale.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.85}
                      max={1.2}
                      step={0.01}
                      value={draft.headScale}
                      onChange={(e) => setDraft((d) => ({ ...d, headScale: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <OptionPills
                    label="Tinggi Badan (Skala Kaki)"
                    value={draft.height}
                    options={[
                      { id: 'child', label: 'Anak (Pendek)' },
                      { id: 'standard', label: 'Standar' },
                      { id: 'tall', label: 'Tinggi' },
                    ]}
                    onChange={(height) => setDraft((d) => ({ ...d, height }))}
                  />
                  <OptionPills
                    label="Lebar Torso"
                    value={draft.build}
                    options={[
                      { id: 'slim', label: 'Ramping' },
                      { id: 'standard', label: 'Standar' },
                      { id: 'broad', label: 'Besar' },
                    ]}
                    onChange={(build) => setDraft((d) => ({ ...d, build }))}
                  />
                </>
              )}

              {tab === 'face' && (
                <>
                  <OptionPills
                    label="Bentuk Mata"
                    value={draft.face.eyes}
                    options={[
                      { id: 'dot', label: 'Titik Klasik' },
                      { id: 'oval', label: 'Oval' },
                      { id: 'sleepy', label: 'Mengantuk' },
                      { id: 'wink', label: 'Kedip' },
                      { id: 'glasses', label: 'Berkacamata' },
                    ]}
                    onChange={(eyes) => setDraft((d) => ({ ...d, face: { ...d.face, eyes } }))}
                  />
                  <OptionPills
                    label="Alis"
                    value={draft.face.eyebrows}
                    options={[
                      { id: 'normal', label: 'Normal' },
                      { id: 'thick', label: 'Tebal' },
                      { id: 'angry', label: 'Marah' },
                      { id: 'raised', label: 'Naik' },
                    ]}
                    onChange={(eyebrows) => setDraft((d) => ({ ...d, face: { ...d.face, eyebrows } }))}
                  />
                  <OptionPills
                    label="Mulut"
                    value={draft.face.mouth}
                    options={[
                      { id: 'smile', label: 'Senyum' },
                      { id: 'laugh', label: 'Tertawa' },
                      { id: 'neutral', label: 'Datar' },
                      { id: 'surprised', label: 'Kaget' },
                      { id: 'tongue', label: 'Melet' },
                    ]}
                    onChange={(mouth) => setDraft((d) => ({ ...d, face: { ...d.face, mouth } }))}
                  />
                  <OptionPills
                    label="Kumis / Jenggot"
                    value={draft.face.facialHair}
                    options={[
                      { id: 'none', label: 'Polos' },
                      { id: 'mustache', label: 'Kumis' },
                      { id: 'beard', label: 'Jenggot' },
                    ]}
                    onChange={(facialHair) =>
                      setDraft((d) => ({ ...d, face: { ...d.face, facialHair } }))
                    }
                  />
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={draft.face.blush}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, face: { ...d.face, blush: e.target.checked } }))
                        }
                      />
                      Pipi Merona
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={draft.face.freckles}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, face: { ...d.face, freckles: e.target.checked } }))
                        }
                      />
                      Bintik-bintik
                    </label>
                  </div>
                </>
              )}

              {tab === 'hair' && (
                <>
                  <OptionPills
                    label="Gaya Rambut (10 Gaya)"
                    value={draft.hairStyle}
                    options={[
                      { id: 'none', label: 'Botak' },
                      { id: 'short', label: 'Pendek' },
                      { id: 'buzz', label: 'Cepak' },
                      { id: 'bangs', label: 'Poni' },
                      { id: 'curly', label: 'Keriting/Afro' },
                      { id: 'long', label: 'Panjang Lurus' },
                      { id: 'ponytail', label: 'Kuncir Kuda' },
                      { id: 'sanggul', label: 'Sanggul' },
                      { id: 'hijab', label: 'Hijab' },
                      { id: 'mohawk', label: 'Mohawk' },
                    ]}
                    onChange={(hairStyle) => setDraft((d) => ({ ...d, hairStyle }))}
                  />
                  <ColorRow
                    label="Warna Rambut / Hijab"
                    value={draft.hairColor}
                    onChange={(hairColor) => setDraft((d) => ({ ...d, hairColor }))}
                  />
                  <OptionPills
                    label="Penutup Kepala"
                    value={draft.headwear}
                    options={[
                      { id: 'none', label: 'Tidak Ada' },
                      { id: 'chef-hat', label: 'Topi Koki' },
                      { id: 'bucket-hat', label: 'Bucket Hat' },
                      { id: 'baseball-cap', label: 'Baseball' },
                      { id: 'helmet', label: 'Helm' },
                      { id: 'peci', label: 'Peci' },
                      { id: 'crown', label: 'Mahkota' },
                      { id: 'bandana', label: 'Bandana' },
                    ]}
                    onChange={(headwear) => setDraft((d) => ({ ...d, headwear }))}
                  />
                  {draft.headwear !== 'none' && (
                    <ColorRow
                      label="Warna Topi / Penutup Kepala"
                      value={draft.headwearColor}
                      onChange={(headwearColor) => setDraft((d) => ({ ...d, headwearColor }))}
                    />
                  )}
                </>
              )}

              {tab === 'torso' && (
                <>
                  <OptionPills
                    label="Model Baju"
                    value={draft.torsoStyle}
                    options={[
                      { id: 'tshirt', label: 'Kaos' },
                      { id: 'shirt', label: 'Kemeja' },
                      { id: 'hawaiian', label: 'Hawaii' },
                      { id: 'hoodie', label: 'Hoodie' },
                      { id: 'jacket', label: 'Jaket' },
                      { id: 'suit', label: 'Jas' },
                      { id: 'kebaya', label: 'Kebaya' },
                      { id: 'apron', label: 'Apron' },
                      { id: 'school-uniform', label: 'Seragam' },
                      { id: 'jersey', label: 'Olahraga' },
                    ]}
                    onChange={(torsoStyle) => setDraft((d) => ({ ...d, torsoStyle }))}
                  />
                  <OptionPills
                    label="Motif Cetak"
                    value={draft.torsoPattern}
                    options={[
                      { id: 'solid', label: 'Polos' },
                      { id: 'stripes', label: 'Garis' },
                      { id: 'floral', label: 'Bunga' },
                      { id: 'batik', label: 'Batik' },
                      { id: 'logo', label: 'Logo' },
                    ]}
                    onChange={(torsoPattern) => setDraft((d) => ({ ...d, torsoPattern }))}
                  />
                  <ColorRow
                    label="Warna Utama Baju"
                    value={draft.torsoColor}
                    onChange={(torsoColor) =>
                      setDraft((d) => ({ ...d, torsoColor, armColor: torsoColor, avatarBg: torsoColor }))
                    }
                  />
                  <ColorRow
                    label="Warna Sekunder / Aksen"
                    value={draft.torsoSecondaryColor}
                    onChange={(torsoSecondaryColor) =>
                      setDraft((d) => ({ ...d, torsoSecondaryColor }))
                    }
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={draft.shortSleeves}
                        onChange={(e) => setDraft((d) => ({ ...d, shortSleeves: e.target.checked }))}
                      />
                      Lengan Pendek
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={draft.handColor !== 'skin'}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, handColor: e.target.checked ? '#202226' : 'skin' }))
                        }
                      />
                      Sarung Tangan
                    </label>
                  </div>
                  <ColorRow
                    label="Warna Lengan"
                    value={draft.armColor}
                    onChange={(armColor) => setDraft((d) => ({ ...d, armColor }))}
                  />
                </>
              )}

              {tab === 'bottom' && (
                <>
                  <OptionPills
                    label="Model Bawahan"
                    value={draft.bottomStyle}
                    options={[
                      { id: 'pants', label: 'Celana Panjang' },
                      { id: 'shorts', label: 'Celana Pendek' },
                      { id: 'skirt', label: 'Rok' },
                      { id: 'batik', label: 'Kain Batik / Sarung' },
                      { id: 'overalls', label: 'Overall' },
                    ]}
                    onChange={(bottomStyle) => setDraft((d) => ({ ...d, bottomStyle }))}
                  />
                  <OptionPills
                    label="Motif Bawahan"
                    value={draft.bottomPattern}
                    options={[
                      { id: 'solid', label: 'Polos' },
                      { id: 'jeans', label: 'Jeans' },
                      { id: 'stripes', label: 'Garis' },
                      { id: 'batik', label: 'Batik' },
                    ]}
                    onChange={(bottomPattern) => setDraft((d) => ({ ...d, bottomPattern }))}
                  />
                  <ColorRow
                    label="Warna Celana / Bawahan"
                    value={draft.bottomColor}
                    onChange={(bottomColor) => setDraft((d) => ({ ...d, bottomColor }))}
                  />
                </>
              )}

              {tab === 'shoes' && (
                <>
                  <OptionPills
                    label="Model Sepatu"
                    value={draft.shoeStyle}
                    options={[
                      { id: 'sneakers', label: 'Sneakers' },
                      { id: 'sandals', label: 'Sandal' },
                      { id: 'boots', label: 'Boots' },
                      { id: 'formal', label: 'Formal' },
                      { id: 'barefoot', label: 'Nyeker' },
                    ]}
                    onChange={(shoeStyle) => setDraft((d) => ({ ...d, shoeStyle }))}
                  />
                  {draft.shoeStyle !== 'barefoot' && (
                    <ColorRow
                      label="Warna Sepatu"
                      value={draft.shoeColor}
                      onChange={(shoeColor) => setDraft((d) => ({ ...d, shoeColor }))}
                    />
                  )}
                </>
              )}

              {tab === 'accessories' && (
                <>
                  <OptionPills
                    label="Slot Kepala"
                    value={draft.accessories.headSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'headphones', label: 'Headphone' },
                    ]}
                    onChange={(headSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, headSlot } }))
                    }
                  />
                  <OptionPills
                    label="Slot Wajah"
                    value={draft.accessories.faceSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'glasses', label: 'Kacamata' },
                      { id: 'sunglasses', label: 'Kacamata Hitam' },
                    ]}
                    onChange={(faceSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, faceSlot } }))
                    }
                  />
                  <OptionPills
                    label="Slot Leher"
                    value={draft.accessories.neckSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'camera', label: 'Kamera Leher' },
                      { id: 'necklace', label: 'Kalung' },
                      { id: 'scarf', label: 'Syal' },
                    ]}
                    onChange={(neckSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, neckSlot } }))
                    }
                  />
                  <OptionPills
                    label="Slot Tangan Kiri"
                    value={draft.accessories.leftHandSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'coffee-cup', label: 'Cangkir Kopi' },
                      { id: 'laptop', label: 'Laptop' },
                      { id: 'watch', label: 'Jam Tangan' },
                    ]}
                    onChange={(leftHandSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, leftHandSlot } }))
                    }
                  />
                  <OptionPills
                    label="Slot Tangan Kanan"
                    value={draft.accessories.rightHandSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'spatula', label: 'Spatula' },
                      { id: 'fan', label: 'Kipas' },
                      { id: 'coffee-cup', label: 'Cangkir Kopi' },
                    ]}
                    onChange={(rightHandSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, rightHandSlot } }))
                    }
                  />
                  <OptionPills
                    label="Slot Punggung"
                    value={draft.accessories.backSlot}
                    options={[
                      { id: 'none', label: 'Kosong' },
                      { id: 'backpack', label: 'Tas Ransel' },
                    ]}
                    onChange={(backSlot) =>
                      setDraft((d) => ({ ...d, accessories: { ...d.accessories, backSlot } }))
                    }
                  />
                </>
              )}

              {tab === 'profile' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Nama Karakter</label>
                    <input
                      type="text"
                      value={draft.name}
                      maxLength={32}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Role / Title</label>
                    <input
                      type="text"
                      value={draft.role}
                      maxLength={36}
                      onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Kutipan / Deskripsi</label>
                    <textarea
                      rows={2}
                      value={draft.quote}
                      maxLength={140}
                      onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Ruangan Favorit</label>
                    <select
                      value={draft.favoriteRoom}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, favoriteRoom: e.target.value as RoomId }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold focus:border-amber-400 focus:outline-none"
                    >
                      {FAVORITE_ROOMS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <OptionPills<PersonalityType>
                    label="Kepribadian (Memengaruhi AI & Obrolan)"
                    value={draft.personality}
                    options={[
                      { id: 'diligent', label: 'Rajin' },
                      { id: 'relaxed', label: 'Santai' },
                      { id: 'chatty', label: 'Suka Ngobrol' },
                      { id: 'shy', label: 'Pemalu' },
                    ]}
                    onChange={(personality) => setDraft((d) => ({ ...d, personality }))}
                  />
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      disabled={characters.length >= MAX_CHARACTERS}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-45"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplikat
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={characters.length <= 1}
                      className={[
                        'inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-40',
                        confirmDelete
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100',
                      ].join(' ')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmDelete ? 'Konfirmasi Hapus?' : 'Hapus'}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeCreator}
                  className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-[3px] border-emerald-700 bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-400 active:translate-y-[1px]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
