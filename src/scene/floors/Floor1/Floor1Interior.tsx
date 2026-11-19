import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Plate, Studs, Wall, type WallOpening } from '../../../components/lego';
import { RoomClickZone } from '../../../components/house/RoomClickZone';
import { LEGO_COLORS } from '../../../lib/colors';
import { FLOOR1_Y, GROUND_Y, PLATE_H } from '../../../lib/constants';
import { getLegoMaterial } from '../../../lib/materials';
import type { RoomId, Vec3 } from '../../../types';
import { FoyerRoom } from './FoyerRoom';
import { StudioRoom } from './StudioRoom';
import { GuestRoom } from './GuestRoom';
import { Floor1Bathroom } from './Floor1Bathroom';
import { LaundryRoom } from './LaundryRoom';
import { StairHall1 } from './StairHall1';
import { FrontPorch1 } from './FrontPorch1';

const SHARED_TILE_BOX = new THREE.BoxGeometry(1, 1, 1);
const tempDummy = new THREE.Object3D();

// Floor 1 interior doorway openings connecting every room logically
const GUEST_EAST_OPENINGS: WallOpening[] = [
  // Doorway from Guest Room to Central Hall at x = -5 (z = -2..0 => offset 9..11 from z = -11)
  { start: 9, width: 2, bottomCourse: 0, heightCourses: 4, kind: 'door', frameColor: LEGO_COLORS.brownWood },
];

const BATH1_SOUTH_OPENINGS: WallOpening[] = [
  // White door from Floor 1 Bathroom to Central Hall at z = -3 (x = -2..0 => offset 2.5..4.5 from x = -4.5)
  { start: 2.5, width: 2, bottomCourse: 0, heightCourses: 4, kind: 'door', frameColor: LEGO_COLORS.white },
];

const STUDIO_WEST_OPENINGS: WallOpening[] = [
  // Doorway from Studio to Central Hall at x = 2 (z = -1.5..0.5 => offset 9.5..11.5 from z = -11)
  { start: 9.5, width: 2, bottomCourse: 0, heightCourses: 4, kind: 'door', frameColor: LEGO_COLORS.brownWood },
];

const STUDIO_SOUTH_OPENINGS: WallOpening[] = [
  // Wide double doorway from Studio to Foyer at z = 3 (x = 5..8 => offset 3..6 from x = 2)
  { start: 3, width: 3, bottomCourse: 0, heightCourses: 4, kind: 'door', frameColor: LEGO_COLORS.brownWood },
];

const LAUNDRY_EAST_OPENINGS: WallOpening[] = [
  // Doorway from Laundry to Stair Hall 1 at x = -6 (z = 5..7 => offset 3.5..5.5 from z = 1.5)
  { start: 3.5, width: 2, bottomCourse: 0, heightCourses: 4, kind: 'door', frameColor: LEGO_COLORS.white },
];

export interface Floor1InteriorProps {
  isNight: boolean;
  onSelectRoom: (roomId: RoomId) => void;
  /** Optional build-mode floor color overrides keyed by roomId */
  roomFloorColors?: Partial<Record<RoomId, string>>;
  /** Optional build-mode wall color overrides keyed by wallId */
  wallColorOverrides?: Record<string, string>;
  onSelectWall?: (wallId: string) => void;
  onSelectFloor?: (roomId: RoomId) => void;
}

