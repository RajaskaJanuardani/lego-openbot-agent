import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';

export interface PalmTreeProps {
  position: Vec3;
  height?: number;
  lean?: [number, number];
  rotationY?: number;
}

// Shared static module-level geometries (allocated once)
const ROOT_BASE_GEO = new THREE.CylinderGeometry(0.68, 0.82, 0.34, 8);
const ROOT_TOE_GEO = new THREE.BoxGeometry(0.44, 0.28, 0.65);
const TRUNK_SEG_GEO = new THREE.CylinderGeometry(0.46, 0.35, 1.05, 10);
const TRUNK_COLLAR_GEO = new THREE.CylinderGeometry(0.51, 0.43, 0.22, 10);
const CROWN_HUB_GEO = new THREE.CylinderGeometry(0.54, 0.42, 0.56, 8);
const COCONUT_GEO = new THREE.SphereGeometry(0.34, 10, 8);
const LEAF_RIB_GEO = new THREE.BoxGeometry(0.24, 0.14, 0.68);
const LEAF_BLADE_GEO = new THREE.BoxGeometry(0.44, 0.08, 1.05);
const LEAF_STUD_GEO = new THREE.CylinderGeometry(0.14, 0.14, 0.11, 8);

const UP_VEC = new THREE.Vector3(0, 1, 0);

interface InstanceTransform {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
}

function evalQuadBezier(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  t: number
): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z
  );
}

