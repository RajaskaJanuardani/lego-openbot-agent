import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Brick, Plate, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { PLATE_H } from '../../lib/layout';
import type { Vec3 } from '../../types';

export interface SofaProps {
  position?: Vec3;
  rotation?: Vec3;
  woodColor?: string;
  cushionColor?: string;
}

let pinkPatternMatCache: THREE.MeshStandardMaterial | null = null;

function getPinkPatternMaterial(): THREE.MeshStandardMaterial {
  if (pinkPatternMatCache) return pinkPatternMatCache;
  if (typeof document === 'undefined') {
    pinkPatternMatCache = getLegoMaterial(LEGO_COLORS.pinkCushion, { roughness: 0.45 });
    return pinkPatternMatCache;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = LEGO_COLORS.pinkCushion;
    ctx.fillRect(0, 0, 128, 128);

    // Subtle geometric Indonesian diamond & floral motif
    ctx.fillStyle = LEGO_COLORS.pinkLight;
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 128; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 4);
        ctx.lineTo(x + 28, y + 16);
        ctx.lineTo(x + 16, y + 28);
        ctx.lineTo(x + 4, y + 16);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = LEGO_COLORS.magentaTrim;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = LEGO_COLORS.warmYellow;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = LEGO_COLORS.pinkLight;
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  pinkPatternMatCache = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.42,
    metalness: 0,
  });
  return pinkPatternMatCache;
}

const throwPillowGeo = new THREE.BoxGeometry(0.65, 0.55, 0.28);
const seatCushionGeo = new THREE.BoxGeometry(1.06, 0.36, 1.12);
const backCushionGeo = new THREE.BoxGeometry(1.06, 0.85, 0.32);

export const Sofa: React.FC<SofaProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  woodColor = LEGO_COLORS.brownWood,
  cushionColor = LEGO_COLORS.pinkCushion,
}) => {
  const patternMat = useMemo(() => getPinkPatternMaterial(), []);
  const accentMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkLight, { roughness: 0.4 }), []);
  const trimMat = useMemo(() => getLegoMaterial(LEGO_COLORS.magentaTrim, { roughness: 0.35 }), []);

  // Seat top height is at local y = 0.86 so Gamer sitting at FLOOR_Y + 0.85 sits right on cushion
  return (
    <group position={position} rotation={rotation}>
      {/* Four sturdy dark wood corner legs */}
      <Plate position={[-1.7, 0, -0.58]} size={[0.35, 1, 0.35]} color={LEGO_COLORS.darkWood} studs={false} />
      <Plate position={[1.7, 0, -0.58]} size={[0.35, 1, 0.35]} color={LEGO_COLORS.darkWood} studs={false} />
      <Plate position={[-1.7, 0, 0.58]} size={[0.35, 1, 0.35]} color={LEGO_COLORS.darkWood} studs={false} />
      <Plate position={[1.7, 0, 0.58]} size={[0.35, 1, 0.35]} color={LEGO_COLORS.darkWood} studs={false} />

      {/* Main wooden base frame (bottom at 0.24, height 1 plate = 0.4 -> top at 0.64? Let's make base bottom at 0.2, top at 0.52) */}
      <Tile position={[0, 0.22, 0]} size={[3.7, 1.55]} height={0.32} color={woodColor} />

      {/* Decorative wooden front apron strip */}
      <Tile position={[0, 0.24, 0.78]} size={[3.4, 0.08]} height={0.26} color={LEGO_COLORS.darkWood} />

      {/* Back wooden frame & slatted backrest */}
      <Brick position={[0, 0.52, -0.68]} size={[3.7, 1.35, 0.26]} color={woodColor} studs={false} />
      <Tile position={[0, 2.14, -0.68]} size={[3.8, 0.34]} height={0.18} color={LEGO_COLORS.darkWood} />
      {/* Carved wood accent bars on backrest */}
      {[-1.2, 0, 1.2].map((bx) => (
        <Tile key={bx} position={[bx, 0.65, -0.82]} size={[0.22, 0.08]} height={1.4} color={LEGO_COLORS.darkWood} />
      ))}

      {/* Left & Right wooden armrests with smooth rounded-look top caps */}
      <Brick position={[-1.75, 0.52, 0.02]} size={[0.32, 0.9, 1.5]} color={woodColor} studs={false} />
      <Tile position={[-1.75, 1.58, 0.02]} size={[0.4, 1.62]} height={0.18} color={LEGO_COLORS.darkWood} />

      <Brick position={[1.75, 0.52, 0.02]} size={[0.32, 0.9, 1.5]} color={woodColor} studs={false} />
      <Tile position={[1.75, 1.58, 0.02]} size={[0.4, 1.62]} height={0.18} color={LEGO_COLORS.darkWood} />

      {/* Three patterned pink seat cushions (center y = 0.70 -> top at 0.88) */}
      {[-1.08, 0, 1.08].map((cx) => (
        <mesh
          key={`seat-${cx}`}
          geometry={seatCushionGeo}
          material={patternMat}
          position={[cx, 0.7, 0.14]}
          castShadow
          receiveShadow
        />
      ))}

      {/* Front piping / trim studs along cushion front */}
      <Tile position={[0, 0.52, 0.72]} size={[3.2, 0.08]} height={0.12} color={cushionColor} />

      {/* Three patterned pink back cushions */}
      {[-1.08, 0, 1.08].map((cx) => (
        <mesh
          key={`back-${cx}`}
          geometry={backCushionGeo}
          material={patternMat}
          position={[cx, 1.32, -0.38]}
          rotation={[-0.12, 0, 0]}
          castShadow
          receiveShadow
        />
      ))}

      {/* Two angled decorative throw pillows in corners */}
      <mesh
        geometry={throwPillowGeo}
        material={accentMat}
        position={[-1.32, 1.18, 0.08]}
        rotation={[0.08, 0.42, -0.15]}
        castShadow
      />
      <mesh
        geometry={throwPillowGeo}
        material={trimMat}
        position={[1.32, 1.18, 0.08]}
        rotation={[0.08, -0.42, 0.15]}
        castShadow
      />

      {/* Subtle LEGO studs on top of wooden back rail for authentic LEGO detail */}
      <Plate position={[-1.65, 2.32, -0.68]} size={[0.3, 0.35, 0.3]} color={LEGO_COLORS.gold} studs={false} />
      <Plate position={[1.65, 2.32, -0.68]} size={[0.3, 0.35, 0.3]} color={LEGO_COLORS.gold} studs={false} />
      {/* Tiny stud detail on armrest fronts */}
      <Plate position={[-1.75, 1.76 - PLATE_H * 0.01, 0.7]} size={[0.2, 0.25, 0.2]} color={LEGO_COLORS.gold} studs={false} />
      <Plate position={[1.75, 1.76 - PLATE_H * 0.01, 0.7]} size={[0.2, 0.25, 0.2]} color={LEGO_COLORS.gold} studs={false} />
    </group>
  );
};
