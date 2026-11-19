import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LEGO_COLORS } from '../../lib/colors';
import { getEmissiveMaterial, getLegoMaterial } from '../../lib/materials';
import { GROUND_Y, STUD_RADIUS, WORLD_BOUNDS } from '../../lib/layout';
import { getSeaDepth, isSeaCell } from './Baseplate';

export interface SeaProps {
  isNight?: boolean;
}

interface SeaCell {
  gx: number;
  gz: number;
  cx: number;
  cz: number;
  depth: number;
  phase: number;
}

interface FoamCell {
  cx: number;
  cz: number;
  phase: number;
  scaleX: number;
  scaleZ: number;
  rotY: number;
  isShore: boolean;
}

// Shared static geometries
const SHALLOW_BED_GEO = new THREE.BoxGeometry(1, 0.22, 1);
const MID_BED_GEO = new THREE.BoxGeometry(1, 0.14, 1);
const DEEP_BED_GEO = new THREE.BoxGeometry(1, 0.08, 1);
const BED_STUD_GEO = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, 0.14, 10);
const WATER_TILE_GEO = new THREE.BoxGeometry(0.97, 0.14, 0.97);
const FOAM_TILE_GEO = new THREE.BoxGeometry(0.76, 0.09, 0.46);
const FOAM_DOT_GEO = new THREE.CylinderGeometry(0.24, 0.26, 0.1, 10);

const BUOY_BASE_GEO = new THREE.CylinderGeometry(0.52, 0.56, 0.34, 12);
const BUOY_RING_GEO = new THREE.CylinderGeometry(0.42, 0.46, 0.28, 12);
const BUOY_TOP_GEO = new THREE.CylinderGeometry(0.18, 0.32, 0.34, 10);
const BUOY_LAMP_GEO = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 10);

const CRAB_BODY_GEO = new THREE.BoxGeometry(0.56, 0.22, 0.42);
const CRAB_CLAW_GEO = new THREE.BoxGeometry(0.22, 0.16, 0.28);
const CRAB_EYE_GEO = new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8);

