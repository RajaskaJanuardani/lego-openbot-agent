import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorLevel } from '../../types';
import { useUIStore } from '../../store/uiStore';

const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => {
  // Intentionally disabled while Floor 2 is faded so raycasts pass through to Floor 1
};

interface MaterialEntry {
  mat: THREE.Material;
  baseOpacity: number;
  baseTransparent: boolean;
  baseDepthWrite: boolean;
}

interface MeshEntry {
  mesh: THREE.Mesh;
  baseCastShadow: boolean;
  baseRaycast: THREE.Object3D['raycast'];
}

const FADE_OPACITY = 0;
const FADE_DURATION = 0.24; // Crisp smooth hide when switching to Floor 1 view

/**
 * Manages smooth opacity fade, shadow suppression, and raycast pass-through
 * for a floor group (`level = 1 | 2`) or dynamic group.
 * Each hook instance owns its own isolated material clone map so fading one
 * subtree NEVER affects materials in any other floor, outdoor, or character subtree!
 */
export function useObjectFade(
  groupRef: React.RefObject<THREE.Group | null>,
  shouldFade: boolean,
  enabled = true
): void {
  const factorRef = useRef(shouldFade ? FADE_OPACITY : 1);
  const cloneMapRef = useRef<WeakMap<THREE.Material, MaterialEntry>>(new WeakMap());
  const clonedSetRef = useRef<WeakSet<THREE.Material>>(new WeakSet());
  const trackedMatsRef = useRef<Set<MaterialEntry>>(new Set());
  const trackedMeshesRef = useRef<Map<string, MeshEntry>>(new Map());
  const lastScanTimeRef = useRef(-10);
  const lastAppliedFadeRef = useRef<number>(-1);
  const lastRaycastBlockedRef = useRef<boolean | null>(null);

  const getOrCloneMaterial = (mat: THREE.Material): MaterialEntry => {
    const cloneMap = cloneMapRef.current;
    const clonedSet = clonedSetRef.current;
    if (clonedSet.has(mat)) {
      const existing = cloneMap.get(mat);
      if (existing) return existing;
    }
    const cached = cloneMap.get(mat);
    if (cached) return cached;

    const cloned = mat.clone();
    const entry: MaterialEntry = {
      mat: cloned,
      baseOpacity: mat.opacity,
      baseTransparent: mat.transparent,
      baseDepthWrite: mat.depthWrite,
    };
    cloneMap.set(mat, entry);
    cloneMap.set(cloned, entry);
    clonedSet.add(cloned);
    return entry;
  };

  const scanSubtree = () => {
    const root = groupRef.current;
    if (!root || !enabled) return;

    const mats = trackedMatsRef.current;
    const meshes = trackedMeshesRef.current;

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      // Track mesh shadow & raycast state once
      if (!meshes.has(obj.uuid)) {
        meshes.set(obj.uuid, {
          mesh: obj,
          baseCastShadow: obj.castShadow,
          baseRaycast: obj.raycast,
        });
      }

      // Swap shared global material -> isolated clone once (zero per-frame cloning!)
      if (Array.isArray(obj.material)) {
        let changed = false;
        const nextArr = obj.material.map((m) => {
          const entry = getOrCloneMaterial(m);
          mats.add(entry);
          if (entry.mat !== m) changed = true;
          return entry.mat;
        });
        if (changed) {
          obj.material = nextArr;
        }
      } else if (obj.material) {
        const entry = getOrCloneMaterial(obj.material);
        mats.add(entry);
        if (entry.mat !== obj.material) {
          obj.material = entry.mat;
        }
      }
    });
  };

  // Initial scan on mount and whenever shouldFade flips
  useEffect(() => {
    if (!enabled) return;
    scanSubtree();
    // Force re-application next frame so any newly mounted meshes adopt current fade immediately
    lastAppliedFadeRef.current = -1;
    lastRaycastBlockedRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFade, enabled]);

  useFrame((state, delta) => {
    if (!enabled || !groupRef.current) return;

    // Periodically scan subtree (every 0.6s) to pick up dynamically added build-mode objects
    if (state.clock.elapsedTime - lastScanTimeRef.current > 0.6) {
      lastScanTimeRef.current = state.clock.elapsedTime;
      scanSubtree();
    }

    const target = shouldFade ? FADE_OPACITY : 1;
    const prev = factorRef.current;
    const step = (Math.min(delta, 0.05) / FADE_DURATION) * (1 - FADE_OPACITY);

    let next = prev;
    if (prev < target) {
      next = Math.min(target, prev + step);
    } else if (prev > target) {
      next = Math.max(target, prev - step);
    }
    factorRef.current = next;

    // Completely hide Floor 2 geometry once faded so Floor 1 is 100% clear and unobstructed
    const shouldBeVisible = next > 0.01;
    if (groupRef.current.visible !== shouldBeVisible) {
      groupRef.current.visible = shouldBeVisible;
    }

    const raycastBlocked = shouldFade;
    const needsMatUpdate = Math.abs(next - lastAppliedFadeRef.current) > 0.0005;
    const needsRaycastUpdate = raycastBlocked !== lastRaycastBlockedRef.current;

    if (!needsMatUpdate && !needsRaycastUpdate) return;

    const isTransparent = next < 0.995;
    const disableShadow = next < 0.85;

    if (needsMatUpdate) {
      trackedMatsRef.current.forEach((entry) => {
        const mat = entry.mat;
        const targetTransparent = isTransparent || entry.baseTransparent;
        const targetDepthWrite = !isTransparent && entry.baseDepthWrite;
        const targetOpacity = entry.baseOpacity * next;

        if (mat.transparent !== targetTransparent) {
          mat.transparent = targetTransparent;
          mat.needsUpdate = true;
        }
        mat.depthWrite = targetDepthWrite;
        mat.opacity = targetOpacity;
      });
      lastAppliedFadeRef.current = next;
    }

    if (needsMatUpdate || needsRaycastUpdate) {
      trackedMeshesRef.current.forEach((entry) => {
        entry.mesh.castShadow = disableShadow ? false : entry.baseCastShadow;
        entry.mesh.raycast = raycastBlocked ? NOOP_RAYCAST : entry.baseRaycast;
      });
      lastRaycastBlockedRef.current = raycastBlocked;
    }
  });
}

/**
 * Floor-level convenience hook: Level 2 fades when floorViewMode === 'floor1'.
 */
export function useFloorFade(
  groupRef: React.RefObject<THREE.Group | null>,
  level: FloorLevel
): void {
  const floorViewMode = useUIStore((s) => s.floorViewMode);
  const shouldFade = level === 2 && floorViewMode === 'floor1';
  useObjectFade(groupRef, shouldFade, level === 2);
}
