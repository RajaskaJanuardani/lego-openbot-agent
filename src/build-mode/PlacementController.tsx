import React, { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Copy, Move, RotateCw, Trash2 } from 'lucide-react';
import { ASSETS_BY_ID, getRotatedFootprint } from '../assets-registry';
import { characterBrain } from '../characters/ai';
import { FloorGroup } from '../scene/floors/FloorGroup';
import { useLayoutStore } from '../store/layoutStore';
import { useUIStore } from '../store/uiStore';
import type { PlacedObject } from '../lib/schema';
import {
  buildDynamicObstacles,
  getFloorBaseY,
  isPlacementValid,
  snapToNearestWall,
} from './collision';

interface GhostState {
  x: number;
  y: number;
  z: number;
  rotationQuarter: number;
  valid: boolean;
}

const PlacedObjectItem: React.FC<{
  obj: PlacedObject;
  isNight: boolean;
  buildMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRotate: (id: string) => void;
  onStartMove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({
  obj,
  isNight,
  buildMode,
  isSelected,
  onSelect,
  onRotate,
  onStartMove,
  onDuplicate,
  onDelete,
}) => {
  const def = ASSETS_BY_ID.get(obj.assetId);
  if (!def) return null;

  const [fw, fd] = getRotatedFootprint(def.footprint, obj.rotationQuarter);
  const rotY = obj.rotationQuarter * (Math.PI / 2);

  return (
    <group
      position={obj.position}
      rotation={[0, rotY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!buildMode) return;
        if (e.delta > 6) return;
        e.stopPropagation();
        onSelect(obj.id);
      }}
    >
      {def.render({
        color: obj.color,
        accentColor: obj.accentColor,
        isNight,
      })}

      {/* Selection footprint ring + quick floating gizmo toolbar */}
      {buildMode && isSelected && (
        <>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(fw, fd) * 0.52, Math.max(fw, fd) * 0.62, 24]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.9} />
          </mesh>
          <Html position={[0, 3.0, 0]} center zIndexRange={[30, 0]}>
            <div
              className="flex items-center gap-1 rounded-xl border-2 border-amber-400 bg-slate-900/95 p-1 text-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Putar 90° (R)"
                onClick={() => onRotate(obj.id)}
                className="cursor-pointer rounded-lg p-1.5 hover:bg-amber-500 hover:text-slate-950"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Pindahkan"
                onClick={() => onStartMove(obj.id)}
                className="cursor-pointer rounded-lg p-1.5 hover:bg-sky-500"
              >
                <Move className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Duplikat (Ctrl+D)"
                onClick={() => onDuplicate(obj.id)}
                className="cursor-pointer rounded-lg p-1.5 hover:bg-emerald-500"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Hapus (Del)"
                onClick={() => onDelete(obj.id)}
                className="cursor-pointer rounded-lg p-1.5 text-rose-400 hover:bg-rose-500 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

/**
 * Renders all data-driven placed Build Mode assets (split properly across Floor 0,
 * FloorGroup 1, and FloorGroup 2), the thin Build Mode stud grid, green/red Ghost
 * preview, keyboard shortcuts, and automatic debounced NavGraph rebuilds!
 */
export const PlacementController: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const buildMode = useUIStore((s) => s.buildMode);
  const pushToast = useUIStore((s) => s.pushToast);

  const placedObjects = useLayoutStore((s) => s.placedObjects);
  const activeEditFloor = useLayoutStore((s) => s.activeEditFloor);
  const placingAssetId = useLayoutStore((s) => s.placingAssetId);
  const placingRotation = useLayoutStore((s) => s.placingRotation);
  const selectedObjectId = useLayoutStore((s) => s.selectedObjectId);
  const movingObjectId = useLayoutStore((s) => s.movingObjectId);

  const addPlacedObject = useLayoutStore((s) => s.addPlacedObject);
  const updatePlacedObject = useLayoutStore((s) => s.updatePlacedObject);
  const deletePlacedObject = useLayoutStore((s) => s.deletePlacedObject);
  const duplicatePlacedObject = useLayoutStore((s) => s.duplicatePlacedObject);
  const setPlacingAssetId = useLayoutStore((s) => s.setPlacingAssetId);
  const rotatePlacing = useLayoutStore((s) => s.rotatePlacing);
  const setSelectedObjectId = useLayoutStore((s) => s.setSelectedObjectId);
  const setMovingObjectId = useLayoutStore((s) => s.setMovingObjectId);
  const undo = useLayoutStore((s) => s.undo);
  const redo = useLayoutStore((s) => s.redo);

  const [ghost, setGhost] = useState<GhostState | null>(null);

  // Automatically rebuild character AI navigation graph whenever layout objects change (debounced 180ms!)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const obstacles = buildDynamicObstacles(placedObjects);
      characterBrain.rebuildGraph(obstacles);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [placedObjects]);

  // Build Mode keyboard shortcuts: R rotate, Del/Backspace delete, Ctrl+D duplicate, Ctrl+Z / Ctrl+Shift+Z undo/redo, Esc cancel
  useEffect(() => {
    if (!buildMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (mod && key === 'd' && selectedObjectId) {
        e.preventDefault();
        duplicatePlacedObject(selectedObjectId);
        pushToast('Objek diduplikat!');
        return;
      }

      if (key === 'r') {
        if (placingAssetId) {
          rotatePlacing();
        } else if (selectedObjectId) {
          const obj = placedObjects.find((o) => o.id === selectedObjectId);
          if (obj) {
            updatePlacedObject(obj.id, { rotationQuarter: (obj.rotationQuarter + 1) % 4 });
          }
        }
        return;
      }

      if ((key === 'delete' || key === 'backspace') && selectedObjectId) {
        e.preventDefault();
        deletePlacedObject(selectedObjectId);
        pushToast('Objek dihapus.');
        return;
      }

      if (key === 'escape') {
        setPlacingAssetId(null);
        setMovingObjectId(null);
        setSelectedObjectId(null);
        setGhost(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    buildMode,
    placingAssetId,
    selectedObjectId,
    placedObjects,
    rotatePlacing,
    updatePlacedObject,
    deletePlacedObject,
    duplicatePlacedObject,
    setPlacingAssetId,
    setMovingObjectId,
    setSelectedObjectId,
    undo,
    redo,
    pushToast,
  ]);

  const activeAssetId = useMemo(() => {
    if (placingAssetId) return placingAssetId;
    if (movingObjectId) {
      return placedObjects.find((o) => o.id === movingObjectId)?.assetId ?? null;
    }
    return null;
  }, [placingAssetId, movingObjectId, placedObjects]);

  const activeDef = activeAssetId ? ASSETS_BY_ID.get(activeAssetId) ?? null : null;
  const activeBaseY = getFloorBaseY(activeEditFloor);

  const handlePlaneMove = (e: ThreeEvent<PointerEvent>) => {
    if (!buildMode || !activeDef) {
      if (ghost) setGhost(null);
      return;
    }
    e.stopPropagation();

    let gx = Math.round(e.point.x);
    let gz = Math.round(e.point.z);
    let gy = activeBaseY;
    let rot = placingRotation;

    if (activeDef.mountType === 'wall') {
      if (activeEditFloor === 1 || activeEditFloor === 2) {
        const snapped = snapToNearestWall(activeEditFloor, e.point.x, e.point.z);
        if (snapped) {
          gx = snapped.x;
          gz = snapped.z;
          rot = snapped.rotationQuarter;
          gy = activeBaseY + (activeDef.wallMountHeight ?? 3.2);
        } else {
          gy = activeBaseY + (activeDef.wallMountHeight ?? 3.2);
        }
      }
    }

    const valid = isPlacementValid(
      activeDef.id,
      activeEditFloor,
      gx,
      gz,
      rot,
      placedObjects,
      movingObjectId ?? undefined
    );

    setGhost({ x: gx, y: gy, z: gz, rotationQuarter: rot, valid });
  };

  const handlePlaneClick = (e: ThreeEvent<MouseEvent>) => {
    if (!buildMode || e.delta > 6) return;

    if (!activeDef || !ghost) {
      setSelectedObjectId(null);
      return;
    }
    e.stopPropagation();

    if (!ghost.valid) {
      pushToast('Posisi bertabrakan dengan dinding/objek lain!', 'warn');
      return;
    }

    if (movingObjectId) {
      updatePlacedObject(movingObjectId, {
        floor: activeEditFloor,
        position: [ghost.x, ghost.y, ghost.z],
        rotationQuarter: ghost.rotationQuarter,
      });
      setMovingObjectId(null);
      setGhost(null);
      pushToast(`${activeDef.name} dipindahkan!`);
    } else {
      const newObj: PlacedObject = {
        id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        assetId: activeDef.id,
        floor: activeEditFloor,
        position: [ghost.x, ghost.y, ghost.z],
        rotationQuarter: ghost.rotationQuarter,
        color: activeDef.defaultColor,
        accentColor: activeDef.defaultAccentColor,
      };
      addPlacedObject(newObj);
      setSelectedObjectId(newObj.id);
      pushToast(`${activeDef.name} ditambahkan!`);
    }
  };

  const floor0Objs = placedObjects.filter((o) => o.floor === 0);
  const floor1Objs = placedObjects.filter((o) => o.floor === 1);
  const floor2Objs = placedObjects.filter((o) => o.floor === 2);

  const renderObjectList = (list: PlacedObject[]) =>
    list.map((obj) => (
      <PlacedObjectItem
        key={obj.id}
        obj={obj}
        isNight={isNight}
        buildMode={buildMode}
        isSelected={selectedObjectId === obj.id}
        onSelect={setSelectedObjectId}
        onRotate={(id) =>
          updatePlacedObject(id, { rotationQuarter: (obj.rotationQuarter + 1) % 4 })
        }
        onStartMove={(id) => {
          setMovingObjectId(id);
          pushToast('Klik lantai tujuan untuk memindahkan objek (R = putar, Esc = batal)');
        }}
        onDuplicate={(id) => {
          duplicatePlacedObject(id);
          pushToast('Objek diduplikat!');
        }}
        onDelete={(id) => {
          deletePlacedObject(id);
          pushToast('Objek dihapus.');
        }}
      />
    ));

  return (
    <group name="build-mode-layer">
      {/* Outdoor placed objects (Floor 0) */}
      <group name="placed-objects-outdoor">{renderObjectList(floor0Objs)}</group>

      {/* Floor 1 placed objects */}
      <FloorGroup level={1} name="placed-objects-f1">
        {renderObjectList(floor1Objs)}
      </FloorGroup>

      {/* Floor 2 placed objects (auto-fade cleanly to 0.12 in Floor 1 mode!) */}
      <FloorGroup level={2} name="placed-objects-f2">
        {renderObjectList(floor2Objs)}
      </FloorGroup>

      {/* Build Mode Subtle Stud Grid & Interactive Raycast Floor Plane */}
      {buildMode && (
        <group position={[0, activeBaseY + 0.06, 0]}>
          <gridHelper
            args={[
              activeEditFloor === 0 ? 54 : 32,
              activeEditFloor === 0 ? 54 : 32,
              '#F59E0B',
              '#38BDF8',
            ]}
          />
          {/* Invisible raycast capture plane for smooth 1-stud snapping */}
          {activeDef && (
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerMove={handlePlaneMove}
              onClick={handlePlaneClick}
              onPointerOut={() => setGhost(null)}
            >
              <planeGeometry args={[56, 46]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      )}

      {/* Translucent Green/Red Ghost Preview snapped to 1-stud grid */}
      {buildMode && activeDef && ghost && (
        <group
          position={[ghost.x, ghost.y, ghost.z]}
          rotation={[0, ghost.rotationQuarter * (Math.PI / 2), 0]}
        >
          {/* Footprint indicator pad (green = valid, red = blocked) */}
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[activeDef.footprint[0], activeDef.footprint[1]]} />
            <meshBasicMaterial
              color={ghost.valid ? '#22C55E' : '#EF4444'}
              transparent
              opacity={0.45}
              depthWrite={false}
            />
          </mesh>
          {/* Ghost volume silhouette */}
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry
              args={[
                Math.max(0.7, activeDef.footprint[0] - 0.1),
                1.6,
                Math.max(0.7, activeDef.footprint[1] - 0.1),
              ]}
            />
            <meshStandardMaterial
              color={ghost.valid ? '#22C55E' : '#EF4444'}
              transparent
              opacity={0.38}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
