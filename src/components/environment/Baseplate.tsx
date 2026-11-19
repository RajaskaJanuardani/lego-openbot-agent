import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import {
  GROUND_Y,
  PLATE_H,
  STUD_HEIGHT,
  STUD_RADIUS,
  WORLD_BOUNDS,
} from '../../lib/layout';
import { Plate, Tile } from '../lego';

export type GroundZone = 'sand' | 'sandDark' | 'brightGreen' | 'green' | 'sea';

/**
 * Returns the leftmost integer grid X coordinate where the sea starts for a given grid Z row.
 * Keeps the sea strictly inside x: [12, 28], z: [-23, -6] with a stepped LEGO shoreline
 * and a comfortable sandy buffer around the house corner (x: 16, z: -12).
 */
export function getSeaShoreStartX(gz: number): number {
  if (gz <= -21) return 12;
  if (gz === -20) return 13;
  if (gz === -19) return 14;
  if (gz === -18) return 15;
  if (gz === -17 || gz === -16) return 16;
  if (gz === -15) return 17;
  if (gz === -14 || gz === -13) return 18;
  if (gz === -12 || gz === -11) return 19;
  if (gz === -10) return 20;
  if (gz === -9) return 21;
  if (gz === -8) return 22;
  if (gz === -7) return 24;
  return 999;
}

export function isSeaCell(gx: number, gz: number): boolean {
  if (gz >= -6 || gz < WORLD_BOUNDS.minZ || gx >= WORLD_BOUNDS.maxX) {
    return false;
  }
  return gx >= getSeaShoreStartX(gz);
}

/**
 * Manhattan-like distance into the sea from the nearest dry beach cell (1 = shoreline edge).
 */
export function getSeaDepth(gx: number, gz: number): number {
  if (!isSeaCell(gx, gz)) return 0;
  const dx = gx - getSeaShoreStartX(gz) + 1;
  const dz = -6 - gz;
  return Math.min(dx, dz);
}

function isNearSea(gx: number, gz: number, radius: number): boolean {
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dz) <= radius + 1 && isSeaCell(gx + dx, gz + dz)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Deterministic cell zone classifier shared across the 56x46 stud grid.
 * Grid cell (gx, gz) covers [gx, gx+1] x [gz, gz+1] with center (gx + 0.5, gz + 0.5).
 */
export function getCellZone(gx: number, gz: number): GroundZone {
  if (isSeaCell(gx, gz)) {
    return 'sea';
  }

  // Wet/dark sand beach margin hugging the stepped shoreline (kept outside house footprint)
  const insideHouseOuter = gx >= -16 && gx < 16 && gz >= -12 && gz < 12;
  if (!insideHouseOuter && isNearSea(gx, gz, 2)) {
    return 'sandDark';
  }

  // Left cream sand side (x: -28..-15) with a playful LEGO step along front-left garden
  const leftSandEdge = gz >= 14 ? (gz % 4 < 2 ? -15 : -16) : -15;
  if (gx < leftSandEdge) {
    return 'sand';
  }

  // Back/Top sand strip behind the house (z: -23..-12)
  if (gz < -12) {
    return 'sand';
  }

  // Sandy beach curve transitioning smoothly into the right yard grass around z = -6..-4
  if (gx >= 16) {
    if (gz <= -6) return 'sand';
    if (gz === -5 && gx >= 19) return 'sand';
    if (gz === -4 && gx >= 23) return 'sand';
  }

  // Green grass zone: Front garden & Right yard with subtle organic LEGO green mottling
  const hash = Math.abs((gx * 37 + gz * 17 + gx * gz * 7) % 11);
  if (hash === 0 || hash === 4 || hash === 8) {
    return 'green';
  }
  return 'brightGreen';
}

interface SteppingTileDef {
  gx: number;
  gz: number;
  w: number;
  d: number;
  color: string;
}

// Grid-snapped stepping stone pathway leading directly from the front verandah entry step (z: 16..23)
const STEPPING_TILES: SteppingTileDef[] = [
  { gx: -2, gz: 16, w: 2, d: 1, color: LEGO_COLORS.creamTile },
  { gx: 1, gz: 16, w: 1, d: 1, color: LEGO_COLORS.lightGray },
  { gx: -1, gz: 17, w: 2, d: 1, color: LEGO_COLORS.sandDark },
  { gx: -2, gz: 18, w: 1, d: 1, color: LEGO_COLORS.lightGray },
  { gx: 0, gz: 18, w: 2, d: 1, color: LEGO_COLORS.creamTile },
  { gx: -1, gz: 19, w: 2, d: 1, color: LEGO_COLORS.creamTile },
  { gx: -2, gz: 20, w: 2, d: 1, color: LEGO_COLORS.lightGray },
  { gx: 1, gz: 20, w: 1, d: 1, color: LEGO_COLORS.sandDark },
  { gx: -1, gz: 21, w: 3, d: 1, color: LEGO_COLORS.creamTile },
  { gx: -2, gz: 22, w: 4, d: 1, color: LEGO_COLORS.sandDark },
];

