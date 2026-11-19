import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getLegoMaterial } from '../../lib/materials';
import { characterBrain, CharacterOverheadUI } from '../ai';
import { useUIStore } from '../../store/uiStore';
import {
  getCachedBottomTexture,
  getCachedFaceTexture,
  getCachedTorsoTexture,
} from './faceTexture';
import { HairPart } from './parts/HairPart';
import { HeadwearPart } from './parts/HeadwearPart';
import {
  BackSlotAccessory,
  FaceSlotAccessory,
  HandSlotAccessory,
  HeadSlotAccessory,
  NeckSlotAccessory,
} from './parts/AccessoriesPart';
import type { MinifigConfig } from './types';
import type { CharacterActivity } from '../../lib/characterRuntime';
import type { Vec3 } from '../../types';

// Shared module-level geometries for classic LEGO Minifigure proportions
function buildTorsoGeo(): THREE.BufferGeometry {
  const hb = 0.56;
  const ht = 0.44;
  const h = 1.04;
  const hd = 0.27;
  const shape = new THREE.Shape();
  shape.moveTo(-hb, 0);
  shape.lineTo(hb, 0);
  shape.lineTo(ht, h);
  shape.lineTo(-ht, h);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: hd * 2,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -hd);
  geo.computeVertexNormals();
  return geo;
}

const SHARED_GEO = {
  torso: buildTorsoGeo(),
  torsoFrontPlane: new THREE.PlaneGeometry(0.86, 0.94),
  headCyl: new THREE.CylinderGeometry(0.38, 0.38, 0.62, 20),
  headRound: new THREE.SphereGeometry(0.41, 18, 16),
  headStud: new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14),
  neck: new THREE.CylinderGeometry(0.19, 0.21, 0.2, 12),
  hipBlock: new THREE.BoxGeometry(1.12, 0.22, 0.52),
  hipDivider: new THREE.BoxGeometry(0.12, 0.42, 0.5),
  legBox: new THREE.BoxGeometry(0.44, 0.78, 0.48),
  legShortUpper: new THREE.BoxGeometry(0.45, 0.38, 0.49),
  legShortLower: new THREE.BoxGeometry(0.42, 0.42, 0.46),
  skirtCone: new THREE.CylinderGeometry(0.55, 0.64, 0.92, 14),
  foot: new THREE.BoxGeometry(0.44, 0.2, 0.62),
  shoeTip: new THREE.BoxGeometry(0.45, 0.16, 0.24),
  bootCuff: new THREE.BoxGeometry(0.46, 0.26, 0.5),
  upperArm: new THREE.CylinderGeometry(0.145, 0.135, 0.44, 10),
  foreArm: new THREE.CylinderGeometry(0.13, 0.12, 0.38, 10),
  shoulder: new THREE.SphereGeometry(0.155, 10, 10),
  clawHand: new THREE.TorusGeometry(0.14, 0.052, 8, 14, Math.PI * 1.45),
  ring: new THREE.RingGeometry(0.76, 0.96, 24),
  // Temporary activity hand props & FX
  drinkCup: new THREE.CylinderGeometry(0.14, 0.11, 0.32, 10),
  drinkLid: new THREE.CylinderGeometry(0.15, 0.15, 0.05, 10),
  drinkStraw: new THREE.CylinderGeometry(0.022, 0.022, 0.24, 6),
  tvRemote: new THREE.BoxGeometry(0.13, 0.05, 0.34),
  tvRemoteBtn: new THREE.BoxGeometry(0.04, 0.025, 0.04),
  spatulaHandle: new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8),
  spatulaBlade: new THREE.BoxGeometry(0.18, 0.03, 0.22),
  fxDrop: new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6),
  fxBubble: new THREE.SphereGeometry(0.11, 8, 8),
  fxSteam: new THREE.SphereGeometry(0.16, 8, 8),
  fxSplash: new THREE.BoxGeometry(0.13, 0.13, 0.13),
  fxRipple: new THREE.RingGeometry(0.55, 0.72, 18),
};

const FX_WATER_MAT = new THREE.MeshStandardMaterial({
  color: '#7DD3FC',
  roughness: 0.15,
  transparent: true,
  opacity: 0.75,
});

const FX_BUBBLE_MAT = new THREE.MeshStandardMaterial({
  color: '#F8FAFC',
  roughness: 0.1,
  transparent: true,
  opacity: 0.78,
});

