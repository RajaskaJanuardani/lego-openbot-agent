import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { PLATE_H, STUD_HEIGHT, STUD_RADIUS } from '../../lib/layout';

export interface BushProps {
  position: Vec3;
  scale?: number;
  color?: string;
  rotationY?: number;
  accentColor?: string;
}

// Shared static geometries (allocated once)
const BASE_PLATE_GEO = new THREE.BoxGeometry(1.85, PLATE_H, 1.05);
const LOBE_GEO = new THREE.CylinderGeometry(0.58, 0.68, 0.52, 8);
const TOP_LOBE_GEO = new THREE.CylinderGeometry(0.46, 0.56, 0.44, 8);
const STUD_GEO = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 10);
const BERRY_GEO = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 8);

interface TransformItem {
  pos: [number, number, number];
  rotY: number;
  sx: number;
  sy: number;
  sz: number;
}

interface BushBatch {
  basePlates: TransformItem[];
  darkLobes: TransformItem[];
  midLobes: TransformItem[];
  brightTops: TransformItem[];
  limeTops: TransformItem[];
  greenStuds: TransformItem[];
  brightStuds: TransformItem[];
  redAccents: TransformItem[];
  yellowAccents: TransformItem[];
  pinkAccents: TransformItem[];
}

function buildBushParts(item: BushProps, batch: BushBatch): void {
  const [bx, by, bz] = item.position;
  const s = item.scale ?? 1;
  const rotY = item.rotationY ?? ((bx * 1.7 + bz * 2.3) % (Math.PI * 2));
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);

  const toWorld = (lx: number, ly: number, lz: number): [number, number, number] => [
    bx + (lx * cosR - lz * sinR) * s,
    by + ly * s,
    bz + (lx * sinR + lz * cosR) * s,
  ];

  // Cross-layered dark green LEGO leaf baseplates at ground level
  batch.basePlates.push({
    pos: toWorld(0, PLATE_H * 0.5, 0),
    rotY,
    sx: s,
    sy: s,
    sz: s,
  });
  batch.basePlates.push({
    pos: toWorld(0, PLATE_H * 0.5, 0),
    rotY: rotY + Math.PI / 2,
    sx: s,
    sy: s,
    sz: s,
  });

  // Lower/mid lush rounded LEGO foliage clusters
  const lowerLobes: { x: number; y: number; z: number; r: number; dark: boolean }[] = [
    { x: -0.45, y: 0.62, z: 0.28, r: 1.05, dark: true },
    { x: 0.48, y: 0.6, z: -0.22, r: 1.0, dark: false },
    { x: -0.18, y: 0.65, z: -0.46, r: 0.96, dark: true },
    { x: 0.34, y: 0.64, z: 0.44, r: 0.94, dark: false },
  ];

  const preferDark = item.color === LEGO_COLORS.darkGreen;
  for (const lobe of lowerLobes) {
    const t: TransformItem = {
      pos: toWorld(lobe.x, lobe.y, lobe.z),
      rotY: rotY + lobe.x,
      sx: s * lobe.r,
      sy: s,
      sz: s * lobe.r,
    };
    if (lobe.dark || preferDark) {
      batch.darkLobes.push(t);
    } else {
      batch.midLobes.push(t);
    }

    // Stud on lower lobe shoulder
    batch.greenStuds.push({
      pos: toWorld(lobe.x * 1.05, lobe.y + 0.26 + STUD_HEIGHT * 0.5, lobe.z * 1.05),
      rotY: 0,
      sx: s,
      sy: s,
      sz: s,
    });
  }

  // Sunlit upper LEGO foliage clusters
  const upperLobes: { x: number; y: number; z: number; r: number; lime: boolean }[] = [
    { x: 0.0, y: 1.06, z: 0.04, r: 1.12, lime: false },
    { x: -0.34, y: 0.96, z: -0.14, r: 0.84, lime: true },
    { x: 0.3, y: 0.94, z: 0.16, r: 0.82, lime: false },
  ];

  for (const top of upperLobes) {
    const t: TransformItem = {
      pos: toWorld(top.x, top.y, top.z),
      rotY: rotY + top.z * 2,
      sx: s * top.r,
      sy: s,
      sz: s * top.r,
    };
    if (top.lime || item.color === LEGO_COLORS.limeGreen) {
      batch.limeTops.push(t);
    } else {
      batch.brightTops.push(t);
    }

    batch.brightStuds.push({
      pos: toWorld(top.x, top.y + 0.22 + STUD_HEIGHT * 0.5, top.z),
      rotY: 0,
      sx: s,
      sy: s,
      sz: s,
    });
  }

  // Optional tropical LEGO blossom/berry studs nestled on the bush
  if (item.accentColor) {
    const targetAccent =
      item.accentColor === LEGO_COLORS.yellow
        ? batch.yellowAccents
        : item.accentColor === LEGO_COLORS.pinkCushion
          ? batch.pinkAccents
          : batch.redAccents;

    targetAccent.push(
      {
        pos: toWorld(0.42, 1.02, 0.36),
        rotY: 0,
        sx: s,
        sy: s,
        sz: s,
      },
      {
        pos: toWorld(-0.46, 0.98, 0.22),
        rotY: 0,
        sx: s,
        sy: s,
        sz: s,
      }
    );
  }
}

