import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RoomId } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { FLOOR_Y, PLATE_H } from '../../lib/layout';
import { getLegoMaterial } from '../../lib/materials';
import { Brick, Tile } from '../lego';
import { RoomClickZone } from './RoomClickZone';
import { LeftTerraceItems, RightTerraceItems } from '../furniture/TerraceItems';

const SHARED_BOX = new THREE.BoxGeometry(1, 1, 1);
const tempObj = new THREE.Object3D();

interface RailingRunProps {
  start: [number, number];
  end: [number, number];
  y: number;
  baseColor?: string;
}

const WoodenRailing: React.FC<RailingRunProps> = ({
  start,
  end,
  y,
  baseColor = LEGO_COLORS.pinkExterior,
}) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const len = Math.max(1, Math.hypot(dx, dz));
  const rotY = Math.atan2(-dz, dx);

  const woodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);

  const balusterCount = Math.max(2, Math.floor(len / 0.85));
  const balusterRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = balusterRef.current;
    if (!mesh) return;
    for (let i = 0; i < balusterCount; i++) {
      const t = (i + 0.5) / balusterCount;
      tempObj.position.set(t * len, 1.15, 0);
      tempObj.rotation.set(0, 0, 0);
      tempObj.scale.set(0.16, 1.55, 0.16);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [balusterCount, len]);

  return (
    <group position={[start[0], y, start[1]]} rotation={[0, rotY, 0]}>
      {/* Low LEGO pink masonry curb underneath wooden railing */}
      <Brick
        position={[len * 0.5, 0, 0]}
        size={[len, 0.35, 0.55]}
        color={baseColor}
        studs={false}
      />

      {/* Bottom wooden rail */}
      <mesh position={[len * 0.5, 0.52, 0]} material={darkWoodMat} castShadow receiveShadow>
        <boxGeometry args={[len, 0.14, 0.24]} />
      </mesh>

      {/* Top handrail */}
      <mesh position={[len * 0.5, 1.98, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[len + 0.25, 0.18, 0.32]} />
      </mesh>

      {/* Instanced balusters */}
      <instancedMesh
        key={balusterCount}
        ref={balusterRef}
        args={[SHARED_BOX, woodMat, balusterCount]}
        castShadow
        receiveShadow
      />

      {/* Corner newel posts */}
      <mesh position={[0.15, 1.18, 0]} material={darkWoodMat} castShadow receiveShadow>
        <boxGeometry args={[0.34, 2.05, 0.34]} />
      </mesh>
      <mesh position={[len - 0.15, 1.18, 0]} material={darkWoodMat} castShadow receiveShadow>
        <boxGeometry args={[0.34, 2.05, 0.34]} />
      </mesh>
    </group>
  );
};