const FX_STEAM_MAT = new THREE.MeshStandardMaterial({
  color: '#FFFFFF',
  roughness: 0.5,
  transparent: true,
  opacity: 0.52,
});

const FX_RIPPLE_MAT = new THREE.MeshBasicMaterial({
  color: '#E0F2FE',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.65,
});

const PROP_CUP_MAT = getLegoMaterial('#38BDF8', { roughness: 0.2 });
const PROP_WHITE_MAT = getLegoMaterial('#F7F7F5');
const PROP_STRAW_MAT = getLegoMaterial('#FDE047');
const PROP_BLACK_MAT = getLegoMaterial('#1E293B');
const PROP_RED_MAT = getLegoMaterial('#EF4444');
const PROP_SILVER_MAT = getLegoMaterial('#CBD5E1', { roughness: 0.22, metalness: 0.55 });

/** Lightweight procedural LEGO particle effects (steam, shower spray, bubbles, swim splashes) */
const ActivityFX: React.FC<{ activity: CharacterActivity }> = ({ activity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();

    if (activity === 'showering') {
      for (let i = 0; i < g.children.length; i++) {
        const child = g.children[i];
        if (i < 6) {
          // Falling water drops from overhead showerhead
          const phase = (t * 2.8 + i * 0.37) % 1;
          const angle = i * 1.15;
          const rad = 0.22 + (i % 2) * 0.22;
          child.position.set(Math.cos(angle) * rad, 3.85 - phase * 3.1, Math.sin(angle) * rad);
        } else {
          // Rising white soap bubbles
          const idx = i - 6;
          const phase = (t * 0.9 + idx * 0.42) % 1;
          child.position.set(
            Math.sin(t * 2.2 + idx * 1.9) * 0.42,
            1.2 + phase * 1.7,
            Math.cos(t * 1.8 + idx * 1.4) * 0.42
          );
          const sc = 0.55 + Math.sin(phase * Math.PI) * 0.55;
          child.scale.setScalar(sc);
        }
      }
    } else if (activity === 'cooking') {
      for (let i = 0; i < g.children.length; i++) {
        const child = g.children[i];
        const phase = (t * 0.85 + i * 0.33) % 1;
        child.position.set(
          Math.sin(t * 2.1 + i * 1.8) * 0.22,
          1.6 + phase * 1.4,
          0.95 + Math.cos(t * 1.6 + i) * 0.14
        );
        const sc = 0.4 + Math.sin(phase * Math.PI) * 0.75;
        child.scale.setScalar(sc);
      }
    } else if (activity === 'washing') {
      for (let i = 0; i < g.children.length; i++) {
        const child = g.children[i];
        const phase = (t * 1.1 + i * 0.35) % 1;
        child.position.set(
          Math.sin(t * 2.5 + i * 1.6) * 0.3,
          1.3 + phase * 1.25,
          0.72 + Math.cos(t * 2.0 + i) * 0.16
        );
        const sc = 0.45 + Math.sin(phase * Math.PI) * 0.55;
        child.scale.setScalar(sc);
      }
    } else if (activity === 'swimming') {
      for (let i = 0; i < g.children.length; i++) {
        const child = g.children[i];
        const phase = (t * 2.4 + i * 0.29) % 1;
        const side = i % 2 === 0 ? -1 : 1;
        const zOff = i < 3 ? 0.55 : -1.05; // front arm splashes + rear kick splashes
        child.position.set(
          side * (0.45 + phase * 0.45),
          0.18 + Math.sin(phase * Math.PI) * 0.42,
          zOff + Math.cos(i * 1.7) * 0.35
        );
        const sc = 0.4 + Math.sin(phase * Math.PI) * 0.7;
        child.scale.setScalar(sc);
      }
      if (rippleRef.current) {
        const rp = (t * 0.9) % 1;
        rippleRef.current.scale.setScalar(0.8 + rp * 1.6);
      }
    }
  });

  if (activity === 'showering') {
    return (
      <group ref={groupRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`drop-${i}`} geometry={SHARED_GEO.fxDrop} material={FX_WATER_MAT} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`bub-${i}`} geometry={SHARED_GEO.fxBubble} material={FX_BUBBLE_MAT} />
        ))}
      </group>
    );
  }

  if (activity === 'cooking') {
    return (
      <group ref={groupRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`steam-${i}`} geometry={SHARED_GEO.fxSteam} material={FX_STEAM_MAT} />
        ))}
      </group>
    );
  }

  if (activity === 'washing') {
    return (
      <group ref={groupRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`wash-b-${i}`} geometry={SHARED_GEO.fxBubble} material={FX_BUBBLE_MAT} />
        ))}
      </group>
    );
  }

  if (activity === 'swimming') {
    return (
      <group>
        <group ref={groupRef}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={`sp-${i}`} geometry={SHARED_GEO.fxSplash} material={FX_BUBBLE_MAT} />
          ))}
        </group>
        <mesh
          ref={rippleRef}
          geometry={SHARED_GEO.fxRipple}
          material={FX_RIPPLE_MAT}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.14, -0.25]}
        />
      </group>
    );
  }

  return null;
};

