import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { GROUND_Y } from '../../lib/layout';

export interface BirdOfParadiseProps {
  position: Vec3;
  scale?: number;
  rotationY?: number;
}

// Shared static geometries for Bird-of-Paradise & scattered LEGO flowers
const BOP_BASE_GEO = new THREE.CylinderGeometry(0.4, 0.48, 0.22, 8);
const BOP_LEAF_GEO = new THREE.BoxGeometry(0.32, 1.32, 0.08);
const BOP_STALK_GEO = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6);
const BOP_BEAK_GEO = new THREE.BoxGeometry(0.16, 0.18, 0.72);
const BOP_PETAL_GEO = new THREE.BoxGeometry(0.11, 0.62, 0.22);
const BOP_TONGUE_GEO = new THREE.BoxGeometry(0.09, 0.14, 0.46);

const SMALL_STEM_GEO = new THREE.CylinderGeometry(0.075, 0.095, 0.38, 6);
const SMALL_LEAF_BASE_GEO = new THREE.CylinderGeometry(0.24, 0.28, 0.12, 6);
const SMALL_PETAL_BAR_GEO = new THREE.BoxGeometry(0.46, 0.13, 0.19);
const SMALL_CENTER_GEO = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8);

/**
 * Single tropical Bird-of-Paradise (Strelitzia) LEGO flower cluster with breeze sway.
 */
