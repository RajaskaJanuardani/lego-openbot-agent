import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { characterRuntimeMap } from '../../lib/characterRuntime';
import { useUIStore } from '../../store/uiStore';

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const prevOffset = new THREE.Vector3();

/**
 * Smoothly tracks the followed character across rooms, stairs, and outdoors,
 * automatically adjusting Floor 1 / Floor 2 transparency as they change floors.
 */
export function useFollowTarget(
  controlsRef: React.RefObject<CameraControls | null>,
  isUserDraggingRef: React.MutableRefObject<boolean>
): void {
  const lastFollowedIdRef = useRef<string | null>(null);
  const offsetRef = useRef<THREE.Vector3>(new THREE.Vector3(-8.5, 7.5, 9.5));

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const { followCharacterId, floorViewMode, setFloorViewMode } = useUIStore.getState();
    if (!followCharacterId || isUserDraggingRef.current) {
      lastFollowedIdRef.current = null;
      return;
    }

    const snap = characterRuntimeMap.get(followCharacterId);
    if (!snap) return;

    const [cx, cy, cz] = snap.position;

    // On first frame of following a character, capture current relative camera offset (clamped comfortably)
    if (lastFollowedIdRef.current !== followCharacterId) {
      lastFollowedIdRef.current = followCharacterId;
      controls.getPosition(tmpPos);
      controls.getTarget(tmpTarget);
      prevOffset.subVectors(tmpPos, tmpTarget);
      const dist = prevOffset.length();
      if (dist >= 7 && dist <= 24) {
        offsetRef.current.copy(prevOffset);
      } else {
        offsetRef.current.set(-8.5, 7.5, 9.5);
      }
    }

    // Auto-switch Floor 1 transparency if followed character enters/leaves Floor 1 inside house
    const inHouse = cx >= -16 && cx <= 16 && cz >= -12 && cz <= 12;
    if (inHouse && cy < 4.5 && floorViewMode !== 'floor1') {
      setFloorViewMode('floor1');
    } else if ((!inHouse || cy >= 5.5) && floorViewMode === 'floor1') {
      setFloorViewMode('all');
    }

    desiredTarget.set(cx, cy + 1.8, cz);
    desiredPos.copy(desiredTarget).add(offsetRef.current);

    controls.getTarget(tmpTarget);
    controls.getPosition(tmpPos);

    const alpha = 1 - Math.exp(-5.2 * Math.min(delta, 0.05));
    tmpTarget.lerp(desiredTarget, alpha);
    tmpPos.lerp(desiredPos, alpha);

    controls.setLookAt(
      tmpPos.x,
      tmpPos.y,
      tmpPos.z,
      tmpTarget.x,
      tmpTarget.y,
      tmpTarget.z,
      false
    );
  });
}