export const Sea: React.FC<SeaProps> = ({ isNight = false }) => {
  const shallowBedRef = useRef<THREE.InstancedMesh>(null);
  const shallowStudRef = useRef<THREE.InstancedMesh>(null);
  const midBedRef = useRef<THREE.InstancedMesh>(null);
  const midStudRef = useRef<THREE.InstancedMesh>(null);
  const deepBedRef = useRef<THREE.InstancedMesh>(null);
  const deepStudRef = useRef<THREE.InstancedMesh>(null);

  const waterTilesRef = useRef<THREE.InstancedMesh>(null);
  const foamTilesRef = useRef<THREE.InstancedMesh>(null);
  const foamDotsRef = useRef<THREE.InstancedMesh>(null);
  const buoyRef = useRef<THREE.Group>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { shallowCells, midCells, deepCells, allSeaCells, foamTiles, foamDots } = useMemo(() => {
    const shallow: SeaCell[] = [];
    const mid: SeaCell[] = [];
    const deep: SeaCell[] = [];
    const all: SeaCell[] = [];
    const fTiles: FoamCell[] = [];
    const fDots: FoamCell[] = [];

    for (let gz = WORLD_BOUNDS.minZ; gz < -6; gz++) {
      for (let gx = 12; gx < WORLD_BOUNDS.maxX; gx++) {
        if (!isSeaCell(gx, gz)) continue;
        const depth = getSeaDepth(gx, gz);
        const cx = gx + 0.5;
        const cz = gz + 0.5;
        const phase = gx * 0.46 + gz * 0.42;
        const cell: SeaCell = { gx, gz, cx, cz, depth, phase };
        all.push(cell);

        if (depth <= 1) {
          shallow.push(cell);
          // Shoreline lapping foam along the stepped coast
          fTiles.push({
            cx: cx - 0.06,
            cz: cz + 0.06,
            phase: (gx + gz) * 0.55,
            scaleX: 0.95 + ((Math.abs(gx * 7 + gz * 13) % 3) * 0.15),
            scaleZ: 0.9 + ((Math.abs(gx * 11 + gz * 5) % 3) * 0.12),
            rotY: Math.PI / 4,
            isShore: true,
          });
          if ((gx + gz) % 2 === 0) {
            fDots.push({
              cx: cx - 0.34,
              cz: cz + 0.3,
              phase: (gx + gz) * 0.55 + 0.6,
              scaleX: 1,
              scaleZ: 1,
              rotY: 0,
              isShore: true,
            });
          }
        } else if (depth <= 3) {
          mid.push(cell);
          if (depth === 2 && Math.abs(gx * 5 + gz * 3) % 3 === 0) {
            fDots.push({
              cx,
              cz,
              phase: phase + 1.1,
              scaleX: 0.85,
              scaleZ: 0.85,
              rotY: 0,
              isShore: true,
            });
          }
        } else {
          deep.push(cell);
          // Gentle white wave crest tiles scattered across deeper water
          if (Math.abs(gx * 13 + gz * 7) % 11 === 0) {
            fTiles.push({
              cx,
              cz,
              phase: phase + 0.4,
              scaleX: 1.1,
              scaleZ: 0.72,
              rotY: Math.PI / 4,
              isShore: false,
            });
          }
        }
      }
    }

    return {
      shallowCells: shallow,
      midCells: mid,
      deepCells: deep,
      allSeaCells: all,
      foamTiles: fTiles,
      foamDots: fDots,
    };
  }, []);

  // Cached materials
  const shallowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.lightBlue), []);
  const midMat = useMemo(() => getLegoMaterial(LEGO_COLORS.seaBlue), []);
  const deepMat = useMemo(() => getLegoMaterial(LEGO_COLORS.seaDeep), []);
  const waterMat = useMemo(
    () =>
      getLegoMaterial(isNight ? LEGO_COLORS.seaDeep : LEGO_COLORS.seaBlue, {
        transparent: true,
        opacity: 0.72,
        roughness: 0.15,
        metalness: 0.05,
      }),
    [isNight]
  );
  const foamMat = useMemo(
    () =>
      getLegoMaterial(LEGO_COLORS.foamWhite, {
        roughness: 0.22,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );
  const redMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const buoyLampMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.warmYellow, 2.2)
        : getLegoMaterial(LEGO_COLORS.warmYellow, { roughness: 0.15 }),
    [isNight]
  );

  // Initialize static stepped seabed slabs & underwater LEGO studs
  useLayoutEffect(() => {
    const populateTier = (
      bedMesh: THREE.InstancedMesh | null,
      studMesh: THREE.InstancedMesh | null,
      cells: SeaCell[],
      bedCenterY: number,
      studCenterY: number
    ) => {
      if (bedMesh) {
        for (let i = 0; i < cells.length; i++) {
          dummy.position.set(cells[i].cx, bedCenterY, cells[i].cz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          bedMesh.setMatrixAt(i, dummy.matrix);
        }
        bedMesh.instanceMatrix.needsUpdate = true;
        bedMesh.computeBoundingSphere();
      }
      if (studMesh) {
        for (let i = 0; i < cells.length; i++) {
          dummy.position.set(cells[i].cx, studCenterY, cells[i].cz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          studMesh.setMatrixAt(i, dummy.matrix);
        }
        studMesh.instanceMatrix.needsUpdate = true;
        studMesh.computeBoundingSphere();
      }
    };

    populateTier(
      shallowBedRef.current,
      shallowStudRef.current,
      shallowCells,
      GROUND_Y - 0.29,
      GROUND_Y - 0.13
    );
    populateTier(
      midBedRef.current,
      midStudRef.current,
      midCells,
      GROUND_Y - 0.33,
      GROUND_Y - 0.21
    );
    populateTier(
      deepBedRef.current,
      deepStudRef.current,
      deepCells,
      GROUND_Y - 0.36,
      GROUND_Y - 0.27
    );

    // Initialize animated water & foam matrices on frame 0 so nothing flashes at origin
    if (waterTilesRef.current) {
      for (let i = 0; i < allSeaCells.length; i++) {
        const c = allSeaCells[i];
        dummy.position.set(c.cx, GROUND_Y - 0.055, c.cz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        waterTilesRef.current.setMatrixAt(i, dummy.matrix);
      }
      waterTilesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (foamTilesRef.current) {
      for (let i = 0; i < foamTiles.length; i++) {
        const f = foamTiles[i];
        dummy.position.set(f.cx, GROUND_Y + (f.isShore ? 0.035 : 0.02), f.cz);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scaleX, 1, f.scaleZ);
        dummy.updateMatrix();
        foamTilesRef.current.setMatrixAt(i, dummy.matrix);
      }
      foamTilesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (foamDotsRef.current) {
      for (let i = 0; i < foamDots.length; i++) {
        const d = foamDots[i];
        dummy.position.set(d.cx, GROUND_Y + 0.045, d.cz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(d.scaleX, 1, d.scaleZ);
        dummy.updateMatrix();
        foamDotsRef.current.setMatrixAt(i, dummy.matrix);
      }
      foamDotsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [shallowCells, midCells, deepCells, allSeaCells, foamTiles, foamDots, dummy]);

  // Animate translucent water tiles, lapping white wave foam, and bobbing LEGO buoy
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (waterTilesRef.current) {
      for (let i = 0; i < allSeaCells.length; i++) {
        const c = allSeaCells[i];
        const swell =
          Math.sin(t * 2.0 + c.phase) * 0.048 +
          Math.cos(t * 1.35 - c.gx * 0.28 + c.gz * 0.52) * 0.024;
        const depthAtten = c.depth === 1 ? 0.65 : 1.0;
        const y = GROUND_Y - 0.055 + swell * depthAtten;
        const tilt = Math.cos(t * 2.0 + c.phase) * 0.035 * depthAtten;

        dummy.position.set(c.cx, y, c.cz);
        dummy.rotation.set(tilt, 0, -tilt);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        waterTilesRef.current.setMatrixAt(i, dummy.matrix);
      }
      waterTilesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (foamTilesRef.current) {
      for (let i = 0; i < foamTiles.length; i++) {
        const f = foamTiles[i];
        const wave = Math.sin(t * 2.2 + f.phase);
        const surge = f.isShore ? wave * 0.2 : wave * 0.06;
        const y = GROUND_Y + (f.isShore ? 0.035 : 0.02) + wave * 0.035;
        const pulse = 0.85 + 0.18 * (0.5 + 0.5 * wave);

        dummy.position.set(f.cx - surge * 0.7, y, f.cz + surge * 0.7);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scaleX * pulse, 1, f.scaleZ * pulse);
        dummy.updateMatrix();
        foamTilesRef.current.setMatrixAt(i, dummy.matrix);
      }
      foamTilesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (foamDotsRef.current) {
      for (let i = 0; i < foamDots.length; i++) {
        const d = foamDots[i];
        const wave = Math.sin(t * 2.3 + d.phase);
        const surge = wave * 0.18;
        const pulse = 0.72 + 0.34 * (0.5 + 0.5 * wave);
        dummy.position.set(
          d.cx - surge * 0.7,
          GROUND_Y + 0.045 + wave * 0.03,
          d.cz + surge * 0.7
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(d.scaleX * pulse, 1, d.scaleZ * pulse);
        dummy.updateMatrix();
        foamDotsRef.current.setMatrixAt(i, dummy.matrix);
      }
      foamDotsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (buoyRef.current) {
      buoyRef.current.position.y = GROUND_Y + 0.08 + Math.sin(t * 2.1 + 1.2) * 0.08;
      buoyRef.current.rotation.z = Math.sin(t * 1.7 + 0.5) * 0.11;
      buoyRef.current.rotation.x = Math.cos(t * 1.45) * 0.09;
    }
  });

  return (
    <group name="tropical-lego-sea">
      {/* Stepped LEGO seabed tiers + underwater studs */}
      {shallowCells.length > 0 && (
        <>
          <instancedMesh
            ref={shallowBedRef}
            args={[SHALLOW_BED_GEO, shallowMat, shallowCells.length]}
            receiveShadow
          />
          <instancedMesh
            ref={shallowStudRef}
            args={[BED_STUD_GEO, shallowMat, shallowCells.length]}
            receiveShadow
          />
        </>
      )}
      {midCells.length > 0 && (
        <>
          <instancedMesh
            ref={midBedRef}
            args={[MID_BED_GEO, midMat, midCells.length]}
            receiveShadow
          />
          <instancedMesh
            ref={midStudRef}
            args={[BED_STUD_GEO, midMat, midCells.length]}
            receiveShadow
          />
        </>
      )}
      {deepCells.length > 0 && (
        <>
          <instancedMesh
            ref={deepBedRef}
            args={[DEEP_BED_GEO, deepMat, deepCells.length]}
            receiveShadow
          />
          <instancedMesh
            ref={deepStudRef}
            args={[BED_STUD_GEO, deepMat, deepCells.length]}
            receiveShadow
          />
        </>
      )}

      {/* Translucent animated LEGO ocean surface */}
      {allSeaCells.length > 0 && (
        <instancedMesh
          ref={waterTilesRef}
          args={[WATER_TILE_GEO, waterMat, allSeaCells.length]}
          receiveShadow
          frustumCulled={false}
        />
      )}

      {/* Animated white LEGO wave foam tiles & spray studs */}
      {foamTiles.length > 0 && (
        <instancedMesh
          ref={foamTilesRef}
          args={[FOAM_TILE_GEO, foamMat, foamTiles.length]}
          frustumCulled={false}
        />
      )}
      {foamDots.length > 0 && (
        <instancedMesh
          ref={foamDotsRef}
          args={[FOAM_DOT_GEO, foamMat, foamDots.length]}
          frustumCulled={false}
        />
      )}

      {/* Bobbing LEGO beach buoy offshore */}
      <group ref={buoyRef} position={[23.5, GROUND_Y + 0.08, -16.5]}>
        <mesh position={[0, 0.12, 0]} geometry={BUOY_BASE_GEO} material={redMat} castShadow />
        <mesh position={[0, 0.42, 0]} geometry={BUOY_RING_GEO} material={whiteMat} castShadow />
        <mesh position={[0, 0.72, 0]} geometry={BUOY_TOP_GEO} material={redMat} castShadow />
        <mesh position={[0, 0.98, 0]} geometry={BUOY_LAMP_GEO} material={buoyLampMat} />
      </group>

      {/* Cute little LEGO red crab perched on the wet beach sand edge */}
      <group position={[17.5, GROUND_Y + 0.11, -13.5]} rotation={[0, -0.7, 0]}>
        <mesh geometry={CRAB_BODY_GEO} material={redMat} castShadow receiveShadow />
        <mesh position={[-0.36, 0.04, 0.24]} rotation={[0, 0.45, 0]} geometry={CRAB_CLAW_GEO} material={redMat} castShadow />
        <mesh position={[0.36, 0.04, 0.24]} rotation={[0, -0.45, 0]} geometry={CRAB_CLAW_GEO} material={redMat} castShadow />
        <mesh position={[-0.14, 0.16, 0.16]} geometry={CRAB_EYE_GEO} material={blackMat} />
        <mesh position={[0.14, 0.16, 0.16]} geometry={CRAB_EYE_GEO} material={blackMat} />
      </group>
    </group>
  );
};
