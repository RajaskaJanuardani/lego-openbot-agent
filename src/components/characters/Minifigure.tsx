import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { LEGO_COLORS } from '../../lib/colors';
import { getLegoMaterial } from '../../lib/materials';
import { characterBrain, CharacterOverheadUI } from '../../characters/ai';
import { useUIStore } from '../../store/uiStore';
import type { CharacterConfig, Vec3 } from '../../types';

export interface MinifigureProps {
  config: CharacterConfig;
  visible: boolean;
  isSelected: boolean;
  onSelect: (char: CharacterConfig, currentPosition: Vec3) => void;
  onPositionUpdate?: (id: CharacterConfig['id'], pos: Vec3) => void;
}

// ---------------------------------------------------------------------------
// Module-level shared geometries & highlight materials (allocated once)
// ---------------------------------------------------------------------------

function createTorsoGeometry(): THREE.BufferGeometry {
  const hb = 0.57; // bottom half-width (total 1.14)
  const ht = 0.45; // top half-width (total 0.90)
  const h = 1.06; // height
  const hd = 0.28; // half-depth (total 0.56)

  const FBL: Vec3 = [-hb, 0, hd];
  const FBR: Vec3 = [hb, 0, hd];
  const FTR: Vec3 = [ht, h, hd];
  const FTL: Vec3 = [-ht, h, hd];

  const BBL: Vec3 = [-hb, 0, -hd];
  const BBR: Vec3 = [hb, 0, -hd];
  const BTR: Vec3 = [ht, h, -hd];
  const BTL: Vec3 = [-ht, h, -hd];

  const uTopLeft = 0.5 - ht / (2 * hb);
  const uTopRight = 0.5 + ht / (2 * hb);

  const positions: number[] = [];
  const uvs: number[] = [];

  const pushTri = (
    a: Vec3,
    b: Vec3,
    c: Vec3,
    ua: [number, number],
    ub: [number, number],
    uc: [number, number]
  ) => {
    positions.push(...a, ...b, ...c);
    uvs.push(...ua, ...ub, ...uc);
  };

  // Group 0: Front (+Z) — distortion-free affine trapezoid UVs
  pushTri(FBL, FBR, FTR, [0, 0], [1, 0], [uTopRight, 1]);
  pushTri(FBL, FTR, FTL, [0, 0], [uTopRight, 1], [uTopLeft, 1]);

  // Group 1: Back (-Z), Right (+X), Left (-X), Top (+Y), Bottom (-Y)
  pushTri(BBR, BBL, BTL, [0, 0], [1, 0], [uTopRight, 1]);
  pushTri(BBR, BTL, BTR, [0, 0], [uTopRight, 1], [uTopLeft, 1]);

  pushTri(FBR, BBR, BTR, [0, 0], [1, 0], [1, 1]);
  pushTri(FBR, BTR, FTR, [0, 0], [1, 1], [0, 1]);

  pushTri(BBL, FBL, FTL, [0, 0], [1, 0], [1, 1]);
  pushTri(BBL, FTL, BTL, [0, 0], [1, 1], [0, 1]);

  pushTri(FTL, FTR, BTR, [0, 0], [1, 0], [1, 1]);
  pushTri(FTL, BTR, BTL, [0, 0], [1, 1], [0, 1]);

  pushTri(BBL, BBR, FBR, [0, 0], [1, 0], [1, 1]);
  pushTri(BBL, FBR, FBL, [0, 0], [1, 1], [0, 1]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.addGroup(0, 6, 0);
  geo.addGroup(6, 30, 1);
  geo.computeVertexNormals();
  return geo;
}

function createBatikSkirtGeometry(): THREE.BufferGeometry {
  const hb = 0.61; // flared bottom half-width
  const ht = 0.55; // waist half-width
  const h = 1.02; // skirt height (y: 0.08..1.10)
  const hdbFront = 0.37; // gentle LEGO dress forward slope
  const hdbBack = 0.31;
  const hdt = 0.28;

  const FBL: Vec3 = [-hb, 0, hdbFront];
  const FBR: Vec3 = [hb, 0, hdbFront];
  const FTR: Vec3 = [ht, h, hdt];
  const FTL: Vec3 = [-ht, h, hdt];

  const BBL: Vec3 = [-hb, 0, -hdbBack];
  const BBR: Vec3 = [hb, 0, -hdbBack];
  const BTR: Vec3 = [ht, h, -hdt];
  const BTL: Vec3 = [-ht, h, -hdt];

  const positions: number[] = [];
  const uvs: number[] = [];

  const pushQuad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  };

  pushQuad(FBL, FBR, FTR, FTL); // front
  pushQuad(BBR, BBL, BTL, BTR); // back
  pushQuad(FBR, BBR, BTR, FTR); // right
  pushQuad(BBL, FBL, FTL, BTL); // left
  pushQuad(FTL, FTR, BTR, BTL); // top
  pushQuad(BBL, BBR, FBR, FBL); // bottom

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

interface SharedGeometries {
  torso: THREE.BufferGeometry;
  batikSkirt: THREE.BufferGeometry;
  hipWaist: THREE.BoxGeometry;
  hipDivider: THREE.BoxGeometry;
  hipAxle: THREE.CylinderGeometry;
  thighCyl: THREE.CylinderGeometry;
  legFull: THREE.BoxGeometry;
  legUpperShort: THREE.BoxGeometry;
  legLowerShort: THREE.BoxGeometry;
  foot: THREE.BoxGeometry;
  footSole: THREE.BoxGeometry;
  slipper: THREE.BoxGeometry;
  shoulderBall: THREE.SphereGeometry;
  upperArm: THREE.CylinderGeometry;
  elbowBall: THREE.SphereGeometry;
  forearm: THREE.CylinderGeometry;
  wristPeg: THREE.CylinderGeometry;
  cHand: THREE.TorusGeometry;
  cHandTip: THREE.SphereGeometry;
  neck: THREE.CylinderGeometry;
  headBottomBevel: THREE.CylinderGeometry;
  headMain: THREE.CylinderGeometry;
  headTopBevel: THREE.CylinderGeometry;
  headStud: THREE.CylinderGeometry;
  hoodCollar: THREE.BoxGeometry;
  chefBand: THREE.CylinderGeometry;
  chefDome: THREE.SphereGeometry;
  chefPuff: THREE.SphereGeometry;
  bucketCrown: THREE.CylinderGeometry;
  bucketBand: THREE.CylinderGeometry;
  bucketBrim: THREE.CylinderGeometry;
  hairCap: THREE.SphereGeometry;
  hairBack: THREE.BoxGeometry;
  hairSide: THREE.BoxGeometry;
  hairBang: THREE.BoxGeometry;
  hairTopSweep: THREE.BoxGeometry;
  sanggulCap: THREE.SphereGeometry;
  sanggulBun: THREE.SphereGeometry;
  hairPinStick: THREE.CylinderGeometry;
  hairPinHead: THREE.SphereGeometry;
  jasmineBud: THREE.SphereGeometry;
  spatulaHandle: THREE.CylinderGeometry;
  spatulaShaft: THREE.CylinderGeometry;
  spatulaBlade: THREE.BoxGeometry;
  spatulaSlot: THREE.BoxGeometry;
  cameraBody: THREE.BoxGeometry;
  cameraTop: THREE.BoxGeometry;
  cameraLensOuter: THREE.CylinderGeometry;
  cameraLensInner: THREE.CylinderGeometry;
  cameraFlash: THREE.BoxGeometry;
  cameraStrap: THREE.BoxGeometry;
  headphoneBand: THREE.TorusGeometry;
  headphoneCup: THREE.CylinderGeometry;
  headphonePad: THREE.CylinderGeometry;
  headphoneRing: THREE.TorusGeometry;
  headphoneMic: THREE.CylinderGeometry;
  fanStick: THREE.BoxGeometry;
  fanLeaf: THREE.CylinderGeometry;
  broochGem: THREE.SphereGeometry;
  selectionRing: THREE.RingGeometry;
  selectionDisc: THREE.CircleGeometry;
}

let cachedGeos: SharedGeometries | null = null;

function getSharedGeometries(): SharedGeometries {
  if (cachedGeos) return cachedGeos;

  const headMain = new THREE.CylinderGeometry(0.39, 0.39, 0.56, 24, 1, false);
  const cHand = new THREE.TorusGeometry(0.155, 0.055, 8, 16, Math.PI * 1.46);

  cachedGeos = {
    torso: createTorsoGeometry(),
    batikSkirt: createBatikSkirtGeometry(),
    hipWaist: new THREE.BoxGeometry(1.12, 0.18, 0.56),
    hipDivider: new THREE.BoxGeometry(0.11, 0.34, 0.5),
    hipAxle: new THREE.CylinderGeometry(0.14, 0.14, 1.06, 12),
    thighCyl: new THREE.CylinderGeometry(0.24, 0.24, 0.48, 14),
    legFull: new THREE.BoxGeometry(0.48, 0.78, 0.48),
    legUpperShort: new THREE.BoxGeometry(0.49, 0.36, 0.49),
    legLowerShort: new THREE.BoxGeometry(0.45, 0.44, 0.45),
    foot: new THREE.BoxGeometry(0.48, 0.2, 0.62),
    footSole: new THREE.BoxGeometry(0.49, 0.06, 0.63),
    slipper: new THREE.BoxGeometry(0.36, 0.1, 0.46),
    shoulderBall: new THREE.SphereGeometry(0.155, 12, 10),
    upperArm: new THREE.CylinderGeometry(0.145, 0.135, 0.48, 12),
    elbowBall: new THREE.SphereGeometry(0.132, 10, 8),
    forearm: new THREE.CylinderGeometry(0.132, 0.125, 0.44, 12),
    wristPeg: new THREE.CylinderGeometry(0.078, 0.078, 0.14, 10),
    cHand,
    cHandTip: new THREE.SphereGeometry(0.055, 8, 6),
    neck: new THREE.CylinderGeometry(0.22, 0.24, 0.16, 16),
    headBottomBevel: new THREE.CylinderGeometry(0.39, 0.3, 0.1, 22),
    headMain,
    headTopBevel: new THREE.CylinderGeometry(0.3, 0.39, 0.1, 22),
    headStud: new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16),
    hoodCollar: new THREE.BoxGeometry(0.84, 0.22, 0.22),
    chefBand: new THREE.CylinderGeometry(0.415, 0.405, 0.18, 20),
    chefDome: new THREE.SphereGeometry(0.39, 16, 12),
    chefPuff: new THREE.SphereGeometry(0.23, 12, 10),
    bucketCrown: new THREE.CylinderGeometry(0.37, 0.42, 0.28, 20),
    bucketBand: new THREE.CylinderGeometry(0.425, 0.43, 0.075, 20),
    bucketBrim: new THREE.CylinderGeometry(0.42, 0.59, 0.17, 22),
    hairCap: new THREE.SphereGeometry(0.43, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairBack: new THREE.BoxGeometry(0.76, 0.46, 0.24),
    hairSide: new THREE.BoxGeometry(0.13, 0.4, 0.36),
    hairBang: new THREE.BoxGeometry(0.68, 0.17, 0.18),
    hairTopSweep: new THREE.BoxGeometry(0.62, 0.16, 0.52),
    sanggulCap: new THREE.SphereGeometry(0.425, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
    sanggulBun: new THREE.SphereGeometry(0.27, 14, 12),
    hairPinStick: new THREE.CylinderGeometry(0.022, 0.014, 0.52, 8),
    hairPinHead: new THREE.SphereGeometry(0.055, 10, 8),
    jasmineBud: new THREE.SphereGeometry(0.05, 8, 6),
    spatulaHandle: new THREE.CylinderGeometry(0.055, 0.055, 0.42, 10),
    spatulaShaft: new THREE.CylinderGeometry(0.032, 0.032, 0.34, 8),
    spatulaBlade: new THREE.BoxGeometry(0.28, 0.32, 0.034),
    spatulaSlot: new THREE.BoxGeometry(0.035, 0.18, 0.042),
    cameraBody: new THREE.BoxGeometry(0.42, 0.27, 0.2),
    cameraTop: new THREE.BoxGeometry(0.4, 0.06, 0.18),
    cameraLensOuter: new THREE.CylinderGeometry(0.105, 0.115, 0.14, 14),
    cameraLensInner: new THREE.CylinderGeometry(0.072, 0.072, 0.15, 12),
    cameraFlash: new THREE.BoxGeometry(0.09, 0.06, 0.06),
    cameraStrap: new THREE.BoxGeometry(0.055, 0.5, 0.035),
    headphoneBand: new THREE.TorusGeometry(0.465, 0.055, 8, 22, Math.PI),
    headphoneCup: new THREE.CylinderGeometry(0.17, 0.16, 0.13, 16),
    headphonePad: new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14),
    headphoneRing: new THREE.TorusGeometry(0.12, 0.022, 8, 16),
    headphoneMic: new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8),
    fanStick: new THREE.BoxGeometry(0.06, 0.24, 0.035),
    fanLeaf: new THREE.CylinderGeometry(
      0.32,
      0.32,
      0.03,
      14,
      1,
      false,
      -Math.PI * 0.425,
      Math.PI * 0.85
    ),
    broochGem: new THREE.SphereGeometry(0.055, 10, 8),
    selectionRing: new THREE.RingGeometry(0.7, 0.94, 32),
    selectionDisc: new THREE.CircleGeometry(0.7, 24),
  };

  return cachedGeos;
}

