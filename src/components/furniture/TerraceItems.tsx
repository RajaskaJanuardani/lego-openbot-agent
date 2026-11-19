import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { FLOOR_Y } from '../../lib/layout';
import { PlasticChair, Stool } from './Chair';
import { PottedPlant } from './Plant';
import { WallSconce } from './Lamp';
import type { Vec3 } from '../../types';

// Cached canvas-textured hopscotch (engklek) tile materials for numbers 1..10
const hopscotchMatCache = new Map<string, THREE.MeshStandardMaterial>();

function getHopscotchTileMaterial(num: number, bgColor: string): THREE.MeshStandardMaterial {
  const key = `${num}|${bgColor}`;
  const existing = hopscotchMatCache.get(key);
  if (existing) return existing;

  if (typeof document === 'undefined') {
    const fallback = getLegoMaterial(bgColor);
    hopscotchMatCache.set(key, fallback);
    return fallback;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Crisp white tile outline
    ctx.fillStyle = LEGO_COLORS.white;
    ctx.fillRect(0, 0, 128, 128);

    // Saturated colored inner square
    ctx.fillStyle = bgColor;
    ctx.fillRect(8, 8, 112, 112);

    // Subtle LEGO tile shine bar
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(12, 12, 104, 18);

    // Bold centered number
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(20, 26, 40, 0.55)';
    ctx.lineWidth = 6;
    ctx.font = 'bold 64px "Fredoka", "Arial Rounded MT Bold", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = String(num);
    ctx.strokeText(label, 64, 68);
    ctx.fillText(label, 64, 68);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.26,
    metalness: 0,
  });
  hopscotchMatCache.set(key, mat);
  return mat;
}

const hopscotchTileGeo = new THREE.BoxGeometry(0.96, 0.06, 0.88);
const fanHousingGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 16);
const fanBladeGeo = new THREE.BoxGeometry(0.76, 0.14, 0.05);
const fanHubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 10);
const pipeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.9, 8);

interface HopscotchCell {
  num: number;
  dx: number;
  dz: number;
  color: string;
}

const HOPSCOTCH_CELLS: HopscotchCell[] = [
  { num: 1, dx: 0, dz: 2.75, color: LEGO_COLORS.yellow },
  { num: 2, dx: 0, dz: 1.83, color: LEGO_COLORS.lightBlue },
  { num: 3, dx: 0, dz: 0.91, color: LEGO_COLORS.brightGreen },
  { num: 4, dx: -0.52, dz: -0.01, color: LEGO_COLORS.orange },
  { num: 5, dx: 0.52, dz: -0.01, color: LEGO_COLORS.pinkCushion },
  { num: 6, dx: 0, dz: -0.93, color: LEGO_COLORS.turquoise },
  { num: 7, dx: -0.52, dz: -1.85, color: LEGO_COLORS.purple },
  { num: 8, dx: 0.52, dz: -1.85, color: LEGO_COLORS.red },
  { num: 9, dx: 0, dz: -2.77, color: LEGO_COLORS.limeGreen },
  { num: 10, dx: 0, dz: -3.69, color: LEGO_COLORS.warmYellow },
];

/** Colorful Indonesian Hopscotch (Engklek) numbered 1-10 made of smooth LEGO tiles */
const HopscotchGrid: React.FC<{ position: Vec3 }> = ({ position }) => {
  const mats = useMemo(
    () => HOPSCOTCH_CELLS.map((cell) => getHopscotchTileMaterial(cell.num, cell.color)),
    []
  );

  return (
    <group position={[position[0], position[1] + 0.035, position[2]]}>
      {HOPSCOTCH_CELLS.map((cell, idx) => (
        <mesh
          key={cell.num}
          geometry={hopscotchTileGeo}
          material={mats[idx]}
          position={[cell.dx, 0, cell.dz]}
          receiveShadow
        />
      ))}
    </group>
  );
};

