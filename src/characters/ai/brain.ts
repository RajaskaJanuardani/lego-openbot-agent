import type { CharacterId, PersonalityType, RoomId, Vec3 } from '../../types';
import type { CharacterActivity } from '../../lib/characterRuntime';
import { characterRuntimeMap, detectRoomFromPosition } from '../../lib/characterRuntime';
import { findPathAStar } from './astar';
import { ConversationManager, type ChatCandidate } from './conversations';
import {
  buildNavGraph,
  findNearestNavNode,
  type DynamicObstacle,
  type NavGraph,
  type NavNode,
} from './navGraph';

export type BrainPhase = 'idle' | 'walking' | 'activity' | 'chatting';

export interface BrainCharacterInput {
  id: CharacterId;
  name: string;
  role: string;
  personality: PersonalityType;
  favoriteRoom: RoomId;
  startPosition: Vec3;
  walkSpeed?: number;
  /** From OpenBot integration: 'working' forces character to Studio workstation! */
  agentStatus?: 'working' | 'idle' | null;
  lastAgentTask?: string | null;
}

export interface BrainCharacterState {
  id: CharacterId;
  phase: BrainPhase;
  activity: CharacterActivity;
  position: Vec3;
  rotationY: number;
  path: string[];
  pathIndex: number;
  targetNodeId: string | null;
  reservedNodeId: string | null;
  reservedNarrowId: string | null;
  timer: number;
  waitYieldTimer: number;
  seatOffsetY: number;
  isMoving: boolean;
  isWorkingAtDesk: boolean;
  wasAgentWorking: boolean;
  speechText: string | null;
  roomId: RoomId;
}

/**
 * Multi-character AI Brain:
 * - Ticks decision / pathfinding / reservations / conversations at 10 Hz
 * - Interpolates smooth walking, stair climbing, turns, and separation steering at 60 fps
 */
export class CharacterAIBrain {
  public graph: NavGraph;
  public states = new Map<CharacterId, BrainCharacterState>();
  private conversations = new ConversationManager();
  private reservedInteractionNodes = new Map<string, CharacterId>();
  private reservedNarrowNodes = new Map<string, CharacterId>();
  private clock = 0;
  private tickAccum = 0;
  private graphVersion = 0;

  constructor() {
    this.graph = buildNavGraph();
  }

  getGraphVersion(): number {
    return this.graphVersion;
  }

  rebuildGraph(obstacles: DynamicObstacle[]): void {
    this.graph = buildNavGraph(obstacles);
    this.graphVersion += 1;
    // Clear obsolete reservations or paths referencing removed/disabled nodes
    this.states.forEach((st) => {
      if (st.reservedNodeId) {
        const node = this.graph.nodes.get(st.reservedNodeId);
        if (!node || node.disabled) {
          this.releaseInteractionNode(st);
          st.phase = 'idle';
          st.timer = 0.5;
        }
      }
      if (st.phase === 'walking' && st.targetNodeId) {
        const nearest = findNearestNavNode(this.graph, st.position);
        const goal = this.graph.nodes.get(st.targetNodeId);
        if (nearest && goal && !goal.disabled) {
          st.path = findPathAStar(this.graph, nearest.id, goal.id);
          st.pathIndex = 0;
        } else {
          st.path = [];
          st.phase = 'idle';
          st.timer = 0.5;
        }
      }
    });
  }

