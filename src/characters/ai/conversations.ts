import type { CharacterId, PersonalityType, RoomId, Vec3 } from '../../types';
import { pickDialogueLine } from './dialogues';

export interface ActiveConversation {
  id: string;
  participants: CharacterId[];
  center: Vec3;
  roomId: RoomId;
  endsAt: number;
  nextTurnAt: number;
  speakerIdx: number;
  turnCount: number;
  currentSpeakerId: CharacterId | null;
  currentLine: string | null;
}

export interface ChatCandidate {
  id: CharacterId;
  name: string;
  role: string;
  personality: PersonalityType;
  position: Vec3;
  roomId: RoomId;
  canChat: boolean;
  lastAgentTask?: string | null;
}

/**
 * Manages 2-to-3 minifigure spontaneous conversations with turn-taking speech bubbles
 * and per-character cooldowns so characters don't talk nonstop.
 */
export class ConversationManager {
  private active = new Map<string, ActiveConversation>();
  private charToConv = new Map<CharacterId, string>();
  private cooldownUntil = new Map<CharacterId, number>();

  getConversationFor(charId: CharacterId): ActiveConversation | undefined {
    const cid = this.charToConv.get(charId);
    return cid ? this.active.get(cid) : undefined;
  }

  getSpeechFor(charId: CharacterId): string | null {
    const conv = this.getConversationFor(charId);
    if (!conv || conv.currentSpeakerId !== charId) return null;
    return conv.currentLine;
  }

  leaveConversation(charId: CharacterId, now: number): void {
    const cid = this.charToConv.get(charId);
    if (!cid) return;
    const conv = this.active.get(cid);
    this.charToConv.delete(charId);
    this.cooldownUntil.set(charId, now + 18);

    if (!conv) return;
    conv.participants = conv.participants.filter((p) => p !== charId);
    if (conv.participants.length < 2) {
      // Dissolve remaining participant cleanly
      for (const rem of conv.participants) {
        this.charToConv.delete(rem);
        this.cooldownUntil.set(rem, now + 14);
      }
      this.active.delete(cid);
    }
  }

  tick(now: number, candidates: ChatCandidate[]): void {
    const candMap = new Map(candidates.map((c) => [c.id, c]));

    // 1. Update active conversations (advance dialogue turns or conclude)
    for (const [cid, conv] of Array.from(this.active.entries())) {
      // Remove anyone who disappeared or became working
      conv.participants = conv.participants.filter((pid) => {
        const c = candMap.get(pid);
        if (!c || !c.canChat) {
          this.charToConv.delete(pid);
          return false;
        }
        return true;
      });

      if (conv.participants.length < 2 || now >= conv.endsAt) {
        for (const pid of conv.participants) {
          this.charToConv.delete(pid);
          this.cooldownUntil.set(pid, now + 18 + Math.random() * 12);
        }
        this.active.delete(cid);
        continue;
      }

      if (now >= conv.nextTurnAt) {
        const speakerId = conv.participants[conv.speakerIdx % conv.participants.length];
        const speaker = candMap.get(speakerId);
        if (speaker) {
          conv.currentSpeakerId = speakerId;
          conv.currentLine = pickDialogueLine(
            {
              speakerName: speaker.name,
              role: speaker.role,
              personality: speaker.personality,
              roomId: conv.roomId,
              lastAgentTask: speaker.lastAgentTask,
            },
            conv.turnCount
          );
          conv.turnCount += 1;
          conv.speakerIdx = (conv.speakerIdx + 1) % conv.participants.length;
          conv.nextTurnAt = now + 2.8 + Math.random() * 1.1;
        }
      }
    }

    // 2. Allow a nearby 3rd character to join an ongoing 2-person chat
    for (const c of candidates) {
      if (!c.canChat || this.charToConv.has(c.id)) continue;
      if ((this.cooldownUntil.get(c.id) ?? 0) > now) continue;

      for (const conv of this.active.values()) {
        if (conv.participants.length >= 3) continue;
        const dy = Math.abs(c.position[1] - conv.center[1]);
        const d = Math.hypot(c.position[0] - conv.center[0], c.position[2] - conv.center[2]);
        const joinProb = c.personality === 'chatty' ? 0.3 : c.personality === 'shy' ? 0.05 : 0.14;
        if (dy < 1.2 && d < 2.8 && Math.random() < joinProb) {
          conv.participants.push(c.id);
          this.charToConv.set(c.id, conv.id);
          break;
        }
      }
    }

    // 3. Try starting new 2-person conversations among nearby eligible characters (< 2.6 units)
    const free = candidates.filter(
      (c) => c.canChat && !this.charToConv.has(c.id) && (this.cooldownUntil.get(c.id) ?? 0) <= now
    );

    for (let i = 0; i < free.length; i++) {
      const a = free[i];
      if (this.charToConv.has(a.id)) continue;
      for (let j = i + 1; j < free.length; j++) {
        const b = free[j];
        if (this.charToConv.has(b.id)) continue;
        const dy = Math.abs(a.position[1] - b.position[1]);
        const dist = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
        if (dy > 1.2 || dist > 2.6 || dist < 0.25) continue;

        let chance = 0.22;
        if (a.personality === 'chatty' || b.personality === 'chatty') chance = 0.45;
        else if (a.personality === 'shy' && b.personality === 'shy') chance = 0.06;

        if (Math.random() < chance) {
          const cid = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const center: Vec3 = [
            (a.position[0] + b.position[0]) * 0.5,
            (a.position[1] + b.position[1]) * 0.5,
            (a.position[2] + b.position[2]) * 0.5,
          ];
          const duration = 6.5 + Math.random() * 5.5; // 6.5–12s
          const firstLine = pickDialogueLine(
            {
              speakerName: a.name,
              role: a.role,
              personality: a.personality,
              roomId: a.roomId,
              lastAgentTask: a.lastAgentTask,
            },
            0
          );
          const conv: ActiveConversation = {
            id: cid,
            participants: [a.id, b.id],
            center,
            roomId: a.roomId,
            endsAt: now + duration,
            nextTurnAt: now + 3.0,
            speakerIdx: 1,
            turnCount: 1,
            currentSpeakerId: a.id,
            currentLine: firstLine,
          };
          this.active.set(cid, conv);
          this.charToConv.set(a.id, cid);
          this.charToConv.set(b.id, cid);
          break;
        }
      }
    }
  }
}