const OUTLINE_HOVER_MAT = new THREE.MeshBasicMaterial({
  color: '#FFF6B8',
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

const OUTLINE_SELECTED_MAT = new THREE.MeshBasicMaterial({
  color: '#FFD94A',
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
});

const RING_HOVER_MAT = new THREE.MeshBasicMaterial({
  color: '#FFF5B0',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
});

const RING_SELECTED_MAT = new THREE.MeshBasicMaterial({
  color: '#FFD22E',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.78,
  depthWrite: false,
});

const DISC_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: '#FFE875',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

const NO_RAYCAST = () => null;

// ---------------------------------------------------------------------------
// Procedural CanvasTexture generators (cached per-character, disposed cleanly)
// ---------------------------------------------------------------------------

function createFaceTexture(config: CharacterConfig): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Classic LEGO yellow skin background
    ctx.fillStyle = config.skinColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle studio shading band near top & bottom rim of cylinder
    const rimGrad = ctx.createLinearGradient(0, 0, 0, h);
    rimGrad.addColorStop(0, 'rgba(180, 115, 0, 0.14)');
    rimGrad.addColorStop(0.14, 'rgba(0, 0, 0, 0)');
    rimGrad.addColorStop(0.86, 'rgba(0, 0, 0, 0)');
    rimGrad.addColorStop(1, 'rgba(160, 100, 0, 0.16)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5; // u = 0.5 faces +Z (front)
    const eyeSpread = 25;
    const eyeY = 58;
    const leftEyeX = cx - eyeSpread;
    const rightEyeX = cx + eyeSpread;

    // Aspect ratio compensation so circular eyes stay perfectly round on 4.38:1 cylinder
    const rxScale = 1 / 1.094;

    const drawDotEye = (ex: number, ey: number, radius = 9.5) => {
      ctx.fillStyle = '#181A1F';
      ctx.beginPath();
      ctx.ellipse(ex, ey, radius * rxScale, radius, 0, 0, Math.PI * 2);
      ctx.fill();

      // Classic LEGO bright white specular glint dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(
        ex - 2.6 * rxScale,
        ey - 3.1,
        3.2 * rxScale,
        3.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawCheeks = (color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(leftEyeX - 12, eyeY + 18, 9 * rxScale, 6.2, 0, 0, Math.PI * 2);
      ctx.ellipse(rightEyeX + 12, eyeY + 18, 9 * rxScale, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (config.id === 'chef') {
      drawCheeks('rgba(235, 110, 80, 0.34)');
      drawDotEye(leftEyeX, eyeY, 9.2);
      drawDotEye(rightEyeX, eyeY, 9.2);

      // Expressive cheerful brown chef eyebrows
      ctx.strokeStyle = '#4A2B16';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 9, eyeY - 17);
      ctx.quadraticCurveTo(leftEyeX, eyeY - 23, leftEyeX + 8, eyeY - 18);
      ctx.moveTo(rightEyeX - 8, eyeY - 18);
      ctx.quadraticCurveTo(rightEyeX, eyeY - 23, rightEyeX + 9, eyeY - 17);
      ctx.stroke();

      // Cute curved handlebar chef mustache!
      ctx.fillStyle = '#4E2E18';
      ctx.beginPath();
      ctx.moveTo(cx, 78);
      ctx.bezierCurveTo(cx - 10, 71, cx - 26, 75, cx - 30, 86);
      ctx.bezierCurveTo(cx - 21, 90, cx - 8, 86, cx, 83);
      ctx.bezierCurveTo(cx + 8, 86, cx + 21, 90, cx + 30, 86);
      ctx.bezierCurveTo(cx + 26, 75, cx + 10, 71, cx, 78);
      ctx.fill();

      // Friendly smile peeking under mustache
      ctx.strokeStyle = '#181A1F';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, 84, 13, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (config.id === 'tourist') {
      drawCheeks('rgba(240, 120, 85, 0.36)');
      drawDotEye(leftEyeX, eyeY - 1, 9.6);
      drawDotEye(rightEyeX, eyeY - 1, 9.6);

      // High cheerful eyebrows
      ctx.strokeStyle = '#2B231D';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 9, eyeY - 18);
      ctx.quadraticCurveTo(leftEyeX, eyeY - 25, leftEyeX + 8, eyeY - 19);
      ctx.moveTo(rightEyeX - 8, eyeY - 19);
      ctx.quadraticCurveTo(rightEyeX, eyeY - 25, rightEyeX + 9, eyeY - 18);
      ctx.stroke();

      // Big joyful open grin with white LEGO teeth!
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#181A1F';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 20, 78);
      ctx.quadraticCurveTo(cx, 81, cx + 20, 78);
      ctx.quadraticCurveTo(cx + 16, 100, cx, 100);
      ctx.quadraticCurveTo(cx - 16, 100, cx - 20, 78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (config.id === 'gamer') {
      drawDotEye(leftEyeX, eyeY, 9.4);
      drawDotEye(rightEyeX, eyeY, 9.4);

      // Confident gamer eyebrows (one slightly cocked!)
      ctx.strokeStyle = '#4E2E18';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 10, eyeY - 19);
      ctx.lineTo(leftEyeX + 9, eyeY - 16);
      ctx.moveTo(rightEyeX - 8, eyeY - 16);
      ctx.quadraticCurveTo(rightEyeX + 1, eyeY - 23, rightEyeX + 10, eyeY - 19);
      ctx.stroke();

      // Cool playful asymmetric smirk
      ctx.strokeStyle = '#181A1F';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(cx - 14, 86);
      ctx.quadraticCurveTo(cx + 3, 94, cx + 20, 80);
      ctx.stroke();

      // Tiny corner grin crease
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx + 19, 77);
      ctx.lineTo(cx + 22, 83);
      ctx.stroke();
    } else {
      // Kebaya (Ibu Sari): warm graceful smile, soft blush, classic LEGO lashes
      drawCheeks('rgba(240, 105, 145, 0.42)');
      drawDotEye(leftEyeX, eyeY, 9.0);
      drawDotEye(rightEyeX, eyeY, 9.0);

      // Cute delicate outer eyelashes
      ctx.strokeStyle = '#181A1F';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 8, eyeY - 5);
      ctx.lineTo(leftEyeX - 14, eyeY - 9);
      ctx.moveTo(leftEyeX - 9, eyeY - 1);
      ctx.lineTo(leftEyeX - 14, eyeY - 2);
      ctx.moveTo(rightEyeX + 8, eyeY - 5);
      ctx.lineTo(rightEyeX + 14, eyeY - 9);
      ctx.moveTo(rightEyeX + 9, eyeY - 1);
      ctx.lineTo(rightEyeX + 14, eyeY - 2);
      ctx.stroke();

      // Graceful thin arched eyebrows
      ctx.strokeStyle = '#1E1A18';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 10, eyeY - 17);
      ctx.quadraticCurveTo(leftEyeX, eyeY - 23, leftEyeX + 8, eyeY - 18);
      ctx.moveTo(rightEyeX - 8, eyeY - 18);
      ctx.quadraticCurveTo(rightEyeX, eyeY - 23, rightEyeX + 10, eyeY - 17);
      ctx.stroke();

      // Warm coral-red smiling lips
      ctx.strokeStyle = '#C9385A';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(cx - 15, 81);
      ctx.quadraticCurveTo(cx, 95, cx + 15, 81);
      ctx.stroke();

      ctx.strokeStyle = '#8F1E3B';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cx - 14, 81);
      ctx.quadraticCurveTo(cx, 90, cx + 14, 81);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createTorsoTexture(config: CharacterConfig): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = config.torsoColor;
    ctx.fillRect(0, 0, w, h);

    if (config.torsoPattern === 'chef-apron') {
      // Red chef shirt with crisp collar & buttons peeking above white apron
      ctx.fillStyle = '#B81E1E';
      ctx.fillRect(0, 0, w, 26);

      // Yellow neck peek
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(156, 0);
      ctx.lineTo(128, 30);
      ctx.closePath();
      ctx.fill();

      // White shirt collar lapels
      ctx.fillStyle = '#F7F7F5';
      ctx.beginPath();
      ctx.moveTo(96, 0);
      ctx.lineTo(128, 30);
      ctx.lineTo(82, 34);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(160, 0);
      ctx.lineTo(128, 30);
      ctx.lineTo(174, 34);
      ctx.closePath();
      ctx.fill();

      // Apron neck straps
      ctx.strokeStyle = '#F7F7F5';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(76, 6);
      ctx.lineTo(66, 72);
      ctx.moveTo(180, 6);
      ctx.lineTo(190, 72);
      ctx.stroke();

      // Main crisp white apron bib & skirt
      ctx.fillStyle = '#F7F7F5';
      ctx.fillRect(54, 62, 148, 194);
      // Lower apron flare
      ctx.fillRect(36, 144, 184, 112);

      // Waist apron tie strings wrapping to sides
      ctx.fillStyle = '#E6E4DC';
      ctx.fillRect(10, 138, 236, 14);
      // Cute center waist bow
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#C9C6BE';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(112, 145, 14, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(144, 145, 14, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(128, 145, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Front apron pocket + subtle stitching
      ctx.strokeStyle = '#B8BDC4';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(60, 68, 136, 182);
      ctx.setLineDash([]);

      // Pocket with wooden spoon peeking out!
      ctx.fillStyle = '#8D5524';
      ctx.beginPath();
      ctx.ellipse(148, 166, 9, 13, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(142, 174, 7, 16);

      ctx.fillStyle = '#ECEAE2';
      ctx.strokeStyle = '#B4B9BF';
      ctx.lineWidth = 3;
      ctx.fillRect(82, 176, 92, 56);
      ctx.strokeRect(82, 176, 92, 56);

      // Cute golden chef star badge on chest
      ctx.fillStyle = '#E6A82E';
      ctx.beginPath();
      ctx.arc(128, 102, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F7F7F5';
      ctx.beginPath();
      ctx.arc(128, 102, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (config.torsoPattern === 'hawaiian') {
      // Vibrant tropical Hawaiian shirt
      // Subtle turquoise weave stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let x = 0; x < w; x += 24) {
        ctx.fillRect(x, 0, 8, h);
      }

      // Palm fronds
      const drawPalmLeaf = (lx: number, ly: number, angle: number, scale: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#1E7A3D';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(22, -16, 44, -4);
        ctx.quadraticCurveTo(22, 14, 0, 0);
        ctx.fill();
        ctx.strokeStyle = '#52BA4E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(38, -3);
        ctx.stroke();
        ctx.restore();
      };

      drawPalmLeaf(36, 95, -0.5, 1.0);
      drawPalmLeaf(180, 72, 2.5, 0.95);
      drawPalmLeaf(208, 178, -2.4, 1.15);
      drawPalmLeaf(48, 210, -0.25, 1.1);
      drawPalmLeaf(140, 145, 0.6, 0.9);

      // Tropical hibiscus flowers (yellow, coral-orange, hot-pink)
      const drawFlower = (fx: number, fy: number, color: string, r: number) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - 0.3;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * r * 0.72, fy + Math.sin(a) * r * 0.72, r * 0.56, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFF3B0';
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
      };

      drawFlower(78, 86, '#FFD95A', 17);
      drawFlower(186, 118, '#F07818', 18);
      drawFlower(86, 172, '#F46FA4', 19);
      drawFlower(178, 210, '#FFD95A', 16);
      drawFlower(142, 62, '#F46FA4', 14);
      drawFlower(42, 224, '#F07818', 15);

      // Open V-collar showing minifig yellow neck + white collar flaps
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.moveTo(96, 0);
      ctx.lineTo(160, 0);
      ctx.lineTo(128, 52);
      ctx.closePath();
      ctx.fill();

      // Center button placket
      ctx.fillStyle = 'rgba(20, 110, 102, 0.45)';
      ctx.fillRect(122, 50, 12, 206);
      ctx.fillStyle = '#F6EBD4';
      for (let by = 72; by <= 232; by += 40) {
        ctx.beginPath();
        ctx.arc(128, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (config.torsoPattern === 'hoodie') {
      // Royal blue gamer hoodie
      // Darker navy ribbed hem at bottom
      ctx.fillStyle = '#1A3461';
      ctx.fillRect(0, 232, w, 24);
      ctx.strokeStyle = '#2E5496';
      ctx.lineWidth = 2;
      for (let rx = 8; rx < w; rx += 12) {
        ctx.beginPath();
        ctx.moveTo(rx, 234);
        ctx.lineTo(rx, 256);
        ctx.stroke();
      }

      // Hood neckline shadow & cyan inner hood lining
      ctx.fillStyle = '#1A3461';
      ctx.beginPath();
      ctx.arc(128, 6, 48, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#5BB6E5';
      ctx.beginPath();
      ctx.arc(128, 4, 34, 0, Math.PI);
      ctx.fill();

      // White hoodie drawstrings
      ctx.strokeStyle = '#F7F7F5';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(106, 30);
      ctx.quadraticCurveTo(102, 74, 108, 106);
      ctx.moveTo(150, 30);
      ctx.quadraticCurveTo(154, 74, 148, 106);
      ctx.stroke();

      // Cute pixel game controller chest emblem!
      ctx.fillStyle = '#1A3461';
      ctx.fillRect(88, 92, 80, 48);
      ctx.strokeStyle = '#5BB6E5';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(88, 92, 80, 48);
      // D-pad (yellow)
      ctx.fillStyle = '#FFD95A';
      ctx.fillRect(104, 104, 8, 24);
      ctx.fillRect(96, 112, 24, 8);
      // Action buttons (pink & cyan)
      ctx.fillStyle = '#F46FA4';
      ctx.beginPath();
      ctx.arc(150, 110, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5BB6E5';
      ctx.beginPath();
      ctx.arc(138, 122, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Front kangaroo pocket
      ctx.fillStyle = '#1E468F';
      ctx.beginPath();
      ctx.moveTo(64, 166);
      ctx.lineTo(192, 166);
      ctx.lineTo(212, 232);
      ctx.lineTo(44, 232);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4B7DD4';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Kebaya (Ibu Sari): vibrant pink blouse with delicate brocade & gold brooch
      // Subtle floral brocade sheen across fabric
      ctx.fillStyle = 'rgba(255, 224, 238, 0.28)';
      for (let gy = 28; gy < h; gy += 36) {
        for (let gx = 28; gx < w; gx += 36) {
          const offset = (Math.floor(gy / 36) % 2) * 18;
          ctx.beginPath();
          ctx.arc(gx + offset, gy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Traditional V-neck opening showing warm skin collar
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.moveTo(92, 0);
      ctx.lineTo(164, 0);
      ctx.lineTo(128, 56);
      ctx.closePath();
      ctx.fill();

      // Kutubaru center panel
      ctx.fillStyle = '#E06094';
      ctx.fillRect(102, 54, 52, 186);

      // Ornate golden lace trim along neckline & kutubaru edges
      ctx.strokeStyle = '#E6A82E';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(92, 0);
      ctx.lineTo(104, 56);
      ctx.lineTo(104, 244);
      ctx.moveTo(164, 0);
      ctx.lineTo(152, 56);
      ctx.lineTo(152, 244);
      ctx.stroke();

      // Scalloped gold hem trim at bottom
      ctx.fillStyle = '#E6A82E';
      for (let sx = 12; sx < w; sx += 24) {
        ctx.beginPath();
        ctx.arc(sx, 248, 10, Math.PI, 0);
        ctx.fill();
      }

      // Gold selendang / waist sash accent
      ctx.fillStyle = 'rgba(230, 168, 46, 0.88)';
      ctx.fillRect(18, 212, 220, 16);
      ctx.strokeStyle = '#FFF2C2';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 214, 220, 12);

      // Ornate tiered traditional gold brooch (bros susun tiga)
      const broochYs = [82, 122, 160];
      broochYs.forEach((by, idx) => {
        const r = 13 - idx * 1.5;
        ctx.fillStyle = '#FFD95A';
        ctx.strokeStyle = '#B87B14';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(128, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#C21878';
        ctx.beginPath();
        ctx.arc(128, by, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createBatikTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich warm sogan brown batik base
    ctx.fillStyle = '#6E3F1E';
    ctx.fillRect(0, 0, w, h);

    // Diagonal parang dark-chocolate waves
    ctx.strokeStyle = '#42220D';
    ctx.lineWidth = 14;
    for (let i = -w; i < w * 2; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }

    // Golden-ochre & cream kawung floral diamond grid
    for (let gy = 20; gy < h - 20; gy += 44) {
      for (let gx = 20; gx < w; gx += 44) {
        const ox = (Math.floor(gy / 44) % 2) * 22;
        const cx = gx + ox;
        const cy = gy;

        // 4-petal kawung motif
        ctx.fillStyle = '#E6A82E';
        const offsets: [number, number][] = [
          [0, -9],
          [0, 9],
          [-9, 0],
          [9, 0],
        ];
        offsets.forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.ellipse(
            cx + dx,
            cy + dy,
            dx === 0 ? 4.5 : 7,
            dy === 0 ? 4.5 : 7,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        // Cream dot center (cecek)
        ctx.fillStyle = '#F6EBD4';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Vertical front wrap pleat crease shadow
    ctx.fillStyle = 'rgba(42, 20, 8, 0.42)';
    ctx.fillRect(156, 0, 8, h);
    ctx.fillStyle = 'rgba(246, 235, 212, 0.25)';
    ctx.fillRect(164, 0, 4, h);

    // Traditional woven gold & dark brown bottom hem border
    ctx.fillStyle = '#3B1E0B';
    ctx.fillRect(0, 224, w, 32);
    ctx.fillStyle = '#E6A82E';
    ctx.fillRect(0, 222, w, 6);
    ctx.fillRect(0, 246, w, 5);
    for (let tx = 8; tx < w; tx += 16) {
      ctx.beginPath();
      ctx.moveTo(tx, 242);
      ctx.lineTo(tx + 6, 230);
      ctx.lineTo(tx + 12, 242);
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// Minifigure Component
// ---------------------------------------------------------------------------

// Offset when sitting so underside of rotated thighs/hips (unshifted y=0.74) rests cleanly on sofa cushion (FLOOR_Y + 0.88)
const SIT_OFFSET_Y = -0.71;

export const Minifigure: React.FC<MinifigureProps> = ({
  config,
  visible,
  isSelected,
  onSelect,
  onPositionUpdate,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const [onFloor2, setOnFloor2] = useState(config.startPosition[1] >= 5.2);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [isWorkingAtDesk, setIsWorkingAtDesk] = useState(false);
  const floorViewMode = useUIStore((s) => s.floorViewMode);

  const geos = useMemo(() => getSharedGeometries(), []);

  // Per-character procedural CanvasTextures & textured materials (disposed on unmount)
  const customAssets = useMemo(() => {
    const faceTex = createFaceTexture(config);
    const torsoTex = createTorsoTexture(config);
    const batikTex = config.legPattern === 'batik' ? createBatikTexture() : null;

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

    const batikMat = batikTex
      ? new THREE.MeshStandardMaterial({
          map: batikTex,
          roughness: 0.34,
          metalness: 0,
        })
      : null;

    return { faceTex, torsoTex, batikTex, faceMat, torsoFrontMat, batikMat };
  }, [config]);

  useEffect(() => {
    return () => {
      customAssets.faceTex.dispose();
      customAssets.torsoTex.dispose();
      customAssets.batikTex?.dispose();
      customAssets.faceMat.dispose();
      customAssets.torsoFrontMat.dispose();
      customAssets.batikMat?.dispose();
    };
  }, [customAssets]);

  // Reset hover cursor if character is hidden or unmounts while hovered
  useEffect(() => {
    if (!visible && hovered) {
      setHovered(false);
      document.body.style.cursor = 'auto';
    }
  }, [visible, hovered]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Cached solid ABS materials
  const mats = useMemo(() => {
    const skin = getLegoMaterial(config.skinColor);
    const torso = getLegoMaterial(config.torsoColor);
    const arm = getLegoMaterial(config.armColor);
    const hip = getLegoMaterial(config.hipColor);
    const leg = getLegoMaterial(config.legColor);
    const accent = getLegoMaterial(config.accentColor);
    const white = getLegoMaterial(LEGO_COLORS.white);
    const black = getLegoMaterial(LEGO_COLORS.black);
    const silver = getLegoMaterial(LEGO_COLORS.silver, { roughness: 0.22, metalness: 0.45 });
    const brown = getLegoMaterial(LEGO_COLORS.brownWood);
    const darkWood = getLegoMaterial(LEGO_COLORS.darkWood);
    const gold = getLegoMaterial(LEGO_COLORS.gold, { roughness: 0.25, metalness: 0.35 });
    const cream = getLegoMaterial(LEGO_COLORS.creamWall);
    const cyan = getLegoMaterial(LEGO_COLORS.lightBlue, {
      emissive: LEGO_COLORS.lightBlue,
      emissiveIntensity: 0.25,
    });
    const darkBlue = getLegoMaterial(LEGO_COLORS.navyBlue);
    const lensGlass = getLegoMaterial(LEGO_COLORS.seaDeep, { roughness: 0.1, metalness: 0.3 });
    const magenta = getLegoMaterial(LEGO_COLORS.magentaTrim);

    return {
      skin,
      torso,
      arm,
      hip,
      leg,
      accent,
      white,
      black,
      silver,
      brown,
      darkWood,
      gold,
      cream,
      cyan,
      darkBlue,
      lensGlass,
      magenta,
      headMaterials: [customAssets.faceMat, skin, skin] as THREE.Material[],
      torsoMaterials: [customAssets.torsoFrontMat, torso] as THREE.Material[],
    };
  }, [config, customAssets]);

  // Deterministic animation phase offset per character
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < config.id.length; i++) {
      hash = (hash * 31 + config.id.charCodeAt(i)) % 1000;
    }
    return (hash / 1000) * Math.PI * 2;
  }, [config.id]);

  // Mutable animation & walking state (never triggers React re-renders)
  const animRef = useRef({
    pos: new THREE.Vector3(...config.startPosition),
    rotY: config.rotationY,
    waypointIdx: 0,
    pauseTimer: 0.8,
    walkCycle: 0,
    isMoving: false,
    scale: 1,
    headTargetY: 0,
    nextHeadTurnAt: 2.2 + phaseOffset * 0.4,
    elapsed: phaseOffset,
    lastReportTime: 0,
  });

  // Animate walking, idle breathing, periodic head turns, and hover scale
  useFrame((_, rawDelta) => {
    if (!visible) return;

    const delta = Math.min(rawDelta, 0.05);
    const state = animRef.current;
    state.elapsed += delta;
    const t = state.elapsed;

    // 1. Sync position, orientation, activity & speech from central CharacterAIBrain
    const brainState = characterBrain.states.get(config.id);
    const activity = brainState?.activity ?? (config.sitting ? 'sitting' : 'idle');
    const isSittingNow =
      activity === 'sitting' ||
      activity === 'working' ||
      activity === 'sunbathing' ||
      activity === 'sleeping';

    if (brainState) {
      state.pos.set(
        brainState.position[0],
        brainState.position[1] + (isSittingNow ? brainState.seatOffsetY : 0),
        brainState.position[2]
      );
      state.rotY = brainState.rotationY;
      state.isMoving = brainState.isMoving;
      if (brainState.isMoving) {
        state.walkCycle += delta * 9.5;
      }

      if (brainState.speechText !== speechText) {
        setSpeechText(brainState.speechText);
      }
      if (brainState.isWorkingAtDesk !== isWorkingAtDesk) {
        setIsWorkingAtDesk(brainState.isWorkingAtDesk);
      }
    }

    // Apply root world transform
    if (rootRef.current) {
      rootRef.current.position.copy(state.pos);
      rootRef.current.rotation.y = state.rotY;
    }

    // Periodically report live position (throttled lightly so parent ref stays fresh)
    if (onPositionUpdate && t - state.lastReportTime > 0.25) {
      state.lastReportTime = t;
      onPositionUpdate(config.id, [state.pos.x, state.pos.y, state.pos.z]);
    }
    const nowOnFloor2 = state.pos.y >= 5.2;
    if (nowOnFloor2 !== onFloor2) {
      setOnFloor2(nowOnFloor2);
    }

    // 2. Smooth hover/select scale lerp
    const targetScale = hovered ? 1.12 : isSelected ? 1.05 : 1.0;
    state.scale += (targetScale - state.scale) * (1 - Math.exp(-12 * delta));
    if (scaleGroupRef.current) {
      scaleGroupRef.current.scale.setScalar(state.scale);
    }

    // 3. Body vertical breathing bob & walking bounce
    const baseBodyY = isSittingNow ? SIT_OFFSET_Y : 0;
    if (bodyRef.current) {
      if (state.isMoving) {
        const bounce = Math.abs(Math.sin(state.walkCycle)) * 0.085;
        const waddle = Math.sin(state.walkCycle) * 0.045;
        bodyRef.current.position.y = baseBodyY + bounce;
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, waddle, 0.25);
      } else {
        const breathe = Math.sin(t * 2.4) * 0.024;
        bodyRef.current.position.y = THREE.MathUtils.lerp(
          bodyRef.current.position.y,
          baseBodyY + breathe,
          0.16
        );
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.14);
      }
    }

    // 4. Leg & arm articulation (walk, sit, type/work, cook/stir, chat gestures, idle)
    const lerpRate = 1 - Math.exp(-12 * delta);
    if (isSittingNow) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2;
      if (activity === 'working') {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.85 + Math.sin(t * 14) * 0.1;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.85 + Math.cos(t * 15.5) * 0.1;
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.58 + Math.sin(t * 6.5) * 0.06;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.58 + Math.cos(t * 7.2) * 0.06;
      }
    } else if (state.isMoving) {
      const legSwing = Math.sin(state.walkCycle) * 0.62;
      const armSwing = Math.sin(state.walkCycle) * 0.52;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) {
        const armBias = config.accessory === 'spatula' ? -0.35 : 0;
        rightArmRef.current.rotation.x = armSwing * 0.75 + armBias;
      }
    } else if (activity === 'cooking') {
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.75 + Math.sin(t * 7.5) * 0.25;
    } else if (activity === 'chatting') {
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      const gesture = speechText ? Math.sin(t * 6.2) * 0.24 - 0.32 : -0.05;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, gesture * 0.6, lerpRate);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, gesture, lerpRate);
    } else {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpRate);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpRate);
      }
      if (leftArmRef.current) {
        const leftIdle = Math.sin(t * 1.8) * 0.05;
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, leftIdle, lerpRate);
      }
      if (rightArmRef.current) {
        let rightIdle = -Math.sin(t * 1.8) * 0.05;
        if (config.accessory === 'spatula') {
          rightIdle = -0.45 + Math.sin(t * 4.2) * 0.14;
        } else if (config.id === 'kebaya') {
          rightIdle = -0.42 + Math.sin(t * 2.6) * 0.18;
        }
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rightIdle, lerpRate);
      }
    }

    // 5. Periodic natural head-turn (looks left/right every few seconds)
    if (t >= state.nextHeadTurnAt) {
      state.nextHeadTurnAt = t + 2.6 + ((Math.sin(t * 3.1 + phaseOffset) + 1) * 1.3);
      if (Math.abs(state.headTargetY) > 0.12) {
        state.headTargetY = 0;
      } else {
        const dir = Math.sin(t * 5.7 + phaseOffset) >= 0 ? 1 : -1;
        state.headTargetY = dir * (0.24 + (Math.cos(t * 2.3) + 1) * 0.1);
      }
    }
    if (headRef.current) {
      const targetHeadY = state.isMoving ? Math.sin(state.walkCycle * 0.5) * 0.08 : state.headTargetY;
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetHeadY,
        1 - Math.exp(-5 * delta)
      );
      // Slight enthusiastic head bob for seated gamer
      if (config.sitting) {
        headRef.current.rotation.x = Math.sin(t * 3.6) * 0.045;
      }
    }

    // 6. Subtle pulsing selection/hover ring underfoot
    if (ringRef.current && (hovered || isSelected)) {
      const pulse = 1 + Math.sin(t * 5.2) * 0.07;
      ringRef.current.scale.set(pulse, 1, pulse);
      ringRef.current.rotation.y = t * 0.8;
    }
  });

  // Pointer interaction handlers (only active when visible)
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!visible) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!visible) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!visible) return;
    if (e.delta > 6) return;
    e.stopPropagation();
    const p = animRef.current.pos;
    onSelect(config, [p.x, p.y, p.z]);
  };

  const showOutline = hovered || isSelected;
  const outlineMat = hovered ? OUTLINE_HOVER_MAT : OUTLINE_SELECTED_MAT;
  const ringMat = hovered ? RING_HOVER_MAT : RING_SELECTED_MAT;
  const isShortSleeve = config.torsoPattern === 'hawaiian';
  const forearmMat = isShortSleeve ? mats.skin : mats.arm;

  // Helper for rendering a single articulated LEGO leg
  const renderLeg = (side: 'left' | 'right') => {
    const xPos = side === 'left' ? -0.305 : 0.305;
    const ref = side === 'left' ? leftLegRef : rightLegRef;
    const pattern = config.legPattern ?? 'solid';

    const shoeMat =
      pattern === 'jeans'
        ? mats.white
        : pattern === 'shorts'
          ? mats.brown
          : mats.leg;

    return (
      <group ref={ref} position={[xPos, 0.98, 0]}>
        {/* Rounded upper thigh joint */}
        <mesh
          geometry={geos.thighCyl}
          material={mats.leg}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        />

        {pattern === 'shorts' ? (
          <>
            {/* Khaki shorts upper leg */}
            <mesh
              geometry={geos.legUpperShort}
              material={mats.leg}
              position={[0, -0.18, 0]}
              castShadow
              receiveShadow
            />
            {/* Yellow LEGO minifigure calf below shorts */}
            <mesh
              geometry={geos.legLowerShort}
              material={mats.skin}
              position={[0, -0.57, 0]}
              castShadow
              receiveShadow
            />
          </>
        ) : (
          <mesh
            geometry={geos.legFull}
            material={mats.leg}
            position={[0, -0.39, 0]}
            castShadow
            receiveShadow
          />
        )}

        {/* Classic LEGO foot with forward toe protrusion (sole cleanly at local y = -0.98 => world y = 0) */}
        <mesh
          geometry={geos.foot}
          material={shoeMat}
          position={[0, -0.88, 0.07]}
          castShadow
          receiveShadow
        />

        {/* Sneaker dark sole accent for Gamer */}
        {pattern === 'jeans' && (
          <mesh
            geometry={geos.footSole}
            material={mats.darkBlue}
            position={[0, -0.95, 0.07]}
            castShadow
            receiveShadow
          />
        )}

        {/* Inverted-hull BackSide highlight outline */}
        {showOutline && (
          <group raycast={NO_RAYCAST}>
            <mesh
              geometry={geos.legFull}
              material={outlineMat}
              position={[0, -0.39, 0]}
              scale={[1.18, 1.07, 1.18]}
              raycast={NO_RAYCAST}
            />
            <mesh
              geometry={geos.foot}
              material={outlineMat}
              position={[0, -0.88, 0.07]}
              scale={[1.18, 1.24, 1.14]}
              raycast={NO_RAYCAST}
            />
          </group>
        )}
      </group>
    );
  };

  // Helper for rendering articulated left/right LEGO arm + classic C-shaped claw hand
  const renderArm = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1;
    const ref = side === 'left' ? leftArmRef : rightArmRef;
    const hasSpatula = side === 'right' && config.accessory === 'spatula';
    const hasBatikFan = side === 'right' && config.accessory === 'batik-fan';

    return (
      <group
        ref={ref}
        position={[sign * 0.49, 2.1, 0]}
        rotation={[0, 0, sign * 0.17]}
      >
        {/* Shoulder cap */}
        <mesh geometry={geos.shoulderBall} material={mats.arm} castShadow receiveShadow />

        {/* Upper arm (short sleeve on Tourist) */}
        <mesh
          geometry={geos.upperArm}
          material={mats.arm}
          position={[sign * 0.04, -0.24, 0.02]}
          rotation={[0.06, 0, sign * 0.06]}
          castShadow
          receiveShadow
        />

        {/* Elbow joint */}
        <mesh
          geometry={geos.elbowBall}
          material={forearmMat}
          position={[sign * 0.06, -0.47, 0.05]}
          castShadow
          receiveShadow
        />

        {/* Forearm angled slightly forward */}
        <mesh
          geometry={geos.forearm}
          material={forearmMat}
          position={[sign * 0.06, -0.66, 0.15]}
          rotation={[-0.42, 0, 0]}
          castShadow
          receiveShadow
        />

        {/* Wrist peg + classic yellow C-shaped LEGO hand */}
        <group position={[sign * 0.06, -0.84, 0.25]} rotation={[-0.3, 0, 0]}>
          <mesh
            geometry={geos.wristPeg}
            material={mats.skin}
            position={[0, 0.03, -0.04]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />

          {/* C-shaped claw oriented in XZ plane with mouth opening forward (+Z) */}
          <group position={[0, -0.02, 0.13]}>
            <mesh
              geometry={geos.cHand}
              material={mats.skin}
              rotation={[-Math.PI / 2, 0, -Math.PI * 0.23]}
              castShadow
              receiveShadow
            />
            {/* Rounded claw tip caps */}
            <mesh
              geometry={geos.cHandTip}
              material={mats.skin}
              position={[-0.115, 0, 0.105]}
              castShadow
            />
            <mesh
              geometry={geos.cHandTip}
              material={mats.skin}
              position={[0.115, 0, 0.105]}
              castShadow
            />

            {/* Accessory: Silver & Black LEGO Spatula (Chef Budi) */}
            {hasSpatula && (
              <group position={[0, 0.16, 0.01]} rotation={[0.25, 0, -0.1]}>
                <mesh
                  geometry={geos.spatulaHandle}
                  material={mats.black}
                  position={[0, -0.04, 0]}
                  castShadow
                />
                <mesh
                  geometry={geos.spatulaShaft}
                  material={mats.silver}
                  position={[0, 0.32, 0]}
                  castShadow
                />
                <group position={[0, 0.62, 0.03]} rotation={[0.22, 0, 0]}>
                  <mesh geometry={geos.spatulaBlade} material={mats.silver} castShadow />
                  <mesh
                    geometry={geos.spatulaSlot}
                    material={mats.black}
                    position={[-0.07, 0.02, 0]}
                  />
                  <mesh
                    geometry={geos.spatulaSlot}
                    material={mats.black}
                    position={[0, 0.02, 0]}
                  />
                  <mesh
                    geometry={geos.spatulaSlot}
                    material={mats.black}
                    position={[0.07, 0.02, 0]}
                  />
                </group>
              </group>
            )}

            {/* Accessory: Traditional Pleated Batik Fan (Ibu Sari) */}
            {hasBatikFan && (
              <group position={[0.02, 0.08, 0.04]} rotation={[0.18, 0.35, -0.22]}>
                <mesh
                  geometry={geos.fanStick}
                  material={mats.darkWood}
                  position={[0, 0.04, 0]}
                  castShadow
                />
                {/* Semi-circular gold & pink pleated fan arc opening upward (+Y) */}
                <mesh
                  geometry={geos.fanLeaf}
                  material={mats.gold}
                  position={[0, 0.14, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  castShadow
                />
                <mesh
                  geometry={geos.fanLeaf}
                  material={mats.magenta}
                  position={[0, 0.14, 0.016]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={[0.78, 1, 0.78]}
                />
              </group>
            )}
          </group>
        </group>

        {/* Arm outline highlight */}
        {showOutline && (
          <group raycast={NO_RAYCAST}>
            <mesh
              geometry={geos.upperArm}
              material={outlineMat}
              position={[sign * 0.04, -0.24, 0.02]}
              rotation={[0.06, 0, sign * 0.06]}
              scale={[1.28, 1.08, 1.28]}
              raycast={NO_RAYCAST}
            />
            <mesh
              geometry={geos.forearm}
              material={outlineMat}
              position={[sign * 0.06, -0.66, 0.15]}
              rotation={[-0.42, 0, 0]}
              scale={[1.28, 1.08, 1.28]}
              raycast={NO_RAYCAST}
            />
          </group>
        )}
      </group>
    );
  };

  return (
    <group
      ref={rootRef}
      visible={visible}
      position={config.startPosition}
      rotation={[0, config.rotationY, 0]}
      onPointerOver={visible ? handlePointerOver : undefined}
      onPointerOut={visible ? handlePointerOut : undefined}
      onClick={visible ? handleClick : undefined}
    >
      {/* Glowing LEGO ring underfoot on hover or selection */}
      {showOutline && (
        <group
          ref={ringRef}
          position={[0, config.sitting ? 0.05 : 0.04, 0]}
          raycast={NO_RAYCAST}
        >
          <mesh
            geometry={geos.selectionRing}
            material={ringMat}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={NO_RAYCAST}
          />
          <mesh
            geometry={geos.selectionDisc}
            material={DISC_GLOW_MAT}
            position={[0, -0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={NO_RAYCAST}
          />
        </group>
      )}

      {/* Hover scale wrapper */}
      <group ref={scaleGroupRef}>
        {/* Animated body wrapper (breathing bob / walking bounce / sit offset) */}
        <group ref={bodyRef} position={[0, config.sitting ? SIT_OFFSET_Y : 0, 0]}>
          {/* -------------------- LEGS & HIPS (y = 0 .. 1.22) -------------------- */}
          <mesh
            geometry={geos.hipWaist}
            material={mats.hip}
            position={[0, 1.13, 0]}
            castShadow
            receiveShadow
          />

          {config.legPattern === 'batik' && customAssets.batikMat ? (
            <group>
              {/* Authentic sloped LEGO Batik wrap skirt (kain batik cokelat) */}
              <mesh
                geometry={geos.batikSkirt}
                material={customAssets.batikMat}
                position={[0, 0.08, 0]}
                castShadow
                receiveShadow
              />
              {/* Tiny traditional dark-wood/gold flat slippers peeking at y = 0 */}
              <mesh
                geometry={geos.slipper}
                material={mats.darkWood}
                position={[-0.25, 0.05, 0.14]}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={geos.slipper}
                material={mats.darkWood}
                position={[0.25, 0.05, 0.14]}
                castShadow
                receiveShadow
              />
              {showOutline && (
                <mesh
                  geometry={geos.batikSkirt}
                  material={outlineMat}
                  position={[0, 0.08, 0]}
                  scale={[1.1, 1.06, 1.12]}
                  raycast={NO_RAYCAST}
                />
              )}
            </group>
          ) : (
            <>
              <mesh
                geometry={geos.hipDivider}
                material={mats.hip}
                position={[0, 0.94, 0]}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={geos.hipAxle}
                material={mats.hip}
                position={[0, 0.98, 0]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                receiveShadow
              />
              {renderLeg('left')}
              {renderLeg('right')}
            </>
          )}

          {/* -------------------- TRAPEZOIDAL TORSO (y = 1.22 .. 2.28) -------------------- */}
          <mesh
            geometry={geos.torso}
            material={mats.torsoMaterials}
            position={[0, 1.22, 0]}
            castShadow
            receiveShadow
          />

          {showOutline && (
            <mesh
              geometry={geos.torso}
              material={outlineMat}
              position={[0, 1.19, 0]}
              scale={[1.12, 1.07, 1.18]}
              raycast={NO_RAYCAST}
            />
          )}

          {/* Extra 3D torso details */}
          {config.torsoPattern === 'hoodie' && (
            <mesh
              geometry={geos.hoodCollar}
              material={mats.torso}
              position={[0, 2.22, -0.28]}
              castShadow
              receiveShadow
            />
          )}

          {config.torsoPattern === 'kebaya' && (
            <mesh
              geometry={geos.broochGem}
              material={mats.gold}
              position={[0, 1.92, 0.3]}
              scale={[1.1, 1.1, 0.55]}
              castShadow
            />
          )}

          {/* Accessory: Tourist Camera hanging on neck strap */}
          {config.accessory === 'camera' && (
            <group position={[0, 1.72, 0.34]}>
              {/* Strap V-lines tilting back toward shoulders/neck */}
              <mesh
                geometry={geos.cameraStrap}
                material={mats.black}
                position={[-0.19, 0.3, -0.09]}
                rotation={[-0.32, 0, -0.14]}
                castShadow
              />
              <mesh
                geometry={geos.cameraStrap}
                material={mats.black}
                position={[0.19, 0.3, -0.09]}
                rotation={[-0.32, 0, 0.14]}
                castShadow
              />
              {/* Black-and-silver LEGO camera body */}
              <mesh geometry={geos.cameraBody} material={mats.black} castShadow />
              <mesh
                geometry={geos.cameraTop}
                material={mats.silver}
                position={[0, 0.145, 0]}
                castShadow
              />
              <mesh
                geometry={geos.cameraFlash}
                material={mats.white}
                position={[0.12, 0.18, 0.02]}
                castShadow
              />
              {/* Protruding lens */}
              <mesh
                geometry={geos.cameraLensOuter}
                material={mats.silver}
                position={[-0.02, -0.01, 0.13]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              />
              <mesh
                geometry={geos.cameraLensInner}
                material={mats.lensGlass}
                position={[-0.02, -0.01, 0.14]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          )}

          {/* -------------------- ARTICULATED ARMS & C-HANDS -------------------- */}
          {renderArm('left')}
          {renderArm('right')}

          {/* -------------------- NECK & HEAD (y = 2.28 .. 3.31) -------------------- */}
          <mesh
            geometry={geos.neck}
            material={mats.skin}
            position={[0, 2.33, 0]}
            castShadow
            receiveShadow
          />

          <group ref={headRef} position={[0, 2.36, 0]}>
            {/* Bottom head bevel */}
            <mesh
              geometry={geos.headBottomBevel}
              material={mats.skin}
              position={[0, 0.08, 0]}
              castShadow
              receiveShadow
            />

            {/* Main classic LEGO yellow cylinder head with CanvasTexture face facing +Z */}
            <mesh
              geometry={geos.headMain}
              material={mats.headMaterials}
              position={[0, 0.41, 0]}
              rotation={[0, Math.PI, 0]}
              castShadow
              receiveShadow
            />

            {/* Top head bevel */}
            <mesh
              geometry={geos.headTopBevel}
              material={mats.skin}
              position={[0, 0.74, 0]}
              castShadow
              receiveShadow
            />

            {/* Iconic LEGO top head stud */}
            <mesh
              geometry={geos.headStud}
              material={mats.skin}
              position={[0, 0.87, 0]}
              castShadow
              receiveShadow
            />

            {/* Head outline glow */}
            {showOutline && (
              <mesh
                geometry={geos.headMain}
                material={outlineMat}
                position={[0, 0.41, 0]}
                scale={[1.15, 1.28, 1.15]}
                raycast={NO_RAYCAST}
              />
            )}

            {/* -------------------- HAIR / HATS -------------------- */}
            {config.hairOrHat === 'chef-hat' && (
              <group position={[0, 0.78, 0]}>
                <mesh geometry={geos.chefBand} material={mats.white} castShadow receiveShadow />
                <mesh
                  geometry={geos.chefDome}
                  material={mats.white}
                  position={[0, 0.34, 0]}
                  scale={[1.05, 0.9, 1.05]}
                  castShadow
                  receiveShadow
                />
                {/* Puffy chef toque crown lobes */}
                {[0, 1, 2, 3, 4].map((idx) => {
                  const angle = (idx * Math.PI * 2) / 5;
                  return (
                    <mesh
                      key={idx}
                      geometry={geos.chefPuff}
                      material={mats.white}
                      position={[Math.cos(angle) * 0.24, 0.38, Math.sin(angle) * 0.24]}
                      castShadow
                      receiveShadow
                    />
                  );
                })}
                <mesh
                  geometry={geos.chefPuff}
                  material={mats.white}
                  position={[0, 0.54, 0]}
                  scale={[1.1, 0.85, 1.1]}
                  castShadow
                  receiveShadow
                />
                {showOutline && (
                  <mesh
                    geometry={geos.chefDome}
                    material={outlineMat}
                    position={[0, 0.34, 0]}
                    scale={[1.38, 1.32, 1.38]}
                    raycast={NO_RAYCAST}
                  />
                )}
              </group>
            )}

            {config.hairOrHat === 'bucket-hat' && (
              <group position={[0, 0.72, 0]}>
                <mesh
                  geometry={geos.bucketCrown}
                  material={mats.cream}
                  position={[0, 0.16, 0]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.bucketBand}
                  material={mats.torso}
                  position={[0, 0.05, 0]}
                  castShadow
                />
                <mesh
                  geometry={geos.bucketBrim}
                  material={mats.cream}
                  position={[0, -0.02, 0]}
                  castShadow
                  receiveShadow
                />
                {showOutline && (
                  <mesh
                    geometry={geos.bucketBrim}
                    material={outlineMat}
                    position={[0, 0.05, 0]}
                    scale={[1.12, 2.2, 1.12]}
                    raycast={NO_RAYCAST}
                  />
                )}
              </group>
            )}

            {config.hairOrHat === 'brown-hair' && (
              <group position={[0, 0.44, 0]}>
                <mesh
                  geometry={geos.hairCap}
                  material={mats.brown}
                  position={[0, 0.16, -0.01]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairBack}
                  material={mats.brown}
                  position={[0, 0.04, -0.32]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairSide}
                  material={mats.brown}
                  position={[-0.37, 0.05, -0.06]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairSide}
                  material={mats.brown}
                  position={[0.37, 0.05, -0.06]}
                  castShadow
                  receiveShadow
                />
                {/* Swept skater/gamer bangs across forehead */}
                <mesh
                  geometry={geos.hairBang}
                  material={mats.brown}
                  position={[0.04, 0.28, 0.34]}
                  rotation={[0.25, 0.14, -0.18]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairTopSweep}
                  material={mats.brown}
                  position={[0, 0.45, 0.04]}
                  rotation={[0.08, 0, -0.08]}
                  castShadow
                  receiveShadow
                />
              </group>
            )}

            {config.hairOrHat === 'sanggul' && (
              <group position={[0, 0.43, 0]}>
                {/* Glossy jet-black sleek top hair cap */}
                <mesh
                  geometry={geos.sanggulCap}
                  material={mats.black}
                  position={[0, 0.15, -0.02]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairBack}
                  material={mats.black}
                  position={[0, 0.04, -0.3]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairSide}
                  material={mats.black}
                  position={[-0.36, 0.07, -0.08]}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={geos.hairSide}
                  material={mats.black}
                  position={[0.36, 0.07, -0.08]}
                  castShadow
                  receiveShadow
                />
                {/* Neat center-parted bangs */}
                <mesh
                  geometry={geos.hairBang}
                  material={mats.black}
                  position={[-0.17, 0.27, 0.31]}
                  rotation={[0.2, 0.25, 0.28]}
                  scale={[0.55, 0.85, 0.85]}
                  castShadow
                />
                <mesh
                  geometry={geos.hairBang}
                  material={mats.black}
                  position={[0.17, 0.27, 0.31]}
                  rotation={[0.2, -0.25, -0.28]}
                  scale={[0.55, 0.85, 0.85]}
                  castShadow
                />
                {/* Iconic traditional Indonesian low rear bun (sanggul) */}
                <mesh
                  geometry={geos.sanggulBun}
                  material={mats.black}
                  position={[0, -0.06, -0.47]}
                  scale={[1.15, 0.92, 0.85]}
                  castShadow
                  receiveShadow
                />
                {/* Golden tusuk konde hairpin + 3 white jasmine buds (melati) */}
                <mesh
                  geometry={geos.hairPinStick}
                  material={mats.gold}
                  position={[0.04, 0.06, -0.5]}
                  rotation={[0.15, 0, -0.78]}
                  castShadow
                />
                <mesh
                  geometry={geos.hairPinHead}
                  material={mats.gold}
                  position={[0.24, 0.25, -0.47]}
                  castShadow
                />
                <mesh
                  geometry={geos.jasmineBud}
                  material={mats.white}
                  position={[0.25, -0.02, -0.43]}
                />
                <mesh
                  geometry={geos.jasmineBud}
                  material={mats.white}
                  position={[0.29, -0.1, -0.39]}
                />
                <mesh
                  geometry={geos.jasmineBud}
                  material={mats.white}
                  position={[0.22, -0.14, -0.45]}
                />
              </group>
            )}

            {/* Accessory: Chunky Over-Ear Gaming Headphones (Rafi Gamer) */}
            {config.accessory === 'headphones' && (
              <group position={[0, 0.44, 0]}>
                {/* Arching black headband clearing the sculpted hair cleanly */}
                <mesh
                  geometry={geos.headphoneBand}
                  material={mats.black}
                  position={[0, 0.04, 0]}
                  scale={[0.98, 1.15, 1.0]}
                  castShadow
                />
                {/* Cyan accent trim along headband */}
                <mesh
                  geometry={geos.headphoneBand}
                  material={mats.cyan}
                  position={[0, 0.08, 0]}
                  scale={[0.96, 1.15, 0.65]}
                />
                {/* Left ear cup + cyan glow ring + mic boom */}
                <group position={[-0.45, 0.02, 0]}>
                  <mesh
                    geometry={geos.headphoneCup}
                    material={mats.black}
                    rotation={[0, 0, Math.PI / 2]}
                    castShadow
                  />
                  <mesh
                    geometry={geos.headphonePad}
                    material={mats.darkBlue}
                    position={[0.06, 0, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                  />
                  <mesh
                    geometry={geos.headphoneRing}
                    material={mats.cyan}
                    position={[-0.07, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                  />
                  {/* Curved gaming mic boom sweeping toward mouth */}
                  <mesh
                    geometry={geos.headphoneMic}
                    material={mats.black}
                    position={[0.1, -0.09, 0.2]}
                    rotation={[Math.PI * 0.45, 0, -0.58]}
                  />
                </group>
                {/* Right ear cup + cyan glow ring */}
                <group position={[0.45, 0.02, 0]}>
                  <mesh
                    geometry={geos.headphoneCup}
                    material={mats.black}
                    rotation={[0, 0, Math.PI / 2]}
                    castShadow
                  />
                  <mesh
                    geometry={geos.headphonePad}
                    material={mats.darkBlue}
                    position={[-0.06, 0, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                  />
                  <mesh
                    geometry={geos.headphoneRing}
                    material={mats.cyan}
                    position={[0.07, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                  />
                </group>
              </group>
            )}
          </group>
        </group>

        {/* Overhead Speech Bubble & Working Badge */}
        <CharacterOverheadUI
          speechText={speechText}
          isWorking={isWorkingAtDesk}
          hidden={!visible || (floorViewMode === 'floor1' && onFloor2)}
        />
      </group>
    </group>
  );
};