export const BirdOfParadise: React.FC<BirdOfParadiseProps> = ({
  position,
  scale = 1,
  rotationY = 0,
}) => {
  const swayRef = useRef<THREE.Group>(null);
  const phase = useMemo(
    () => position[0] * 0.8 + position[2] * 0.6 + rotationY,
    [position, rotationY]
  );

  const darkGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGreen), []);
  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.green), []);
  const orangeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.orange), []);
  const redMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const blueMat = useMemo(() => getLegoMaterial(LEGO_COLORS.blue), []);

  useFrame(({ clock }) => {
    if (!swayRef.current) return;
    const t = clock.getElapsedTime();
    swayRef.current.rotation.x = Math.sin(t * 1.65 + phase) * 0.055;
    swayRef.current.rotation.z = Math.cos(t * 1.35 + phase * 0.9) * 0.048;
  });

  const stalks = useMemo(
    () => [
      { x: 0.0, z: 0.0, h: 2.05, yaw: 0.2, tiltX: 0.06, tiltZ: -0.05 },
      { x: -0.26, z: 0.18, h: 1.68, yaw: 2.35, tiltX: -0.1, tiltZ: 0.08 },
      { x: 0.25, z: -0.16, h: 1.52, yaw: -1.45, tiltX: 0.08, tiltZ: 0.1 },
    ],
    []
  );

  const leaves = useMemo(
    () => [
      { angle: 0.4, tilt: 0.48, y: 0.62, dark: true },
      { angle: 1.95, tilt: 0.52, y: 0.58, dark: false },
      { angle: 3.55, tilt: 0.45, y: 0.64, dark: true },
      { angle: 5.05, tilt: 0.54, y: 0.56, dark: false },
    ],
    []
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <group ref={swayRef}>
        {/* Ground base rosette */}
        <mesh
          position={[0, 0.11, 0]}
          geometry={BOP_BASE_GEO}
          material={darkGreenMat}
          castShadow
          receiveShadow
        />

        {/* Upright tropical sword leaves fanning out from the base */}
        {leaves.map((leaf, i) => (
          <group key={`leaf-${i}`} rotation={[0, leaf.angle, 0]}>
            <mesh
              position={[0, leaf.y, 0.34]}
              rotation={[leaf.tilt, 0, 0]}
              geometry={BOP_LEAF_GEO}
              material={leaf.dark ? darkGreenMat : greenMat}
              castShadow
              receiveShadow
            />
          </group>
        ))}

        {/* Bird-of-Paradise stalks + beak spathe + spiky orange/red petals + blue tongue */}
        {stalks.map((s, idx) => (
          <group
            key={`stalk-${idx}`}
            position={[s.x, 0.14, s.z]}
            rotation={[s.tiltX, s.yaw, s.tiltZ]}
          >
            {/* Green cylindrical LEGO stem */}
            <mesh
              position={[0, s.h * 0.5, 0]}
              scale={[1, s.h, 1]}
              geometry={BOP_STALK_GEO}
              material={greenMat}
              castShadow
            />

            {/* Iconic bird-head blossom at top of stalk */}
            <group position={[0, s.h, 0]}>
              {/* Horizontal boat-shaped green/crimson spathe beak */}
              <mesh
                position={[0, 0.02, 0.24]}
                rotation={[-0.18, 0, 0]}
                geometry={BOP_BEAK_GEO}
                material={darkGreenMat}
                castShadow
              />

              {/* Three spiky upright orange & red LEGO petals */}
              <mesh
                position={[0, 0.32, 0.12]}
                rotation={[-0.28, 0, 0.1]}
                geometry={BOP_PETAL_GEO}
                material={redMat}
                castShadow
              />
              <mesh
                position={[-0.04, 0.36, 0.28]}
                rotation={[0.08, 0.08, -0.14]}
                geometry={BOP_PETAL_GEO}
                material={orangeMat}
                castShadow
              />
              <mesh
                position={[0.05, 0.31, 0.4]}
                rotation={[0.38, -0.06, 0.12]}
                geometry={BOP_PETAL_GEO}
                material={orangeMat}
                castShadow
              />

              {/* Vibrant blue Bird-of-Paradise accent tongue */}
              <mesh
                position={[0, 0.14, 0.44]}
                rotation={[-0.12, 0, 0]}
                geometry={BOP_TONGUE_GEO}
                material={blueMat}
                castShadow
              />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

interface SmallFlowerSpec {
  x: number;
  z: number;
  color: string;
  centerColor: string;
  scale: number;
  rotY: number;
  phase: number;
}

const BIRD_OF_PARADISE_CLUSTERS: BirdOfParadiseProps[] = [
  // Front garden framing the stepping-stone walkway (clear of verandah porch z <= 15.2 & entry step z <= 15.95)
  { position: [-3.7, GROUND_Y, 16.5], scale: 1.05, rotationY: 0.4 },
  { position: [3.7, GROUND_Y, 16.5], scale: 1.0, rotationY: -0.6 },
  { position: [-7.5, GROUND_Y, 17.5], scale: 0.95, rotationY: 1.4 },
  { position: [7.8, GROUND_Y, 17.2], scale: 1.08, rotationY: 2.2 },
  { position: [-13.5, GROUND_Y, 20.5], scale: 0.92, rotationY: 0.9 },
  { position: [14.5, GROUND_Y, 20.2], scale: 0.98, rotationY: 3.1 },
  // Sand edges & back yard
  { position: [-18.2, GROUND_Y, 12.8], scale: 1.0, rotationY: 1.9 },
  { position: [-18.0, GROUND_Y, -8.5], scale: 0.95, rotationY: -1.1 },
  { position: [3.2, GROUND_Y, -15.2], scale: 1.0, rotationY: 2.6 },
  // Right yard framing the Tuk-Tuk and Lounge Chair
  { position: [18.0, GROUND_Y, 3.5], scale: 0.96, rotationY: -0.4 },
  { position: [25.5, GROUND_Y, 9.8], scale: 1.05, rotationY: 4.1 },
  { position: [25.6, GROUND_Y, -1.2], scale: 0.94, rotationY: 2.8 },
];

// Curated small scattered LEGO flower positions (all clear of house, porch, step, path, Tuk-Tuk, Lounge, sea)
const SMALL_FLOWER_COORDS: [number, number, string][] = [
  // Front garden borders around the stepping path
  [-2.9, 16.1, LEGO_COLORS.red],
  [-2.9, 17.8, LEGO_COLORS.yellow],
  [-2.6, 19.6, LEGO_COLORS.orange],
  [-3.2, 21.4, LEGO_COLORS.pinkCushion],
  [2.9, 16.1, LEGO_COLORS.orange],
  [2.8, 17.4, LEGO_COLORS.red],
  [2.6, 19.3, LEGO_COLORS.yellow],
  [3.1, 21.6, LEGO_COLORS.white],
  // Front lawn scatter (left & right)
  [-5.5, 16.0, LEGO_COLORS.yellow],
  [-6.2, 20.4, LEGO_COLORS.red],
  [-8.6, 21.3, LEGO_COLORS.orange],
  [-10.8, 16.5, LEGO_COLORS.pinkCushion],
  [-11.8, 18.4, LEGO_COLORS.yellow],
  [-14.6, 16.2, LEGO_COLORS.red],
  [-15.2, 19.1, LEGO_COLORS.orange],
  [5.4, 16.2, LEGO_COLORS.pinkCushion],
  [6.3, 20.5, LEGO_COLORS.yellow],
  [8.9, 21.2, LEGO_COLORS.red],
  [11.2, 16.4, LEGO_COLORS.orange],
  [12.1, 18.6, LEGO_COLORS.white],
  [15.4, 16.1, LEGO_COLORS.yellow],
  [16.3, 19.4, LEGO_COLORS.red],
  [17.5, 17.4, LEGO_COLORS.orange],
  [20.2, 18.5, LEGO_COLORS.pinkCushion],
  [21.6, 20.8, LEGO_COLORS.yellow],
  // Right yard near Tuk-Tuk & Lounge Chair
  [17.4, 8.8, LEGO_COLORS.red],
  [17.2, 6.2, LEGO_COLORS.yellow],
  [18.2, 0.8, LEGO_COLORS.orange],
  [24.6, 6.5, LEGO_COLORS.pinkCushion],
  [25.1, 1.4, LEGO_COLORS.yellow],
  [22.5, 14.2, LEGO_COLORS.red],
  [20.2, 14.8, LEGO_COLORS.orange],
  [26.2, 15.4, LEGO_COLORS.white],
  // Left sand-to-grass border & around sand palms
  [-17.2, 16.8, LEGO_COLORS.orange],
  [-19.6, 18.5, LEGO_COLORS.yellow],
  [-17.4, 5.5, LEGO_COLORS.red],
  [-18.2, 0.5, LEGO_COLORS.pinkCushion],
  [-17.5, -5.2, LEGO_COLORS.orange],
  [-19.8, -11.5, LEGO_COLORS.yellow],
  [-20.5, -17.5, LEGO_COLORS.red],
  // Back sand edge behind house
  [-9.5, -14.8, LEGO_COLORS.orange],
  [-7.2, -16.4, LEGO_COLORS.yellow],
  [-1.5, -14.5, LEGO_COLORS.red],
  [6.8, -14.6, LEGO_COLORS.pinkCushion],
  [8.6, -16.8, LEGO_COLORS.orange],
  [11.5, -14.2, LEGO_COLORS.yellow],
];

interface ColoredPetalGroupProps {
  flowers: SmallFlowerSpec[];
  color: string;
}

const InstancedFlowerPetals: React.FC<ColoredPetalGroupProps> = ({ flowers, color }) => {
  const petalARef = useRef<THREE.InstancedMesh>(null);
  const petalBRef = useRef<THREE.InstancedMesh>(null);
  const centerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petalMat = useMemo(() => getLegoMaterial(color), [color]);
  const centerMat = useMemo(
    () =>
      getLegoMaterial(
        color === LEGO_COLORS.yellow ? LEGO_COLORS.white : LEGO_COLORS.yellow
      ),
    [color]
  );

  // Initialize petal matrices on frame 0 so blossoms never flash at world origin
  useLayoutEffect(() => {
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];
      const headY = GROUND_Y + 0.42 * f.scale;

      if (petalARef.current) {
        dummy.position.set(f.x, headY, f.z);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        petalARef.current.setMatrixAt(i, dummy.matrix);
      }
      if (petalBRef.current) {
        dummy.position.set(f.x, headY, f.z);
        dummy.rotation.set(0, f.rotY + Math.PI / 2, 0);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        petalBRef.current.setMatrixAt(i, dummy.matrix);
      }
      if (centerRef.current) {
        dummy.position.set(f.x, headY + 0.05 * f.scale, f.z);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        centerRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    if (petalARef.current) petalARef.current.instanceMatrix.needsUpdate = true;
    if (petalBRef.current) petalBRef.current.instanceMatrix.needsUpdate = true;
    if (centerRef.current) centerRef.current.instanceMatrix.needsUpdate = true;
  }, [flowers, dummy]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const count = flowers.length;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const f = flowers[i];
      const swayX = Math.sin(t * 2.1 + f.phase) * 0.08;
      const swayZ = Math.cos(t * 1.8 + f.phase * 1.2) * 0.07;
      const headY = GROUND_Y + 0.42 * f.scale;

      if (petalARef.current) {
        dummy.position.set(f.x + swayZ * 0.15, headY, f.z + swayX * 0.15);
        dummy.rotation.set(swayX, f.rotY, swayZ);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        petalARef.current.setMatrixAt(i, dummy.matrix);
      }

      if (petalBRef.current) {
        dummy.position.set(f.x + swayZ * 0.15, headY, f.z + swayX * 0.15);
        dummy.rotation.set(swayX, f.rotY + Math.PI / 2, swayZ);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        petalBRef.current.setMatrixAt(i, dummy.matrix);
      }

      if (centerRef.current) {
        dummy.position.set(
          f.x + swayZ * 0.15,
          headY + 0.05 * f.scale,
          f.z + swayX * 0.15
        );
        dummy.rotation.set(swayX, f.rotY, swayZ);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        centerRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (petalARef.current) petalARef.current.instanceMatrix.needsUpdate = true;
    if (petalBRef.current) petalBRef.current.instanceMatrix.needsUpdate = true;
    if (centerRef.current) centerRef.current.instanceMatrix.needsUpdate = true;
  });

  if (flowers.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={petalARef}
        args={[SMALL_PETAL_BAR_GEO, petalMat, flowers.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={petalBRef}
        args={[SMALL_PETAL_BAR_GEO, petalMat, flowers.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={centerRef}
        args={[SMALL_CENTER_GEO, centerMat, flowers.length]}
        frustumCulled={false}
      />
    </group>
  );
};

export const Flowers: React.FC = () => {
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const leafBaseRef = useRef<THREE.InstancedMesh>(null);

  const greenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.green), []);
  const darkGreenMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGreen), []);

  const { allSmallFlowers, flowersByColor } = useMemo(() => {
    const specs: SmallFlowerSpec[] = SMALL_FLOWER_COORDS.map(([x, z, color], idx) => ({
      x,
      z,
      color,
      centerColor: color === LEGO_COLORS.yellow ? LEGO_COLORS.white : LEGO_COLORS.yellow,
      scale: 0.88 + ((idx * 19) % 5) * 0.08,
      rotY: ((idx * 1.17) % Math.PI),
      phase: x * 0.55 + z * 0.45,
    }));

    const byColor = new Map<string, SmallFlowerSpec[]>();
    for (const s of specs) {
      const list = byColor.get(s.color) ?? [];
      list.push(s);
      byColor.set(s.color, list);
    }

    return {
      allSmallFlowers: specs,
      flowersByColor: Array.from(byColor.entries()),
    };
  }, []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    if (stemRef.current) {
      for (let i = 0; i < allSmallFlowers.length; i++) {
        const f = allSmallFlowers[i];
        dummy.position.set(f.x, GROUND_Y + 0.19 * f.scale, f.z);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        stemRef.current.setMatrixAt(i, dummy.matrix);
      }
      stemRef.current.instanceMatrix.needsUpdate = true;
      stemRef.current.computeBoundingSphere();
    }

    if (leafBaseRef.current) {
      for (let i = 0; i < allSmallFlowers.length; i++) {
        const f = allSmallFlowers[i];
        dummy.position.set(f.x, GROUND_Y + 0.06 * f.scale, f.z);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();
        leafBaseRef.current.setMatrixAt(i, dummy.matrix);
      }
      leafBaseRef.current.instanceMatrix.needsUpdate = true;
      leafBaseRef.current.computeBoundingSphere();
    }
  }, [allSmallFlowers]);

  return (
    <group name="lego-tropical-flowers">
      {/* Tropical Bird-of-Paradise clusters */}
      {BIRD_OF_PARADISE_CLUSTERS.map((cfg, idx) => (
        <BirdOfParadise
          key={idx}
          position={cfg.position}
          scale={cfg.scale}
          rotationY={cfg.rotationY}
        />
      ))}

      {/* Scattered small LEGO flower stems & leaf bases (InstancedMesh) */}
      <instancedMesh
        ref={stemRef}
        args={[SMALL_STEM_GEO, greenMat, allSmallFlowers.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={leafBaseRef}
        args={[SMALL_LEAF_BASE_GEO, darkGreenMat, allSmallFlowers.length]}
        receiveShadow
        frustumCulled={false}
      />

      {/* Animated swaying 4-petal LEGO blossoms grouped by color */}
      {flowersByColor.map(([color, groupFlowers]) => (
        <InstancedFlowerPetals key={color} color={color} flowers={groupFlowers} />
      ))}
    </group>
  );
};