const Floor1BaseTiles: React.FC<{ roomFloorColors?: Partial<Record<RoomId, string>> }> = ({
  roomFloorColors,
}) => {
  const bathMintRef = useRef<THREE.InstancedMesh>(null);
  const bathWhiteRef = useRef<THREE.InstancedMesh>(null);
  const foyerLightRef = useRef<THREE.InstancedMesh>(null);
  const foyerAccentRef = useRef<THREE.InstancedMesh>(null);
  const studioTileRef = useRef<THREE.InstancedMesh>(null);

  const mintMat = useMemo(
    () => getLegoMaterial(roomFloorColors?.['bathroom-1'] ?? LEGO_COLORS.mintTile),
    [roomFloorColors?.['bathroom-1']]
  );
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const foyerMainMat = useMemo(
    () => getLegoMaterial(roomFloorColors?.foyer ?? LEGO_COLORS.creamTile),
    [roomFloorColors?.foyer]
  );
  const foyerAccentMat = useMemo(() => getLegoMaterial(LEGO_COLORS.sand), []);
  const studioMat = useMemo(
    () => getLegoMaterial(roomFloorColors?.studio ?? LEGO_COLORS.offWhite),
    [roomFloorColors?.studio]
  );

  const { bathMint, bathWhite, foyerLight, foyerAccent, studioTiles, woodStuds } = useMemo(() => {
    const bm: Array<[number, number]> = [];
    const bw: Array<[number, number]> = [];
    const fl: Array<[number, number]> = [];
    const fa: Array<[number, number]> = [];
    const st: Array<[number, number]> = [];
    const studs: Vec3[] = [];

    // Bathroom 1 checkerboard (x: -5..2, z: -11..-3)
    for (let x = -4.5; x <= 1.5; x += 1) {
      for (let z = -10.5; z <= -3.5; z += 1) {
        if ((Math.round(x - 0.5) + Math.round(z - 0.5)) % 2 === 0) bm.push([x, z]);
        else bw.push([x, z]);
      }
    }

    // Foyer + Stair Hall 1 + Central Hall warm checkerboard (x: -5.5..14.5, z: 3..11 and hall -4.5..1.5, z: -2.5..2.5)
    for (let x = -5.5; x <= 14.5; x += 1) {
      for (let z = -2.5; z <= 10.5; z += 1) {
        // Skip Laundry (x < -6, z > 1) and Guest Room (x < -5, z < 1) and Studio (x > 2, z < 3)
        if (x < -5.5) continue;
        if (x > 2 && z < 3) continue;
        if ((Math.round(x - 0.5) + Math.round(z - 0.5)) % 2 === 0) fl.push([x, z]);
        else fa.push([x, z]);
      }
    }

    // Studio modern light tile grid (x: 2.5..14.5, z: -10.5..2.5)
    for (let x = 2.5; x <= 14.5; x += 1) {
      for (let z = -10.5; z <= 2.5; z += 1) {
        st.push([x, z]);
      }
    }

    // Wooden studs in Guest Room (x: -14.5..-5.5, z: -10.5..0.5) & Laundry (x: -14.5..-6.5, z: 1.5..10.5)
    for (let x = -14.5; x <= -5.5; x += 1) {
      for (let z = -10.5; z <= 0.5; z += 1) {
        // Skip bedside rug footprint
        if (x >= -11.6 && x <= -7.4 && z >= -4.8 && z <= -2.4) continue;
        studs.push([x, FLOOR1_Y, z]);
      }
    }
    for (let x = -14.5; x <= -6.5; x += 1) {
      for (let z = 1.5; z <= 10.5; z += 1) {
        studs.push([x, FLOOR1_Y, z]);
      }
    }

    return { bathMint: bm, bathWhite: bw, foyerLight: fl, foyerAccent: fa, studioTiles: st, woodStuds: studs };
  }, []);

  useLayoutEffect(() => {
    const populate = (mesh: THREE.InstancedMesh | null, coords: Array<[number, number]>) => {
      if (!mesh) return;
      for (let i = 0; i < coords.length; i++) {
        const [x, z] = coords[i];
        tempDummy.position.set(x, FLOOR1_Y - PLATE_H * 0.5 + 0.012, z);
        tempDummy.rotation.set(0, 0, 0);
        tempDummy.scale.set(0.95, PLATE_H, 0.95);
        tempDummy.updateMatrix();
        mesh.setMatrixAt(i, tempDummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
    populate(bathMintRef.current, bathMint);
    populate(bathWhiteRef.current, bathWhite);
    populate(foyerLightRef.current, foyerLight);
    populate(foyerAccentRef.current, foyerAccent);
    populate(studioTileRef.current, studioTiles);
  }, [bathMint, bathWhite, foyerLight, foyerAccent, studioTiles]);

  const guestColor = roomFloorColors?.['guest-room'] ?? LEGO_COLORS.brownFloor;

  return (
    <group name="floor1-slab">
      {/* Main Floor 1 structural 1-plate interior base slab (Y = 0..0.4, x: -15.5..15.5, z: -11.5..11.5) */}
      <Plate
        position={[0, GROUND_Y, 0]}
        size={[31, 1, 23]}
        color={guestColor}
        studs={false}
      />

      <Studs positions={woodStuds} color={guestColor} castShadow={false} />

      <instancedMesh ref={bathMintRef} args={[SHARED_TILE_BOX, mintMat, bathMint.length]} receiveShadow />
      <instancedMesh ref={bathWhiteRef} args={[SHARED_TILE_BOX, whiteMat, bathWhite.length]} receiveShadow />
      <instancedMesh ref={foyerLightRef} args={[SHARED_TILE_BOX, foyerMainMat, foyerLight.length]} receiveShadow />
      <instancedMesh ref={foyerAccentRef} args={[SHARED_TILE_BOX, foyerAccentMat, foyerAccent.length]} receiveShadow />
      <instancedMesh ref={studioTileRef} args={[SHARED_TILE_BOX, studioMat, studioTiles.length]} receiveShadow />
    </group>
  );
};

export const Floor1Interior: React.FC<Floor1InteriorProps> = ({
  isNight,
  onSelectRoom,
  roomFloorColors,
  wallColorOverrides,
}) => {
  const wc = (id: string, fallback: string) => wallColorOverrides?.[id] ?? fallback;

  return (
    <group name="floor1-interior">
      {/* Floor 1 slab & room-specific floor tiles */}
      <Floor1BaseTiles roomFloorColors={roomFloorColors} />

      {/* ================================================================= */}
      {/* FLOOR 1 INTERIOR PARTITION WALLS (courses = 5 => height 6.0,      */}
      {/* sits cleanly from y = 0.4 to 6.4 below Floor 2 slab at y = 7.2!)  */}
      {/* ================================================================= */}

      {/* Guest Room (W) vs Bathroom 1 / Central Hall (E): x = -5, z = -11..1 */}
      <Wall
        start={[-5, FLOOR1_Y, -11]}
        end={[-5, FLOOR1_Y, 1]}
        courses={5}
        outerColor={wc('f1-guest-east', LEGO_COLORS.creamWall)}
        innerColor={wc('f1-bath-west', LEGO_COLORS.mintTile)}
        innerAccentColor={LEGO_COLORS.white}
        outerSide={1}
        topStuds={false}
        openings={GUEST_EAST_OPENINGS}
      />

      {/* Guest Room (N) vs Laundry (S): z = 1, x = -15..-5.5 */}
      <Wall
        start={[-15, FLOOR1_Y, 1]}
        end={[-5.5, FLOOR1_Y, 1]}
        courses={5}
        outerColor={wc('f1-laundry-north', LEGO_COLORS.offWhite)}
        innerColor={wc('f1-guest-south', LEGO_COLORS.creamWall)}
        outerSide={1}
        topStuds={false}
      />

      {/* Laundry (W) vs Stair Hall 1 (E): x = -6, z = 1.5..11 */}
      <Wall
        start={[-6, FLOOR1_Y, 1.5]}
        end={[-6, FLOOR1_Y, 11]}
        courses={5}
        outerColor={wc('f1-laundry-east', LEGO_COLORS.offWhite)}
        innerColor={wc('f1-stair1-west', LEGO_COLORS.creamWall)}
        outerSide={1}
        topStuds={false}
        openings={LAUNDRY_EAST_OPENINGS}
      />

      {/* Bathroom 1 (N) vs Central Hall (S): z = -3, x = -4.5..1.5 */}
      <Wall
        start={[-4.5, FLOOR1_Y, -3]}
        end={[1.5, FLOOR1_Y, -3]}
        courses={5}
        outerColor={wc('f1-hall-north', LEGO_COLORS.creamWall)}
        innerColor={wc('f1-bath-south', LEGO_COLORS.mintTile)}
        innerAccentColor={LEGO_COLORS.white}
        outerSide={1}
        topStuds={false}
        openings={BATH1_SOUTH_OPENINGS}
      />

      {/* Bathroom 1 / Central Hall (W) vs Studio (E): x = 2, z = -11..3 */}
      <Wall
        start={[2, FLOOR1_Y, -11]}
        end={[2, FLOOR1_Y, 3]}
        courses={5}
        outerColor={wc('f1-bath-east', LEGO_COLORS.mintTile)}
        innerColor={wc('f1-studio-west', LEGO_COLORS.offWhite)}
        outerSide={1}
        topStuds={false}
        openings={STUDIO_WEST_OPENINGS}
      />

      {/* Studio (N) vs Foyer / Living (S): z = 3, x = 2..15 */}
      <Wall
        start={[2, FLOOR1_Y, 3]}
        end={[15, FLOOR1_Y, 3]}
        courses={5}
        outerColor={wc('f1-foyer-north', LEGO_COLORS.creamWall)}
        innerColor={wc('f1-studio-south', LEGO_COLORS.offWhite)}
        outerSide={1}
        topStuds={false}
        openings={STUDIO_SOUTH_OPENINGS}
      />

      {/* ================================================================= */}
      {/* 7 FURNISHED FLOOR 1 ROOMS + FRONT PORCH                           */}
      {/* ================================================================= */}
      <FoyerRoom isNight={isNight} />
      <StudioRoom isNight={isNight} />
      <GuestRoom isNight={isNight} />
      <Floor1Bathroom isNight={isNight} />
      <LaundryRoom isNight={isNight} />
      <StairHall1 isNight={isNight} />
      <FrontPorch1 isNight={isNight} />

      {/* ================================================================= */}
      {/* CLICKABLE FLOOR 1 ROOM HIT ZONES (active when Floor 2 fades!)     */}
      {/* ================================================================= */}
      <RoomClickZone
        roomId="guest-room"
        minX={-15}
        maxX={-5.5}
        minZ={-11}
        maxZ={0.5}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.orange}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="bathroom-1"
        minX={-4.5}
        maxX={1.5}
        minZ={-11}
        maxZ={-3.5}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.mintTile}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="laundry"
        minX={-15}
        maxX={-6.5}
        minZ={1.5}
        maxZ={11}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.lightBlue}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="stair-hall-1"
        minX={-5.5}
        maxX={1.5}
        minZ={-2.5}
        maxZ={11}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.warmYellow}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="studio"
        minX={2.5}
        maxX={15}
        minZ={-11}
        maxZ={2.5}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.lightBlue}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="foyer"
        minX={1.5}
        maxX={15}
        minZ={3.5}
        maxZ={11}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.turquoise}
        onSelectRoom={onSelectRoom}
      />
      <RoomClickZone
        roomId="front-porch"
        minX={-15.5}
        maxX={15.5}
        minZ={12}
        maxZ={15.2}
        y={FLOOR1_Y + 0.04}
        highlightColor={LEGO_COLORS.terracotta}
        onSelectRoom={onSelectRoom}
      />
    </group>
  );
};
