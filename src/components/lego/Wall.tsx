import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../../types';
import { BRICK_H, PLATE_H, STUD_UNIT } from '../../lib/layout';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { Studs } from './Studs';

const SHARED_UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const WALL_BRICK_GAP = 0.032;
const tempObj = new THREE.Object3D();

export interface WallOpening {
  /** Start position in studs along the wall from `start` (0..length) */
  start: number;
  /** Width in studs */
  width: number;
  /** Bottom course index (0 = floor level) */
  bottomCourse: number;
  /** Height in brick courses */
  heightCourses: number;
  /** Frame style */
  kind?: 'door' | 'window' | 'arch' | 'open';
  /** Frame color (defaults to wooden brown or white for arch) */
  frameColor?: string;
  /** Translucent glass pane inside window/arch */
  glass?: boolean;
  /** Optional wooden shutter color flanking window */
  shutterColor?: string;
  /** Optional wooden lattice/louver bars */
  lattice?: boolean;
}

export interface WallProps {
  start: Vec3;
  end: Vec3;
  courses?: number;
  thickness?: number;
  outerColor: string;
  innerColor?: string;
  /** Flip which local Z side is outer (+1 = local +Z, -1 = local -Z) */
  outerSide?: 1 | -1;
  /** Optional 1-plate top cap color along the wall ridge */
  topTrimColor?: string;
  /** Show top LEGO studs (default true) */
  topStuds?: boolean;
  openings?: WallOpening[];
  /** Optional alternating inner ceramic accent tile color on lower courses */
  innerAccentColor?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

interface BrickInstance {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
}

function splitSpanIntoBricks(
  spanStart: number,
  spanEnd: number,
  courseIdx: number
): Array<{ x0: number; len: number }> {
  const result: Array<{ x0: number; len: number }> = [];
  let cursor = spanStart;

  // Handle leading half-stud corner piece if span starts on a .5 offset
  if (Math.abs(cursor - Math.round(cursor)) > 0.01 && spanEnd - cursor >= 0.49) {
    const step = Math.min(0.5, spanEnd - cursor);
    result.push({ x0: cursor, len: step });
    cursor += step;
  }

  // Reserve trailing half-stud corner piece if span ends on a .5 offset
  const intEnd = Math.floor(spanEnd + 0.001);

  // Stagger odd courses by 1 stud for authentic running-bond LEGO masonry
  if (courseIdx % 2 === 1 && intEnd - cursor >= 2) {
    result.push({ x0: cursor, len: 1 });
    cursor += 1;
  }

  while (cursor < intEnd - 0.01) {
    const remaining = intEnd - cursor;
    let len = 2;
    if (remaining >= 4 && (Math.round(cursor) + courseIdx) % 3 === 0) {
      len = 4;
    } else if (remaining >= 3 && (Math.round(cursor) + courseIdx) % 2 === 0) {
      len = 3;
    } else if (remaining >= 2) {
      len = 2;
    } else {
      len = remaining;
    }
    result.push({ x0: cursor, len });
    cursor += len;
  }

  // Trailing half-stud corner closer piece
  if (spanEnd - cursor > 0.01) {
    result.push({ x0: cursor, len: spanEnd - cursor });
  }

  return result;
}

const BrickBatch: React.FC<{
  instances: BrickInstance[];
  color: string;
  castShadow: boolean;
  receiveShadow: boolean;
}> = ({ instances, color, castShadow, receiveShadow }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => getLegoMaterial(color), [color]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || instances.length === 0) return;