const RING_HOVER_MAT = new THREE.MeshBasicMaterial({
  color: '#FDE047',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.85,
});

const RING_SELECTED_MAT = new THREE.MeshBasicMaterial({
  color: '#38BDF8',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9,
});

export interface ModularMinifigureProps {
  config: MinifigConfig;
  mode?: 'world' | 'preview';
  visible?: boolean;
  isSelected?: boolean;
  onSelect?: (char: MinifigConfig, currentPosition: Vec3) => void;
}

const SIT_OFFSET_Y = -0.68;

export const ModularMinifigure: React.FC<ModularMinifigureProps> = ({
  config,
  mode = 'world',
  visible = true,
  isSelected = false,
  onSelect,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [onFloor2, setOnFloor2] = useState(config.startPosition[1] >= 5.2);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [isWorkingAtDesk, setIsWorkingAtDesk] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<CharacterActivity>('idle');
  const activityRef = useRef<CharacterActivity>('idle');

  const floorViewMode = useUIStore((s) => s.floorViewMode);
  const hiddenByFloor1View = mode === 'world' && floorViewMode === 'floor1' && onFloor2;

  // Per-part posture scales (height modifies legs & vertical stretch, build modifies torso width!)
  const legScaleY = config.height === 'child' ? 0.68 : config.height === 'tall' ? 1.16 : 1.0;
  const torsoScaleX = config.build === 'slim' ? 0.86 : config.build === 'broad' ? 1.18 : 1.0;
  const torsoScaleZ = config.build === 'slim' ? 0.9 : config.build === 'broad' ? 1.15 : 1.0;
  const headBaseMult =
    config.headShape === 'chibi' ? 1.18 : config.headShape === 'small' ? 0.86 : 1.0;
  const finalHeadScale = headBaseMult * config.headScale;

  // Cached CanvasTextures & materials
  const faceTex = useMemo(
    () => getCachedFaceTexture(config.skinColor, config.face),
    [config.skinColor, config.face]
  );
  const torsoTex = useMemo(
    () =>
      getCachedTorsoTexture(
        config.torsoStyle,
        config.torsoColor,
        config.torsoSecondaryColor,
        config.torsoPattern
      ),
    [config.torsoStyle, config.torsoColor, config.torsoSecondaryColor, config.torsoPattern]
  );
  const bottomTex = useMemo(
    () => getCachedBottomTexture(config.bottomColor, config.bottomPattern),
    [config.bottomColor, config.bottomPattern]
  );

  const dynamicMats = useMemo(() => {
    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.28,
      metalness: 0,
    });
    const torsoFrontMat = new THREE.MeshStandardMaterial({
      map: torsoTex,
      roughness: 0.28,
      metalness: 0,
    });
    const bottomPatternMat = bottomTex
      ? new THREE.MeshStandardMaterial({
          map: bottomTex,
          roughness: 0.32,
          metalness: 0,
        })
      : null;
    return { faceMat, torsoFrontMat, bottomPatternMat };
  }, [faceTex, torsoTex, bottomTex]);

  useEffect(() => {
    return () => {
      dynamicMats.faceMat.dispose();
      dynamicMats.torsoFrontMat.dispose();
      dynamicMats.bottomPatternMat?.dispose();
    };
  }, [dynamicMats]);

  const skinMat = useMemo(() => getLegoMaterial(config.skinColor), [config.skinColor]);
  const torsoMat = useMemo(() => getLegoMaterial(config.torsoColor), [config.torsoColor]);
  const armMat = useMemo(() => getLegoMaterial(config.armColor), [config.armColor]);
  const handMat = useMemo(
    () => getLegoMaterial(config.handColor === 'skin' ? config.skinColor : config.handColor),
    [config.handColor, config.skinColor]
  );
  const bottomMat = useMemo(() => getLegoMaterial(config.bottomColor), [config.bottomColor]);
  const shoeMat = useMemo(
    () =>
      getLegoMaterial(
        config.shoeStyle === 'barefoot' ? config.skinColor : config.shoeColor
      ),
    [config.shoeStyle, config.shoeColor, config.skinColor]
  );
  const headMaterials = useMemo<THREE.Material[]>(
    () => [dynamicMats.faceMat, skinMat, skinMat],
    [dynamicMats.faceMat, skinMat]
  );

  const legSurfaceMat = dynamicMats.bottomPatternMat ?? bottomMat;
  const forearmMat = config.shortSleeves ? skinMat : armMat;

  const animRef = useRef({
    pos: new THREE.Vector3(...config.startPosition),
    rotY: 0,
    walkCycle: 0,
    scale: 1,
    elapsed: Math.random() * Math.PI * 2,
    headTargetY: 0,
    nextHeadTurnAt: 2.5,
  });

  useFrame((_, rawDelta) => {
    if (!visible) return;
    const delta = Math.min(rawDelta, 0.05);
    const anim = animRef.current;
    anim.elapsed += delta;
    const t = anim.elapsed;

    if (mode === 'preview') {
      // Gentle showcase breathing & slight head look in Character Creator turntable
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2.2) * 0.03;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.15;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.6) * 0.06;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.6) * 0.06;
      return;
    }

    // World mode driven by CharacterAIBrain
    const brainState = characterBrain.states.get(config.id);
    const activity: CharacterActivity = brainState?.activity ?? 'idle';
    if (activity !== activityRef.current) {
      activityRef.current = activity;
      setCurrentActivity(activity);
    }

    const isSeated =
      activity === 'sitting' ||
      activity === 'working' ||
      activity === 'watching-tv' ||
      activity === 'mirror';
    const isReclinedOrLying =
      activity === 'sleeping' ||
      activity === 'hammock' ||
      activity === 'sunbathing';
    const usesSeatOffset = isSeated || isReclinedOrLying;

    if (brainState) {
      anim.pos.set(
        brainState.position[0],
        brainState.position[1] + (usesSeatOffset ? brainState.seatOffsetY : 0),
        brainState.position[2]
      );
      anim.rotY = brainState.rotationY;
      if (brainState.isMoving) {
        anim.walkCycle += delta * 9.5;
      }
      if (brainState.speechText !== speechText) {
        setSpeechText(brainState.speechText);
      }
      if (brainState.isWorkingAtDesk !== isWorkingAtDesk) {
        setIsWorkingAtDesk(brainState.isWorkingAtDesk);
      }
    }

    if (rootRef.current) {
      rootRef.current.position.copy(anim.pos);
      rootRef.current.rotation.y = anim.rotY;
    }

    const nowOnFloor2 = anim.pos.y >= 5.2;
    if (nowOnFloor2 !== onFloor2) {
      setOnFloor2(nowOnFloor2);
    }

    // Smooth hover/select scale
    const targetScale = hovered ? 1.12 : isSelected ? 1.05 : 1.0;
    anim.scale += (targetScale - anim.scale) * (1 - Math.exp(-12 * delta));
    if (scaleGroupRef.current) {
      scaleGroupRef.current.scale.setScalar(anim.scale);
    }

    // =========================================================================
    // FULL-BODY POSTURE (bodyRef) + LIMB ARTICULATION BY ACTIVITY
    // =========================================================================
    const isMoving = brainState?.isMoving ?? false;
    const lerpRate = 1 - Math.exp(-11 * delta);

    let targetBodyY = isSeated ? SIT_OFFSET_Y * legScaleY : 0;
    let targetBodyZ = 0;
    let targetBodyRotX = 0;
    let targetBodyRotZ = 0;
    let targetHeadRotX = 0;
    let targetHeadRotZ = 0;
    let customHeadRotY: number | null = null;

    if (activity === 'swimming') {
      // Freestyle horizontal crawl skimming the blue LEGO sea waves
      targetBodyRotX = Math.PI * 0.44;
      targetBodyY = Math.sin(t * 3.4) * 0.08;
      targetBodyZ = -1.2;
      targetBodyRotZ = Math.sin(t * 4.6) * 0.18;
      targetHeadRotX = -0.55;
      customHeadRotY = Math.sin(t * 2.6) * 0.34;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -(t * 5.2);
      if (rightArmRef.current) rightArmRef.current.rotation.x = -(t * 5.2 + Math.PI);
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 12.5) * 0.38;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * 12.5) * 0.38;
    } else if (activity === 'sleeping') {
      // Lying flat horizontally on back on bed mattress (head resting on north pillows)
      targetBodyRotX = -Math.PI / 2;
      targetBodyY = 0.34 + Math.sin(t * 1.6) * 0.025;
      targetBodyZ = 1.25;
      targetBodyRotZ = 0;
      customHeadRotY = 0.16;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.35, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.22 + Math.sin(t * 1.6) * 0.04, lerpRate);
    } else if (activity === 'hammock') {
      // Lounging lengthwise in the suspended white fabric hammock with gentle side sway
      targetBodyRotX = -Math.PI * 0.45;
      targetBodyY = 0.36 + Math.sin(t * 1.8) * 0.06;
      targetBodyZ = 1.15;
      targetBodyRotZ = Math.sin(t * 0.9) * 0.16;
      customHeadRotY = Math.sin(t * 0.65) * 0.14;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.24 + Math.sin(t * 1.8) * 0.05, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.18 - Math.sin(t * 1.8) * 0.05, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -2.35, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -2.35, lerpRate);
    } else if (activity === 'sunbathing') {
      // Reclined lazily back on the blue beach lounge chair soaking up tropical sun
      targetBodyRotX = -0.58;
      targetBodyY = -0.32 * legScaleY;
      targetBodyZ = -0.25;
      customHeadRotY = Math.sin(t * 0.7) * 0.2;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -1.05, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -1.05, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -2.25, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -2.25, lerpRate);
    } else if (isMoving) {
      // Brisk classic LEGO minifigure walking cycle (handles flat floors & stairs)
      targetBodyY = Math.abs(Math.sin(anim.walkCycle)) * 0.085;
      targetBodyRotZ = Math.sin(anim.walkCycle) * 0.045;
      const legSwing = Math.sin(anim.walkCycle) * 0.62;
      const armSwing = Math.sin(anim.walkCycle) * 0.52;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing * 0.8;
    } else if (activity === 'working') {
      // Seated energetic keyboard typing (strictly when OpenBot status === 'working')
      targetBodyY = SIT_OFFSET_Y * legScaleY + Math.sin(t * 4) * 0.015;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.88 + Math.sin(t * 15) * 0.12;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.88 + Math.cos(t * 16.5) * 0.12;
      targetHeadRotX = 0.08 + Math.sin(t * 3.2) * 0.04;
    } else if (activity === 'watching-tv') {
      // Seated on Floor 1 foyer sofa/armchair watching the LEGO TV with remote clicks!
      targetBodyY = SIT_OFFSET_Y * legScaleY + Math.sin(t * 2.2) * 0.02;
      targetBodyRotZ = Math.sin(t * 1.1) * 0.03;
      targetHeadRotX = Math.sin(t * 2.6) * 0.07;
      customHeadRotY = Math.sin(t * 0.85) * 0.12;
      const remoteClick = Math.sin(t * 2.1) > 0.72 ? -1.18 : -0.82;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.45, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, remoteClick, lerpRate);
    } else if (activity === 'mirror') {
      // Seated at Dressing Room vanity mirror admiring reflection & adjusting hair
      targetBodyY = SIT_OFFSET_Y * legScaleY + Math.sin(t * 2.4) * 0.02;
      customHeadRotY = Math.sin(t * 1.6) * 0.36;
      targetHeadRotZ = Math.sin(t * 1.6) * 0.09;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.46, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.55 + Math.sin(t * 4.2) * 0.24, lerpRate);
    } else if (activity === 'sitting') {
      // Relaxed seated pose on living/dining/kitchen/porch/terrace chairs & sofas
      targetBodyY = SIT_OFFSET_Y * legScaleY + Math.sin(t * 2.2) * 0.02;
      targetBodyRotZ = Math.sin(t * 1.3) * 0.028;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.48 + Math.sin(t * 2.6) * 0.05, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.48 + Math.cos(t * 2.9) * 0.05, lerpRate);
    } else if (activity === 'showering') {
      // Refreshing warm shower scrub inside Floor 1 glass shower stall
      targetBodyY = Math.abs(Math.sin(t * 3.5)) * 0.045;
      targetBodyRotZ = Math.sin(t * 3.5) * 0.065;
      targetHeadRotX = -0.18 + Math.sin(t * 3.5) * 0.1;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -2.15 + Math.sin(t * 7.2) * 0.34, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -2.15 + Math.cos(t * 7.2) * 0.34, lerpRate);
    } else if (activity === 'drinking') {
      // Grabbing cold drink from silver fridge dispenser & taking refreshing sips!
      const sipWave = Math.sin(t * 1.7);
      const isSipping = sipWave > 0.1;
      targetHeadRotX = isSipping ? -0.24 : 0.05;
      customHeadRotY = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, isSipping ? -0.22 : -1.05, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, isSipping ? -2.05 : -0.95, lerpRate);
    } else if (activity === 'cooking') {
      // Stirring & flipping delicious food over the kitchen stove
      targetBodyY = Math.sin(t * 4.5) * 0.025;
      targetHeadRotX = 0.12;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.52, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.92 + Math.sin(t * 8.4) * 0.34;
    } else if (activity === 'washing') {
      // Scrubbing dishes at kitchen sink or loading/rinsing laundry washer
      targetBodyY = Math.sin(t * 5) * 0.025;
      targetHeadRotX = 0.14;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.92 + Math.sin(t * 9.5) * 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.92 - Math.sin(t * 9.5) * 0.2;
    } else if (activity === 'hopscotch') {
      // Playful hopping on Left Terrace engklek grid!
      const hop = Math.abs(Math.sin(t * 6.4));
      targetBodyY = hop * 0.46;
      targetBodyRotZ = Math.sin(t * 3.2) * 0.12;
      const leftUp = Math.max(0, Math.sin(t * 3.2)) * -0.82;
      const rightUp = Math.max(0, -Math.sin(t * 3.2)) * -0.82;
      if (leftLegRef.current) leftLegRef.current.rotation.x = leftUp;
      if (rightLegRef.current) rightLegRef.current.rotation.x = rightUp;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.6 - hop * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.6 - hop * 0.55;
    } else if (activity === 'chatting') {
      targetBodyY = Math.sin(t * 2.4) * 0.022;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      const gesture = speechText ? Math.sin(t * 6.2) * 0.25 - 0.34 : -0.05;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, gesture * 0.6, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, gesture, lerpRate);
    } else {
      targetBodyY = Math.sin(t * 2.4) * 0.022;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, Math.sin(t * 1.8) * 0.05, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.sin(t * 1.8) * 0.05, lerpRate);
    }

    // Apply smooth body position & tilt interpolation (prevents snap/stuck rotations)
    if (bodyRef.current) {
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetBodyY, isMoving || activity === 'hopscotch' ? 0.35 : lerpRate);
      bodyRef.current.position.z = THREE.MathUtils.lerp(bodyRef.current.position.z, targetBodyZ, lerpRate);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetBodyRotX, lerpRate);
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, targetBodyRotZ, lerpRate);
    }

    // Periodic natural head turn + activity pitch/tilt
    if (t >= anim.nextHeadTurnAt) {
      anim.nextHeadTurnAt = t + 2.5 + Math.random() * 2.2;
      anim.headTargetY = Math.abs(anim.headTargetY) > 0.12 ? 0 : (Math.random() > 0.5 ? 1 : -1) * 0.32;
    }
    if (headRef.current) {
      const targetY =
        customHeadRotY !== null
          ? customHeadRotY
          : isMoving
            ? Math.sin(anim.walkCycle * 0.5) * 0.08
            : anim.headTargetY;
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetY,
        1 - Math.exp(-5 * delta)
      );
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadRotX, lerpRate);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetHeadRotZ, lerpRate);
    }

    if (ringRef.current && (hovered || isSelected)) {
      const pulse = 1 + Math.sin(t * 5.2) * 0.07;
      ringRef.current.scale.set(pulse, 1, pulse);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (mode !== 'world' || !visible || hiddenByFloor1View || !onSelect) return;
    if (e.delta > 6) return;
    e.stopPropagation();
    const p = animRef.current.pos;
    onSelect(config, [p.x, p.y, p.z]);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (mode !== 'world' || !visible || hiddenByFloor1View) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (mode !== 'world' || !visible || hiddenByFloor1View) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const hipY = 1.0 * legScaleY;
  const torsoY = hipY + 0.18;
  const headY = torsoY + 1.44;
  const isSkirtOrBatik = config.bottomStyle === 'skirt' || config.bottomStyle === 'batik';

  const renderLeg = (side: 'left' | 'right') => {
    const xPos = side === 'left' ? -0.3 : 0.3;
    const ref = side === 'left' ? leftLegRef : rightLegRef;
    const isShorts = config.bottomStyle === 'shorts';

    return (
      <group ref={ref} position={[xPos, hipY, 0]}>
        <group scale={[1, legScaleY, 1]}>
          {isShorts ? (
            <>
              <mesh geometry={SHARED_GEO.legShortUpper} material={legSurfaceMat} position={[0, -0.22, 0]} castShadow receiveShadow />
              <mesh geometry={SHARED_GEO.legShortLower} material={skinMat} position={[0, -0.62, 0]} castShadow receiveShadow />
            </>
          ) : (
            <mesh geometry={SHARED_GEO.legBox} material={legSurfaceMat} position={[0, -0.42, 0]} castShadow receiveShadow />
          )}

          {/* Foot & Shoe */}
          <mesh geometry={SHARED_GEO.foot} material={shoeMat} position={[0, -0.9, 0.08]} castShadow receiveShadow />
          {config.shoeStyle === 'sneakers' && (
            <mesh geometry={SHARED_GEO.shoeTip} material={getLegoMaterial('#F7F7F5')} position={[0, -0.92, 0.28]} />
          )}
          {config.shoeStyle === 'boots' && (
            <mesh geometry={SHARED_GEO.bootCuff} material={shoeMat} position={[0, -0.74, 0]} />
          )}
        </group>
      </group>
    );
  };

  const renderArm = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1;
    const ref = side === 'left' ? leftArmRef : rightArmRef;
    const xShoulder = sign * (0.48 * torsoScaleX + 0.08);
    const handAccessory =
      side === 'left' ? config.accessories.leftHandSlot : config.accessories.rightHandSlot;

    return (
      <group ref={ref} position={[xShoulder, torsoY + 0.88, 0]}>
        <mesh geometry={SHARED_GEO.shoulder} material={armMat} castShadow />
        <group rotation={[0, 0, sign * 0.14]}>
          <mesh geometry={SHARED_GEO.upperArm} material={armMat} position={[0, -0.22, 0]} castShadow />
          <mesh geometry={SHARED_GEO.foreArm} material={forearmMat} position={[0, -0.56, 0.06]} rotation={[-0.22, 0, 0]} castShadow />
          {/* C-Shaped LEGO Claw Hand */}
          <group position={[0, -0.82, 0.14]}>
            <mesh
              geometry={SHARED_GEO.clawHand}
              material={handMat}
              rotation={[Math.PI / 2, 0, Math.PI * 0.28]}
              castShadow
            />
            {side === 'right' && currentActivity === 'drinking' ? (
              /* Temporary cold LEGO cup with straw from fridge */
              <group position={[0, -0.02, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh geometry={SHARED_GEO.drinkCup} material={PROP_CUP_MAT} castShadow />
                <mesh geometry={SHARED_GEO.drinkLid} material={PROP_WHITE_MAT} position={[0, 0.17, 0]} />
                <mesh geometry={SHARED_GEO.drinkStraw} material={PROP_STRAW_MAT} position={[0.04, 0.28, 0]} rotation={[0, 0, -0.22]} />
              </group>
            ) : side === 'right' && currentActivity === 'watching-tv' ? (
              /* Temporary black LEGO TV remote with red power button */
              <group position={[0, -0.04, 0.16]}>
                <mesh geometry={SHARED_GEO.tvRemote} material={PROP_BLACK_MAT} castShadow />
                <mesh geometry={SHARED_GEO.tvRemoteBtn} material={PROP_RED_MAT} position={[0.025, 0.035, 0.11]} />
              </group>
            ) : side === 'right' && currentActivity === 'cooking' && handAccessory === 'none' ? (
              /* Temporary silver LEGO cooking spatula */
              <group position={[0, -0.04, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh geometry={SHARED_GEO.spatulaHandle} material={PROP_BLACK_MAT} />
                <mesh geometry={SHARED_GEO.spatulaBlade} material={PROP_SILVER_MAT} position={[0, 0.25, 0]} />
              </group>
            ) : (
              <HandSlotAccessory slot={handAccessory} />
            )}
          </group>
        </group>
      </group>
    );
  };

  return (
    <group
      ref={rootRef}
      visible={visible && !hiddenByFloor1View}
      position={mode === 'preview' ? [0, -1.5, 0] : config.startPosition}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Ground hover/selection ring */}
      {mode === 'world' && (hovered || isSelected) && (
        <mesh
          ref={ringRef}
          geometry={SHARED_GEO.ring}
          material={hovered ? RING_HOVER_MAT : RING_SELECTED_MAT}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.06, 0]}
        />
      )}

      <group ref={scaleGroupRef}>
        <group ref={bodyRef}>
          {/* HIPS & LEGS / SKIRT */}
          <mesh
            geometry={SHARED_GEO.hipBlock}
            material={legSurfaceMat}
            position={[0, hipY + 0.08, 0]}
            scale={[torsoScaleX, 1, torsoScaleZ]}
            castShadow
            receiveShadow
          />

          {isSkirtOrBatik ? (
            <group>
              <mesh
                geometry={SHARED_GEO.skirtCone}
                material={legSurfaceMat}
                position={[0, hipY * 0.52, 0]}
                scale={[torsoScaleX, legScaleY, torsoScaleZ]}
                castShadow
                receiveShadow
              />
              {/* Subtle feet peeking under skirt/batik */}
              <mesh geometry={SHARED_GEO.foot} material={shoeMat} position={[-0.26, 0.1, 0.08]} />
              <mesh geometry={SHARED_GEO.foot} material={shoeMat} position={[0.26, 0.1, 0.08]} />
            </group>
          ) : (
            <>
              <mesh geometry={SHARED_GEO.hipDivider} material={legSurfaceMat} position={[0, hipY - 0.16, 0]} />
              {renderLeg('left')}
              {renderLeg('right')}
            </>
          )}

          {/* TORSO + FRONT PRINT DECAL + OVER-TORSO ACCESSORIES */}
          <group position={[0, torsoY, 0]} scale={[torsoScaleX, 1, torsoScaleZ]}>
            <mesh geometry={SHARED_GEO.torso} material={torsoMat} castShadow receiveShadow />
            <mesh
              geometry={SHARED_GEO.torsoFrontPlane}
              material={dynamicMats.torsoFrontMat}
              position={[0, 0.52, 0.295]}
            />
            {config.bottomStyle === 'overalls' && (
              <>
                <mesh position={[-0.24, 0.56, 0.305]} material={bottomMat}>
                  <boxGeometry args={[0.14, 0.88, 0.03]} />
                </mesh>
                <mesh position={[0.24, 0.56, 0.305]} material={bottomMat}>
                  <boxGeometry args={[0.14, 0.88, 0.03]} />
                </mesh>
              </>
            )}
            <NeckSlotAccessory slot={config.accessories.neckSlot} />
            <BackSlotAccessory slot={config.accessories.backSlot} />
          </group>

          {/* ARTICULATED ARMS */}
          {renderArm('left')}
          {renderArm('right')}

          {/* NECK */}
          <mesh geometry={SHARED_GEO.neck} material={skinMat} position={[0, torsoY + 1.08, 0]} />

          {/* HEAD + MODULAR HAIR + HEADWEAR + HEAD/FACE ACCESSORIES */}
          <group ref={headRef} position={[0, headY, 0]} scale={[finalHeadScale, finalHeadScale, finalHeadScale]}>
            {config.headShape === 'round' ? (
              <mesh geometry={SHARED_GEO.headRound} material={dynamicMats.faceMat} rotation={[0, Math.PI / 2, 0]} castShadow />
            ) : (
              <mesh geometry={SHARED_GEO.headCyl} material={headMaterials} rotation={[0, Math.PI, 0]} castShadow />
            )}
            {/* Classic top head stud */}
            <mesh geometry={SHARED_GEO.headStud} material={skinMat} position={[0, 0.39, 0]} castShadow />

            <HairPart style={config.hairStyle} color={config.hairColor} />
            <HeadwearPart style={config.headwear} color={config.headwearColor} />
            <HeadSlotAccessory slot={config.accessories.headSlot} />
            <FaceSlotAccessory slot={config.accessories.faceSlot} />
          </group>
        </group>

        {/* Lightweight procedural particle FX (steam, shower drops, bubbles, swim splashes) */}
        {mode === 'world' && <ActivityFX activity={currentActivity} />}

        {/* Floating Speech Bubble / Working Badge / Zzz Sleeping Pill (world mode only) */}
        {mode === 'world' && (
          <CharacterOverheadUI
            speechText={speechText}
            isWorking={isWorkingAtDesk}
            isSleeping={currentActivity === 'sleeping'}
            hidden={!visible || (floorViewMode === 'floor1' && onFloor2)}
            yOffset={
              currentActivity === 'sleeping' ||
              currentActivity === 'hammock' ||
              currentActivity === 'swimming'
                ? 1.65
                : headY + 0.95
            }
          />
        )}
      </group>
    </group>
  );
};