// Build quick lookup of cells covered by smooth stepping tiles so baseplate studs don't poke through
const STEPPING_TILE_CELLS = new Set<string>();
for (const tile of STEPPING_TILES) {
  for (let x = tile.gx; x < tile.gx + tile.w; x++) {
    for (let z = tile.gz; z < tile.gz + tile.d; z++) {
      STEPPING_TILE_CELLS.add(`${x},${z}`);
    }
  }
}

// Shared module-level geometries (allocated once, never per render)
const CELL_BOX_GEO = new THREE.BoxGeometry(1, PLATE_H, 1);
const STUD_GEO = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 10);
const PLINTH_GEO = new THREE.BoxGeometry(
  WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 0.4,
  0.32,
  WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 0.4
);
const HOUSE_UNDER_SLAB_GEO = new THREE.BoxGeometry(30, PLATE_H, 22);
const STARFISH_ARM_GEO = new THREE.BoxGeometry(0.68, 0.12, 0.16);
const SHELL_DOME_GEO = new THREE.CylinderGeometry(0.18, 0.32, 0.16, 8);
const BUCKET_GEO = new THREE.CylinderGeometry(0.32, 0.24, 0.48, 12);
const CASTLE_TOWER_GEO = new THREE.CylinderGeometry(0.24, 0.28, 0.56, 10);
const CASTLE_BASE_GEO = new THREE.BoxGeometry(1.1, 0.36, 1.1);
const FLAG_POLE_GEO = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6);
const FLAG_CLOTH_GEO = new THREE.BoxGeometry(0.32, 0.2, 0.06);

interface InstancedZoneProps {
  positions: [number, number][];
  color: string;
  renderStuds?: boolean;
}

const InstancedGroundZone: React.FC<InstancedZoneProps> = ({
  positions,
  color,
  renderStuds = true,
}) => {
  const slabRef = useRef<THREE.InstancedMesh>(null);
  const studRef = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => getLegoMaterial(color), [color]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    if (slabRef.current) {
      for (let i = 0; i < positions.length; i++) {
        const [cx, cz] = positions[i];
        dummy.position.set(cx, GROUND_Y - PLATE_H / 2, cz);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        slabRef.current.setMatrixAt(i, dummy.matrix);
      }
      slabRef.current.instanceMatrix.needsUpdate = true;
      slabRef.current.computeBoundingSphere();
    }

    if (studRef.current && renderStuds) {
      for (let i = 0; i < positions.length; i++) {
        const [cx, cz] = positions[i];
        dummy.position.set(cx, GROUND_Y + STUD_HEIGHT / 2, cz);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        studRef.current.setMatrixAt(i, dummy.matrix);
      }
      studRef.current.instanceMatrix.needsUpdate = true;
      studRef.current.computeBoundingSphere();
    }
  }, [positions, renderStuds]);

  if (positions.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={slabRef}
        args={[CELL_BOX_GEO, material, positions.length]}
        receiveShadow
        frustumCulled={false}
      />
      {renderStuds && (
        <instancedMesh
          ref={studRef}
          args={[STUD_GEO, material, positions.length]}
          receiveShadow
          castShadow
          frustumCulled={false}
        />
      )}
    </group>
  );
};

/**
 * Small beach props snapped onto the sandy beach corner for tactile LEGO diorama charm.
 */
