import {
  FLOOR1_Y,
  FLOOR2_Y,
  GROUND_Y,
  PLATE_H,
  STUDIO_WORKSTATIONS,
  getStairStepPoints,
} from '../../lib/constants';
import type { RoomId, Vec3 } from '../../types';

export type NavNodeKind =
  | 'room'
  | 'door'
  | 'stair'
  | 'outdoor'
  | 'sit'
  | 'work'
  | 'cook'
  | 'drink'
  | 'wash'
  | 'sleep'
  | 'hammock'
  | 'watch-tv'
  | 'shower'
  | 'swim'
  | 'sunbathe'
  | 'hopscotch'
  | 'mirror';

export interface NavNode {
  id: string;
  position: Vec3;
  floor: 0 | 1 | 2;
  roomId: RoomId;
  kind: NavNodeKind;
  facingY?: number;
  seatOffsetY?: number;
  narrow?: boolean;
  disabled?: boolean;
  /** Optional asset instance id if created dynamically by Build Mode */
  assetInstanceId?: string;
}

export interface NavGraph {
  nodes: Map<string, NavNode>;
  edges: Map<string, string[]>;
}

export interface DynamicObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floor: 0 | 1 | 2;
  interactionPoint?: {
    position: Vec3;
    kind:
      | 'sit'
      | 'work'
      | 'cook'
      | 'drink'
      | 'wash'
      | 'sleep'
      | 'hammock'
      | 'watch-tv'
      | 'shower'
      | 'sunbathe';
    facingY: number;
    seatOffsetY?: number;
    roomId: RoomId;
  };
}

function addNode(graph: NavGraph, node: NavNode) {
  graph.nodes.set(node.id, node);
  if (!graph.edges.has(node.id)) {
    graph.edges.set(node.id, []);
  }
}

function connect(graph: NavGraph, a: string, b: string) {
  if (!graph.nodes.has(a) || !graph.nodes.has(b)) return;
  const ea = graph.edges.get(a)!;
  const eb = graph.edges.get(b)!;
  if (!ea.includes(b)) ea.push(b);
  if (!eb.includes(a)) eb.push(a);
}

/**
 * Builds the complete multi-floor + outdoor + sea navigation graph with rich
 * asset-aligned interaction spots (fridge drink, stove cooking, sink/laundry washing,
 * beds sleeping, white hammock swinging, vanity mirror, Floor 1 TV watching,
 * glass shower bathing, chairs/sofas sitting, engklek hopscotch, beach lounge sunbathing,
 * tropical sea swimming, and 6 Studio agent workstations).
 */
