import React, { createContext, useContext, useRef } from 'react';
import * as THREE from 'three';
import type { FloorLevel } from '../../types';
import { useFloorFade } from './useFloorFade';

const FloorContext = createContext<FloorLevel | 0>(0);

export function useCurrentFloor(): FloorLevel | 0 {
  return useContext(FloorContext);
}

export interface FloorGroupProps {
  level: FloorLevel;
  name?: string;
  children: React.ReactNode;
}

/**
 * Groups scene geometry per floor (`level={1 | 2}`) and smoothly fades Floor 2
 * to opacity 0.12 (no castShadow, no raycast blocking) when `floorViewMode === 'floor1'`.
 */
export const FloorGroup: React.FC<FloorGroupProps> = ({
  level,
  name,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  useFloorFade(groupRef, level);

  return (
    <FloorContext.Provider value={level}>
      <group ref={groupRef} name={name ?? `floor-group-${level}`}>
        {children}
      </group>
    </FloorContext.Provider>
  );
};
