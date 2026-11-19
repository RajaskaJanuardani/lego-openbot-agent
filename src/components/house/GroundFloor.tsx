import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LEGO_COLORS } from '../../lib/colors';
import { BRICK_H, GROUND_FLOOR_H, GROUND_Y, PLATE_H } from '../../lib/constants';
import { getLegoMaterial } from '../../lib/materials';
import { Brick, Plate, Tile, Wall, type WallOpening } from '../lego';

const SHARED_BOX = new THREE.BoxGeometry(1, 1, 1);
const tempDummy = new THREE.Object3D();

const FRONT_OPENINGS: WallOpening[] = [
  {
    start: 3,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
  {
    start: 8,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
  {
    start: 14,
    width: 4,
    bottomCourse: 0,
    heightCourses: 5,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
  },
  {
    start: 21,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
  {
    start: 26,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
];

const SIDE_OPENINGS: WallOpening[] = [
  {
    start: 3,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
  {
    start: 10,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
  {
    start: 17,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
    shutterColor: LEGO_COLORS.brownWood,
  },
];

const BACK_OPENINGS: WallOpening[] = [
  {
    start: 3,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
  {
    start: 10,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
  {
    start: 19,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
  {
    start: 26,
    width: 3,
    bottomCourse: 1,
    heightCourses: 4,
    kind: 'arch',
    frameColor: LEGO_COLORS.white,
    glass: true,
  },
];

/**
 * Sloped terracotta LEGO genteng roof overhang & decorative floor-divider belt molding.
 * Placed inside FloorGroup level={2} so it fades smoothly to 0.12 in Floor 1 view!
 */
export const TerracottaRoofOverhang: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const terracottaMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.terracotta, { roughness: 0.32 }),
    []
  );
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);

  const tiles = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }> = [];
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const z = 12.28 + r * 0.68;
      const y = 7.18 - r * 0.42;
      for (let x = -15.5; x <= 15.5; x += 1) {
        items.push({ x, y, z, sx: 0.92, sy: 0.28, sz: 0.78 });
      }
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pitch = 0.54;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      tempDummy.position.set(t.x, t.y, t.z);
      tempDummy.rotation.set(pitch, 0, 0);
      tempDummy.scale.set(t.sx, t.sy, t.sz);
      tempDummy.updateMatrix();
      mesh.setMatrixAt(i, tempDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tiles]);

  return (
    <group name="terracotta-roof-overhang">
      {/* Roof backing soffit slab */}
      <mesh
        position={[0, 6.22, 13.65]}
        rotation={[0.54, 0, 0]}
        material={darkWoodMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[32.2, 0.24, 3.7]} />
      </mesh>

      {/* Terracotta genteng LEGO tiles */}
      <instancedMesh
        ref={meshRef}
        args={[SHARED_BOX, terracottaMat, tiles.length]}
        castShadow
        receiveShadow
      />

      {/* Front horizontal eave beam */}
      <Brick
        position={[0, 5.15, 14.8]}
        size={[32, 0.35, 0.5]}
        color={LEGO_COLORS.brownWood}
        studs={false}
      />

      {/* Decorative belt molding separating 1st floor mint & 2nd floor pink */}
      <Tile
        position={[0, GROUND_FLOOR_H - 0.1, -12.05]}
        size={[32.4, 0.35]}
        height={PLATE_H}
        color={LEGO_COLORS.white}
      />
      <Tile
        position={[-16.05, GROUND_FLOOR_H - 0.1, 0]}
        size={[0.35, 24.4]}
        height={PLATE_H}
        color={LEGO_COLORS.white}
      />
      <Tile
        position={[16.05, GROUND_FLOOR_H - 0.1, 0]}
        size={[0.35, 24.4]}
        height={PLATE_H}
        color={LEGO_COLORS.white}
      />
    </group>
  );
};

export interface GroundFloorShellProps {
  outerColor?: string;
}

/**
 * Floor 1 exterior mint masonry shell, white arched windows, inviting half-open double
 * wooden entry doors, corner quoins, front verandah pillars & cream verandah floor.
 * Placed inside FloorGroup level={1}.
 */
export const GroundFloorShell: React.FC<GroundFloorShellProps> = ({
  outerColor = LEGO_COLORS.mintWall,
}) => {
  const warmDoorMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const darkWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);
  const goldMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.45, roughness: 0.25 }),
    []
  );

  const columnXs = [-15, -9, -3.5, 3.5, 9, 15];

  return (
    <group name="ground-floor-shell">
      {/* 1st Floor South (Front) Wall: x = -16..16 at z = 11.5 */}
      <Wall
        start={[-16, GROUND_Y, 11.5]}
        end={[16, GROUND_Y, 11.5]}
        courses={6}
        outerColor={outerColor}
        innerColor={LEGO_COLORS.creamWall}
        outerSide={1}
        topStuds={false}
        openings={FRONT_OPENINGS}
      />

      {/* Double wooden main entry doors swung invitingly inward so characters pass freely */}
      <group position={[0, GROUND_Y + PLATE_H, 11.3]}>
        {/* Left door leaf hinged at x = -1.78 */}
        <group position={[-1.78, 0, 0]} rotation={[0, -0.92, 0]}>
          <mesh position={[0.82, 2.55, 0]} material={warmDoorMat} castShadow receiveShadow>
            <boxGeometry args={[1.64, 5.1, 0.2]} />
          </mesh>
          <mesh position={[0.82, 1.4, 0.11]} material={darkWoodMat}>
            <boxGeometry args={[1.08, 1.7, 0.05]} />
          </mesh>
          <mesh position={[0.82, 3.6, 0.11]} material={darkWoodMat}>
            <boxGeometry args={[1.08, 1.5, 0.05]} />
          </mesh>
          <mesh position={[1.45, 2.35, 0.16]} material={goldMat}>
            <sphereGeometry args={[0.13, 10, 10]} />
          </mesh>
        </group>

        {/* Right door leaf hinged at x = +1.78 */}
        <group position={[1.78, 0, 0]} rotation={[0, 0.92, 0]}>
          <mesh position={[-0.82, 2.55, 0]} material={warmDoorMat} castShadow receiveShadow>
            <boxGeometry args={[1.64, 5.1, 0.2]} />
          </mesh>
          <mesh position={[-0.82, 1.4, 0.11]} material={darkWoodMat}>
            <boxGeometry args={[1.08, 1.7, 0.05]} />
          </mesh>
          <mesh position={[-0.82, 3.6, 0.11]} material={darkWoodMat}>
            <boxGeometry args={[1.08, 1.5, 0.05]} />
          </mesh>
          <mesh position={[-1.45, 2.35, 0.16]} material={goldMat}>
            <sphereGeometry args={[0.13, 10, 10]} />
          </mesh>
        </group>
      </group>

      {/* 1st Floor North (Back) Wall: x = -16..16 at z = -11.5 */}
      <Wall
        start={[-16, GROUND_Y, -11.5]}
        end={[16, GROUND_Y, -11.5]}
        courses={6}
        outerColor={outerColor}
        innerColor={LEGO_COLORS.offWhite}
        outerSide={-1}
        topStuds={false}
        openings={BACK_OPENINGS}
      />

      {/* 1st Floor West (Left) Wall: z = -11..11 at x = -15.5 */}
      <Wall
        start={[-15.5, GROUND_Y, -11]}
        end={[-15.5, GROUND_Y, 11]}
        courses={6}
        outerColor={outerColor}
        innerColor={LEGO_COLORS.creamWall}
        outerSide={1}
        topStuds={false}
        openings={SIDE_OPENINGS}
      />

      {/* 1st Floor East (Right) Wall: z = -11..11 at x = 15.5 */}
      <Wall
        start={[15.5, GROUND_Y, -11]}
        end={[15.5, GROUND_Y, 11]}
        courses={6}
        outerColor={outerColor}
        innerColor={LEGO_COLORS.offWhite}
        outerSide={-1}
        topStuds={false}
        openings={SIDE_OPENINGS}
      />

      {/* Corner LEGO masonry quoin accents in white */}
      {[
        [-15.65, -11.65],
        [15.65, -11.65],
        [-15.65, 11.65],
        [15.65, 11.65],
      ].map(([cx, cz], idx) => (
        <group key={idx}>
          {[0, 2, 4].map((c) => (
            <Plate
              key={c}
              position={[cx, GROUND_Y + c * BRICK_H, cz]}
              size={[0.85, 3, 0.85]}
              color={LEGO_COLORS.white}
              studs={false}
            />
          ))}
        </group>
      ))}

      {/* Verandah support columns along Z = 14.7 */}
      {columnXs.map((x) => (
        <group key={x} position={[x, GROUND_Y, 14.7]}>
          <Brick position={[0, 0, 0]} size={[1, 0.5, 1]} color={LEGO_COLORS.offWhite} studs={false} />
          <Brick position={[0, 0.6, 0]} size={[0.65, 3.5, 0.65]} color={LEGO_COLORS.white} studs={false} />
          <Brick position={[0, 4.8, 0]} size={[0.95, 0.32, 0.95]} color={LEGO_COLORS.brownWood} studs={false} />
        </group>
      ))}

      {/* Front verandah tiled porch floor */}
      <Tile
        position={[0, GROUND_Y, 13.6]}
        size={[32, 3.2]}
        height={PLATE_H}
        color={LEGO_COLORS.creamTile}
      />
      {/* Front entry step */}
      <Tile
        position={[0, GROUND_Y, 15.5]}
        size={[5, 0.9]}
        height={PLATE_H * 0.65}
        color={LEGO_COLORS.offWhite}
      />
    </group>
  );
};

/** Legacy combined export kept for compatibility */
export const GroundFloor: React.FC = () => (
  <group>
    <GroundFloorShell />
    <TerracottaRoofOverhang />
  </group>
);
