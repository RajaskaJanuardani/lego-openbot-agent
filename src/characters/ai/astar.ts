import type { NavGraph } from './navGraph';

function heuristic(graph: NavGraph, aId: string, bId: string): number {
  const a = graph.nodes.get(aId);
  const b = graph.nodes.get(bId);
  if (!a || !b) return 0;
  return Math.hypot(
    a.position[0] - b.position[0],
    (a.position[1] - b.position[1]) * 1.2,
    a.position[2] - b.position[2]
  );
}

/**
 * Shortest-path A* over the multi-floor + outdoor navigation graph.
 * Returns ordered list of NavNode IDs from startId to goalId (inclusive), or [] if unreachable.
 */
export function findPathAStar(
  graph: NavGraph,
  startId: string,
  goalId: string
): string[] {
  if (startId === goalId) return [startId];
  const startNode = graph.nodes.get(startId);
  const goalNode = graph.nodes.get(goalId);
  if (!startNode || !goalNode || goalNode.disabled) return [];

  const openSet = new Set<string>([startId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startId, 0]]);
  const fScore = new Map<string, number>([[startId, heuristic(graph, startId, goalId)]]);

  while (openSet.size > 0) {
    let current: string | null = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = id;
      }
    }

    if (!current) break;
    if (current === goalId) {
      const path: string[] = [current];
      let cur = current;
      while (cameFrom.has(cur)) {
        cur = cameFrom.get(cur)!;
        path.push(cur);
      }
      return path.reverse();
    }

    openSet.delete(current);
    const neighbors = graph.edges.get(current) ?? [];

    for (const neighborId of neighbors) {
      const neighbor = graph.nodes.get(neighborId);
      if (!neighbor || (neighbor.disabled && neighborId !== goalId)) continue;

      const tentativeG = (gScore.get(current) ?? Infinity) + heuristic(graph, current, neighborId);
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG + heuristic(graph, neighborId, goalId));
        openSet.add(neighborId);
      }
    }
  }

  return [];
}