/** Outdoor AC condenser unit with animated spinning fan grille (front faces +Z) */
const OutdoorACUnit: React.FC<{ position: Vec3; rotation?: Vec3 }> = ({
  position,
  rotation = [0, 0, 0],
}) => {
  const fanRef = useRef<THREE.Group>(null);
  const darkMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black, { roughness: 0.4 }), []);
  const bladeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.55, roughness: 0.25 }), []);

  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z -= delta * 5.2;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Two mounting foot brackets */}
      <Tile position={[-0.65, 0, 0]} size={[0.24, 0.82]} height={0.22} color={LEGO_COLORS.darkGray} />
      <Tile position={[0.65, 0, 0]} size={[0.24, 0.82]} height={0.22} color={LEGO_COLORS.darkGray} />

      {/* Main off-white boxy outdoor condenser cabinet */}
      <Tile position={[0, 0.22, 0]} size={[1.76, 0.8]} height={1.22} color={LEGO_COLORS.offWhite} />
      <Tile position={[0, 1.44, 0]} size={[1.82, 0.84]} height={0.1} color={LEGO_COLORS.white} />

      {/* Dark recessed circular fan opening on left front */}
      <mesh
        geometry={fanHousingGeo}
        material={darkMat}
        position={[-0.28, 0.83, 0.39]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Spinning 4-blade fan inside opening */}
      <group position={[-0.28, 0.83, 0.43]} ref={fanRef}>
        <mesh geometry={fanBladeGeo} material={bladeMat} />
        <mesh geometry={fanBladeGeo} material={bladeMat} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={fanHubGeo} material={silverMat} rotation={[Math.PI / 2, 0, 0]} />
      </group>

      {/* Protective horizontal safety grille bars in front of fan */}
      {[-0.28, -0.1, 0.08, 0.26].map((gy) => (
        <Tile key={gy} position={[-0.28, 0.83 + gy, 0.47]} size={[0.88, 0.03]} height={0.04} color={LEGO_COLORS.lightGray} />
      ))}

      {/* Right-side louver vents & brand badge */}
      <Tile position={[0.52, 1.15, 0.42]} size={[0.42, 0.04]} height={0.14} color={LEGO_COLORS.blue} />
      {[0.45, 0.65, 0.85].map((vy) => (
        <Tile key={vy} position={[0.52, vy, 0.42]} size={[0.48, 0.04]} height={0.08} color={LEGO_COLORS.lightGray} />
      ))}

      {/* Insulated refrigerant pipe running into north kitchen wall */}
      <mesh geometry={pipeGeo} material={silverMat} position={[0.88, 0.72, -0.2]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

export interface TerraceItemsProps {
  isNight: boolean;
}

/**
 * Left Terrace props (bounds x: -15..-7, z: 2..11, floor FLOOR_Y = 7.6):
 * - Colorful numbered 1-10 hopscotch (engklek) on pink terrace floor (clear for Tourist walking!)
 * - Outdoor AC unit with spinning fan mounted near north kitchen wall
 * - Yellow flower pots with tropical foliage & blooms along railing
 */
export const LeftTerraceItems: React.FC<TerraceItemsProps> = ({ isNight }) => {
  return (
    <group name="left-terrace-items">
      {/* Hopscotch 1-10 centered at x = -10.6, z = 6.9 (spans z: ~3.2..9.7, x: ~-11.6..-9.6) */}
      <HopscotchGrid position={[-10.6, FLOOR_Y, 6.9]} />

      {/* Outdoor AC unit near north kitchen wall */}
      <OutdoorACUnit position={[-14.1, FLOOR_Y, 2.05]} />

      {/* Subtle warm porch wall sconce on solid pink wall west of kitchen terrace door (emissive glow only) */}
      <WallSconce position={[-12.6, 11.8, 1.54]} isNight={isNight} enableLight={false} />

      {/* Yellow flower pots along west & south railings (clear of Stair Room arched door at x=-6, z=9..11) */}
      <PottedPlant
        position={[-14.7, FLOOR_Y, 5.2]}
        potColor={LEGO_COLORS.yellow}
        variant="flowering"
        flowerColor={LEGO_COLORS.pinkCushion}
        scale={0.95}
      />
      <PottedPlant
        position={[-14.7, FLOOR_Y, 8.2]}
        potColor={LEGO_COLORS.yellow}
        variant="tropical"
        scale={0.9}
      />
      <PottedPlant
        position={[-14.5, FLOOR_Y, 10.6]}
        potColor={LEGO_COLORS.yellow}
        variant="flowering"
        flowerColor={LEGO_COLORS.orange}
        scale={0.95}
      />
      <PottedPlant
        position={[-12.2, FLOOR_Y, 10.7]}
        potColor={LEGO_COLORS.yellow}
        variant="flowering"
        flowerColor={LEGO_COLORS.red}
        scale={0.85}
      />
      <PottedPlant
        position={[-9.5, FLOOR_Y, 10.7]}
        potColor={LEGO_COLORS.yellow}
        variant="tropical"
        scale={0.92}
      />
    </group>
  );
};

/**
 * Right Terrace props (bounds x: 13..15, z: -1..11, floor FLOOR_Y = 7.6):
 * - Green plastic LEGO chair & pink plastic LEGO chair
 * - Small red stool
 * - Colorful terracotta & yellow flower pots along terrace edge
 */
export const RightTerraceItems: React.FC<TerraceItemsProps> = ({ isNight }) => {
  return (
    <group name="right-terrace-items">
      {/* Green plastic LEGO chair (kursi plastik hijau) */}
      <PlasticChair
        position={[14.1, FLOOR_Y, 2.5]}
        rotation={[0, -Math.PI * 0.42, 0]}
        color={LEGO_COLORS.brightGreen}
      />

      {/* Pink plastic LEGO chair (kursi plastik pink) */}
      <PlasticChair
        position={[14.1, FLOOR_Y, 6.0]}
        rotation={[0, -Math.PI * 0.62, 0]}
        color={LEGO_COLORS.pinkCushion}
      />

      {/* Small red stool (bangku merah kecil) */}
      <Stool position={[14.0, FLOOR_Y, 8.5]} color={LEGO_COLORS.red} />

      {/* Emissive outdoor terrace wall lamp on solid wall north of krepyak doorway */}
      <WallSconce
        position={[12.54, 11.8, 3.2]}
        rotation={[0, Math.PI / 2, 0]}
        isNight={isNight}
        enableLight={false}
      />

      {/* Colorful flower pots lining the terrace edge */}
      <PottedPlant
        position={[14.85, FLOOR_Y, 0.2]}
        potColor={LEGO_COLORS.terracotta}
        variant="tropical"
        scale={0.88}
      />
      <PottedPlant
        position={[14.85, FLOOR_Y, 4.25]}
        potColor={LEGO_COLORS.yellow}
        variant="flowering"
        flowerColor={LEGO_COLORS.pinkCushion}
        scale={0.82}
      />
      <PottedPlant
        position={[14.85, FLOOR_Y, 10.3]}
        potColor={LEGO_COLORS.terracotta}
        variant="flowering"
        flowerColor={LEGO_COLORS.orange}
        scale={0.9}
      />
      <PottedPlant
        position={[13.2, FLOOR_Y, 10.4]}
        potColor={LEGO_COLORS.yellow}
        variant="compact"
        scale={0.8}
      />
    </group>
  );
};