interface InstancedBatchMeshProps {
  geometry: THREE.BufferGeometry;
  color: string;
  items: TransformItem[];
  castShadow?: boolean;
}

const InstancedBatchMesh: React.FC<InstancedBatchMeshProps> = ({
  geometry,
  color,
  items,
  castShadow = true,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => getLegoMaterial(color), [color]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      dummy.position.set(it.pos[0], it.pos[1], it.pos[2]);
      dummy.rotation.set(0, it.rotY, 0);
      dummy.scale.set(it.sx, it.sy, it.sz);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  );
};

/**
 * Renders many tropical LEGO bushes across the entire yard using shared InstancedMeshes.
 */
export const BushField: React.FC<{ items: BushProps[] }> = ({ items }) => {
  const batch = useMemo<BushBatch>(() => {
    const b: BushBatch = {
      basePlates: [],
      darkLobes: [],
      midLobes: [],
      brightTops: [],
      limeTops: [],
      greenStuds: [],
      brightStuds: [],
      redAccents: [],
      yellowAccents: [],
      pinkAccents: [],
    };
    for (const item of items) {
      buildBushParts(item, b);
    }
    return b;
  }, [items]);

  return (
    <group name="lego-tropical-bushes">
      <InstancedBatchMesh geometry={BASE_PLATE_GEO} color={LEGO_COLORS.darkGreen} items={batch.basePlates} />
      <InstancedBatchMesh geometry={LOBE_GEO} color={LEGO_COLORS.darkGreen} items={batch.darkLobes} />
      <InstancedBatchMesh geometry={LOBE_GEO} color={LEGO_COLORS.green} items={batch.midLobes} />
      <InstancedBatchMesh geometry={TOP_LOBE_GEO} color={LEGO_COLORS.brightGreen} items={batch.brightTops} />
      <InstancedBatchMesh geometry={TOP_LOBE_GEO} color={LEGO_COLORS.limeGreen} items={batch.limeTops} />
      <InstancedBatchMesh geometry={STUD_GEO} color={LEGO_COLORS.green} items={batch.greenStuds} castShadow={false} />
      <InstancedBatchMesh geometry={STUD_GEO} color={LEGO_COLORS.brightGreen} items={batch.brightStuds} castShadow={false} />
      <InstancedBatchMesh geometry={BERRY_GEO} color={LEGO_COLORS.red} items={batch.redAccents} castShadow={false} />
      <InstancedBatchMesh geometry={BERRY_GEO} color={LEGO_COLORS.yellow} items={batch.yellowAccents} castShadow={false} />
      <InstancedBatchMesh geometry={BERRY_GEO} color={LEGO_COLORS.pinkCushion} items={batch.pinkAccents} castShadow={false} />
    </group>
  );
};

/**
 * Reusable single tropical LEGO bush component.
 */
export const Bush: React.FC<BushProps> = (props) => {
  const items = useMemo(() => [props], [props]);
  return <BushField items={items} />;
};