    for (let i = 0; i < instances.length; i++) {
      const b = instances[i];
      tempObj.position.set(b.x, b.y, b.z);
      tempObj.rotation.set(0, 0, 0);
      tempObj.scale.set(b.sx, b.sy, b.sz);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      key={instances.length}
      ref={ref}
      args={[SHARED_UNIT_BOX, material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
};

const OpeningFrame: React.FC<{
  opening: WallOpening;
  thickness: number;
  outerSide: 1 | -1;
}> = ({ opening, thickness, outerSide }) => {
  const kind = opening.kind ?? 'window';
  if (kind === 'open') return null;

  const w = opening.width * STUD_UNIT;
  const h = opening.heightCourses * BRICK_H;
  const cx = (opening.start + opening.width * 0.5) * STUD_UNIT;
  const cy = opening.bottomCourse * BRICK_H;

  const frameColor =
    opening.frameColor ??
    (kind === 'arch' ? LEGO_COLORS.white : LEGO_COLORS.brownWood);
  const frameMat = useMemo(() => getLegoMaterial(frameColor), [frameColor]);
  const glassMat = useMemo(
    () =>
      getLegoMaterial('#CBEFFF', {
        roughness: 0.08,
        metalness: 0.05,
        transparent: true,
        opacity: 0.32,
      }),
    []
  );
  const shutterMat = useMemo(
    () =>
      opening.shutterColor ? getLegoMaterial(opening.shutterColor) : null,
    [opening.shutterColor]
  );

  const frameDepth = thickness + 0.12;
  const bar = 0.16;

  return (
    <group position={[cx, cy, 0]}>
      {/* Left jamb */}
      <mesh
        position={[-w * 0.5 + bar * 0.5, h * 0.5, 0]}
        material={frameMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[bar, h, frameDepth]} />
      </mesh>
      {/* Right jamb */}
      <mesh
        position={[w * 0.5 - bar * 0.5, h * 0.5, 0]}
        material={frameMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[bar, h, frameDepth]} />
      </mesh>
      {/* Top header */}
      <mesh
        position={[0, h - bar * 0.5, 0]}
        material={frameMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, bar, frameDepth]} />
      </mesh>

      {/* Bottom sill for windows & arched windows */}
      {(kind === 'window' || (kind === 'arch' && opening.bottomCourse > 0)) && (
        <mesh
          position={[0, bar * 0.5, 0]}
          material={frameMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w + 0.18, bar * 1.15, frameDepth + 0.14]} />
        </mesh>
      )}

      {/* LEGO stepped arch spandrels for arched windows & doors */}
      {kind === 'arch' && (
        <>
          <mesh
            position={[-w * 0.5 + 0.34, h - 0.34, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.56, 0.56, frameDepth - 0.04]} />
          </mesh>
          <mesh
            position={[w * 0.5 - 0.34, h - 0.34, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.56, 0.56, frameDepth - 0.04]} />
          </mesh>
          <mesh
            position={[-w * 0.5 + 0.2, h - 0.72, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.28, 0.36, frameDepth - 0.04]} />
          </mesh>
          <mesh
            position={[w * 0.5 - 0.2, h - 0.72, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.28, 0.36, frameDepth - 0.04]} />
          </mesh>
          {/* Decorative arch keystone */}
          <mesh
            position={[0, h - 0.22, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[w * 0.42, 0.24, frameDepth]} />
          </mesh>
        </>
      )}

      {/* Window cross mullions */}
      {(kind === 'window' || (kind === 'arch' && opening.bottomCourse > 0)) && (
        <>
          <mesh position={[0, h * 0.5, 0]} material={frameMat}>
            <boxGeometry args={[0.09, h - bar * 2, 0.14]} />
          </mesh>
          <mesh position={[0, h * 0.52, 0]} material={frameMat}>
            <boxGeometry args={[w - bar * 2, 0.09, 0.14]} />
          </mesh>
        </>
      )}

      {/* Glass pane */}
      {opening.glass && (
        <mesh position={[0, h * 0.5, 0]} material={glassMat}>
          <boxGeometry args={[w - bar * 1.8, h - bar * 1.8, 0.08]} />
        </mesh>
      )}

      {/* Wooden shutters (tropical krepyak window detail) */}
      {shutterMat && (
        <>
          <mesh
            position={[-w * 0.5 - 0.32, h * 0.5, outerSide * (thickness * 0.5 + 0.08)]}
            material={shutterMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.56, h * 0.92, 0.12]} />
          </mesh>
          <mesh
            position={[w * 0.5 + 0.32, h * 0.5, outerSide * (thickness * 0.5 + 0.08)]}
            material={shutterMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.56, h * 0.92, 0.12]} />
          </mesh>
        </>
      )}

      {/* Lattice / Krepyak wooden slats for tropical terrace doorways */}
      {opening.lattice && (
        <group position={[w * 0.36, 0, 0]}>
          {/* Half-open lattice side panel on right side of opening */}
          <mesh
            position={[0, h * 0.5, 0]}
            material={frameMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.1, h - bar * 1.5, 0.24]} />
          </mesh>
          {[0.2, 0.36, 0.52, 0.68, 0.82].map((frac, idx) => (
            <mesh
              key={idx}
              position={[-0.22, h * frac, 0]}
              material={frameMat}
              castShadow
            >
              <boxGeometry args={[0.42, 0.09, 0.18]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export const Wall: React.FC<WallProps> = ({
  start,
  end,
  courses = 6,
  thickness = 1,
  outerColor,
  innerColor,
  outerSide = 1,
  topTrimColor,
  topStuds = true,
  openings = [],
  innerAccentColor,
  castShadow = true,
  receiveShadow = true,
}) => {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  // Support exact half-stud lengths so perpendicular walls butt flush at corners without overlap
  const halfSteps = Math.max(1, Math.round(Math.hypot(dx, dz) * 2));
  const rotY = Math.atan2(-dz, dx);

  const dualSided = Boolean(innerColor && innerColor !== outerColor);

  const {
    outerBricks,
    innerBricks,
    innerAccentBricks,
    trimBricks,
    topStudPositions,
  } = useMemo(() => {
    const outer: BrickInstance[] = [];
    const inner: BrickInstance[] = [];
    const innerAccent: BrickInstance[] = [];
    const trim: BrickInstance[] = [];
    const studs: Vec3[] = [];

    const isInsideOpening = (halfCol: number, course: number) => {
      const colCenter = (halfCol + 0.5) * 0.5;
      for (const op of openings) {
        if (
          colCenter > op.start &&
          colCenter < op.start + op.width &&
          course >= op.bottomCourse &&
          course < op.bottomCourse + op.heightCourses
        ) {
          return true;
        }
      }
      return false;
    };

    const halfDepth = thickness * 0.5;
    const outerZ = dualSided ? outerSide * halfDepth * 0.5 : 0;
    const innerZ = dualSided ? -outerSide * halfDepth * 0.5 : 0;
    const outerThickness = dualSided ? halfDepth : thickness;

    for (let c = 0; c < courses; c++) {
      const yCenter = c * BRICK_H + BRICK_H * 0.5;
      const brickH = BRICK_H - WALL_BRICK_GAP;

      // Collect contiguous solid horizontal spans in half-stud increments
      let u = 0;
      while (u < halfSteps) {
        if (isInsideOpening(u, c)) {
          u++;
          continue;
        }
        const uStart = u;
        while (u < halfSteps && !isInsideOpening(u, c)) {
          u++;
        }
        const spanStart = uStart * 0.5;
        const spanEnd = u * 0.5;

        const segments = splitSpanIntoBricks(spanStart, spanEnd, c);
        for (const seg of segments) {
          const cx = (seg.x0 + seg.len * 0.5) * STUD_UNIT;
          const sx = Math.max(0.1, seg.len * STUD_UNIT - WALL_BRICK_GAP);

          outer.push({
            x: cx,
            y: yCenter,
            z: outerZ,
            sx,
            sy: brickH,
            sz: outerThickness - WALL_BRICK_GAP * 0.5,
          });

          if (dualSided) {
            if (innerAccentColor && c < 3) {
              // Ceramic wall tile checkerboard on lower interior courses
              let tileCursor = seg.x0;
              const segEnd = seg.x0 + seg.len;
              while (tileCursor < segEnd - 0.01) {
                const tileLen = Math.min(1, segEnd - tileCursor);
                const tileX = (tileCursor + tileLen * 0.5) * STUD_UNIT;
                const useAccent = (Math.floor(tileCursor + 0.01) + c) % 2 === 0;
                const targetList = useAccent ? innerAccent : inner;
                targetList.push({
                  x: tileX,
                  y: yCenter,
                  z: innerZ,
                  sx: Math.max(0.1, tileLen * STUD_UNIT - WALL_BRICK_GAP),
                  sy: brickH,
                  sz: halfDepth - WALL_BRICK_GAP * 0.5,
                });
                tileCursor += tileLen;
              }
            } else {
              inner.push({
                x: cx,
                y: yCenter,
                z: innerZ,
                sx,
                sy: brickH,
                sz: halfDepth - WALL_BRICK_GAP * 0.5,
              });
            }
          }
        }
      }
    }

    // Top trim plate & top studs on columns where the top course is solid
    const topY = courses * BRICK_H;
    const studY = topTrimColor ? topY + PLATE_H : topY;

    let u = 0;
    while (u < halfSteps) {
      if (isInsideOpening(u, courses - 1)) {
        u++;
        continue;
      }
      const uStart = u;
      while (u < halfSteps && !isInsideOpening(u, courses - 1)) {
        u++;
      }
      const spanStart = uStart * 0.5;
      const spanEnd = u * 0.5;

      if (topTrimColor) {
        const trimSegments = splitSpanIntoBricks(spanStart, spanEnd, courses);
        for (const seg of trimSegments) {
          trim.push({
            x: (seg.x0 + seg.len * 0.5) * STUD_UNIT,
            y: topY + PLATE_H * 0.5,
            z: 0,
            sx: Math.max(0.1, seg.len * STUD_UNIT - WALL_BRICK_GAP),
            sy: PLATE_H - WALL_BRICK_GAP * 0.5,
            sz: thickness - WALL_BRICK_GAP * 0.5,
          });
        }
      }

      if (topStuds) {
        for (let sx = spanStart + 0.5; sx <= spanEnd - 0.49; sx += 1) {
          studs.push([sx * STUD_UNIT, studY, 0]);
        }
      }
    }

    return {
      outerBricks: outer,
      innerBricks: inner,
      innerAccentBricks: innerAccent,
      trimBricks: trim,
      topStudPositions: studs,
    };
  }, [
    halfSteps,
    courses,
    thickness,
    dualSided,
    outerSide,
    topTrimColor,
    topStuds,
    openings,
    innerAccentColor,
  ]);

  const studColor = topTrimColor ?? outerColor;

  return (
    <group position={start} rotation={[0, rotY, 0]}>
      <BrickBatch
        instances={outerBricks}
        color={outerColor}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />
      {dualSided && innerColor && (
        <BrickBatch
          instances={innerBricks}
          color={innerColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
      {dualSided && innerAccentColor && (
        <BrickBatch
          instances={innerAccentBricks}
          color={innerAccentColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
      {topTrimColor && (
        <BrickBatch
          instances={trimBricks}
          color={topTrimColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
      {topStuds && topStudPositions.length > 0 && (
        <Studs
          positions={topStudPositions}
          color={studColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
      {openings.map((op, i) => (
        <OpeningFrame
          key={i}
          opening={op}
          thickness={thickness}
          outerSide={outerSide}
        />
      ))}
    </group>
  );
};
