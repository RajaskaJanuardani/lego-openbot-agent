import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

const discOuterGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16);
const discInnerGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.13, 14);
const discCenterGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 10);
const rodGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 8);
const finialGeo = new THREE.SphereGeometry(0.11, 8, 8);
const curtainFoldGeo = new THREE.BoxGeometry(0.34, 2.75, 0.18);

const curtainMatCache = new Map<string, THREE.MeshStandardMaterial>();

function getCurtainMaterial(variant: 'blue-white' | 'batik-yellow-red'): THREE.MeshStandardMaterial {
  const cached = curtainMatCache.get(variant);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    const fallback = getLegoMaterial(variant === 'blue-white' ? LEGO_COLORS.lightBlue : LEGO_COLORS.yellow);
    curtainMatCache.set(variant, fallback);
    return fallback;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (variant === 'blue-white') {
      // Crisp coastal blue & white patterned kitchen curtains
      ctx.fillStyle = LEGO_COLORS.white;
      ctx.fillRect(0, 0, 128, 256);

      ctx.fillStyle = LEGO_COLORS.blue;
      for (let x = 0; x < 128; x += 32) {
        ctx.fillRect(x, 0, 14, 256);
      }
      ctx.fillStyle = LEGO_COLORS.lightBlue;
      for (let y = 0; y < 256; y += 32) {
        ctx.fillRect(0, y + 12, 128, 8);
      }
      // Subtle diamond dots
      ctx.fillStyle = LEGO_COLORS.white;
      for (let y = 16; y < 256; y += 32) {
        for (let x = 7; x < 128; x += 32) {
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Vibrant Indonesian yellow-red batik patterned curtains
      ctx.fillStyle = LEGO_COLORS.yellow;
      ctx.fillRect(0, 0, 128, 256);

      // Horizontal red batik borders & kawung motifs
      ctx.fillStyle = LEGO_COLORS.red;
      ctx.fillRect(0, 0, 128, 24);
      ctx.fillRect(0, 224, 128, 32);

      for (let y = 32; y < 224; y += 32) {
        for (let x = 0; x < 128; x += 32) {
          // Batik diamond petal flower
          ctx.fillStyle = LEGO_COLORS.red;
          ctx.beginPath();
          ctx.moveTo(x + 16, y + 3);
          ctx.lineTo(x + 29, y + 16);
          ctx.lineTo(x + 16, y + 29);
          ctx.lineTo(x + 3, y + 16);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = LEGO_COLORS.orange;
          ctx.beginPath();
          ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = LEGO_COLORS.warmYellow;
          ctx.beginPath();
          ctx.arc(x + 16, y + 16, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0 });
  curtainMatCache.set(variant, mat);
  return mat;
}

/** Framed colorful tropical LEGO tile painting (local front faces +Z) */
export const FramedPainting: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Outer dark wood & gold frame */}
      <Tile position={[0, -0.95, 0]} size={[2.4, 0.16]} height={1.9} color={LEGO_COLORS.darkWood} />
      <Tile position={[0, -0.82, 0.06]} size={[2.12, 0.08]} height={1.64} color={LEGO_COLORS.gold} />
      {/* Colorful LEGO sunset / sea / island mosaic tiles */}
      <Tile position={[0, 0.15, 0.1]} size={[1.92, 0.06]} height={0.58} color={LEGO_COLORS.lightBlue} />
      <Tile position={[0, -0.18, 0.1]} size={[1.92, 0.06]} height={0.35} color={LEGO_COLORS.orange} />
      <Tile position={[0, -0.5, 0.1]} size={[1.92, 0.06]} height={0.34} color={LEGO_COLORS.seaBlue} />
      <Tile position={[0, -0.74, 0.1]} size={[1.92, 0.06]} height={0.26} color={LEGO_COLORS.sand} />
      {/* Glowing LEGO sun + palm silhouette */}
      <Tile position={[0.45, 0.12, 0.13]} size={[0.38, 0.06]} height={0.38} color={LEGO_COLORS.yellow} />
      <Tile position={[-0.45, -0.55, 0.13]} size={[0.16, 0.06]} height={0.78} color={LEGO_COLORS.darkWood} />
      <Tile position={[-0.45, 0.16, 0.14]} size={[0.68, 0.06]} height={0.28} color={LEGO_COLORS.brightGreen} />
      <Tile position={[-0.72, -0.68, 0.13]} size={[0.3, 0.06]} height={0.24} color={LEGO_COLORS.pinkCushion} />
    </group>
  );
};

/** Large carved Indonesian wooden wall panel (panel ukir kayu besar) for Living Room (front faces +Z) */
export const CarvedWoodPanel: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Wide recessed dark wood panel base */}
      <Tile position={[0, -0.95, 0]} size={[3.8, 0.16]} height={1.9} color={LEGO_COLORS.darkWood} />
      {/* Raised wood border frame */}
      <Tile position={[0, 0.78, 0.08]} size={[3.72, 0.12]} height={0.18} color={LEGO_COLORS.brownWood} />
      <Tile position={[0, -0.95, 0.08]} size={[3.72, 0.12]} height={0.18} color={LEGO_COLORS.brownWood} />
      <Tile position={[-1.78, -0.82, 0.08]} size={[0.18, 0.12]} height={1.64} color={LEGO_COLORS.brownWood} />
      <Tile position={[1.78, -0.82, 0.08]} size={[0.18, 0.12]} height={1.64} color={LEGO_COLORS.brownWood} />

      {/* Intricate geometric carved relief diamonds & gold studs */}
      <Tile position={[0, -0.45, 0.1]} size={[0.92, 0.1]} height={0.92} color={LEGO_COLORS.brownWood} rotation={[0, 0, Math.PI / 4]} />
      <Tile position={[0, -0.22, 0.15]} size={[0.46, 0.08]} height={0.46} color={LEGO_COLORS.gold} rotation={[0, 0, Math.PI / 4]} />

      {[-1.12, 1.12].map((ox) => (
        <group key={ox} position={[ox, 0, 0]}>
          <Tile position={[0, -0.35, 0.1]} size={[0.68, 0.1]} height={0.68} color={LEGO_COLORS.rattan} rotation={[0, 0, Math.PI / 4]} />
          <Tile position={[0, -0.15, 0.14]} size={[0.3, 0.08]} height={0.3} color={LEGO_COLORS.gold} rotation={[0, 0, Math.PI / 4]} />
        </group>
      ))}
    </group>
  );
};

