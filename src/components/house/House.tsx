import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RoomId, Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import {
  FLOOR2_Y,
  GROUND_FLOOR_H,
  PLATE_H,
  STAIRWELL_HOLE,
} from '../../lib/constants';
import { getLegoMaterial } from '../../lib/materials';
import { Brick, Plate, Studs, Wall, type WallOpening } from '../lego';
import { FloorGroup } from '../../scene/floors/FloorGroup';
import { Floor1Interior } from '../../scene/floors/Floor1';
import { Stairs } from '../../scene/floors/Stairs';
import { GroundFloorShell, TerracottaRoofOverhang } from './GroundFloor';
import { Terraces } from './Terraces';
import { RoomClickZone } from './RoomClickZone';
import { Kitchen } from './Kitchen';
import { Bedroom } from './Bedroom';
import { DressingRoom } from './DressingRoom';
import { StairRoom } from './StairRoom';
import { LivingRoom } from './LivingRoom';
import { DiningArea } from './DiningArea';

const SHARED_TILE_BOX = new THREE.BoxGeometry(1, 1, 1);
const tempDummy = new THREE.Object3D();

const KITCHEN_NORTH_OPENINGS: WallOpening[] = [
  {
    start: 3,
    width: 3,
    bottomCourse: 2,
    heightCourses: 3,
    kind: 'window',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

const BEDROOM_NORTH_OPENINGS: WallOpening[] = [
  {
    start: 3,
    width: 3,
    bottomCourse: 2,
    heightCourses: 3,
    kind: 'window',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

const DRESSING_NORTH_OPENINGS: WallOpening[] = [
  {
    start: 4,
    width: 3,
    bottomCourse: 2,
    heightCourses: 3,
    kind: 'window',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

const KITCHEN_SOUTH_OPENINGS: WallOpening[] = [
  {
    start: 4,
    width: 2,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
    lattice: true,
  },
  {
    start: 7,
    width: 2,
    bottomCourse: 2,
    heightCourses: 2,
    kind: 'window',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

const KITCHEN_STAIR_EAST_OPENINGS: WallOpening[] = [
  // Indoor passage between Kitchen & expanded Stair Room (z = -1.5..0.5 => offset 0.5..2.5 from z = -2)
  {
    start: 0.5,
    width: 2,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
  },
];

const BEDROOM_SOUTH_OPENINGS: WallOpening[] = [
  // Doorway from Bedroom into expanded Stair Room hall (x = 0..2 => offset 5.5..7.5 from x = -5.5)
  {
    start: 5.5,
    width: 2,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
  },
];

const DRESSING_SOUTH_OPENINGS: WallOpening[] = [
  {
    start: 5,
    width: 2,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
  },
];

const DRESSING_TERRACE_SOUTH_OPENINGS: WallOpening[] = [
  {
    start: 1.5,
    width: 2,
    bottomCourse: 2,
    heightCourses: 3,
    kind: 'window',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

const STAIR_TERRACE_WEST_OPENINGS: WallOpening[] = [
  // Classic white arched door connecting expanded Stair Room & Left Terrace (z = 8.5..10.5 => offset 8..10 from z = 0.5)
  {
    start: 8.0,
    width: 2,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
  },
];

const STAIR_LIVING_DIVIDER_OPENINGS: WallOpening[] = [
  {
    start: 5.5,
    width: 3,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
  },
];

const RIGHT_TERRACE_WALL_OPENINGS: WallOpening[] = [
  {
    start: 5.5,
    width: 3,
    bottomCourse: 0,
    heightCourses: 4,
    kind: 'door',
    frameColor: LEGO_COLORS.brownWood,
    lattice: true,
  },
  {
    start: 9.5,
    width: 2,
    bottomCourse: 2,
    heightCourses: 2,
    kind: 'window',
    frameColor: LEGO_COLORS.brownWood,
    glass: true,
  },
];

const RUG_EXCLUSIONS = [
  { minX: -12.5, maxX: -8.5, minZ: -7.75, maxZ: -4.65 }, // Kitchen
  { minX: -2.9, maxX: 0.9, minZ: -4.6, maxZ: -3.1 }, // Bedroom
  { minX: 7.6, maxX: 12.0, minZ: -7.7, maxZ: -4.3 }, // Dressing Room
  { minX: 4.65, maxX: 10.35, minZ: 0.5, maxZ: 4.5 }, // Living Room
];

/** Floor 2 structural baseplate split cleanly around STAIRWELL_HOLE (x: -4..-1, z: 3.5..9.5) */
const UpperFloorBase: React.FC<{
  roomFloorColors?: Partial<Record<RoomId, string>>;
}> = ({ roomFloorColors }) => {
  const stairYellowRef = useRef<THREE.InstancedMesh>(null);
  const stairBrownRef = useRef<THREE.InstancedMesh>(null);

  const yellowMat = useMemo(
    () => getLegoMaterial(roomFloorColors?.['stair-room'] ?? LEGO_COLORS.warmYellow),
    [roomFloorColors?.['stair-room']]
  );
  const brownTileMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownFloor), []);

  const { brownStuds, stairYellow, stairBrown } = useMemo(() => {
    const studs: Vec3[] = [];
    const sy: Array<[number, number]> = [];
    const sb: Array<[number, number]> = [];

    const isStairHole = (x: number, z: number) =>
      x > STAIRWELL_HOLE.minX &&
      x < STAIRWELL_HOLE.maxX &&
      z > STAIRWELL_HOLE.minZ &&
      z < STAIRWELL_HOLE.maxZ;

    // Yellow-brown checkerboard tiles across the ENTIRE expanded Stair Room (x: -6..3, z: -2..12)
    // Absorbing the former Floor 2 bathroom footprint cleanly!
    for (let x = -5.5; x <= 2.5; x += 1) {
      for (let z = -1.5; z <= 11.5; z += 1) {
        if (isStairHole(x, z)) continue;
        const ix = Math.round(x - 0.5);
        const iz = Math.round(z - 0.5);
        if ((ix + iz) % 2 === 0) sy.push([x, z]);
        else sb.push([x, z]);
      }
    }

    const isInsideRug = (x: number, z: number) => {
      const margin = 0.26;
      for (const r of RUG_EXCLUSIONS) {
        if (
          x >= r.minX - margin &&
          x <= r.maxX + margin &&
          z >= r.minZ - margin &&
          z <= r.maxZ + margin
        ) {
          return true;
        }
      }
      return false;
    };

    const addStudRect = (x0: number, x1: number, z0: number, z1: number) => {
      for (let x = x0 + 0.5; x < x1; x += 1) {
        for (let z = z0 + 0.5; z < z1; z += 1) {
          if (isInsideRug(x, z)) continue;
          studs.push([x, FLOOR2_Y, z]);
        }
      }
    };

    addStudRect(-15, -7, -11, 0); // Kitchen
    addStudRect(-5, 3, -11, -3); // Bedroom
    addStudRect(5, 15, -11, -3); // Dressing Room
    addStudRect(4, 11, -1, 11); // Living Room & Dining Area

    return { brownStuds: studs, stairYellow: sy, stairBrown: sb };
  }, []);

  useLayoutEffect(() => {
    const populate = (
      mesh: THREE.InstancedMesh | null,
      coords: Array<[number, number]>
    ) => {
      if (!mesh) return;
      for (let i = 0; i < coords.length; i++) {
        const [x, z] = coords[i];
        tempDummy.position.set(x, FLOOR2_Y - PLATE_H * 0.5 + 0.015, z);
        tempDummy.rotation.set(0, 0, 0);
        tempDummy.scale.set(0.95, PLATE_H, 0.95);
        tempDummy.updateMatrix();
        mesh.setMatrixAt(i, tempDummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    populate(stairYellowRef.current, stairYellow);
    populate(stairBrownRef.current, stairBrown);
  }, [stairYellow, stairBrown]);

  const baseWoodColor = roomFloorColors?.['living-room'] ?? LEGO_COLORS.brownFloor;

  return (
    <group name="floor2-slab">
      {/* Structural Floor 2 slab split cleanly around stairwell opening x:[-4,-1], z:[3.5,9.5] */}
      {/* North band: x: -16..16, z: -12..3.5 (length 15.5, center z = -4.25) */}
      <Plate
        position={[0, GROUND_FLOOR_H, -4.25]}
        size={[32, 1, 15.5]}
        color={baseWoodColor}
        studs={false}
      />
      {/* West-south band: x: -16..-4, z: 3.5..12 (length 8.5, center z = 7.75) */}
      <Plate
        position={[-10, GROUND_FLOOR_H, 7.75]}
        size={[12, 1, 8.5]}
        color={baseWoodColor}
        studs={false}
      />
      {/* East-south band: x: -1..16, z: 3.5..12 (length 8.5, center z = 7.75) */}
      <Plate
        position={[7.5, GROUND_FLOOR_H, 7.75]}
        size={[17, 1, 8.5]}
        color={baseWoodColor}
        studs={false}
      />
      {/* South strip behind stairwell opening: x: -4..-1, z: 9.5..12 (length 2.5, center z = 10.75) */}
      <Plate
        position={[-2.5, GROUND_FLOOR_H, 10.75]}
        size={[3, 1, 2.5]}
        color={baseWoodColor}
        studs={false}
      />

      <Studs positions={brownStuds} color={baseWoodColor} castShadow={false} />

      {/* Yellow-Brown Checkerboard Floor across expanded Stair Room & Hall */}
      <instancedMesh
        ref={stairYellowRef}
        args={[SHARED_TILE_BOX, yellowMat, stairYellow.length]}
        receiveShadow
      />
      <instancedMesh
        ref={stairBrownRef}
        args={[SHARED_TILE_BOX, brownTileMat, stairBrown.length]}
        receiveShadow
      />
    </group>
  );
};

export interface HouseProps {
  isNight: boolean;
  onSelectRoom: (roomId: RoomId) => void;
  /** Optional wall/trim/floor color overrides from Build Mode */
  wallColorOverrides?: Record<string, string>;
  trimColorOverrides?: { left?: string; right?: string };
  roomFloorColors?: Partial<Record<RoomId, string>>;
}

export const House: React.FC<HouseProps> = ({
  isNight,
  onSelectRoom,
  wallColorOverrides,
  trimColorOverrides,
  roomFloorColors,
}) => {
  const wc = (id: string, fallback: string) => wallColorOverrides?.[id] ?? fallback;
  const leftTrim = trimColorOverrides?.left ?? LEGO_COLORS.darkBlueTrim;
  const rightTrim = trimColorOverrides?.right ?? LEGO_COLORS.magentaTrim;
  const pinkExt = wc('outer-f2', LEGO_COLORS.pinkExterior);

  return (
    <group name="lego-tropical-house">
      {/* ================================================================= */}
      {/* FLOOR 1 GROUP: Outer mint shell, 7 interior rooms, & connecting   */}
      {/* 12-step staircase (always opaque & interactive in Floor 1 mode!)  */}
      {/* ================================================================= */}
      <FloorGroup level={1} name="floor-1">
        <GroundFloorShell outerColor={wc('outer-f1', LEGO_COLORS.mintWall)} />
        <Floor1Interior
          isNight={isNight}
          onSelectRoom={onSelectRoom}
          roomFloorColors={roomFloorColors}
          wallColorOverrides={wallColorOverrides}
        />
        {/* Precision 12-step wooden staircase descending from Floor 2 (7.6) -> Floor 1 (0.4) */}
        <Stairs />
      </FloorGroup>

      {/* ================================================================= */}
      {/* FLOOR 2 GROUP: Terracotta overhang, Floor 2 slab, walls, rooms,   */}
      {/* terraces, & guard rails — fades smoothly to 0.12 in Floor 1 mode! */}
      {/* ================================================================= */}
      <FloorGroup level={2} name="floor-2">
        {/* Sloped terracotta genteng roof overhang + divider molding */}
        <TerracottaRoofOverhang />

        {/* Floor 2 Structural Baseplate + Checkerboard Stair Hall */}
        <UpperFloorBase roomFloorColors={roomFloorColors} />

        {/* =============================================================== */}
        {/* OUTER 2ND FLOOR WALLS (Left trim Dark Blue, Right trim Magenta) */}
        {/* =============================================================== */}
        <Wall
          start={[-16, FLOOR2_Y, -11.5]}
          end={[-6, FLOOR2_Y, -11.5]}
          courses={6}
          outerColor={wc('f2-kitchen-north-ext', pinkExt)}
          innerColor={wc('f2-kitchen-north-int', LEGO_COLORS.mintWall)}
          innerAccentColor={LEGO_COLORS.mintTile}
          outerSide={-1}
          topTrimColor={leftTrim}
          openings={KITCHEN_NORTH_OPENINGS}
        />
        <Wall
          start={[-6, FLOOR2_Y, -11.5]}
          end={[0, FLOOR2_Y, -11.5]}
          courses={6}
          outerColor={wc('f2-bedroom-north-ext', pinkExt)}
          innerColor={wc('f2-bedroom-north-int', LEGO_COLORS.mintLight)}
          outerSide={-1}
          topTrimColor={leftTrim}
          openings={BEDROOM_NORTH_OPENINGS}
        />
        <Wall
          start={[0, FLOOR2_Y, -11.5]}
          end={[4, FLOOR2_Y, -11.5]}
          courses={6}
          outerColor={wc('f2-bedroom-north-ext', pinkExt)}
          innerColor={wc('f2-bedroom-north-int', LEGO_COLORS.mintLight)}
          outerSide={-1}
          topTrimColor={rightTrim}
        />
        <Wall
          start={[4, FLOOR2_Y, -11.5]}
          end={[16, FLOOR2_Y, -11.5]}
          courses={6}
          outerColor={wc('f2-dressing-north-ext', pinkExt)}
          innerColor={wc('f2-dressing-north-int', LEGO_COLORS.pinkLight)}
          outerSide={-1}
          topTrimColor={rightTrim}
          openings={DRESSING_NORTH_OPENINGS}
        />

        {/* West Outer Wall (Kitchen West) */}
        <Wall
          start={[-15.5, FLOOR2_Y, -11]}
          end={[-15.5, FLOOR2_Y, 0.5]}
          courses={6}
          outerColor={wc('f2-kitchen-west-ext', pinkExt)}
          innerColor={wc('f2-kitchen-west-int', LEGO_COLORS.mintWall)}
          innerAccentColor={LEGO_COLORS.mintTile}
          outerSide={1}
          topTrimColor={leftTrim}
        />

        {/* Kitchen South Wall overlooking Left Terrace */}
        <Wall
          start={[-16, FLOOR2_Y, 1]}
          end={[-6.5, FLOOR2_Y, 1]}
          courses={6}
          outerColor={wc('f2-kitchen-south-ext', pinkExt)}
          innerColor={wc('f2-kitchen-south-int', LEGO_COLORS.mintWall)}
          innerAccentColor={LEGO_COLORS.mintTile}
          outerSide={1}
          topTrimColor={leftTrim}
          openings={KITCHEN_SOUTH_OPENINGS}
        />

        {/* East Outer Wall (Dressing Room East) */}
        <Wall
          start={[15.5, FLOOR2_Y, -11]}
          end={[15.5, FLOOR2_Y, -2.5]}
          courses={6}
          outerColor={wc('f2-dressing-east-ext', pinkExt)}
          innerColor={wc('f2-dressing-east-int', LEGO_COLORS.pinkLight)}
          outerSide={-1}
          topTrimColor={rightTrim}
        />

        {/* Dressing Room South Wall overlooking Right Terrace */}
        <Wall
          start={[11.5, FLOOR2_Y, -2]}
          end={[16, FLOOR2_Y, -2]}
          courses={6}
          outerColor={wc('f2-dressing-south-ext', pinkExt)}
          innerColor={wc('f2-dressing-south-int', LEGO_COLORS.pinkLight)}
          outerSide={1}
          topTrimColor={rightTrim}
          openings={DRESSING_TERRACE_SOUTH_OPENINGS}
        />

        {/* Living Room & Dining Area East Wall facing Right Terrace */}
        <Wall
          start={[12, FLOOR2_Y, -1.5]}
          end={[12, FLOOR2_Y, 11]}
          courses={6}
          outerColor={wc('f2-living-east-ext', pinkExt)}
          innerColor={wc('f2-living-east-int', LEGO_COLORS.creamWall)}
          outerSide={-1}
          topTrimColor={rightTrim}
          openings={RIGHT_TERRACE_WALL_OPENINGS}
        />

        {/* Stepped Front Cutaway Corner Piers & Parapets */}
        <Brick position={[-5.75, FLOOR2_Y, 11.5]} size={[1.5, 3, 1]} color={pinkExt} studs={false} />
        <Plate position={[-5.75, FLOOR2_Y + 3.6, 11.5]} size={[1.5, 1, 1]} color={leftTrim} />
        <Brick position={[11.75, FLOOR2_Y, 11.5]} size={[1.5, 3, 1]} color={pinkExt} studs={false} />
        <Plate position={[11.75, FLOOR2_Y + 3.6, 11.5]} size={[1.5, 1, 1]} color={rightTrim} />

        <Wall
          start={[-5, FLOOR2_Y, 11.5]}
          end={[0, FLOOR2_Y, 11.5]}
          courses={2}
          outerColor={pinkExt}
          innerColor={wc('f2-stair-south-int', LEGO_COLORS.darkBrownBrick)}
          outerSide={1}
          topTrimColor={leftTrim}
        />
        <Wall
          start={[0, FLOOR2_Y, 11.5]}
          end={[3, FLOOR2_Y, 11.5]}
          courses={2}
          outerColor={pinkExt}
          innerColor={wc('f2-stair-south-int', LEGO_COLORS.darkBrownBrick)}
          outerSide={1}
          topTrimColor={rightTrim}
        />
        <Wall
          start={[3, FLOOR2_Y, 11.5]}
          end={[11, FLOOR2_Y, 11.5]}
          courses={1}
          outerColor={pinkExt}
          innerColor={wc('f2-dining-south-int', LEGO_COLORS.creamWall)}
          outerSide={1}
          topTrimColor={rightTrim}
        />

        {/* =============================================================== */}
        {/* FLOOR 2 INTERIOR PARTITIONS (Bathroom walls REMOVED!)           */}
        {/* =============================================================== */}

        {/* Spine wall x = -6: Kitchen (W) vs Bedroom (E): z = -11..-2 */}
        <Wall
          start={[-6, FLOOR2_Y, -11]}
          end={[-6, FLOOR2_Y, -2]}
          courses={5}
          outerColor={wc('f2-kitchen-east-int', LEGO_COLORS.mintWall)}
          innerColor={wc('f2-bedroom-west-int', LEGO_COLORS.mintLight)}
          outerSide={1}
          topTrimColor={leftTrim}
        />
        {/* Spine wall x = -6: Kitchen (W) vs expanded Stair Room (E): z = -2..0.5 with indoor doorway */}
        <Wall
          start={[-6, FLOOR2_Y, -2]}
          end={[-6, FLOOR2_Y, 0.5]}
          courses={5}
          outerColor={wc('f2-kitchen-east-int', LEGO_COLORS.mintWall)}
          innerColor={wc('f2-stair-west-int', LEGO_COLORS.darkBrownBrick)}
          outerSide={1}
          topTrimColor={leftTrim}
          openings={KITCHEN_STAIR_EAST_OPENINGS}
        />
        {/* Exterior-facing wall x = -6: Left Terrace (W) vs expanded Stair Room (E): z = 0.5..11 */}
        <Wall
          start={[-6, FLOOR2_Y, 0.5]}
          end={[-6, FLOOR2_Y, 11]}
          courses={6}
          outerColor={wc('f2-stair-west-ext', pinkExt)}
          innerColor={wc('f2-stair-west-int', LEGO_COLORS.darkBrownBrick)}
          outerSide={1}
          topTrimColor={leftTrim}
          openings={STAIR_TERRACE_WEST_OPENINGS}
        />

        {/* Partition x = 4: Bedroom (W) vs Dressing Room (E) */}
        <Wall
          start={[4, FLOOR2_Y, -11]}
          end={[4, FLOOR2_Y, -2.5]}
          courses={5}
          outerColor={wc('f2-bedroom-east-int', LEGO_COLORS.mintLight)}
          innerColor={wc('f2-dressing-west-int', LEGO_COLORS.pinkLight)}
          outerSide={1}
        />

        {/* Partition z = -2: Bedroom (N) vs expanded Stair Room (S): x = -5.5..4 (single continuous dark-brown stair wall!) */}
        <Wall
          start={[-5.5, FLOOR2_Y, -2]}
          end={[4, FLOOR2_Y, -2]}
          courses={5}
          outerColor={wc('f2-stair-north-int', LEGO_COLORS.darkBrownBrick)}
          innerColor={wc('f2-bedroom-south-int', LEGO_COLORS.mintLight)}
          outerSide={1}
          openings={BEDROOM_SOUTH_OPENINGS}
        />

        {/* Partition z = -2: Dressing Room (N) vs Living Room (S) */}
        <Wall
          start={[4, FLOOR2_Y, -2]}
          end={[11.5, FLOOR2_Y, -2]}
          courses={5}
          outerColor={wc('f2-living-north-int', LEGO_COLORS.creamWall)}
          innerColor={wc('f2-dressing-south-int', LEGO_COLORS.pinkLight)}
          outerSide={1}
          openings={DRESSING_SOUTH_OPENINGS}
        />

        {/* Partition x = 3: Stair Room (W) vs Living Room/Dining Area (E) */}
        <Wall
          start={[3, FLOOR2_Y, -1.5]}
          end={[3, FLOOR2_Y, 11]}
          courses={5}
          outerColor={wc('f2-stair-east-int', LEGO_COLORS.darkBrownBrick)}
          innerColor={wc('f2-living-west-int', LEGO_COLORS.creamWall)}
          outerSide={1}
          openings={STAIR_LIVING_DIVIDER_OPENINGS}
        />

        {/* =============================================================== */}
        {/* TERRACES + 6 FURNISHED FLOOR 2 ROOMS (Bathroom moved to F1!)    */}
        {/* =============================================================== */}
        <Terraces isNight={isNight} onSelectRoom={onSelectRoom} />

        <Kitchen isNight={isNight} />
        <Bedroom isNight={isNight} />
        <DressingRoom isNight={isNight} />
        <StairRoom isNight={isNight} />
        <LivingRoom isNight={isNight} />
        <DiningArea isNight={isNight} />

        {/* =============================================================== */}
        {/* CLICKABLE FLOOR 2 ROOM HIT ZONES (auto-disabled in Floor 1!)    */}
        {/* =============================================================== */}
        <RoomClickZone
          roomId="kitchen"
          minX={-15}
          maxX={-6.5}
          minZ={-11}
          maxZ={0.5}
          highlightColor={LEGO_COLORS.mintLight}
          onSelectRoom={onSelectRoom}
        />
        <RoomClickZone
          roomId="bedroom"
          minX={-5.5}
          maxX={3.5}
          minZ={-11}
          maxZ={-2.5}
          highlightColor={LEGO_COLORS.lightBlue}
          onSelectRoom={onSelectRoom}
        />
        <RoomClickZone
          roomId="dressing-room"
          minX={4.5}
          maxX={15}
          minZ={-11}
          maxZ={-2.5}
          highlightColor={LEGO_COLORS.pinkLight}
          onSelectRoom={onSelectRoom}
        />
        <RoomClickZone
          roomId="stair-room"
          minX={-5.5}
          maxX={2.5}
          minZ={-1.5}
          maxZ={11}
          highlightColor={LEGO_COLORS.warmYellow}
          onSelectRoom={onSelectRoom}
        />
        <RoomClickZone
          roomId="living-room"
          minX={3.5}
          maxX={11.5}
          minZ={-1.5}
          maxZ={5.5}
          highlightColor={LEGO_COLORS.warmYellow}
          onSelectRoom={onSelectRoom}
        />
        <RoomClickZone
          roomId="dining-area"
          minX={3.5}
          maxX={11.5}
          minZ={5.5}
          maxZ={11}
          highlightColor={LEGO_COLORS.orange}
          onSelectRoom={onSelectRoom}
        />
      </FloorGroup>
    </group>
  );
};
