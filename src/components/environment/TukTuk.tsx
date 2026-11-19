import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../../types';
import { LEGO_COLORS } from '../../lib/colors';
import { getEmissiveMaterial, getLegoMaterial } from '../../lib/materials';
import { Brick, Plate, Tile } from '../lego';

export interface TukTukProps {
  position?: Vec3;
  rotationY?: number;
  isNight: boolean;
}

// Shared static cylindrical/detail geometries
const TIRE_GEO = new THREE.CylinderGeometry(0.56, 0.56, 0.44, 18);
const TIRE_RIM_GEO = new THREE.CylinderGeometry(0.32, 0.32, 0.47, 14);
const HUB_STUD_GEO = new THREE.CylinderGeometry(0.14, 0.14, 0.51, 10);
const AXLE_GEO = new THREE.CylinderGeometry(0.09, 0.09, 2.85, 8);
const FORK_TUBE_GEO = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8);
const BUMPER_BAR_GEO = new THREE.CylinderGeometry(0.08, 0.08, 1.85, 10);
const HEADLIGHT_BEZEL_GEO = new THREE.CylinderGeometry(0.34, 0.36, 0.18, 16);
const HEADLIGHT_LENS_GEO = new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16);
const SIGNAL_STUD_GEO = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10);
const STEER_COL_GEO = new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8);
const HANDLEBAR_GEO = new THREE.CylinderGeometry(0.06, 0.06, 1.35, 8);
const GRIP_GEO = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 8);
const ROOF_POLE_GEO = new THREE.CylinderGeometry(0.075, 0.075, 1.75, 8);
const EXHAUST_GEO = new THREE.CylinderGeometry(0.1, 0.12, 0.75, 10);
const MIRROR_STEM_GEO = new THREE.CylinderGeometry(0.035, 0.035, 0.36, 6);
const MIRROR_HEAD_GEO = new THREE.BoxGeometry(0.28, 0.2, 0.08);
const WINDSHIELD_GEO = new THREE.BoxGeometry(2.05, 1.22, 0.1);
const WINDSHIELD_PILLAR_GEO = new THREE.BoxGeometry(0.18, 1.32, 0.18);
const WINDSHIELD_HEADER_GEO = new THREE.BoxGeometry(2.34, 0.2, 0.2);
const WIPER_GEO = new THREE.BoxGeometry(0.56, 0.05, 0.05);

interface WheelProps {
  position: Vec3;
}

const LegoWheel: React.FC<WheelProps> = ({ position }) => {
  const tireMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.black, { roughness: 0.72 }),
    []
  );
  const rimMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.silver, { roughness: 0.25, metalness: 0.45 }),
    []
  );
  const hubMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);

  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={TIRE_GEO} material={tireMat} castShadow receiveShadow />
      <mesh geometry={TIRE_RIM_GEO} material={rimMat} castShadow />
      <mesh geometry={HUB_STUD_GEO} material={hubMat} />
    </group>
  );
};

