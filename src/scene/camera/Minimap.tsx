import React, { useEffect, useState } from 'react';
import { Map as MapIcon, Minimize2 } from 'lucide-react';
import { cameraRuntime, characterRuntimeMap } from '../../lib/characterRuntime';
import { FLOOR1_Y, FLOOR2_Y } from '../../lib/constants';
import { useUIStore } from '../../store/uiStore';
import type { CharacterId, Vec3 } from '../../types';

export interface MinimapCharacterMeta {
  id: CharacterId;
  name: string;
  color: string;
}

export interface MinimapProps {
  characters: MinimapCharacterMeta[];
  isNight: boolean;
}

interface Telemetry {
  target: Vec3;
  camPos: Vec3;
  chars: Array<{ id: string; x: number; y: number; z: number; working: boolean }>;
}

// Map world coordinates x:[-28, 28], z:[-23, 23] -> SVG 0..168 x 0..138 (3px per stud)
const SCALE = 3;
const toSvgX = (wx: number) => (wx + 28) * SCALE;
const toSvgY = (wz: number) => (wz + 23) * SCALE;

export const Minimap: React.FC<MinimapProps> = ({ characters, isNight }) => {
  const showMinimap = useUIStore((s) => s.showMinimap);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);
  const floorViewMode = useUIStore((s) => s.floorViewMode);
  const selectedCharacterId = useUIStore((s) => s.selectedCharacterId);
  const requestCameraMove = useUIStore((s) => s.requestCameraMove);
  const setAutoRotate = useUIStore((s) => s.setAutoRotate);
  const setFollowCharacterId = useUIStore((s) => s.setFollowCharacterId);
  const markInteracted = useUIStore((s) => s.markInteracted);

  const [telemetry, setTelemetry] = useState<Telemetry>({
    target: [...cameraRuntime.target] as Vec3,
    camPos: [...cameraRuntime.position] as Vec3,
    chars: [],
  });

  // Refresh minimap telemetry at 8 Hz (ultra-lightweight, zero 3D overhead)
  useEffect(() => {
    if (!showMinimap) return;
    const timer = window.setInterval(() => {
      const chars: Telemetry['chars'] = [];
      characterRuntimeMap.forEach((snap) => {
        chars.push({
          id: snap.id,
          x: snap.position[0],
          y: snap.position[1],
          z: snap.position[2],
          working: snap.isWorkingAtDesk,
        });
      });
      setTelemetry({
        target: [...cameraRuntime.target] as Vec3,
        camPos: [...cameraRuntime.position] as Vec3,
        chars,
      });
    }, 125);
    return () => window.clearInterval(timer);
  }, [showMinimap]);

  if (!showMinimap) {
    return (
      <button
        type="button"
        onClick={toggleMinimap}
        title="Buka Minimap"
        className={[
          'pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold backdrop-blur-xl transition-all hover:scale-105',
          isNight
            ? 'border-indigo-400/35 bg-slate-900/80 text-sky-200'
            : 'border-white/85 bg-white/85 text-slate-700 shadow-md',
        ].join(' ')}
      >
        <MapIcon className="h-3.5 w-3.5 text-emerald-500" />
        <span>Minimap</span>
      </button>
    );
  }

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const wx = -28 + nx * 56;
    const wz = -23 + ny * 46;
    const targetY = floorViewMode === 'floor1' ? FLOOR1_Y + 1.8 : FLOOR2_Y + 1.4;

    // Keep current camera viewing offset so clicking minimap pans naturally
    const dx = cameraRuntime.position[0] - cameraRuntime.target[0];
    const dy = cameraRuntime.position[1] - cameraRuntime.target[1];
    const dz = cameraRuntime.position[2] - cameraRuntime.target[2];

    markInteracted();
    setAutoRotate(false);
    setFollowCharacterId(null);
    requestCameraMove({
      position: [wx + dx, Math.max(8, targetY + dy), wz + dz],
      target: [wx, targetY, wz],
    });
  };

  const charColorMap = new Map(characters.map((c) => [c.id, c.color]));
  const isF1 = floorViewMode === 'floor1';

  // Viewing direction ray from camera toward target for frustum wedge
  const tx = toSvgX(telemetry.target[0]);
  const ty = toSvgY(telemetry.target[2]);
  const cx = toSvgX(telemetry.camPos[0]);
  const cy = toSvgY(telemetry.camPos[2]);
  const angle = Math.atan2(ty - cy, tx - cx);
  const coneLen = 28;
  const spread = 0.42;
  const p1x = tx - Math.cos(angle - spread) * coneLen;
  const p1y = ty - Math.sin(angle - spread) * coneLen;
  const p2x = tx - Math.cos(angle + spread) * coneLen;
  const p2y = ty - Math.sin(angle + spread) * coneLen;

  return (
    <div
      className={[
        'pointer-events-auto overflow-hidden rounded-2xl border-2 backdrop-blur-xl transition-colors duration-300',
        isNight
          ? 'border-indigo-400/35 bg-slate-900/85 text-slate-100 shadow-2xl'
          : 'border-white/90 bg-white/88 text-slate-800 shadow-xl',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
        <span className="inline-flex items-center gap-1">
          <MapIcon className="h-3 w-3 text-emerald-500" />
          <span>Denah {isF1 ? 'Lantai 1' : 'Lantai 2'}</span>
        </span>
        <button
          type="button"
          onClick={toggleMinimap}
          title="Sembunyikan Minimap"
          className="cursor-pointer rounded p-0.5 opacity-70 hover:bg-slate-500/20 hover:opacity-100"
        >
          <Minimize2 className="h-3 w-3" />
        </button>
      </div>

      <svg
        viewBox="0 0 168 138"
        onClick={handleSvgClick}
        className="block h-[116px] w-[142px] sm:h-[132px] sm:w-[162px] cursor-crosshair"
        aria-label="Minimap denah rumah, klik untuk memindahkan kamera"
      >
        {/* Exterior Baseplate: Sand, Grass, Beach/Sea */}
        <rect x="0" y="0" width="168" height="138" fill="#E8D2A0" />
        <rect x="39" y="51" width="129" height="87" fill="#52BA4E" />
        <rect x="120" y="0" width="48" height="51" fill="#2FA6D6" />
        {/* Yellow Bajaj icon on right yard */}
        <rect x={toSvgX(20.5)} y={toSvgY(6.2)} width={7} height={9} rx={2} fill="#F6C915" stroke="#202226" strokeWidth="1" />

        {/* House Footprint */}
        {isF1 ? (
          <g stroke="#2B3A42" strokeWidth="1">
            {/* Guest Room */}
            <rect x={toSvgX(-16)} y={toSvgY(-12)} width={11 * SCALE} height={13 * SCALE} fill="#F6EBD4" />
            {/* Bathroom 1 */}
            <rect x={toSvgX(-5)} y={toSvgY(-12)} width={7 * SCALE} height={9 * SCALE} fill="#9BE0CA" />
            {/* Studio / Ruang Kerja */}
            <rect x={toSvgX(2)} y={toSvgY(-12)} width={14 * SCALE} height={15 * SCALE} fill="#E0F2FE" />
            {/* Laundry */}
            <rect x={toSvgX(-16)} y={toSvgY(1)} width={10 * SCALE} height={11 * SCALE} fill="#ECEAE2" />
            {/* Stair Hall 1 */}
            <rect x={toSvgX(-6)} y={toSvgY(-3)} width={8 * SCALE} height={15 * SCALE} fill="#EFE2C3" />
            {/* Foyer */}
            <rect x={toSvgX(1)} y={toSvgY(3)} width={15 * SCALE} height={9 * SCALE} fill="#FDE68A" />
            {/* Front Porch */}
            <rect x={toSvgX(-16)} y={toSvgY(12)} width={32 * SCALE} height={3.4 * SCALE} fill="#C85A32" opacity="0.65" />
            {/* Stairs footprint */}
            <rect x={toSvgX(-4)} y={toSvgY(3.5)} width={3 * SCALE} height={6 * SCALE} fill="#8D5524" />
          </g>
        ) : (
          <g stroke="#3B2514" strokeWidth="1">
            {/* Kitchen */}
            <rect x={toSvgX(-16)} y={toSvgY(-12)} width={10 * SCALE} height={13 * SCALE} fill="#9BE0CA" />
            {/* Left Terrace */}
            <rect x={toSvgX(-16)} y={toSvgY(1)} width={10 * SCALE} height={11 * SCALE} fill="#F9C6D9" />
            {/* Bedroom */}
            <rect x={toSvgX(-6)} y={toSvgY(-12)} width={10 * SCALE} height={10 * SCALE} fill="#C2ECE0" />
            {/* Expanded Stair Room */}
            <rect x={toSvgX(-6)} y={toSvgY(-2)} width={9 * SCALE} height={14 * SCALE} fill="#FFD95A" />
            {/* Dressing Room */}
            <rect x={toSvgX(4)} y={toSvgY(-12)} width={12 * SCALE} height={10 * SCALE} fill="#F9C6D9" />
            {/* Living & Dining */}
            <rect x={toSvgX(3)} y={toSvgY(-2)} width={9 * SCALE} height={14 * SCALE} fill="#F6EBD4" />
            {/* Right Terrace */}
            <rect x={toSvgX(12)} y={toSvgY(-2)} width={4 * SCALE} height={14 * SCALE} fill="#EFE2C3" />
            {/* Stairwell cutout */}
            <rect x={toSvgX(-4)} y={toSvgY(3.5)} width={3 * SCALE} height={6 * SCALE} fill="#4E2E18" />
          </g>
        )}

        {/* Camera Field-of-View Cone & Target Crosshair */}
        <polygon
          points={`${tx},${ty} ${p1x},${p1y} ${p2x},${p2y}`}
          fill="rgba(59, 130, 246, 0.28)"
          stroke="rgba(37, 99, 235, 0.7)"
          strokeWidth="0.9"
        />
        <circle cx={tx} cy={ty} r="3.2" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.2" />

        {/* Live Character Markers */}
        {telemetry.chars.map((c) => {
          const sx = toSvgX(c.x);
          const sy = toSvgY(c.z);
          const isSel = selectedCharacterId === c.id;
          const color = charColorMap.get(c.id) ?? '#F6C915';
          const onOtherFloor = isF1 ? c.y >= 5.2 : c.y < 4.5 && c.x >= -16 && c.x <= 16 && c.z >= -12 && c.z <= 12;

          return (
            <g key={c.id} opacity={onOtherFloor ? 0.45 : 1}>
              {isSel && (
                <circle cx={sx} cy={sy} r="5.5" fill="none" stroke="#F59E0B" strokeWidth="1.6" />
              )}
              <circle
                cx={sx}
                cy={sy}
                r={isSel ? 3.5 : 2.8}
                fill={color}
                stroke={c.working ? '#10B981' : '#FFFFFF'}
                strokeWidth="1.2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
