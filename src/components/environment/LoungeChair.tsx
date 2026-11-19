import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { getEmissiveMaterial, getLegoMaterial } from '../../lib/materials';
import { Plate, Tile } from '../lego';

export interface LoungeChairProps {
  position?: Vec3;
  rotationY?: number;
  isNight?: boolean;
}

// Shared static geometries
const LEG_GEO = new THREE.BoxGeometry(0.18, 0.68, 0.18);
const WHEEL_GEO = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12);
const HINGE_BAR_GEO = new THREE.CylinderGeometry(0.08, 0.08, 1.98, 10);
const ARM_POST_GEO = new THREE.CylinderGeometry(0.075, 0.075, 0.52, 8);
const BACK_STRUT_GEO = new THREE.CylinderGeometry(0.06, 0.06, 0.78, 8);

const TABLE_LEG_GEO = new THREE.CylinderGeometry(0.08, 0.09, 1.05, 8);
const DRINK_CUP_GEO = new THREE.CylinderGeometry(0.2, 0.17, 0.36, 10);
const DRINK_LIME_GEO = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
const DRINK_STRAW_GEO = new THREE.CylinderGeometry(0.03, 0.03, 0.34, 6);

const UMBRELLA_BASE_GEO = new THREE.CylinderGeometry(0.55, 0.66, 0.3, 10);
const UMBRELLA_POLE_GEO = new THREE.CylinderGeometry(0.09, 0.11, 3.85, 10);
const UMBRELLA_WEDGE_GEO = new THREE.BoxGeometry(0.95, 0.12, 1.55);
const UMBRELLA_CAP_GEO = new THREE.CylinderGeometry(0.24, 0.32, 0.26, 8);
const UMBRELLA_FINIAL_GEO = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 8);
const LANTERN_GEO = new THREE.CylinderGeometry(0.16, 0.14, 0.26, 8);