export const PalmTree: React.FC<PalmTreeProps> = ({
  position,
  height = 10,
  lean = [0.9, 0.5],
  rotationY = 0,
}) => {
  const trunkSegRef = useRef<THREE.InstancedMesh>(null);
  const trunkCollarRef = useRef<THREE.InstancedMesh>(null);
  const ribRef = useRef<THREE.InstancedMesh>(null);
  const darkLeafRef = useRef<THREE.InstancedMesh>(null);
  const midLeafRef = useRef<THREE.InstancedMesh>(null);
  const brightLeafRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.Group>(null);

  // Deterministic phase offset per world position so trees sway organically out of sync
  const swayPhase = useMemo(
    () => position[0] * 0.63 + position[2] * 0.47 + rotationY,
    [position, rotationY]
  );

  // Materials (all cached)
  const brownWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);
  const coconutMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkBrownBrick), []);
  const darkGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGreen), []);
  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.green), []);
  const brightGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brightGreen), []);

  // Precompute segmented curved trunk and arched multi-ring LEGO palm fronds
  const {
    trunkSegs,
    trunkCollars,
    crownPos,
    crownBaseEuler,
    ribSegs,
    darkLeaves,
    midLeaves,
    brightLeaves,
  } = useMemo(() => {
    const segCount = Math.max(6, Math.round(height / 1.02));
    const p0 = new THREE.Vector3(0, 0.2, 0);
    const p1 = new THREE.Vector3(lean[0] * 0.35, height * 0.54, lean[1] * 0.35);
    const p2 = new THREE.Vector3(lean[0], height, lean[1]);

    const tSegs: InstanceTransform[] = [];
    const tCollars: InstanceTransform[] = [];

    for (let i = 0; i < segCount; i++) {
      const t0 = i / segCount;
      const t1 = (i + 1) / segCount;
      const start = evalQuadBezier(p0, p1, p2, t0);
      const end = evalQuadBezier(p0, p1, p2, t1);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dir = end.clone().sub(start);
      const segLen = dir.length();
      dir.normalize();

      const quat = new THREE.Quaternion().setFromUnitVectors(UP_VEC, dir);
      const taper = 1.06 - (i / segCount) * 0.34;

      tSegs.push({
        pos: mid,
        quat,
        scale: new THREE.Vector3(taper, segLen / 1.02, taper),
      });

      // Raised LEGO trunk collar near the top of each segment
      const collarPos = start.clone().lerp(end, 0.82);
      tCollars.push({
        pos: collarPos,
        quat,
        scale: new THREE.Vector3(taper, 1, taper),
      });
    }

    // Gentle crown tilt aligned slightly with trunk tip tangent
    const tipTangent = evalQuadBezier(p0, p1, p2, 1.0)
      .sub(evalQuadBezier(p0, p1, p2, 0.85))
      .normalize();
    const tipQuat = new THREE.Quaternion().setFromUnitVectors(UP_VEC, tipTangent);
    const tipEuler = new THREE.Euler().setFromQuaternion(tipQuat);
    // Soften tilt to 45% so canopy stays nicely open toward the sky
    const baseEuler: [number, number, number] = [
      tipEuler.x * 0.45,
      tipEuler.y,
      tipEuler.z * 0.45,
    ];

    // Build 8 arching LEGO palm fronds (5 lower outer fronds + 3 upper inner fronds)
    const rSegs: InstanceTransform[] = [];
    const dLeaves: InstanceTransform[] = [];
    const mLeaves: InstanceTransform[] = [];
    const bLeaves: InstanceTransform[] = [];

    const frondConfigs = [
      // 5 outer wide-arching fronds
      ...Array.from({ length: 5 }, (_, idx) => ({
        angle: (idx * Math.PI * 2) / 5 + 0.12 * (idx % 2 === 0 ? 1 : -1),
        length: 4.15 + (idx % 2) * 0.25,
        rise: 1.45,
        droop: 1.75,
        yOffset: 0.16,
        tier: 'outer' as const,
      })),
      // 3 upper perkier inner fronds
      ...Array.from({ length: 3 }, (_, idx) => ({
        angle: (idx * Math.PI * 2) / 3 + Math.PI / 5,
        length: 3.15,
        rise: 2.05,
        droop: 0.85,
        yOffset: 0.34,
        tier: 'inner' as const,
      })),
    ];

    const segsPerFrond = 6;
    const tmpEuler = new THREE.Euler();

    for (const frond of frondConfigs) {
      const cosA = Math.cos(frond.angle);
      const sinA = Math.sin(frond.angle);

      const getFrondPoint = (u: number): THREE.Vector3 => {
        const r = 0.3 + u * frond.length;
        // Parabolic tropical arch: rises rapidly then droops smoothly at the tip
        const y = frond.yOffset + frond.rise * Math.sin(u * Math.PI * 0.78) - frond.droop * u * u;
        return new THREE.Vector3(cosA * r, y, sinA * r);
      };

      for (let s = 0; s < segsPerFrond; s++) {
        const u0 = s / segsPerFrond;
        const u1 = (s + 1) / segsPerFrond;
        const uMid = (u0 + u1) * 0.5;

        const pt0 = getFrondPoint(u0);
        const pt1 = getFrondPoint(u1);
        const ptMid = pt0.clone().add(pt1).multiplyScalar(0.5);
        const segVec = pt1.clone().sub(pt0);
        const segLen = segVec.length();

        // Compute pitch & yaw along the frond spine
        const horizLen = Math.hypot(segVec.x, segVec.z) || 0.001;
        const pitch = -Math.atan2(segVec.y, horizLen);
        const yaw = Math.atan2(segVec.x, segVec.z);

        // Central rib segment
        tmpEuler.set(pitch, yaw, 0, 'YXZ');
        const ribQuat = new THREE.Quaternion().setFromEuler(tmpEuler);
        const ribTaper = 1.0 - uMid * 0.42;

        rSegs.push({
          pos: ptMid,
          quat: ribQuat.clone(),
          scale: new THREE.Vector3(ribTaper, ribTaper, segLen / 0.62),
        });

        // Pair of LEGO serrated leaflets fanning left & right from the rib
        const widthProfile = Math.sin(Math.min(0.95, (uMid + 0.12) * Math.PI * 0.88));
        const bladeLength = 0.68 + widthProfile * 0.85;
        const bladeWidth = 0.72 + widthProfile * 0.42;
        const targetList =
          frond.tier === 'inner' || s >= segsPerFrond - 2
            ? bLeaves
            : s % 2 === 0
              ? mLeaves
              : dLeaves;

        for (const side of [-1, 1]) {
          // Local lateral offset rotated into frond frame
          const localOff = new THREE.Vector3(side * (0.32 + widthProfile * 0.28), -0.05, 0.08);
          localOff.applyQuaternion(ribQuat);
          const bladePos = ptMid.clone().add(localOff);

          // Sweep leaflets gracefully outward and droop slightly downward on the sides (V-profile)
          const bladeLocalEuler = new THREE.Euler(0.1, side * 0.72, -side * 0.34, 'YXZ');
          const bladeLocalQuat = new THREE.Quaternion().setFromEuler(bladeLocalEuler);
          const bladeQuat = ribQuat.clone().multiply(bladeLocalQuat);

          targetList.push({
            pos: bladePos,
            quat: bladeQuat,
            scale: new THREE.Vector3(bladeWidth, 1, bladeLength),
          });
        }
      }
    }

    return {
      trunkSegs: tSegs,
      trunkCollars: tCollars,
      crownPos: [p2.x, p2.y, p2.z] as Vec3,
      crownBaseEuler: baseEuler,
      ribSegs: rSegs,
      darkLeaves: dLeaves,
      midLeaves: mLeaves,
      brightLeaves: bLeaves,
    };
  }, [height, lean]);

  // Populate static InstancedMeshes once per config
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    const applyList = (
      mesh: THREE.InstancedMesh | null,
      list: InstanceTransform[]
    ) => {
      if (!mesh) return;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        dummy.position.copy(item.pos);
        dummy.quaternion.copy(item.quat);
        dummy.scale.copy(item.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    applyList(trunkSegRef.current, trunkSegs);
    applyList(trunkCollarRef.current, trunkCollars);
    applyList(ribRef.current, ribSegs);
    applyList(darkLeafRef.current, darkLeaves);
    applyList(midLeafRef.current, midLeaves);
    applyList(brightLeafRef.current, brightLeaves);
  }, [trunkSegs, trunkCollars, ribSegs, darkLeaves, midLeaves, brightLeaves]);

  // Gentle organic tropical breeze swaying the crown
  useFrame(({ clock }) => {
    if (!crownRef.current) return;
    const t = clock.getElapsedTime();
    const swayX =
      Math.sin(t * 1.15 + swayPhase) * 0.048 +
      Math.sin(t * 2.1 + swayPhase * 1.3) * 0.016;
    const swayZ =
      Math.cos(t * 0.95 + swayPhase * 0.8) * 0.042 +
      Math.cos(t * 1.85 + swayPhase) * 0.015;
    crownRef.current.rotation.x = crownBaseEuler[0] + swayX;
    crownRef.current.rotation.y = crownBaseEuler[1];
    crownRef.current.rotation.z = crownBaseEuler[2] + swayZ;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} name="lego-palm-tree">
      {/* Grounded LEGO root base & 4 flared root toes */}
      <mesh
        position={[0, 0.17, 0]}
        geometry={ROOT_BASE_GEO}
        material={darkWoodMat}
        castShadow
        receiveShadow
      />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.65, 0.14, Math.cos(a) * 0.65]}
            rotation={[0, a, 0]}
            geometry={ROOT_TOE_GEO}
            material={brownWoodMat}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Segmented curved LEGO brown trunk (2 InstancedMeshes) */}
      <instancedMesh
        ref={trunkSegRef}
        args={[TRUNK_SEG_GEO, brownWoodMat, trunkSegs.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={trunkCollarRef}
        args={[TRUNK_COLLAR_GEO, darkWoodMat, trunkCollars.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />

      {/* Swaying palm crown: hub + coconuts + instanced segmented LEGO fronds */}
      <group ref={crownRef} position={crownPos}>
        <mesh
          position={[0, 0.05, 0]}
          geometry={CROWN_HUB_GEO}
          material={darkWoodMat}
          castShadow
        />

        {/* Cluster of 4 coconuts tucked neatly under the fronds */}
        {[
          [0.44, -0.26, 0.24],
          [-0.4, -0.24, 0.3],
          [0.06, -0.28, -0.46],
          [-0.22, -0.42, -0.14],
        ].map(([cx, cy, cz], idx) => (
          <mesh
            key={idx}
            position={[cx, cy, cz]}
            geometry={COCONUT_GEO}
            material={coconutMat}
            castShadow
          />
        ))}

        {/* Small crown top stud detail */}
        <mesh
          position={[0, 0.38, 0]}
          geometry={LEAF_STUD_GEO}
          material={darkGreenMat}
        />

        {/* All LEGO frond ribs & leaf blades batched by green tone */}
        <instancedMesh
          ref={ribRef}
          args={[LEAF_RIB_GEO, darkGreenMat, ribSegs.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
        <instancedMesh
          ref={darkLeafRef}
          args={[LEAF_BLADE_GEO, darkGreenMat, darkLeaves.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
        <instancedMesh
          ref={midLeafRef}
          args={[LEAF_BLADE_GEO, greenMat, midLeaves.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
        <instancedMesh
          ref={brightLeafRef}
          args={[LEAF_BLADE_GEO, brightGreenMat, brightLeaves.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      </group>
    </group>
  );
};