/** Compact carved wood wall ornament for Stair Room walls (front faces +Z) */
export const CarvedWallOrnament: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      <Tile position={[0, -0.65, 0]} size={[1.35, 0.14]} height={1.35} color={LEGO_COLORS.brownWood} />
      <Tile position={[0, -0.5, 0.08]} size={[0.95, 0.09]} height={0.95} color={LEGO_COLORS.rattan} />
      <Tile position={[0, -0.32, 0.13]} size={[0.56, 0.08]} height={0.56} color={LEGO_COLORS.darkWood} rotation={[0, 0, Math.PI / 4]} />
      <Tile position={[0, -0.16, 0.17]} size={[0.24, 0.06]} height={0.24} color={LEGO_COLORS.gold} />
    </group>
  );
};

/** Decorative round plates / wheel discs mounted on walls (front faces +Z) */
export const RoundWallPlates: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const rattanMat = useMemo(() => getLegoMaterial(LEGO_COLORS.rattan), []);
  const terracottaMat = useMemo(() => getLegoMaterial(LEGO_COLORS.terracotta), []);
  const turquoiseMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold), []);
  const creamMat = useMemo(() => getLegoMaterial(LEGO_COLORS.creamWall), []);
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);

  const discs = [
    { pos: [0, 0.45, 0] as Vec3, scale: 1.0, outer: rattanMat, inner: terracottaMat, center: goldMat },
    { pos: [-0.88, -0.25, 0] as Vec3, scale: 0.78, outer: turquoiseMat, inner: creamMat, center: darkWoodMat },
    { pos: [0.85, -0.18, 0] as Vec3, scale: 0.72, outer: darkWoodMat, inner: rattanMat, center: turquoiseMat },
  ];

  return (
    <group position={position} rotation={rotation}>
      {discs.map((d, i) => (
        <group key={i} position={d.pos} scale={[d.scale, d.scale, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={discOuterGeo} material={d.outer} castShadow />
          <mesh geometry={discInnerGeo} material={d.inner} />
          <mesh geometry={discCenterGeo} material={d.center} />
        </group>
      ))}
    </group>
  );
};

export interface CurtainsProps {
  position?: Vec3;
  rotation?: Vec3;
  width?: number;
  variant: 'blue-white' | 'batik-yellow-red';
}

/** Patterned window curtains with wooden rod & dual pleated fabric drapes (front faces +Z) */
export const Curtains: React.FC<CurtainsProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 3.2,
  variant,
}) => {
  const curtainMat = useMemo(() => getCurtainMaterial(variant), [variant]);
  const woodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35, roughness: 0.25 }), []);
  const tieColor = variant === 'blue-white' ? LEGO_COLORS.navyBlue : LEGO_COLORS.red;

  const halfW = width / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Horizontal curtain rod at top */}
      <mesh
        geometry={rodGeo}
        material={woodMat}
        position={[0, 1.48, 0.12]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1, width + 0.5, 1]}
      />
      <mesh geometry={finialGeo} material={goldMat} position={[-halfW - 0.28, 1.48, 0.12]} />
      <mesh geometry={finialGeo} material={goldMat} position={[halfW + 0.28, 1.48, 0.12]} />

      {/* Left pleated drape panel (2 staggered folds) */}
      <group position={[-halfW + 0.22, 0.04, 0.14]}>
        <mesh geometry={curtainFoldGeo} material={curtainMat} position={[-0.14, 0, 0]} castShadow />
        <mesh geometry={curtainFoldGeo} material={curtainMat} position={[0.14, 0, 0.06]} castShadow />
        <Tile position={[0, -0.35, 0.12]} size={[0.66, 0.1]} height={0.14} color={tieColor} />
      </group>

      {/* Right pleated drape panel */}
      <group position={[halfW - 0.22, 0.04, 0.14]}>
        <mesh geometry={curtainFoldGeo} material={curtainMat} position={[-0.14, 0, 0.06]} castShadow />
        <mesh geometry={curtainFoldGeo} material={curtainMat} position={[0.14, 0, 0]} castShadow />
        <Tile position={[0, -0.35, 0.12]} size={[0.66, 0.1]} height={0.14} color={tieColor} />
      </group>

      {/* Top valance bar */}
      <Tile position={[0, 1.18, 0.14]} size={[width + 0.12, 0.16]} height={0.34} color={tieColor} />
    </group>
  );
};