export const LoungeChair: React.FC<LoungeChairProps> = ({
  position = [21, 0, -1.5],
  rotationY = -1.25,
  isNight = false,
}) => {
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const blueMat = useMemo(() => getLegoMaterial(LEGO_COLORS.blue), []);
  const darkGrayMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);
  const silverMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.silver, { roughness: 0.24, metalness: 0.45 }),
    []
  );
  const brownWoodMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const limeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.limeGreen), []);
  const pinkMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkCushion), []);
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const lanternMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.warmYellow, 2.2)
        : getLegoMaterial(LEGO_COLORS.warmYellow, { roughness: 0.2 }),
    [isNight]
  );

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      name="lego-blue-lounge-chair"
    >
      {/* === BLUE LEGO LOUNGE CHAIR (KURSI SANTAI BIRU) === */}
      <group name="recliner-body">
        {/* White legs & rear rolling wheels */}
        {[
          [-0.84, 0.34, 1.38],
          [0.84, 0.34, 1.38],
          [-0.84, 0.34, -0.25],
          [0.84, 0.34, -0.25],
          [-0.84, 0.38, -1.35],
          [0.84, 0.38, -1.35],
        ].map(([lx, ly, lz], idx) => (
          <mesh
            key={idx}
            position={[lx, ly, lz]}
            geometry={LEG_GEO}
            material={whiteMat}
            castShadow
            receiveShadow
          />
        ))}
        {/* Rear resort-style mini LEGO wheels */}
        <mesh
          position={[-0.96, 0.22, -1.35]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={WHEEL_GEO}
          material={darkGrayMat}
          castShadow
        />
        <mesh
          position={[0.96, 0.22, -1.35]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={WHEEL_GEO}
          material={darkGrayMat}
          castShadow
        />

        {/* Crisp white underframe rails */}
        <Plate
          position={[0, 0.62, 0.05]}
          size={[1.95, 0.65, 3.25]}
          color={LEGO_COLORS.white}
          studs={false}
        />

        {/* Blue lower seat & footrest bed */}
        <Plate
          position={[0, 0.86, 0.62]}
          size={[1.9, 0.72, 2.15]}
          color={LEGO_COLORS.blue}
          studs={true}
        />
        {/* Smooth light-blue slatted cushion tiles across the seat */}
        {[0.05, 0.55, 1.05].map((tz, i) => (
          <Tile
            key={i}
            position={[0, 1.15, tz]}
            size={[1.55, 0.38]}
            height={0.14}
            color={LEGO_COLORS.lightBlue}
          />
        ))}
        {/* Folded sunny beach towel draped over the foot of the lounge chair */}
        <Tile
          position={[0, 1.16, 1.46]}
          size={[1.65, 0.42]}
          height={0.18}
          color={LEGO_COLORS.warmYellow}
        />
        <Tile
          position={[0, 1.24, 1.46]}
          size={[1.65, 0.16]}
          height={0.12}
          color={LEGO_COLORS.pinkCushion}
        />

        {/* Silver LEGO hinge cylinder at the backrest pivot */}
        <mesh
          position={[0, 0.98, -0.46]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={HINGE_BAR_GEO}
          material={silverMat}
        />

        {/* Reclined Blue Backrest */}
        <group position={[0, 0.98, -0.46]} rotation={[0.62, 0, 0]}>
          <Plate
            position={[0, 0.04, -0.86]}
            size={[1.88, 0.72, 1.72]}
            color={LEGO_COLORS.blue}
            studs={true}
          />
          {/* Light-blue slat accent tiles */}
          {[-0.36, -0.82].map((bz, idx) => (
            <Tile
              key={idx}
              position={[0, 0.33, bz]}
              size={[1.52, 0.34]}
              height={0.14}
              color={LEGO_COLORS.lightBlue}
            />
          ))}
          {/* Plush white headrest cushion pillow with blue trim */}
          <Plate
            position={[0, 0.34, -1.36]}
            size={[1.38, 0.75, 0.55]}
            color={LEGO_COLORS.white}
            studs={false}
          />
          <Tile
            position={[0, 0.64, -1.36]}
            size={[1.3, 0.18]}
            height={0.1}
            color={LEGO_COLORS.lightBlue}
          />
        </group>

        {/* Rear adjustable backrest support struts */}
        <mesh
          position={[-0.65, 1.18, -1.25]}
          rotation={[0.2, 0, 0]}
          geometry={BACK_STRUT_GEO}
          material={whiteMat}
          castShadow
        />
        <mesh
          position={[0.65, 1.18, -1.25]}
          rotation={[0.2, 0, 0]}
          geometry={BACK_STRUT_GEO}
          material={whiteMat}
          castShadow
        />

        {/* Left & Right Blue Armrests on white vertical posts */}
        {[-0.98, 0.98].map((ax, idx) => (
          <group key={idx} position={[ax, 0, 0]}>
            <mesh
              position={[0, 1.14, 0.35]}
              geometry={ARM_POST_GEO}
              material={whiteMat}
              castShadow
            />
            <mesh
              position={[0, 1.14, -0.58]}
              geometry={ARM_POST_GEO}
              material={whiteMat}
              castShadow
            />
            <Tile
              position={[0, 1.38, -0.1]}
              size={[0.28, 1.32]}
              height={0.18}
              color={LEGO_COLORS.blue}
            />
          </group>
        ))}
      </group>

      {/* === TROPICAL RATTAN LEGO SIDE TABLE + COCONUT DRINK === */}
      <group position={[-1.62, 0, 0.22]} name="lounge-side-table">
        {[
          [-0.44, 0.52, -0.44],
          [0.44, 0.52, -0.44],
          [-0.44, 0.52, 0.44],
          [0.44, 0.52, 0.44],
        ].map(([x, y, z], idx) => (
          <mesh
            key={idx}
            position={[x, y, z]}
            geometry={TABLE_LEG_GEO}
            material={brownWoodMat}
            castShadow
            receiveShadow
          />
        ))}
        {/* Rattan-colored LEGO tabletop */}
        <Plate
          position={[0, 1.0, 0]}
          size={[1.25, 0.65, 1.25]}
          color={LEGO_COLORS.rattan}
          studs={false}
        />
        <Tile
          position={[0, 1.24, 0]}
          size={[1.1, 1.1]}
          height={0.1}
          color={LEGO_COLORS.creamTile}
        />

        {/* Tropical coconut drink with lime wedge & pink straw */}
        <group position={[0.14, 1.34, 0.08]}>
          <mesh position={[0, 0.18, 0]} geometry={DRINK_CUP_GEO} material={brownWoodMat} castShadow />
          <mesh
            position={[0.16, 0.36, 0]}
            rotation={[0, 0, -0.5]}
            geometry={DRINK_LIME_GEO}
            material={limeMat}
          />
          <mesh
            position={[-0.04, 0.44, 0.03]}
            rotation={[0.25, 0, 0.32]}
            geometry={DRINK_STRAW_GEO}
            material={pinkMat}
          />
        </group>

        {/* Mini beach paperback / magazine LEGO tile */}
        <Tile
          position={[-0.25, 1.34, -0.18]}
          size={[0.42, 0.52]}
          height={0.09}
          rotation={[0, 0.35, 0]}
          color={LEGO_COLORS.turquoise}
        />
      </group>

      {/* === STRIPED BLUE & WHITE LEGO BEACH PARASOL UMBRELLA === */}
      <group position={[-1.45, 0, -1.08]} name="lounge-beach-umbrella">
        {/* Weighted base stand */}
        <mesh
          position={[0, 0.15, 0]}
          geometry={UMBRELLA_BASE_GEO}
          material={whiteMat}
          castShadow
          receiveShadow
        />

        {/* Gently angled umbrella pole & 8-panel striped LEGO canopy */}
        <group position={[0, 0.22, 0]} rotation={[0.08, 0, -0.14]}>
          <mesh
            position={[0, 1.92, 0]}
            geometry={UMBRELLA_POLE_GEO}
            material={silverMat}
            castShadow
          />

          {/* Umbrella canopy crown */}
          <group position={[0, 3.85, 0]}>
            {Array.from({ length: 8 }, (_, idx) => {
              const angle = (idx * Math.PI * 2) / 8;
              const isBlue = idx % 2 === 0;
              return (
                <group key={idx} rotation={[0, angle, 0]}>
                  <mesh
                    position={[0, -0.22, 0.85]}
                    rotation={[0.32, 0, 0]}
                    geometry={UMBRELLA_WEDGE_GEO}
                    material={isBlue ? blueMat : whiteMat}
                    castShadow
                    receiveShadow
                  />
                </group>
              );
            })}
            <mesh position={[0, 0.08, 0]} geometry={UMBRELLA_CAP_GEO} material={blueMat} castShadow />
            <mesh position={[0, 0.28, 0]} geometry={UMBRELLA_FINIAL_GEO} material={yellowMat} castShadow />

            {/* Cozy hanging lantern stud under the umbrella (glows softly at night!) */}
            <mesh position={[0.45, -0.45, 0.2]} geometry={LANTERN_GEO} material={lanternMat} />
            {isNight && (
              <pointLight
                position={[0.45, -0.65, 0.2]}
                color="#FFD95A"
                intensity={1.5}
                distance={7}
                decay={2}
              />
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
