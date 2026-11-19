import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import type { Vec3 } from '../../types';

export interface HammockProps {
  position?: Vec3;
  rotation?: Vec3;
  span?: number;
  anchorHeight?: number;
}

const spreaderGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8);
const ropeGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
const hookGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8);
const plankGeo = new THREE.BoxGeometry(0.46, 0.1, 1.24);
const pillowGeo = new THREE.BoxGeometry(0.58, 0.24, 0.85);
const tasselGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.22, 6);

/**
 * Suspended white fabric swing/hammock (ayunan/hammock kain putih) with wooden spreader bars,
 * angled suspension ropes anchored to ceiling brackets, throw pillow, and gentle breeze sway.
 * Local origin is floor center directly underneath the hammock.
 */
export const Hammock: React.FC<HammockProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  span = 3.8,
  anchorHeight = 6.0,
}) => {
  const swingRef = useRef<THREE.Group>(null);

  const fabricMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white, { roughness: 0.45 }), []);
  const creamMat = useMemo(() => getLegoMaterial(LEGO_COLORS.offWhite, { roughness: 0.45 }), []);
  const woodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const ropeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.khaki, { roughness: 0.5 }), []);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35, roughness: 0.25 }), []);
  const pillowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkLight, { roughness: 0.4 }), []);

  // Gentle organic hammock sway
  useFrame(({ clock }) => {
    if (swingRef.current) {
      const t = clock.getElapsedTime();
      swingRef.current.rotation.x = Math.sin(t * 0.9) * 0.045;
    }
  });

  const halfSpan = span / 2;
  const spreaderX = halfSpan - 0.55;
  const lowY = 1.15; // Lowest point of hammock sag above floor
  const spreaderY = 1.95; // Height of wooden spreader bars

  // Build 7 curved catenary fabric segments along X between the two spreader bars
  const segments = useMemo(() => {
    const count = 7;
    const arr: { x: number; y: number; rotZ: number }[] = [];
    for (let i = 0; i < count; i++) {
      const u = (i / (count - 1)) * 2 - 1; // -1..+1
      const x = u * (spreaderX - 0.16);
      const y = lowY + (spreaderY - lowY) * (u * u);
      const slope = 2 * (spreaderY - lowY) * (u / (spreaderX - 0.16));
      const rotZ = Math.atan(slope);
      arr.push({ x, y, rotZ });
    }
    return arr;
  }, [spreaderX]);

  // Helper to compute midpoint, length, and quaternion for a cylinder rope from p1 to p2
  const ropes = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [
      // Left spreader ends up to left ceiling ring
      [new THREE.Vector3(-spreaderX, spreaderY, -0.58), new THREE.Vector3(-halfSpan, anchorHeight, 0)],
      [new THREE.Vector3(-spreaderX, spreaderY, 0.58), new THREE.Vector3(-halfSpan, anchorHeight, 0)],
      [new THREE.Vector3(-spreaderX, spreaderY, 0), new THREE.Vector3(-halfSpan, anchorHeight, 0)],
      // Right spreader ends up to right ceiling ring
      [new THREE.Vector3(spreaderX, spreaderY, -0.58), new THREE.Vector3(halfSpan, anchorHeight, 0)],
      [new THREE.Vector3(spreaderX, spreaderY, 0.58), new THREE.Vector3(halfSpan, anchorHeight, 0)],
      [new THREE.Vector3(spreaderX, spreaderY, 0), new THREE.Vector3(halfSpan, anchorHeight, 0)],
    ];

    const up = new THREE.Vector3(0, 1, 0);
    return pairs.map(([a, b]) => {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      return { mid, len, quat };
    });
  }, [spreaderX, halfSpan, anchorHeight]);

  return (
    <group position={position} rotation={rotation}>
      {/* Ceiling/beam anchor hooks at anchorHeight */}
      <mesh geometry={hookGeo} material={goldMat} position={[-halfSpan, anchorHeight, 0]} />
      <mesh geometry={hookGeo} material={goldMat} position={[halfSpan, anchorHeight, 0]} />

      {/* Swinging group pivoted around top anchor line (y = anchorHeight) */}
      <group position={[0, anchorHeight, 0]} ref={swingRef}>
        <group position={[0, -anchorHeight, 0]}>
          {/* Suspension ropes */}
          {ropes.map((r, i) => (
            <mesh
              key={i}
              geometry={ropeGeo}
              material={ropeMat}
              position={r.mid}
              quaternion={r.quat}
              scale={[1, r.len, 1]}
            />
          ))}

          {/* Left & Right wooden spreader bars */}
          <mesh
            geometry={spreaderGeo}
            material={woodMat}
            position={[-spreaderX, spreaderY, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          />
          <mesh
            geometry={spreaderGeo}
            material={woodMat}
            position={[spreaderX, spreaderY, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          />

          {/* Catenary white fabric bed segments */}
          {segments.map((seg, i) => (
            <group key={i} position={[seg.x, seg.y, 0]} rotation={[0, 0, seg.rotZ]}>
              <mesh
                geometry={plankGeo}
                material={i % 2 === 0 ? fabricMat : creamMat}
                castShadow
                receiveShadow
              />
              {/* Cute fringe tassels hanging on front & back edges */}
              <mesh geometry={tasselGeo} material={creamMat} position={[0, -0.14, 0.62]} />
              <mesh geometry={tasselGeo} material={creamMat} position={[0, -0.14, -0.62]} />
            </group>
          ))}

          {/* Cozy pink pillow tucked on left end of hammock */}
          <mesh
            geometry={pillowGeo}
            material={pillowMat}
            position={[-0.75, lowY + 0.34, 0]}
            rotation={[0, 0, -0.35]}
            castShadow
          />
        </group>
      </group>
    </group>
  );
};