  ensureCharacters(inputs: BrainCharacterInput[]): void {
    const activeIds = new Set(inputs.map((i) => i.id));
    // Remove deleted characters
    for (const id of Array.from(this.states.keys())) {
      if (!activeIds.has(id)) {
        const st = this.states.get(id)!;
        this.releaseInteractionNode(st);
        this.releaseNarrowNode(st);
        this.conversations.leaveConversation(id, this.clock);
        this.states.delete(id);
        characterRuntimeMap.delete(id);
      }
    }

    // Add newly created characters
    inputs.forEach((inp, idx) => {
      if (!this.states.has(inp.id)) {
        const pos: Vec3 = [...inp.startPosition];
        const roomId = detectRoomFromPosition(pos);
        const state: BrainCharacterState = {
          id: inp.id,
          phase: 'idle',
          activity: 'idle',
          position: pos,
          rotationY: 0,
          path: [],
          pathIndex: 0,
          targetNodeId: null,
          reservedNodeId: null,
          reservedNarrowId: null,
          timer: 1.2 + idx * 0.9,
          waitYieldTimer: 0,
          seatOffsetY: 0,
          isMoving: false,
          isWorkingAtDesk: false,
          wasAgentWorking: false,
          speechText: null,
          roomId,
        };
        this.states.set(inp.id, state);
        this.syncRuntimeSnapshot(state);
      }
    });
  }

  private releaseInteractionNode(st: BrainCharacterState): void {
    if (st.reservedNodeId && this.reservedInteractionNodes.get(st.reservedNodeId) === st.id) {
      this.reservedInteractionNodes.delete(st.reservedNodeId);
    }
    st.reservedNodeId = null;
  }

  private releaseNarrowNode(st: BrainCharacterState): void {
    if (st.reservedNarrowId && this.reservedNarrowNodes.get(st.reservedNarrowId) === st.id) {
      this.reservedNarrowNodes.delete(st.reservedNarrowId);
    }
    st.reservedNarrowId = null;
  }

  private pickDestination(inp: BrainCharacterInput, st: BrainCharacterState): NavNode | null {
    const candidates: Array<{ node: NavNode; weight: number }> = [];

    this.graph.nodes.forEach((node) => {
      // Work desks are strictly reserved for characters whose OpenBot agent status is 'working'
      if (
        node.disabled ||
        node.kind === 'door' ||
        node.kind === 'stair' ||
        node.kind === 'work'
      ) {
        return;
      }

      // Respect exclusive interaction points (sofas, chairs, beds, hammock, shower, fridge, stove, TV, beach chair)
      const isInteractive =
        node.kind === 'sit' ||
        node.kind === 'sleep' ||
        node.kind === 'hammock' ||
        node.kind === 'watch-tv' ||
        node.kind === 'shower' ||
        node.kind === 'drink' ||
        node.kind === 'cook' ||
        node.kind === 'wash' ||
        node.kind === 'mirror' ||
        node.kind === 'hopscotch' ||
        node.kind === 'sunbathe';
      if (isInteractive) {
        const holder = this.reservedInteractionNodes.get(node.id);
        if (holder && holder !== st.id) return;
      }

      // Avoid picking the exact spot we're already standing at
      const d = Math.hypot(
        node.position[0] - st.position[0],
        node.position[2] - st.position[2]
      );
      if (d < 1.5 && Math.abs(node.position[1] - st.position[1]) < 1.0) return;

      let weight = 1.0;

      // Boost fun asset interactions so characters visibly drink, cook, sleep, swing, watch TV, shower, sit & swim!
      if (
        node.kind === 'drink' ||
        node.kind === 'cook' ||
        node.kind === 'sleep' ||
        node.kind === 'hammock' ||
        node.kind === 'watch-tv' ||
        node.kind === 'shower' ||
        node.kind === 'swim' ||
        node.kind === 'sit' ||
        node.kind === 'hopscotch' ||
        node.kind === 'sunbathe' ||
        node.kind === 'mirror'
      ) {
        weight += 1.65;
      }

      // Favorite room preference
      if (node.roomId === inp.favoriteRoom) weight += 3.2;

      // Role affinities (still allows visiting ANY room / floor / outdoor!)
      const roleLower = inp.role.toLowerCase();
      if (roleLower.includes('koki') && node.roomId === 'kitchen') weight += 3.0;
      if (roleLower.includes('turis') && (node.roomId === 'outdoor-beach' || node.roomId === 'outdoor-tuktuk' || node.roomId === 'terraces')) {
        weight += 3.2;
      }
      if (roleLower.includes('gamer') && (node.roomId === 'living-room' || node.roomId === 'studio')) {
        weight += 2.6;
      }
      if (roleLower.includes('kebaya') && (node.roomId === 'dressing-room' || node.roomId === 'foyer')) {
        weight += 2.6;
      }

      // Personality affinities
      if (inp.personality === 'diligent' && node.roomId === 'studio') weight += 2.0;
      if (inp.personality === 'relaxed' && (node.kind === 'sit' || node.kind === 'sunbathe' || node.kind === 'sleep')) {
        weight += 2.2;
      }
      if (inp.personality === 'chatty' && (node.roomId === 'living-room' || node.roomId === 'foyer' || node.roomId === 'terraces')) {
        weight += 2.2;
      }
      if (inp.personality === 'shy' && (node.roomId === 'bedroom' || node.roomId === 'guest-room' || node.roomId === 'dressing-room')) {
        weight += 2.0;
      }

      // Encourage multi-floor & outdoor exploration!
      if (node.floor === 1 || node.floor === 0) weight += 0.65;

      candidates.push({ node, weight });
    });

    if (candidates.length === 0) return null;
    const total = candidates.reduce((acc, c) => acc + c.weight, 0);
    let r = Math.random() * total;
    for (const c of candidates) {
      r -= c.weight;
      if (r <= 0) return c.node;
    }
    return candidates[candidates.length - 1].node;
  }