const BeachDetails: React.FC = () => {
  const orangeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.orange), []);
  const coralMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const offWhiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.offWhite), []);
  const sandMat = useMemo(() => getLegoMaterial(LEGO_COLORS.sand), []);
  const sandDarkMat = useMemo(() => getLegoMaterial(LEGO_COLORS.sandDark), []);
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);

  return (
    <group name="beach-details">
      {/* Orange LEGO starfish near the wet shoreline */}
      <group position={[16.5, GROUND_Y + 0.08, -14.5]} rotation={[0, 0.4, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            geometry={STARFISH_ARM_GEO}
            material={orangeMat}
            rotation={[0, (i * Math.PI * 2) / 5, 0]}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      {/* Mini LEGO seashell near east beach */}
      <mesh
        position={[19.5, GROUND_Y + 0.08, -8.5]}
        geometry={SHELL_DOME_GEO}
        material={offWhiteMat}
        castShadow
        receiveShadow
      />
      <mesh
        position={[14.5, GROUND_Y + 0.08, -18.5]}
        geometry={SHELL_DOME_GEO}
        material={offWhiteMat}
        castShadow
        receiveShadow
      />

      {/* Tiny LEGO sandcastle & red beach bucket on dry beach sand */}
      <group position={[13.5, GROUND_Y, -15.5]}>
        <mesh
          position={[0, 0.18, 0]}
          geometry={CASTLE_BASE_GEO}
          material={sandMat}
          castShadow
          receiveShadow
        />
        {[
          [-0.4, -0.4],
          [0.4, -0.4],
          [-0.4, 0.4],
          [0.4, 0.4],
        ].map(([x, z], idx) => (
          <mesh
            key={idx}
            position={[x, 0.44, z]}
            geometry={CASTLE_TOWER_GEO}
            material={sandDarkMat}
            castShadow
            receiveShadow
          />
        ))}
        {/* Tiny red beach flag on the sandcastle */}
        <mesh position={[0, 0.72, 0]} geometry={FLAG_POLE_GEO} material={yellowMat} castShadow />
        <mesh position={[0.16, 0.96, 0]} geometry={FLAG_CLOTH_GEO} material={coralMat} castShadow />
        {/* Red sand bucket beside the castle */}
        <mesh
          position={[1.15, 0.24, 0.45]}
          geometry={BUCKET_GEO}
          material={coralMat}
          castShadow
          receiveShadow
        />
      </group>
    </group>
  );
};

export const Baseplate: React.FC = () => {
  const {
    sandStuds,
    sandDarkStuds,
    brightGreenStuds,
    greenStuds,
    flatPathUnderCells,
  } = useMemo(() => {
    const sand: [number, number][] = [];
    const sandDark: [number, number][] = [];
    const brightGreen: [number, number][] = [];
    const green: [number, number][] = [];
    const pathUnder: [number, number][] = [];

    for (let gz = WORLD_BOUNDS.minZ; gz < WORLD_BOUNDS.maxZ; gz++) {
      for (let gx = WORLD_BOUNDS.minX; gx < WORLD_BOUNDS.maxX; gx++) {
        // Skip hidden house interior footprint x: [-15, 15], z: [-11, 11]
        if (gx >= -15 && gx < 15 && gz >= -11 && gz < 11) {
          continue;
        }

        const zone = getCellZone(gx, gz);
        if (zone === 'sea') {
          continue;
        }

        const cx = gx + 0.5;
        const cz = gz + 0.5;

        // Cells under smooth stepping tiles, GroundFloor verandah porch (z: 12..15.2),
        // or front entry step (x: -2.5..2.5, z: 15.05..15.95) get a flat slab without studs
        const underVerandah = gx >= -16 && gx < 16 && gz >= 12 && gz < 15;
        const underEntryStep = gx >= -3 && gx <= 2 && gz === 15;
        if (underVerandah || underEntryStep || STEPPING_TILE_CELLS.has(`${gx},${gz}`)) {
          pathUnder.push([cx, cz]);
          continue;
        }

        if (zone === 'sand') {
          sand.push([cx, cz]);
        } else if (zone === 'sandDark') {
          sandDark.push([cx, cz]);
        } else if (zone === 'brightGreen') {
          brightGreen.push([cx, cz]);
        } else {
          green.push([cx, cz]);
        }
      }
    }

    return {
      sandStuds: sand,
      sandDarkStuds: sandDark,
      brightGreenStuds: brightGreen,
      greenStuds: green,
      flatPathUnderCells: pathUnder,
    };
  }, []);

  const plinthMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.darkWood, { roughness: 0.55 }),
    []
  );
  const underHouseMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.sandDark, { roughness: 0.4 }),
    []
  );

  return (
    <group name="lego-baseplate">
      {/* Subtle dark museum-style baseplate plinth underside */}
      <mesh
        position={[0, GROUND_Y - PLATE_H - 0.16, 0]}
        geometry={PLINTH_GEO}
        material={plinthMat}
        receiveShadow
      />

      {/* Single hidden baseplate slab underneath the house footprint (saves 660+ studs) */}
      <mesh
        position={[0, GROUND_Y - PLATE_H / 2, 0]}
        geometry={HOUSE_UNDER_SLAB_GEO}
        material={underHouseMat}
        receiveShadow
      />

      {/* Instanced baseplate cells + studs per color zone */}
      <InstancedGroundZone positions={sandStuds} color={LEGO_COLORS.sand} />
      <InstancedGroundZone positions={sandDarkStuds} color={LEGO_COLORS.sandDark} />
      <InstancedGroundZone positions={brightGreenStuds} color={LEGO_COLORS.brightGreen} />
      <InstancedGroundZone positions={greenStuds} color={LEGO_COLORS.green} />
      <InstancedGroundZone
        positions={flatPathUnderCells}
        color={LEGO_COLORS.brightGreen}
        renderStuds={false}
      />

      {/* Smooth LEGO stepping-stone pathway tiles leading from front-center */}
      <group name="front-stepping-path">
        {STEPPING_TILES.map((tile, idx) => {
          const cx = tile.gx + tile.w / 2;
          const cz = tile.gz + tile.d / 2;
          return (
            <Tile
              key={idx}
              position={[cx, GROUND_Y, cz]}
              size={[tile.w, tile.d]}
              height={0.2}
              color={tile.color}
            />
          );
        })}
      </group>

      {/* Low LEGO stepped sand contour plates along far-left edge */}
      <group name="sand-contours">
        <Plate
          position={[-26.5, GROUND_Y, -19.5]}
          size={[3, 1, 5]}
          color={LEGO_COLORS.sand}
        />
        <Plate
          position={[-26.5, GROUND_Y, 9.0]}
          size={[3, 1, 4]}
          color={LEGO_COLORS.sand}
        />
      </group>

      <BeachDetails />
    </group>
  );
};