export function buildNavGraph(dynamicObstacles: DynamicObstacle[] = []): NavGraph {
  const graph: NavGraph = {
    nodes: new Map(),
    edges: new Map(),
  };

  const F2 = FLOOR2_Y; // 7.6
  const F1 = FLOOR1_Y; // 0.4
  const PORCH_Y = GROUND_Y + PLATE_H; // 0.4
  const OUT = GROUND_Y; // 0.0

  // =========================================================================
  // 1. FLOOR 2 NODES
  // =========================================================================
  const f2Nodes: NavNode[] = [
    // Kitchen (stove cooking, silver fridge drinking, sink washing, breakfast chair sitting)
    { id: 'f2-kitchen-center', position: [-10.5, F2, -6.2], floor: 2, roomId: 'kitchen', kind: 'room' },
    { id: 'f2-kitchen-cook', position: [-7.7, F2, -8.8], floor: 2, roomId: 'kitchen', kind: 'cook', facingY: Math.PI },
    { id: 'f2-kitchen-sink', position: [-11.65, F2, -8.8], floor: 2, roomId: 'kitchen', kind: 'wash', facingY: Math.PI },
    { id: 'f2-kitchen-fridge', position: [-12.6, F2, -2.9], floor: 2, roomId: 'kitchen', kind: 'drink', facingY: -Math.PI / 2 },
    { id: 'f2-kitchen-chair', position: [-8.1, F2, -4.25], floor: 2, roomId: 'kitchen', kind: 'sit', facingY: 0, seatOffsetY: 0.74 },
    { id: 'f2-kitchen-east-door', position: [-6.0, F2, -0.5], floor: 2, roomId: 'kitchen', kind: 'door', narrow: true },
    { id: 'f2-kitchen-south-door', position: [-11.0, F2, 1.0], floor: 2, roomId: 'kitchen', kind: 'door', narrow: true },

    // Left Terrace (engklek hopscotch + balcony view)
    { id: 'f2-lterrace-north', position: [-11.0, F2, 3.2], floor: 2, roomId: 'terraces', kind: 'room' },
    { id: 'f2-lterrace-engklek', position: [-10.5, F2, 6.8], floor: 2, roomId: 'terraces', kind: 'hopscotch', facingY: 0 },
    { id: 'f2-lterrace-view', position: [-13.2, F2, 9.2], floor: 2, roomId: 'terraces', kind: 'room', facingY: -0.7 },
    { id: 'f2-lterrace-arch-door', position: [-6.0, F2, 9.5], floor: 2, roomId: 'terraces', kind: 'door', narrow: true },

    // Master Bedroom (canopy bed horizontal sleeping!)
    { id: 'f2-bedroom-center', position: [-1.0, F2, -4.0], floor: 2, roomId: 'bedroom', kind: 'room' },
    { id: 'f2-bedroom-sleep', position: [-1.0, F2, -7.65], floor: 2, roomId: 'bedroom', kind: 'sleep', facingY: 0, seatOffsetY: 1.70 },
    { id: 'f2-bedroom-door', position: [1.0, F2, -2.0], floor: 2, roomId: 'bedroom', kind: 'door', narrow: true },

    // Expanded Stair Room (Floor 2)
    { id: 'f2-stair-north-west', position: [-3.2, F2, 0.2], floor: 2, roomId: 'stair-room', kind: 'room' },
    { id: 'f2-stair-north-east', position: [1.0, F2, 0.5], floor: 2, roomId: 'stair-room', kind: 'room' },
    { id: 'f2-stair-east-hall', position: [0.8, F2, 5.5], floor: 2, roomId: 'stair-room', kind: 'room' },
    { id: 'f2-stair-south-hall', position: [-2.5, F2, 10.4], floor: 2, roomId: 'stair-room', kind: 'room' },
    { id: 'f2-stair-living-door', position: [3.0, F2, 5.5], floor: 2, roomId: 'stair-room', kind: 'door', narrow: true },

    // Dressing Room (white fabric hammock lounging + carved vanity mirror!)
    { id: 'f2-dressing-center', position: [10.0, F2, -6.0], floor: 2, roomId: 'dressing-room', kind: 'room' },
    { id: 'f2-dressing-hammock', position: [7.2, F2, -8.6], floor: 2, roomId: 'dressing-room', kind: 'hammock', facingY: 0.24 + Math.PI / 2, seatOffsetY: 1.24 },
    { id: 'f2-dressing-vanity', position: [12.9, F2, -7.0], floor: 2, roomId: 'dressing-room', kind: 'mirror', facingY: Math.PI / 2, seatOffsetY: 0.72 },
    { id: 'f2-dressing-door', position: [10.0, F2, -2.0], floor: 2, roomId: 'dressing-room', kind: 'door', narrow: true },

    // Living Room & Dining Area (sofa, rattan armchair, dining chair)
    { id: 'f2-living-center', position: [7.5, F2, 4.8], floor: 2, roomId: 'living-room', kind: 'room' },
    { id: 'f2-living-north', position: [9.8, F2, 0.2], floor: 2, roomId: 'living-room', kind: 'room' },
    { id: 'f2-living-sofa', position: [7.5, F2, 0.0], floor: 2, roomId: 'living-room', kind: 'sit', facingY: 0, seatOffsetY: 0.85 },
    { id: 'f2-living-armchair', position: [4.85, F2, 2.5], floor: 2, roomId: 'living-room', kind: 'sit', facingY: Math.PI * 0.36, seatOffsetY: 0.75 },
    { id: 'f2-dining-center', position: [7.5, F2, 6.8], floor: 2, roomId: 'dining-area', kind: 'room' },
    { id: 'f2-dining-sit', position: [9.3, F2, 8.6], floor: 2, roomId: 'dining-area', kind: 'sit', facingY: -Math.PI / 2, seatOffsetY: 0.72 },
    { id: 'f2-rterrace-door', position: [12.0, F2, 5.5], floor: 2, roomId: 'living-room', kind: 'door', narrow: true },

    // Right Terrace (plastic chair sitting + balcony view)
    { id: 'f2-rterrace-mid', position: [14.0, F2, 5.2], floor: 2, roomId: 'terraces', kind: 'room' },
    { id: 'f2-rterrace-chair', position: [14.1, F2, 2.5], floor: 2, roomId: 'terraces', kind: 'sit', facingY: -Math.PI / 2, seatOffsetY: 0.72 },
    { id: 'f2-rterrace-south', position: [14.0, F2, 9.8], floor: 2, roomId: 'terraces', kind: 'room', facingY: 0.4 },
  ];
  f2Nodes.forEach((n) => addNode(graph, n));

  // Floor 2 edges
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-cook');
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-sink');
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-fridge');
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-chair');
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-east-door');
  connect(graph, 'f2-kitchen-center', 'f2-kitchen-south-door');
  connect(graph, 'f2-kitchen-east-door', 'f2-stair-north-west');
  connect(graph, 'f2-kitchen-south-door', 'f2-lterrace-north');

  connect(graph, 'f2-lterrace-north', 'f2-lterrace-engklek');
  connect(graph, 'f2-lterrace-engklek', 'f2-lterrace-view');
  connect(graph, 'f2-lterrace-engklek', 'f2-lterrace-arch-door');
  connect(graph, 'f2-lterrace-arch-door', 'f2-stair-south-hall');

  connect(graph, 'f2-bedroom-sleep', 'f2-bedroom-center');
  connect(graph, 'f2-bedroom-center', 'f2-bedroom-door');
  connect(graph, 'f2-bedroom-door', 'f2-stair-north-east');

  connect(graph, 'f2-stair-north-west', 'f2-stair-north-east');
  connect(graph, 'f2-stair-north-east', 'f2-stair-east-hall');
  connect(graph, 'f2-stair-east-hall', 'f2-stair-south-hall');
  connect(graph, 'f2-stair-east-hall', 'f2-stair-living-door');

  connect(graph, 'f2-stair-living-door', 'f2-living-center');
  connect(graph, 'f2-living-center', 'f2-living-north');
  connect(graph, 'f2-living-center', 'f2-living-armchair');
  connect(graph, 'f2-living-north', 'f2-living-sofa');
  connect(graph, 'f2-living-north', 'f2-dressing-door');
  connect(graph, 'f2-dressing-door', 'f2-dressing-center');
  connect(graph, 'f2-dressing-center', 'f2-dressing-vanity');
  connect(graph, 'f2-dressing-center', 'f2-dressing-hammock');

  connect(graph, 'f2-living-center', 'f2-dining-center');
  connect(graph, 'f2-dining-center', 'f2-dining-sit');
  connect(graph, 'f2-living-center', 'f2-rterrace-door');
  connect(graph, 'f2-dining-center', 'f2-rterrace-door');
  connect(graph, 'f2-rterrace-door', 'f2-rterrace-mid');
  connect(graph, 'f2-rterrace-mid', 'f2-rterrace-chair');
  connect(graph, 'f2-rterrace-mid', 'f2-rterrace-south');

  // =========================================================================
  // 2. CONNECTING 12-STEP STAIRCASE CHAIN (Exact step heights 7.6 -> 0.4)
  // =========================================================================
  const stairPts = getStairStepPoints();
  let prevStairId: string | null = null;
  for (let i = 0; i < stairPts.length; i++) {
    const pt = stairPts[i];
    const id = i === 0 ? 'stair-top' : i === stairPts.length - 1 ? 'stair-bottom' : `stair-step-${pt.index}`;
    const floor: 1 | 2 = pt.position[1] >= 4.0 ? 2 : 1;
    addNode(graph, {
      id,
      position: pt.position,
      floor,
      roomId: floor === 2 ? 'stair-room' : 'stair-hall-1',
      kind: 'stair',
      narrow: true,
    });
    if (prevStairId) {
      connect(graph, prevStairId, id);
    }
    prevStairId = id;
  }
  connect(graph, 'stair-top', 'f2-stair-north-west');
  connect(graph, 'stair-top', 'f2-stair-north-east');

  // =========================================================================
  // 3. FLOOR 1 NODES
  // =========================================================================
  const f1Nodes: NavNode[] = [
    // Stair Hall 1 & Central Hallway
    { id: 'f1-stair-south', position: [-2.5, F1, 10.3], floor: 1, roomId: 'stair-hall-1', kind: 'room' },
    { id: 'f1-stair-west', position: [-4.7, F1, 6.0], floor: 1, roomId: 'stair-hall-1', kind: 'room' },
    { id: 'f1-hall-center', position: [-1.5, F1, -0.5], floor: 1, roomId: 'stair-hall-1', kind: 'room' },
    { id: 'f1-hall-east-pass', position: [0.4, F1, 7.6], floor: 1, roomId: 'stair-hall-1', kind: 'room' },

    // Doorways on Floor 1
    { id: 'f1-guest-door', position: [-5.0, F1, -1.0], floor: 1, roomId: 'guest-room', kind: 'door', narrow: true },
    { id: 'f1-bath-door', position: [-1.0, F1, -3.0], floor: 1, roomId: 'bathroom-1', kind: 'door', narrow: true },
    { id: 'f1-laundry-door', position: [-6.0, F1, 6.0], floor: 1, roomId: 'laundry', kind: 'door', narrow: true },
    { id: 'f1-studio-west-door', position: [2.0, F1, -0.5], floor: 1, roomId: 'studio', kind: 'door', narrow: true },
    { id: 'f1-studio-south-door', position: [6.5, F1, 3.0], floor: 1, roomId: 'studio', kind: 'door', narrow: true },
    { id: 'f1-main-door', position: [0.0, F1, 11.4], floor: 1, roomId: 'foyer', kind: 'door', narrow: true },

    // Guest Room (Floor 1 single bed horizontal sleeping!)
    { id: 'f1-guest-center', position: [-9.2, F1, -3.2], floor: 1, roomId: 'guest-room', kind: 'room' },
    { id: 'f1-guest-sleep', position: [-11.8, F1, -7.8], floor: 1, roomId: 'guest-room', kind: 'sleep', facingY: 0, seatOffsetY: 1.36 },

    // Bathroom 1 (walk-in glass shower bathing + sink!)
    { id: 'f1-bath-center', position: [-1.8, F1, -6.2], floor: 1, roomId: 'bathroom-1', kind: 'room' },
    { id: 'f1-bath-shower', position: [0.35, F1 + 0.22, -9.1], floor: 1, roomId: 'bathroom-1', kind: 'shower', facingY: -Math.PI / 2 },

    // Laundry (front-loading washer activity!)
    { id: 'f1-laundry-center', position: [-8.5, F1, 5.5], floor: 1, roomId: 'laundry', kind: 'room' },
    { id: 'f1-laundry-washer', position: [-13.2, F1, 4.0], floor: 1, roomId: 'laundry', kind: 'wash', facingY: Math.PI },

    // Studio / Ruang Kerja Agent
    { id: 'f1-studio-aisle-west', position: [4.8, F1, -0.5], floor: 1, roomId: 'studio', kind: 'room' },
    { id: 'f1-studio-aisle-mid', position: [8.4, F1, -0.5], floor: 1, roomId: 'studio', kind: 'room' },
    { id: 'f1-studio-aisle-east', position: [12.0, F1, -0.5], floor: 1, roomId: 'studio', kind: 'room' },
    { id: 'f1-studio-mid-west', position: [4.8, F1, -5.8], floor: 1, roomId: 'studio', kind: 'room' },
    { id: 'f1-studio-mid-center', position: [8.4, F1, -5.8], floor: 1, roomId: 'studio', kind: 'room' },
    { id: 'f1-studio-mid-east', position: [12.0, F1, -5.8], floor: 1, roomId: 'studio', kind: 'room' },

    // Foyer / Ruang Tamu Depan (Sofa & Armchair watching the new LEGO TV!)
    { id: 'f1-foyer-entry', position: [0.0, F1, 10.1], floor: 1, roomId: 'foyer', kind: 'room' },
    { id: 'f1-foyer-center', position: [6.5, F1, 7.6], floor: 1, roomId: 'foyer', kind: 'room' },
    { id: 'f1-foyer-sofa', position: [10.8, F1, 4.6], floor: 1, roomId: 'foyer', kind: 'watch-tv', facingY: 0, seatOffsetY: 0.85 },
    { id: 'f1-foyer-armchair', position: [13.5, F1, 7.6], floor: 1, roomId: 'foyer', kind: 'watch-tv', facingY: -Math.PI * 0.65, seatOffsetY: 0.75 },
  ];
  f1Nodes.forEach((n) => addNode(graph, n));

  // Add all 6 Studio Agent Workstations from STUDIO_WORKSTATIONS (strictly for OpenBot working!)
  STUDIO_WORKSTATIONS.forEach((ws, idx) => {
    const nodeId = `studio-${ws.id}`;
    addNode(graph, {
      id: nodeId,
      position: ws.chairPosition,
      floor: 1,
      roomId: 'studio',
      kind: 'work',
      facingY: ws.facingY,
      seatOffsetY: 0.78,
    });
    if (idx === 0) connect(graph, nodeId, 'f1-studio-mid-west');
    else if (idx === 1) connect(graph, nodeId, 'f1-studio-mid-center');
    else if (idx === 2) connect(graph, nodeId, 'f1-studio-mid-east');
    else if (idx === 3) connect(graph, nodeId, 'f1-studio-aisle-west');
    else if (idx === 4) connect(graph, nodeId, 'f1-studio-aisle-mid');
    else connect(graph, nodeId, 'f1-studio-aisle-east');
  });

  // Floor 1 edges
  connect(graph, 'stair-bottom', 'f1-stair-south');
  connect(graph, 'f1-stair-south', 'f1-foyer-entry');
  connect(graph, 'f1-stair-south', 'f1-stair-west');
  connect(graph, 'f1-stair-west', 'f1-laundry-door');
  connect(graph, 'f1-stair-west', 'f1-hall-center');
  connect(graph, 'f1-hall-center', 'f1-guest-door');
  connect(graph, 'f1-hall-center', 'f1-bath-door');
  connect(graph, 'f1-hall-center', 'f1-studio-west-door');
  connect(graph, 'f1-hall-east-pass', 'f1-foyer-entry');
  connect(graph, 'f1-hall-east-pass', 'f1-foyer-center');
  connect(graph, 'f1-hall-east-pass', 'f1-hall-center');

  connect(graph, 'f1-guest-door', 'f1-guest-center');
  connect(graph, 'f1-guest-center', 'f1-guest-sleep');
  connect(graph, 'f1-bath-door', 'f1-bath-center');
  connect(graph, 'f1-bath-center', 'f1-bath-shower');
  connect(graph, 'f1-laundry-door', 'f1-laundry-center');
  connect(graph, 'f1-laundry-center', 'f1-laundry-washer');

  connect(graph, 'f1-studio-west-door', 'f1-studio-aisle-west');
  connect(graph, 'f1-studio-aisle-west', 'f1-studio-aisle-mid');
  connect(graph, 'f1-studio-aisle-mid', 'f1-studio-aisle-east');
  connect(graph, 'f1-studio-aisle-west', 'f1-studio-mid-west');
  connect(graph, 'f1-studio-aisle-mid', 'f1-studio-mid-center');
  connect(graph, 'f1-studio-aisle-east', 'f1-studio-mid-east');
  connect(graph, 'f1-studio-mid-west', 'f1-studio-mid-center');
  connect(graph, 'f1-studio-mid-center', 'f1-studio-mid-east');
  connect(graph, 'f1-studio-aisle-west', 'f1-studio-south-door');
  connect(graph, 'f1-studio-aisle-mid', 'f1-studio-south-door');

  connect(graph, 'f1-studio-south-door', 'f1-foyer-center');
  connect(graph, 'f1-foyer-center', 'f1-foyer-sofa');
  connect(graph, 'f1-foyer-center', 'f1-foyer-armchair');
  connect(graph, 'f1-foyer-entry', 'f1-main-door');

  // =========================================================================
  // 4. FRONT PORCH, YARD, BEACH & SEA SWIMMING NODES
  // =========================================================================
  const outdoorNodes: NavNode[] = [
    { id: 'out-porch-center', position: [0.0, PORCH_Y, 13.5], floor: 0, roomId: 'front-porch', kind: 'outdoor' },
    { id: 'out-porch-left', position: [-9.5, PORCH_Y, 13.8], floor: 0, roomId: 'front-porch', kind: 'outdoor' },
    { id: 'out-porch-chair-left', position: [-12.2, PORCH_Y, 13.3], floor: 0, roomId: 'front-porch', kind: 'sit', facingY: 0.45, seatOffsetY: 0.74 },
    { id: 'out-porch-right', position: [9.5, PORCH_Y, 13.8], floor: 0, roomId: 'front-porch', kind: 'outdoor' },
    { id: 'out-porch-chair-right', position: [7.4, PORCH_Y, 13.3], floor: 0, roomId: 'front-porch', kind: 'sit', facingY: 0.35, seatOffsetY: 0.74 },
    { id: 'out-step', position: [0.0, OUT, 16.2], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-path-south', position: [0.0, OUT, 19.6], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-garden-left', position: [-13.0, OUT, 18.5], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-sand-west', position: [-20.0, OUT, 8.0], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-garden-right', position: [12.5, OUT, 18.2], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-yard-east', position: [18.5, OUT, 13.5], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-tuktuk', position: [18.4, OUT, 7.6], floor: 0, roomId: 'outdoor-tuktuk', kind: 'outdoor', facingY: Math.PI / 2 },
    { id: 'out-yard-north', position: [18.5, OUT, 2.5], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-lounge-chair', position: [21.0, OUT, -1.5], floor: 0, roomId: 'outdoor-beach', kind: 'sunbathe', facingY: -1.25, seatOffsetY: 1.22 },
    { id: 'out-beach-shore', position: [16.5, OUT, -6.5], floor: 0, roomId: 'outdoor-beach', kind: 'outdoor', facingY: 0.8 },
    { id: 'out-beach-sand', position: [11.5, OUT, -14.5], floor: 0, roomId: 'outdoor-beach', kind: 'outdoor', facingY: 1.2 },
    // Swimming nodes out in the animated blue LEGO sea!
    { id: 'out-sea-swim-1', position: [20.2, OUT - 0.18, -13.2], floor: 0, roomId: 'outdoor-beach', kind: 'swim', facingY: 0.85 },
    { id: 'out-sea-swim-2', position: [23.8, OUT - 0.18, -18.2], floor: 0, roomId: 'outdoor-beach', kind: 'swim', facingY: -2.2 },
    { id: 'out-back-sand', position: [-2.0, OUT, -16.0], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
    { id: 'out-west-back', position: [-19.5, OUT, -10.0], floor: 0, roomId: 'outdoor-yard', kind: 'outdoor' },
  ];
  outdoorNodes.forEach((n) => addNode(graph, n));

  connect(graph, 'f1-main-door', 'out-porch-center');
  connect(graph, 'out-porch-center', 'out-porch-left');
  connect(graph, 'out-porch-left', 'out-porch-chair-left');
  connect(graph, 'out-porch-center', 'out-porch-right');
  connect(graph, 'out-porch-right', 'out-porch-chair-right');
  connect(graph, 'out-porch-center', 'out-step');
  connect(graph, 'out-step', 'out-path-south');
  connect(graph, 'out-path-south', 'out-garden-left');
  connect(graph, 'out-garden-left', 'out-sand-west');
  connect(graph, 'out-sand-west', 'out-west-back');
  connect(graph, 'out-west-back', 'out-back-sand');
  connect(graph, 'out-back-sand', 'out-beach-sand');
  connect(graph, 'out-path-south', 'out-garden-right');
  connect(graph, 'out-garden-right', 'out-yard-east');
  connect(graph, 'out-yard-east', 'out-tuktuk');
  connect(graph, 'out-tuktuk', 'out-yard-north');
  connect(graph, 'out-yard-north', 'out-lounge-chair');
  connect(graph, 'out-yard-north', 'out-beach-shore');
  connect(graph, 'out-beach-shore', 'out-beach-sand');
  connect(graph, 'out-beach-shore', 'out-sea-swim-1');
  connect(graph, 'out-beach-sand', 'out-sea-swim-1');
  connect(graph, 'out-sea-swim-1', 'out-sea-swim-2');

  // =========================================================================
  // 5. APPLY DYNAMIC BUILD-MODE OBSTACLES & INTERACTION POINTS
  // =========================================================================
  if (dynamicObstacles.length > 0) {
    graph.nodes.forEach((node) => {
      if (node.kind === 'door' || node.kind === 'stair') return;
      for (const obs of dynamicObstacles) {
        if (obs.floor !== node.floor) continue;
        const [nx, , nz] = node.position;
        if (
          nx >= obs.minX - 0.35 &&
          nx <= obs.maxX + 0.35 &&
          nz >= obs.minZ - 0.35 &&
          nz <= obs.maxZ + 0.35
        ) {
          node.disabled = true;
          break;
        }
      }
    });

    for (const obs of dynamicObstacles) {
      if (!obs.interactionPoint) continue;
      const ip = obs.interactionPoint;
      const newId = `custom-ip-${obs.id}`;
      addNode(graph, {
        id: newId,
        position: ip.position,
        floor: obs.floor,
        roomId: ip.roomId,
        kind: ip.kind,
        facingY: ip.facingY,
        seatOffsetY: ip.seatOffsetY,
        assetInstanceId: obs.id,
      });

      let bestId: string | null = null;
      let bestDist = Infinity;
      graph.nodes.forEach((cand) => {
        if (cand.id === newId || cand.disabled || cand.floor !== obs.floor) return;
        const d = Math.hypot(
          cand.position[0] - ip.position[0],
          cand.position[2] - ip.position[2]
        );
        if (d < bestDist) {
          bestDist = d;
          bestId = cand.id;
        }
      });
      if (bestId && bestDist < 12) {
        connect(graph, newId, bestId);
      }
    }
  }

  return graph;
}

/** Finds the closest walkable node in the graph to a world position */
export function findNearestNavNode(graph: NavGraph, pos: Vec3): NavNode | null {
  let best: NavNode | null = null;
  let bestDist = Infinity;
  graph.nodes.forEach((node) => {
    if (node.disabled) return;
    const dy = (node.position[1] - pos[1]) * 2.5;
    const d = Math.hypot(node.position[0] - pos[0], dy, node.position[2] - pos[2]);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  });
  return best;
}
