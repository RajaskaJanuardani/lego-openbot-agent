import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraTarget } from '../../types';
import { INITIAL_CAMERA } from './presets';

export interface CameraControllerProps {
  targetPreset: CameraTarget | null;
  autoRotate: boolean;
  onFirstInteraction: () => void;
  onTransitionComplete?: () => void;
}

const TRANSITION_DURATION = 1.0;

const PAN_LIMITS = {
  minX: -18,
  maxX: 18,
  minY: 3,
  maxY: 16,
  minZ: -15,
  maxZ: 15,
};

export const CameraController: React.FC<CameraControllerProps> = ({
  targetPreset,
  autoRotate,
  onFirstInteraction,
  onTransitionComplete,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  const hasInteractedRef = useRef(false);
  const transitionRef = useRef<{
    active: boolean;
    elapsed: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  }>({
    active: false,
    elapsed: 0,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Set initial orbit target on mount
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.set(...INITIAL_CAMERA.target);
    controls.update();
  }, []);

  // Notify on first pointer/wheel/touch interaction and cancel any active camera lerp
  useEffect(() => {
    const dom = gl.domElement;
    const handleInteract = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        onFirstInteraction();
      }
      if (transitionRef.current.active) {
        transitionRef.current.active = false;
      }
    };

    dom.addEventListener('pointerdown', handleInteract, { passive: true });
    dom.addEventListener('wheel', handleInteract, { passive: true });
    dom.addEventListener('touchstart', handleInteract, { passive: true });

    return () => {
      dom.removeEventListener('pointerdown', handleInteract);
      dom.removeEventListener('wheel', handleInteract);
      dom.removeEventListener('touchstart', handleInteract);
    };
  }, [gl, onFirstInteraction]);

  // Begin smooth 1-second eased transition whenever targetPreset updates
  useEffect(() => {
    if (!targetPreset || !controlsRef.current) return;

    const tr = transitionRef.current;
    tr.active = true;
    tr.elapsed = 0;
    tr.startPos.copy(camera.position);
    tr.endPos.set(...targetPreset.position);
    tr.startTarget.copy(controlsRef.current.target);
    tr.endTarget.set(...targetPreset.target);
  }, [targetPreset, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const tr = transitionRef.current;
    if (tr.active) {
      tr.elapsed += Math.min(delta, 0.05);
      const t = Math.min(1, tr.elapsed / TRANSITION_DURATION);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(tr.startPos, tr.endPos, ease);
      controls.target.lerpVectors(tr.startTarget, tr.endTarget, ease);

      if (t >= 1) {
        tr.active = false;
        onTransitionComplete?.();
      }
    }

    controls.autoRotate = autoRotate && !tr.active;

    // Clamp pan target inside house/diorama neighborhood
    controls.target.x = THREE.MathUtils.clamp(
      controls.target.x,
      PAN_LIMITS.minX,
      PAN_LIMITS.maxX
    );
    controls.target.y = THREE.MathUtils.clamp(
      controls.target.y,
      PAN_LIMITS.minY,
      PAN_LIMITS.maxY
    );
    controls.target.z = THREE.MathUtils.clamp(
      controls.target.z,
      PAN_LIMITS.minZ,
      PAN_LIMITS.maxZ
    );

    controls.update();
  });

  const handleControlStart = () => {
    if (transitionRef.current.active) {
      transitionRef.current.active = false;
    }
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      onFirstInteraction();
    }
  };

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enablePan
      panSpeed={0.85}
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.44}
      minDistance={10}
      maxDistance={66}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      onStart={handleControlStart}
    />
  );
};