  private pickEmptyStudioDesk(st: BrainCharacterState): NavNode | null {
    const workNodes: NavNode[] = [];
    this.graph.nodes.forEach((n) => {
      if (n.kind === 'work' && !n.disabled) {
        const holder = this.reservedInteractionNodes.get(n.id);
        if (!holder || holder === st.id) {
          workNodes.push(n);
        }
      }
    });
    if (workNodes.length === 0) return null;
    // Prefer already-reserved desk if we hold one
    const mine = workNodes.find((n) => n.id === st.reservedNodeId);
    return mine ?? workNodes[0];
  }

  private startWalkingTo(st: BrainCharacterState, dest: NavNode): boolean {
    const startNode = findNearestNavNode(this.graph, st.position);
    if (!startNode) return false;

    const path = findPathAStar(this.graph, startNode.id, dest.id);
    if (path.length === 0) return false;

    this.releaseInteractionNode(st);
    if (
      dest.kind === 'sit' ||
      dest.kind === 'work' ||
      dest.kind === 'sleep' ||
      dest.kind === 'hammock' ||
      dest.kind === 'watch-tv' ||
      dest.kind === 'shower' ||
      dest.kind === 'drink' ||
      dest.kind === 'cook' ||
      dest.kind === 'wash' ||
      dest.kind === 'mirror' ||
      dest.kind === 'hopscotch' ||
      dest.kind === 'sunbathe'
    ) {
      this.reservedInteractionNodes.set(dest.id, st.id);
      st.reservedNodeId = dest.id;
    }

    st.phase = 'walking';
    st.activity = 'walking';
    st.seatOffsetY = 0;
    st.isWorkingAtDesk = false;
    st.targetNodeId = dest.id;
    st.path = path;
    st.pathIndex = 0;
    return true;
  }

