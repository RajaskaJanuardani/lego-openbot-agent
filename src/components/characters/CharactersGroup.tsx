import React, { useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { CharacterId, Vec3 } from '../../types';
import { characterBrain, NavDebugView, type BrainCharacterInput } from '../../characters/ai';
import { ModularMinifigure } from '../../characters/minifig/ModularMinifigure';
import type { MinifigConfig } from '../../characters/minifig/types';
import { useCharacterStore } from '../../store/characterStore';
import { useUIStore } from '../../store/uiStore';

export interface CharactersGroupProps {
  visible: boolean;
  selectedId: CharacterId | null;
  onSelectCharacter: (char: MinifigConfig, currentPosition: Vec3) => void;
  /** Optional OpenBot status resolver keyed by characterId (wired in Fase 6!) */
  getAgentState?: (charId: CharacterId) => {
    status: 'working' | 'idle' | null;
    lastTask?: string | null;
  };
}

export const CharactersGroup: React.FC<CharactersGroupProps> = ({
  visible,
  selectedId,
  onSelectCharacter,
  getAgentState,
}) => {
  const characters = useCharacterStore((s) => s.characters);
  const buildMode = useUIStore((s) => s.buildMode);

  const brainInputsBase = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        personality: c.personality,
        favoriteRoom: c.favoriteRoom,
        startPosition: c.startPosition,
        walkSpeed: 2.35,
      })),
    [characters]
  );

  // Step the multi-floor A* & conversation AI brain every frame (10 Hz decisions, 60 fps movement)
  useFrame((_, delta) => {
    const inputs: BrainCharacterInput[] = getAgentState
      ? brainInputsBase.map((b) => {
          const ag = getAgentState(b.id);
          return {
            ...b,
            agentStatus: ag.status,
            lastAgentTask: ag.lastTask,
          };
        })
      : brainInputsBase;

    characterBrain.step(delta, inputs, buildMode);
  });

  const handleSelect = useCallback(
    (char: MinifigConfig, currentPosition: Vec3) => {
      onSelectCharacter(char, currentPosition);
    },
    [onSelectCharacter]
  );

  return (
    <group name="lego-characters-group">
      {characters.map((char) => (
        <ModularMinifigure
          key={char.id}
          config={char}
          mode="world"
          visible={visible}
          isSelected={selectedId === char.id}
          onSelect={handleSelect}
        />
      ))}
      <NavDebugView />
    </group>
  );
};
