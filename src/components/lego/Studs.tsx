import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../../types';
import { STUD_HEIGHT, STUD_RADIUS } from '../../lib/layout';
import { getLegoMaterial, type LegoMaterialOptions } from '../../lib/materials';

const SHARED_STUD_GEOMETRY = new THREE.CylinderGeometry(
  STUD_RADIUS,
  STUD_RADIUS,
  STUD_HEIGHT,
  12
);

const tempDummy = new THREE.Object3D();

export interface StudsProps {
  positions: Vec3[];
  color: string;
  materialOpts?: LegoMaterialOptions;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export const Studs: React.FC<StudsProps> = ({
  positions,
  color,
  materialOpts,
  castShadow = true,
  receiveShadow = true,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(
    () => getLegoMaterial(color, materialOpts),
    [
      color,
      materialOpts?.roughness,
      materialOpts?.metalness,
      materialOpts?.transparent,
      materialOpts?.opacity,
      materialOpts?.emissive,
      materialOpts?.emissiveIntensity,
    ]
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || positions.length === 0) return;

    for (let i = 0; i < positions.length; i++) {
      const [x, y, z] = positions[i];
      tempDummy.position.set(x, y + STUD_HEIGHT * 0.5, z);
      tempDummy.rotation.set(0, 0, 0);
      tempDummy.scale.set(1, 1, 1);
      tempDummy.updateMatrix();
      mesh.setMatrixAt(i, tempDummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions]);

  if (positions.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      key={positions.length}
      ref={meshRef}
      args={[SHARED_STUD_GEOMETRY, material, positions.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
};
