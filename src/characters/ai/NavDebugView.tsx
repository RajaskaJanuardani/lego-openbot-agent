import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useUIStore } from '../../store/uiStore';
import { characterBrain } from './brain';
import type { NavNodeKind } from './navGraph';

const NODE_COLORS: Record<NavNodeKind, string> = {
  room: '#22C55E',
  outdoor: '#84CC16',
  door: '#38BDF8',
  stair: '#FACC15',
  sit: '#F472B6',
  work: '#A855F7',
  cook: '#FB923C',
  drink: '#06B6D4',
  wash: '#38BDF8',
  sleep: '#60A5FA',
  hammock: '#F43F5E',
  'watch-tv': '#8B5CF6',
  shower: '#0EA5E9',
  swim: '#0284C7',
  sunbathe: '#2DD4BF',
  hopscotch: '#EAB308',
  mirror: '#EC4899',
};

/**
 * Debug overlay toggled by pressing `G`: visualizes all navigation nodes
 * (color-coded by kind) and walkable edges across Floor 1, Floor 2, Stairs, and Outdoors.
 */
export const NavDebugView: React.FC = () => {
  const showNavDebug = useUIStore((s) => s.showNavDebug);
  const graphVersion = characterBrain.getGraphVersion();

  const { nodesList, lineGeometry } = useMemo(() => {
    const graph = characterBrain.graph;
    const nodes = Array.from(graph.nodes.values());
    const pts: number[] = [];
    const seen = new Set<string>();

    graph.edges.forEach((neighbors, fromId) => {
      const a = graph.nodes.get(fromId);
      if (!a || a.disabled) return;
      for (const toId of neighbors) {
        const key = fromId < toId ? `${fromId}|${toId}` : `${toId}|${fromId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const b = graph.nodes.get(toId);
        if (!b || b.disabled) continue;
        pts.push(a.position[0], a.position[1] + 0.35, a.position[2]);
        pts.push(b.position[0], b.position[1] + 0.35, b.position[2]);
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return { nodesList: nodes, lineGeometry: geo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphVersion, showNavDebug]);

  if (!showNavDebug) return null;

  return (
    <group name="nav-debug-overlay">
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.65} />
      </lineSegments>
      {nodesList.map((n) => (
        <mesh
          key={n.id}
          position={[n.position[0], n.position[1] + 0.35, n.position[2]]}
        >
          <sphereGeometry args={[n.disabled ? 0.14 : 0.22, 8, 8]} />
          <meshBasicMaterial
            color={n.disabled ? '#EF4444' : NODE_COLORS[n.kind]}
            transparent={n.disabled}
            opacity={n.disabled ? 0.45 : 0.95}
          />
        </mesh>
      ))}
    </group>
  );
};
