import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import { INITIAL_CAMERA } from '../../components/camera/presets';
import { cameraRuntime } from '../../lib/characterRuntime';
import { useUIStore } from '../../store/uiStore';
import { useFollowTarget } from './useFollowTarget';

const { ACTION } = CameraControlsImpl;

const DIORAMA_BOUNDARY = new THREE.Box3(
  new THREE.Vector3(-27, 0.4, -23),
  new THREE.Vector3(27, 17, 23)
);

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export const CameraRig: React.FC = () => {
  const controlsRef = useRef<CameraControls>(null);
  const { gl, camera, scene } = useThree();

  const cameraTarget = useUIStore((s) => s.cameraTarget);
  const cameraRequestNonce = useUIStore((s) => s.cameraRequestNonce);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const clearCameraTarget = useUIStore((s) => s.clearCameraTarget);

  const isUserDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Initialize starting camera & boundary box
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.setBoundary(DIORAMA_BOUNDARY);
    controls.boundaryEnclosesCamera = false;
    controls.smoothTime = 0.28;
    controls.draggingSmoothTime = 0.12;
    controls.setLookAt(
      INITIAL_CAMERA.position[0],
      INITIAL_CAMERA.position[1],
      INITIAL_CAMERA.position[2],
      INITIAL_CAMERA.target[0],
      INITIAL_CAMERA.target[1],
      INITIAL_CAMERA.target[2],
      false
    );
  }, []);

  // Respond to preset / room / character focus / minimap camera moves
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !cameraTarget) return;
    isTransitioningRef.current = true;
    controls
      .setLookAt(
        cameraTarget.position[0],
        cameraTarget.position[1],
        cameraTarget.position[2],
        cameraTarget.target[0],
        cameraTarget.target[1],
        cameraTarget.target[2],
        true
      )
      .then(() => {
        isTransitioningRef.current = false;
        clearCameraTarget();
      });
  }, [cameraTarget, cameraRequestNonce, clearCameraTarget]);

  // Keyboard navigation: WASD / Arrows pan parallel to ground, Q/E rotate, Shift+drag pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;
      if (useUIStore.getState().creatorOpen) return;

      const key = e.key.toLowerCase();
      if (key === 'shift' && controlsRef.current) {
        controlsRef.current.mouseButtons.left = ACTION.TRUCK;
      }

      if (
        ['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          key
        )
      ) {
        keysPressedRef.current.add(key);
        const st = useUIStore.getState();
        st.markInteracted();
        if (st.autoRotate) st.setAutoRotate(false);
        if (st.followCharacterId) st.setFollowCharacterId(null);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'shift' && controlsRef.current) {
        controlsRef.current.mouseButtons.left = ACTION.ROTATE;
      }
      keysPressedRef.current.delete(key);
    };

    const onBlur = () => {
      keysPressedRef.current.clear();
      if (controlsRef.current) {
        controlsRef.current.mouseButtons.left = ACTION.ROTATE;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Double-click anywhere on floor or ground to smoothly slide focus target there
  useEffect(() => {
    const dom = gl.domElement;

    const handleDblClick = (e: MouseEvent) => {
      if (useUIStore.getState().buildMode) return;
      const controls = controlsRef.current;
      if (!controls) return;

      const rect = dom.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      const hits = raycaster.intersectObjects(scene.children, true);
      const validHit = hits.find((h) => {
        if (!h.object.visible) return false;
        // Skip invisible helper planes or tiny overlays
        const mat = (h.object as THREE.Mesh).material;
        if (mat && !Array.isArray(mat) && mat.transparent && mat.opacity <= 0.01) {
          return false;
        }
        return true;
      });
      if (!validHit) return;

      const pt = validHit.point;
      const clampedX = THREE.MathUtils.clamp(pt.x, -26, 26);
      const clampedY = THREE.MathUtils.clamp(pt.y + 0.8, 1.0, 14.0);
      const clampedZ = THREE.MathUtils.clamp(pt.z, -22, 22);

      const st = useUIStore.getState();
      st.markInteracted();
      st.setAutoRotate(false);
      st.setFollowCharacterId(null);
      st.setActivePreset(null);

      controls.moveTo(clampedX, clampedY, clampedZ, true);
    };

    const handlePointerDown = () => {
      const st = useUIStore.getState();
      st.markInteracted();
      isTransitioningRef.current = false;
      if (st.followCharacterId) {
        st.setFollowCharacterId(null);
      }
    };

    const handleWheel = () => {
      const st = useUIStore.getState();
      st.markInteracted();
      if (st.autoRotate) st.setAutoRotate(false);
    };

    dom.addEventListener('dblclick', handleDblClick);
    dom.addEventListener('pointerdown', handlePointerDown, { passive: true });
    dom.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      dom.removeEventListener('dblclick', handleDblClick);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl, camera, scene]);

  // Smoothly follow selected character when Follow mode is enabled
  useFollowTarget(controlsRef, isUserDraggingRef);

  // Per-frame WASD/QE keyboard navigation, auto-rotate, and Minimap telemetry sync
  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const dt = Math.min(delta, 0.05);
    const keys = keysPressedRef.current;

    if (keys.size > 0) {
      const panSpeed = 20 * dt;
      const rotSpeed = 1.45 * dt;

      let forward = 0;
      let right = 0;
      if (keys.has('w') || keys.has('arrowup')) forward += 1;
      if (keys.has('s') || keys.has('arrowdown')) forward -= 1;
      if (keys.has('d') || keys.has('arrowright')) right += 1;
      if (keys.has('a') || keys.has('arrowleft')) right -= 1;

      if (forward !== 0) {
        controls.forward(forward * panSpeed, false);
      }
      if (right !== 0) {
        controls.truck(right * panSpeed, 0, false);
      }
      if (keys.has('q')) {
        controls.rotate(-rotSpeed, 0, false);
      }
      if (keys.has('e')) {
        controls.rotate(rotSpeed, 0, false);
      }
    }

    // Gentle auto-rotate when idle
    const st = useUIStore.getState();
    if (
      autoRotate &&
      !isUserDraggingRef.current &&
      !isTransitioningRef.current &&
      !st.followCharacterId &&
      !st.buildMode &&
      keys.size === 0
    ) {
      controls.azimuthAngle += 0.14 * dt;
    }

    // Export camera state for live Minimap cone
    controls.getPosition(tmpPos);
    controls.getTarget(tmpTarget);
    cameraRuntime.position[0] = tmpPos.x;
    cameraRuntime.position[1] = tmpPos.y;
    cameraRuntime.position[2] = tmpPos.z;
    cameraRuntime.target[0] = tmpTarget.x;
    cameraRuntime.target[1] = tmpTarget.y;
    cameraRuntime.target[2] = tmpTarget.z;
    cameraRuntime.azimuth = controls.azimuthAngle;
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI * 0.08}
      maxPolarAngle={Math.PI * 0.44}
      minDistance={8}
      maxDistance={72}
      dollySpeed={0.9}
      truckSpeed={1.4}
      azimuthRotateSpeed={0.75}
      polarRotateSpeed={0.7}
      mouseButtons={{
        left: ACTION.ROTATE,
        middle: ACTION.DOLLY,
        right: ACTION.TRUCK,
        wheel: ACTION.DOLLY,
      }}
      touches={{
        one: ACTION.TOUCH_ROTATE,
        two: ACTION.TOUCH_DOLLY_TRUCK,
        three: ACTION.TOUCH_TRUCK,
      }}
      onStart={() => {
        isUserDraggingRef.current = true;
        isTransitioningRef.current = false;
        const st = useUIStore.getState();
        st.markInteracted();
        if (st.autoRotate) st.setAutoRotate(false);
        if (st.followCharacterId) st.setFollowCharacterId(null);
      }}
      onEnd={() => {
        isUserDraggingRef.current = false;
      }}
    />
  );
};