/** Crisp white LEGO window trim, sill & little floral vase for Bedroom north window (front faces +Z) */
export const WindowTrim: React.FC<{
  position?: Vec3;
  rotation?: Vec3;
  width?: number;
  height?: number;
}> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 3.2,
  height = 3.6,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* White protruding windowsill */}
      <Tile position={[0, 0, 0.2]} size={[width + 0.45, 0.44]} height={0.18} color={LEGO_COLORS.white} />
      {/* Side vertical white frame casings spanning full 3-course window height */}
      <Tile position={[-width / 2 - 0.08, 0.18, 0.06]} size={[0.24, 0.18]} height={height} color={LEGO_COLORS.white} />
      <Tile position={[width / 2 + 0.08, 0.18, 0.06]} size={[0.24, 0.18]} height={height} color={LEGO_COLORS.white} />
      {/* Top header molding cleanly above window opening */}
      <Tile position={[0, 0.14 + height, 0.1]} size={[width + 0.48, 0.26]} height={0.24} color={LEGO_COLORS.white} />
      {/* Cute little flower vase resting on sill */}
      <Tile position={[0.85, 0.18, 0.24]} size={[0.26, 0.26]} height={0.34} color={LEGO_COLORS.turquoise} />
      <Tile position={[0.85, 0.52, 0.24]} size={[0.24, 0.24]} height={0.2} color={LEGO_COLORS.pinkCushion} />
    </group>
  );
};