  /** Called every render frame; runs 10 Hz AI decision tick + 60 fps smooth movement */
  step(delta: number, inputs: BrainCharacterInput[], paused: boolean): void {
    this.ensureCharacters(inputs);
    if (paused) {
      // Freeze characters smoothly in place during Build Mode
      this.states.forEach((st) => {
        st.isMoving = false;
      });
      return;
    }

    const dt = Math.min(delta, 0.05);
    this.clock += dt;
    this.tickAccum += dt;

    const inputMap = new Map(inputs.map((i) => [i.id, i]));

    // =======================================================================
    // 10 Hz AI STATE MACHINE & CONVERSATIONS TICK
    // =======================================================================
    if (this.tickAccum >= 0.1) {
      const tickDt = this.tickAccum;
      this.tickAccum = 0;

      // Build chat candidates (working agents NEVER chat!)
      const chatCandidates: ChatCandidate[] = [];
      for (const inp of inputs) {
        const st = this.states.get(inp.id);
        if (!st) continue;
        const isWorking = inp.agentStatus === 'working';
        const isOnStairs = st.roomId === 'stair-room' && st.position[1] < 7.2 && st.position[1] > 0.8;
        const canChat =
          !isWorking &&
          !isOnStairs &&
          (st.phase === 'idle' || st.phase === 'walking' || st.phase === 'chatting');

        chatCandidates.push({
          id: inp.id,
          name: inp.name,
          role: inp.role,
          personality: inp.personality,
          position: st.position,
          roomId: st.roomId,
          canChat,
          lastAgentTask: inp.lastAgentTask,
        });
      }

      this.conversations.tick(this.clock, chatCandidates);

      // Process each character's state machine
      for (const inp of inputs) {
        const st = this.states.get(inp.id);
        if (!st) continue;

        const isAgentWorking = inp.agentStatus === 'working';
        const conv = this.conversations.getConversationFor(inp.id);

        // --- OPENBOT WORKING OVERRIDE (immediate reroute to Studio desk!) ---
        if (isAgentWorking) {
          if (conv) {
            this.conversations.leaveConversation(inp.id, this.clock);
          }
          st.speechText = null;
          st.wasAgentWorking = true;

          const deskNode = this.pickEmptyStudioDesk(st);
          const alreadyAtDesk =
            st.phase === 'activity' && st.activity === 'working' && st.isWorkingAtDesk;
          const walkingToDesk =
            st.phase === 'walking' &&
            st.targetNodeId !== null &&
            this.graph.nodes.get(st.targetNodeId)?.kind === 'work';

          if (!alreadyAtDesk && !walkingToDesk && deskNode) {
            this.startWalkingTo(st, deskNode);
          }
          continue;
        }

        // Strictly ensure idle/unlinked characters NEVER play working animation or sit at work desks
        const walkingToWorkDesk =
          st.phase === 'walking' &&
          st.targetNodeId !== null &&
          this.graph.nodes.get(st.targetNodeId)?.kind === 'work';

        if (
          !isAgentWorking &&
          (st.wasAgentWorking ||
            st.isWorkingAtDesk ||
            st.activity === 'working' ||
            walkingToWorkDesk)
        ) {
          st.wasAgentWorking = false;
          st.isWorkingAtDesk = false;
          this.releaseInteractionNode(st);
          st.phase = 'idle';
          st.activity = 'idle';
          st.path = [];
          st.targetNodeId = null;
          st.seatOffsetY = 0;
          st.timer = 0.5;
        }

        // --- ACTIVE CONVERSATION ---
        if (conv) {
          st.phase = 'chatting';
          st.activity = 'chatting';
          st.isMoving = false;
          st.seatOffsetY = 0;
          st.speechText = this.conversations.getSpeechFor(inp.id);
          // Turn smoothly to face conversation center
          const dx = conv.center[0] - st.position[0];
          const dz = conv.center[2] - st.position[2];
          if (Math.hypot(dx, dz) > 0.1) {
            const targetAngle = Math.atan2(dx, dz);
            const diff = ((targetAngle - st.rotationY + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            st.rotationY += diff * 0.4;
          }
          continue;
        } else if (st.phase === 'chatting') {
          st.phase = 'idle';
          st.activity = 'idle';
          st.speechText = null;
          st.timer = 1.2 + Math.random() * 1.5;
        } else {
          st.speechText = null;
        }

        // --- IDLE / ACTIVITY TIMERS ---
        if (st.phase === 'idle' || st.phase === 'activity') {
          st.timer -= tickDt;
          st.isMoving = false;
          if (st.timer <= 0) {
            this.releaseInteractionNode(st);
            const dest = this.pickDestination(inp, st);
            if (dest) {
              this.startWalkingTo(st, dest);
            } else {
              st.timer = 2.5;
            }
          }
        }
      }
    }

    // =======================================================================
    // 60 FPS SMOOTH INTERPOLATION, STAIR CLIMBING & SEPARATION STEERING
    // =======================================================================
    this.states.forEach((st) => {
      if (st.phase !== 'walking' || st.path.length === 0) {
        st.isMoving = false;
        this.syncRuntimeSnapshot(st);
        return;
      }

      const inp = inputMap.get(st.id);
      const baseSpeed = inp?.walkSpeed ?? 2.35;
      const wpId = st.path[st.pathIndex];
      const wp = this.graph.nodes.get(wpId);
      if (!wp) {
        st.phase = 'idle';
        st.timer = 1.0;
        st.isMoving = false;
        return;
      }

      // Narrow passage / stair yielding check so two characters don't clip in doors or on stairs
      if (wp.narrow) {
        const holder = this.reservedNarrowNodes.get(wp.id);
        if (holder && holder !== st.id) {
          st.waitYieldTimer += dt;
          if (st.waitYieldTimer < 2.2) {
            st.isMoving = false;
            this.syncRuntimeSnapshot(st);
            return;
          }
        } else {
          this.releaseNarrowNode(st);
          this.reservedNarrowNodes.set(wp.id, st.id);
          st.reservedNarrowId = wp.id;
          st.waitYieldTimer = 0;
        }
      } else if (st.reservedNarrowId) {
        this.releaseNarrowNode(st);
      }

      const dx = wp.position[0] - st.position[0];
      const dy = wp.position[1] - st.position[1];
      const dz = wp.position[2] - st.position[2];
      const horizDist = Math.hypot(dx, dz);
      const totalDist = Math.hypot(dx, dy, dz);

      if (totalDist < 0.14) {
        st.position[0] = wp.position[0];
        st.position[1] = wp.position[1];
        st.position[2] = wp.position[2];
        st.pathIndex += 1;

        if (st.pathIndex >= st.path.length) {
          // Reached final destination!
          this.releaseNarrowNode(st);
          st.isMoving = false;
          st.path = [];
          if (wp.facingY !== undefined) {
            st.rotationY = wp.facingY;
          }
          st.seatOffsetY = wp.seatOffsetY ?? 0;

          if (wp.kind === 'work') {
            if (inp?.agentStatus === 'working') {
              st.phase = 'activity';
              st.activity = 'working';
              st.isWorkingAtDesk = true;
              st.timer = 10 + Math.random() * 8;
            } else {
              // Status became idle before arrival — never enter working animation!
              this.releaseInteractionNode(st);
              st.phase = 'idle';
              st.activity = 'idle';
              st.isWorkingAtDesk = false;
              st.seatOffsetY = 0;
              st.timer = 0.5;
            }
          } else if (wp.kind === 'sit') {
            st.phase = 'activity';
            st.activity = 'sitting';
            st.timer = 7 + Math.random() * 7;
          } else if (wp.kind === 'watch-tv') {
            st.phase = 'activity';
            st.activity = 'watching-tv';
            st.timer = 9 + Math.random() * 8;
          } else if (wp.kind === 'cook') {
            st.phase = 'activity';
            st.activity = 'cooking';
            st.timer = 7 + Math.random() * 6;
          } else if (wp.kind === 'drink') {
            st.phase = 'activity';
            st.activity = 'drinking';
            st.timer = 6 + Math.random() * 4;
          } else if (wp.kind === 'wash') {
            st.phase = 'activity';
            st.activity = 'washing';
            st.timer = 6 + Math.random() * 5;
          } else if (wp.kind === 'sleep') {
            st.phase = 'activity';
            st.activity = 'sleeping';
            st.timer = 9 + Math.random() * 7;
          } else if (wp.kind === 'hammock') {
            st.phase = 'activity';
            st.activity = 'hammock';
            st.timer = 9 + Math.random() * 7;
          } else if (wp.kind === 'shower') {
            st.phase = 'activity';
            st.activity = 'showering';
            st.timer = 7 + Math.random() * 6;
          } else if (wp.kind === 'swim') {
            st.phase = 'activity';
            st.activity = 'swimming';
            st.timer = 9 + Math.random() * 7;
          } else if (wp.kind === 'sunbathe') {
            st.phase = 'activity';
            st.activity = 'sunbathing';
            st.timer = 8 + Math.random() * 7;
          } else if (wp.kind === 'hopscotch') {
            st.phase = 'activity';
            st.activity = 'hopscotch';
            st.timer = 6 + Math.random() * 5;
          } else if (wp.kind === 'mirror') {
            st.phase = 'activity';
            st.activity = 'mirror';
            st.timer = 6 + Math.random() * 5;
          } else {
            st.phase = 'idle';
            st.activity = 'idle';
            st.timer = 3 + Math.random() * 4;
          }
        }
      } else {
        st.isMoving = true;
        // Characters swimming between sea waypoints stay in swimming animation while gliding through water!
        if (wp.kind === 'swim' || st.position[1] < -0.25) {
          st.activity = 'swimming';
        } else {
          st.activity = 'walking';
        }
        // Slight slower pace on stairs & water for realistic movement
        const speed =
          wp.kind === 'stair'
            ? baseSpeed * 0.78
            : wp.kind === 'swim'
              ? baseSpeed * 0.65
              : baseSpeed;

        if (horizDist > 0.04) {
          const targetAngle = Math.atan2(dx, dz);
          const diff =
            ((targetAngle - st.rotationY + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          st.rotationY += diff * Math.min(1, dt * 8.5);
        }

        // Subtle separation steering in open rooms/yards (disabled on narrow stairs/doorways!)
        let sepX = 0;
        let sepZ = 0;
        if (!wp.narrow) {
          this.states.forEach((other) => {
            if (other.id === st.id) return;
            if (Math.abs(other.position[1] - st.position[1]) > 1.2) return;
            const ox = st.position[0] - other.position[0];
            const oz = st.position[2] - other.position[2];
            const d = Math.hypot(ox, oz);
            if (d > 0.01 && d < 1.05) {
              const push = ((1.05 - d) / 1.05) * 0.85;
              sepX += (ox / d) * push;
              sepZ += (oz / d) * push;
            }
          });
        }

        const step = Math.min(totalDist, speed * dt);
        st.position[0] += (dx / totalDist) * step + sepX * dt;
        st.position[1] += (dy / totalDist) * step;
        st.position[2] += (dz / totalDist) * step + sepZ * dt;
      }

      st.roomId = detectRoomFromPosition(st.position);
      this.syncRuntimeSnapshot(st);
    });
  }

  private syncRuntimeSnapshot(st: BrainCharacterState): void {
    const existing = characterRuntimeMap.get(st.id);
    if (existing) {
      existing.position[0] = st.position[0];
      existing.position[1] = st.position[1];
      existing.position[2] = st.position[2];
      existing.rotationY = st.rotationY;
      existing.roomId = st.roomId;
      existing.activity = st.activity;
      existing.speechText = st.speechText;
      existing.isWorkingAtDesk = st.isWorkingAtDesk;
    } else {
      characterRuntimeMap.set(st.id, {
        id: st.id,
        position: [...st.position] as Vec3,
        rotationY: st.rotationY,
        roomId: st.roomId,
        activity: st.activity,
        speechText: st.speechText,
        speechUntil: 0,
        isWorkingAtDesk: st.isWorkingAtDesk,
      });
    }
  }
}

/** Singleton AI brain shared across scene & layout rebuild triggers */
export const characterBrain = new CharacterAIBrain();