const TerraceTiledFloors: React.FC = () => {
  const leftMainRef = useRef<THREE.InstancedMesh>(null);
  const leftAccentRef = useRef<THREE.InstancedMesh>(null);
  const rightMainRef = useRef<THREE.InstancedMesh>(null);
  const rightAccentRef = useRef<THREE.InstancedMesh>(null);

  const pinkLightMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkLight), []);
  const pinkAccentMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkExterior), []);
  const creamTileMat = useMemo(() => getLegoMaterial(LEGO_COLORS.creamTile), []);
  const sandTileMat = useMemo(() => getLegoMaterial(LEGO_COLORS.sand), []);

  const { leftMain, leftAccent, rightMain, rightAccent } = useMemo(() => {
    const lm: Array<[number, number]> = [];
    const la: Array<[number, number]> = [];
    const rm: Array<[number, number]> = [];
    const ra: Array<[number, number]> = [];

    // Left terrace: x = -16..-6 (centers -15.5..-6.5), z = 1..12 (centers 1.5..11.5)
    for (let x = -15.5; x <= -6.5; x += 1) {
      for (let z = 1.5; z <= 11.5; z += 1) {
        const isBorder =
          x <= -15 || x >= -7 || z <= 2 || z >= 11;
        if (isBorder) {
          la.push([x, z]);
        } else {
          lm.push([x, z]);
        }
      }
    }

    // Right terrace: x = 12..16 (centers 12.5..15.5), z = -2..12 (centers -1.5..11.5)
    for (let x = 12.5; x <= 15.5; x += 1) {
      for (let z = -1.5; z <= 11.5; z += 1) {
        const ix = Math.round(x - 0.5);
        const iz = Math.round(z - 0.5);
        if ((ix + iz) % 2 === 0) {
          rm.push([x, z]);
        } else {
          ra.push([x, z]);
        }
      }
    }

    return { leftMain: lm, leftAccent: la, rightMain: rm, rightAccent: ra };
  }, []);

  useLayoutEffect(() => {
    const fill = (
      mesh: THREE.InstancedMesh | null,
      coords: Array<[number, number]>
    ) => {
      if (!mesh) return;
      for (let i = 0; i < coords.length; i++) {
        const [x, z] = coords[i];
        tempObj.position.set(x, FLOOR_Y - PLATE_H * 0.5, z);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(0.96, PLATE_H, 0.96);
        tempObj.updateMatrix();
        mesh.setMatrixAt(i, tempObj.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    fill(leftMainRef.current, leftMain);
    fill(leftAccentRef.current, leftAccent);
    fill(rightMainRef.current, rightMain);
    fill(rightAccentRef.current, rightAccent);
  }, [leftMain, leftAccent, rightMain, rightAccent]);

  return (
    <group>
      <instancedMesh
        ref={leftMainRef}
        args={[SHARED_BOX, pinkLightMat, leftMain.length]}
        receiveShadow
      />
      <instancedMesh
        ref={leftAccentRef}
        args={[SHARED_BOX, pinkAccentMat, leftAccent.length]}
        receiveShadow
      />
      <instancedMesh
        ref={rightMainRef}
        args={[SHARED_BOX, creamTileMat, rightMain.length]}
        receiveShadow
      />
      <instancedMesh
        ref={rightAccentRef}
        args={[SHARED_BOX, sandTileMat, rightAccent.length]}
        receiveShadow
      />
    </group>
  );
};

export interface TerracesProps {
  isNight: boolean;
  onSelectRoom: (roomId: RoomId) => void;
}

export const Terraces: React.FC<TerracesProps> = ({ isNight, onSelectRoom }) => {
  return (
    <group>
      {/* Tiled floors for Left (pink) & Right (patterned cream) Terraces */}
      <TerraceTiledFloors />

      {/* Left Terrace Wooden Baluster Railings */}
      <WoodenRailing
        start={[-15.65, 1.5]}
        end={[-15.65, 11.65]}
        y={FLOOR_Y}
        baseColor={LEGO_COLORS.pinkExterior}
      />
      <WoodenRailing
        start={[-15.65, 11.65]}
        end={[-6.5, 11.65]}
        y={FLOOR_Y}
        baseColor={LEGO_COLORS.pinkExterior}
      />

      {/* Right Terrace Wooden Baluster Railings */}
      <WoodenRailing
        start={[15.65, -1.5]}
        end={[15.65, 11.65]}
        y={FLOOR_Y}
        baseColor={LEGO_COLORS.pinkExterior}
      />
      <WoodenRailing
        start={[12.5, 11.65]}
        end={[15.65, 11.65]}
        y={FLOOR_Y}
        baseColor={LEGO_COLORS.pinkExterior}
      />

      {/* Decorative wooden pergola beam cap over Left Terrace kitchen doorway */}
      <Tile
        position={[-11, FLOOR_Y + 5.2, 1.75]}
        size={[3.4, 0.7]}
        height={0.22}
        color={LEGO_COLORS.brownWood}
      />

      {/* Decorative wooden krepyak awning cap centered over Right Terrace z = 4..7 doorway */}
      <Tile
        position={[12.65, FLOOR_Y + 5.2, 5.5]}
        size={[0.8, 3.6]}
        height={0.22}
        color={LEGO_COLORS.brownWood}
      />

      {/* Terrace Furniture & Details from Agent 2 */}
      <LeftTerraceItems isNight={isNight} />
      <RightTerraceItems isNight={isNight} />

      {/* Clickable hit zones for both terraces */}
      <RoomClickZone
        roomId="terraces"
        minX={-15.5}
        maxX={-6.5}
        minZ={1.5}
        maxZ={11.5}
        highlightColor={LEGO_COLORS.pinkLight}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="terraces"
        minX={12.5}
        maxX={15.5}
        minZ={-1.5}
        maxZ={11.5}
        highlightColor={LEGO_COLORS.creamTile}
        onSelectRoom={onSelectRoom}
      />
    </group>
  );
};