export const TukTuk: React.FC<TukTukProps> = ({
  position = [21.5, 0, 7.5],
  rotationY = -0.35,
  isNight,
}) => {
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const darkGrayMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkGray), []);
  const silverMat = useMemo(
    () => getLegoMaterial(LEGO_COLORS.silver, { roughness: 0.22, metalness: 0.55 }),
    []
  );
  const yellowMat = useMemo(() => getLegoMaterial(LEGO_COLORS.yellow), []);
  const orangeMat = useMemo(() => getLegoMaterial(LEGO_COLORS.orange), []);
  const windshieldMat = useMemo(
    () =>
      getLegoMaterial(LEGO_COLORS.lightBlue, {
        transparent: true,
        opacity: 0.42,
        roughness: 0.08,
        metalness: 0.05,
      }),
    []
  );

  const headlightMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.warmYellow, 2.5)
        : getLegoMaterial(LEGO_COLORS.warmYellow, { roughness: 0.12 }),
    [isNight]
  );

  const taillightMat = useMemo(
    () =>
      isNight
        ? getEmissiveMaterial(LEGO_COLORS.red, 1.8)
        : getLegoMaterial(LEGO_COLORS.red, { roughness: 0.18 }),
    [isNight]
  );

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      name="lego-yellow-tuktuk"
    >
      {/* 3 LEGO Wheels (1 front, 2 rear) */}
      <LegoWheel position={[0, 0.56, 2.02]} />
      <LegoWheel position={[-1.42, 0.56, -1.35]} />
      <LegoWheel position={[1.42, 0.56, -1.35]} />

      {/* Rear axle & exhaust pipe */}
      <mesh
        position={[0, 0.56, -1.35]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={AXLE_GEO}
        material={darkGrayMat}
        castShadow
      />
      <mesh
        position={[0.82, 0.42, -2.25]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={EXHAUST_GEO}
        material={silverMat}
        castShadow
      />

      {/* Front wheel fork & yellow front mudguard */}
      <mesh
        position={[-0.28, 0.85, 2.02]}
        rotation={[-0.18, 0, 0]}
        geometry={FORK_TUBE_GEO}
        material={darkGrayMat}
        castShadow
      />
      <mesh
        position={[0.28, 0.85, 2.02]}
        rotation={[-0.18, 0, 0]}
        geometry={FORK_TUBE_GEO}
        material={darkGrayMat}
        castShadow
      />
      <Plate
        position={[0, 1.18, 2.04]}
        size={[0.85, 0.75, 1.15]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />

      {/* Chassis floorboard & side running steps */}
      <Plate
        position={[0, 0.55, -0.25]}
        size={[2.75, 1, 3.6]}
        color={LEGO_COLORS.darkGray}
        studs={false}
      />
      <Plate
        position={[0, 0.55, 1.65]}
        size={[1.75, 1, 0.95]}
        color={LEGO_COLORS.darkGray}
        studs={false}
      />
      <Tile
        position={[-1.52, 0.55, -0.05]}
        size={[0.38, 1.7]}
        height={0.26}
        color={LEGO_COLORS.black}
      />
      <Tile
        position={[1.52, 0.55, -0.05]}
        size={[0.38, 1.7]}
        height={0.26}
        color={LEGO_COLORS.black}
      />

      {/* Iconic Yellow Bajaj Front Cowling & Hood */}
      <Brick
        position={[0, 0.95, 1.75]}
        size={[2.35, 1.0, 0.95]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      <Plate
        position={[0, 1.92, 1.65]}
        size={[2.35, 1.35, 0.88]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      {/* Sloped upper cowl tile under windshield */}
      <Tile
        position={[0, 2.38, 1.62]}
        size={[2.28, 0.65]}
        height={0.28}
        rotation={[0.24, 0, 0]}
        color={LEGO_COLORS.yellow}
      />
      {/* Red & black sporty belt trim across front nose */}
      <Tile
        position={[0, 1.38, 2.24]}
        size={[2.36, 0.12]}
        height={0.2}
        color={LEGO_COLORS.black}
      />
      <Tile
        position={[0, 1.56, 2.24]}
        size={[2.2, 0.12]}
        height={0.14}
        color={LEGO_COLORS.red}
      />

      {/* Silver chrome front bumper bar */}
      <mesh
        position={[0, 1.04, 2.36]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={BUMPER_BAR_GEO}
        material={silverMat}
        castShadow
      />
      {/* Mini black & white Indonesian license plate */}
      <Tile
        position={[0, 1.15, 2.26]}
        size={[0.82, 0.1]}
        height={0.28}
        color={LEGO_COLORS.black}
      />
      <Tile
        position={[0, 1.24, 2.31]}
        size={[0.62, 0.05]}
        height={0.1}
        color={LEGO_COLORS.white}
      />

      {/* Iconic Round Center Headlight + Amber Turn Signals */}
      <group position={[0, 1.98, 2.22]}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          geometry={HEADLIGHT_BEZEL_GEO}
          material={silverMat}
          castShadow
        />
        <mesh
          position={[0, 0, 0.07]}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={HEADLIGHT_LENS_GEO}
          material={headlightMat}
        />
        {isNight && (
          <pointLight
            position={[0, 0.05, 0.65]}
            color="#FFD95A"
            intensity={2.4}
            distance={9}
            decay={2}
          />
        )}
      </group>
      {/* Left & right amber turn signal studs */}
      <mesh
        position={[-0.88, 1.96, 2.2]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={SIGNAL_STUD_GEO}
        material={orangeMat}
      />
      <mesh
        position={[0.88, 1.96, 2.2]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={SIGNAL_STUD_GEO}
        material={orangeMat}
      />

      {/* Windshield Frame, Transparent Glass, Wiper & Side Mirrors */}
      <group position={[0, 3.05, 1.44]} rotation={[-0.14, 0, 0]}>
        {/* Transparent LEGO glass pane */}
        <mesh geometry={WINDSHIELD_GEO} material={windshieldMat} />
        {/* Yellow A-pillars & top frame */}
        <mesh position={[-1.08, 0, 0]} geometry={WINDSHIELD_PILLAR_GEO} material={yellowMat} castShadow />
        <mesh position={[1.08, 0, 0]} geometry={WINDSHIELD_PILLAR_GEO} material={yellowMat} castShadow />
        <mesh position={[0, 0.66, 0]} geometry={WINDSHIELD_HEADER_GEO} material={yellowMat} castShadow />
        {/* Wiper blade */}
        <mesh
          position={[0.1, -0.42, 0.08]}
          rotation={[0, 0, 0.32]}
          geometry={WIPER_GEO}
          material={blackMat}
        />
        {/* Side-view mirrors */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.24, -0.15, 0.04]}>
            <mesh
              rotation={[0, 0, side * 1.2]}
              geometry={MIRROR_STEM_GEO}
              material={blackMat}
            />
            <mesh
              position={[side * 0.16, 0.1, 0]}
              geometry={MIRROR_HEAD_GEO}
              material={blackMat}
              castShadow
            />
          </group>
        ))}
      </group>

      {/* Driver Steering Column, Handlebars & Saddle Seat */}
      <group position={[0, 1.95, 1.18]}>
        <mesh
          rotation={[-0.32, 0, 0]}
          geometry={STEER_COL_GEO}
          material={darkGrayMat}
        />
        <mesh
          position={[0, 0.48, -0.18]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={HANDLEBAR_GEO}
          material={silverMat}
        />
        <mesh
          position={[-0.62, 0.48, -0.18]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={GRIP_GEO}
          material={blackMat}
        />
        <mesh
          position={[0.62, 0.48, -0.18]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={GRIP_GEO}
          material={blackMat}
        />
      </group>
      {/* Driver seat */}
      <Plate
        position={[0, 0.95, 0.45]}
        size={[1.05, 1.25, 0.88]}
        color={LEGO_COLORS.black}
        studs={false}
      />
      <Plate
        position={[0, 1.45, 0.1]}
        size={[1.0, 1.5, 0.25]}
        color={LEGO_COLORS.black}
        studs={false}
      />

      {/* Side Rear Yellow Body Panels (open passenger doorway in center!) */}
      <Brick
        position={[-1.24, 0.95, -1.28]}
        size={[0.36, 1.2, 1.65]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      <Brick
        position={[1.24, 0.95, -1.28]}
        size={[0.36, 1.2, 1.65]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      {/* Lower side door sills */}
      <Plate
        position={[-1.24, 0.95, 0.45]}
        size={[0.34, 1.0, 1.85]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      <Plate
        position={[1.24, 0.95, 0.45]}
        size={[0.34, 1.0, 1.85]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      {/* Sporty side stripe on rear quarter panels */}
      <Tile
        position={[-1.44, 1.4, -1.28]}
        size={[0.08, 1.55]}
        height={0.18}
        color={LEGO_COLORS.red}
      />
      <Tile
        position={[1.44, 1.4, -1.28]}
        size={[0.08, 1.55]}
        height={0.18}
        color={LEGO_COLORS.red}
      />

      {/* Rear Yellow Engine Panel, Vent Grille, Bumper & Taillights */}
      <Brick
        position={[0, 0.95, -2.0]}
        size={[2.75, 1.35, 0.42]}
        color={LEGO_COLORS.yellow}
        studs={false}
      />
      {/* Engine air vent louvers */}
      {[1.18, 1.44, 1.7].map((vy, idx) => (
        <Tile
          key={idx}
          position={[0, vy, -2.23]}
          size={[1.45, 0.08]}
          height={0.12}
          color={LEGO_COLORS.darkGray}
        />
      ))}
      {/* Rear chrome bumper */}
      <mesh
        position={[0, 0.85, -2.28]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={BUMPER_BAR_GEO}
        material={silverMat}
        castShadow
      />
      {/* Red LEGO taillight studs (glow softly at night) */}
      <mesh
        position={[-1.06, 1.62, -2.23]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={SIGNAL_STUD_GEO}
        material={taillightMat}
      />
      <mesh
        position={[1.06, 1.62, -2.23]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={SIGNAL_STUD_GEO}
        material={taillightMat}
      />

      {/* Cozy Red Cushioned Passenger Bench Seat inside rear cabin */}
      <Plate
        position={[0, 0.95, -1.18]}
        size={[2.1, 1.4, 1.05]}
        color={LEGO_COLORS.red}
        studs={false}
      />
      <Brick
        position={[0, 1.5, -1.62]}
        size={[2.1, 0.95, 0.34]}
        color={LEGO_COLORS.red}
        studs={false}
      />

      {/* Black Canopy Frame Struts */}
      {[
        [-1.22, 2.75, 0.15],
        [1.22, 2.75, 0.15],
        [-1.22, 2.75, -1.96],
        [1.22, 2.75, -1.96],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={idx}
          position={[px, py, pz]}
          geometry={ROOF_POLE_GEO}
          material={blackMat}
          castShadow
        />
      ))}

      {/* Iconic Black Arched / Stepped LEGO Canopy Roof */}
      <group name="tuktuk-black-canopy">
        {/* Lower eaves */}
        <Plate
          position={[0, 3.6, -0.35]}
          size={[2.72, 0.85, 3.65]}
          color={LEGO_COLORS.black}
          studs={false}
        />
        {/* Mid arched canvas step */}
        <Plate
          position={[0, 3.92, -0.42]}
          size={[2.22, 0.78, 3.3]}
          color={LEGO_COLORS.black}
          studs={false}
        />
        {/* Top crown ridge with crisp black LEGO studs */}
        <Plate
          position={[0, 4.2, -0.45]}
          size={[1.4, 0.65, 2.85]}
          color={LEGO_COLORS.black}
          studs={true}
        />
        {/* Slight sloped visor brow over the windshield */}
        <Tile
          position={[0, 3.74, 1.52]}
          size={[2.46, 0.5]}
          height={0.2}
          rotation={[0.26, 0, 0]}
          color={LEGO_COLORS.black}
        />
        {/* Cute classic yellow Bajaj roof sign tile */}
        <Plate
          position={[0, 4.46, 0.65]}
          size={[0.92, 0.65, 0.36]}
          color={LEGO_COLORS.yellow}
          studs={false}
        />
      </group>
    </group>
  );
};
