import React, { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type {
  CameraPreset,
  CameraTarget,
  CharacterId,
  FloorViewMode,
  PresetId,
  RoomId,
  Vec3,
} from './types';
import type { MinifigConfig } from './characters/minifig/types';
import {
  FLOOR1_OVERVIEW_CAMERA,
  INITIAL_CAMERA,
  ROOM_CAMERA_TARGETS,
  ROOM_FLOOR_MAP,
} from './components/camera/presets';
import { CameraRig } from './scene/camera/CameraRig';
import { SceneLighting } from './components/SceneLighting';
import { House } from './components/house/House';
import { EnvironmentScene } from './components/environment/EnvironmentScene';
import { CharactersGroup } from './components/characters/CharactersGroup';
import { CharacterCreator } from './characters/creator/CharacterCreator';
import { BuildModePanel } from './build-mode/BuildModePanel';
import { PlacementController } from './build-mode/PlacementController';
import { BridgeAgentSource } from './openbot/BridgeAgentSource';
import { ConnectAgentModal } from './openbot/ConnectAgentModal';
import { OpenBotSettingsModal } from './openbot/OpenBotSettingsModal';
import { StatusBadge } from './openbot/StatusBadge';
import type { OpenBotAgent } from './openbot/AgentSource';
import { Loader, Overlay, type LinkedAgentInfo } from './components/ui';
import { characterRuntimeMap } from './lib/characterRuntime';
import { useAgentStore } from './store/agentStore';
import { useCharacterStore } from './store/characterStore';
import { useLayoutStore } from './store/layoutStore';
import { useUIStore } from './store/uiStore';

const PRESET_IDS = new Set<RoomId>([
  'overview',
  'kitchen',
  'bedroom',
  'living-room',
  'terraces',
  'foyer',
  'studio',
  'guest-room',
]);

function isPresetId(roomId: RoomId): roomId is PresetId {
  return PRESET_IDS.has(roomId);
}

function buildCharacterCameraTarget(pos: Vec3): CameraTarget {
  return {
    position: [pos[0] - 8, pos[1] + 7, pos[2] + 9],
    target: [pos[0], pos[1] + 1.8, pos[2]],
  };
}

export function App(): React.ReactElement {
  const characters = useCharacterStore((s) => s.characters);
  const wallColors = useLayoutStore((s) => s.wallColors);
  const trimColors = useLayoutStore((s) => s.trimColors);
  const floorSettings = useLayoutStore((s) => s.floorSettings);

  const agents = useAgentStore((s) => s.agents);
  const characterToAgent = useAgentStore((s) => s.characterToAgent);
  const setAgents = useAgentStore((s) => s.setAgents);
  const syncAutoBindings = useAgentStore((s) => s.syncAutoBindings);
  const setConnectionState = useAgentStore((s) => s.setConnectionState);
  const unlinkCharacter = useAgentStore((s) => s.unlinkCharacter);
  const syncWithAgents = useCharacterStore((s) => s.syncWithAgents);

  const isNight = useUIStore((s) => s.isNight);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const showCharacters = useUIStore((s) => s.showCharacters);
  const floorViewMode = useUIStore((s) => s.floorViewMode);
  const buildMode = useUIStore((s) => s.buildMode);
  const activePreset = useUIStore((s) => s.activePreset);
  const selectedCharacterId = useUIStore((s) => s.selectedCharacterId);
  const followCharacterId = useUIStore((s) => s.followCharacterId);
  const hasInteracted = useUIStore((s) => s.hasInteracted);
  const sceneReady = useUIStore((s) => s.sceneReady);

  const toggleNight = useUIStore((s) => s.toggleNight);
  const toggleAutoRotate = useUIStore((s) => s.toggleAutoRotate);
  const toggleCharacters = useUIStore((s) => s.toggleCharacters);
  const toggleBuildMode = useUIStore((s) => s.toggleBuildMode);
  const setFloorViewMode = useUIStore((s) => s.setFloorViewMode);
  const setActivePreset = useUIStore((s) => s.setActivePreset);
  const requestCameraMove = useUIStore((s) => s.requestCameraMove);
  const setSelectedCharacterId = useUIStore((s) => s.setSelectedCharacterId);
  const setFollowCharacterId = useUIStore((s) => s.setFollowCharacterId);
  const setAutoRotate = useUIStore((s) => s.setAutoRotate);
  const setShowCharacters = useUIStore((s) => s.setShowCharacters);
  const openCreator = useUIStore((s) => s.openCreator);
  const openConnectModal = useUIStore((s) => s.openConnectModal);
  const markInteracted = useUIStore((s) => s.markInteracted);
  const setSceneReady = useUIStore((s) => s.setSceneReady);
  const pushToast = useUIStore((s) => s.pushToast);

  const selectedCharacter =
    characters.find((c) => c.id === selectedCharacterId) ?? null;

  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const readyTimerRef = useRef<number | null>(null);
  const prevAgentStatusRef = useRef<Map<string, 'working' | 'idle'>>(new Map());

  // Subscribe to OpenBot Bridge SSE & auto-sync 1 agent = 1 LEGO character
  useEffect(() => {
    const source = new BridgeAgentSource();
    prevAgentStatusRef.current.clear();
    let initialized = false;

    const unsubscribe = source.subscribe(
      (nextAgents: OpenBotAgent[]) => {
        // 1. Automatically spawn / update / remove 1-to-1 LEGO characters for every OpenBot agent
        syncWithAgents(nextAgents);
        syncAutoBindings(nextAgents);

        // 2. Clear selection / camera follow if the selected agent character was removed
        const validIds = new Set(useCharacterStore.getState().characters.map((c) => c.id));
        const ui = useUIStore.getState();
        if (ui.selectedCharacterId && !validIds.has(ui.selectedCharacterId)) {
          ui.setSelectedCharacterId(null);
        }
        if (ui.followCharacterId && !validIds.has(ui.followCharacterId)) {
          ui.setFollowCharacterId(null);
        }

        // 3. Emit toasts for newly arrived agents & working/idle transitions
        const nextIds = new Set<string>();
        for (const ag of nextAgents) {
          nextIds.add(ag.agentId);
          const prevStatus = prevAgentStatusRef.current.get(ag.agentId);
          if (!prevStatus && initialized) {
            pushToast(`Agent baru masuk rumah: ${ag.name}!`, 'info');
          } else if (prevStatus && prevStatus !== ag.status) {
            if (ag.status === 'working') {
              pushToast(
                `${ag.name} mulai bekerja: ${ag.task || 'Menjalankan task baru'}`,
                'working'
              );
            } else {
              pushToast(`${ag.name} selesai bekerja dan kembali santai`, 'idle');
            }
          }
          prevAgentStatusRef.current.set(ag.agentId, ag.status);
        }
        for (const oldId of Array.from(prevAgentStatusRef.current.keys())) {
          if (!nextIds.has(oldId)) {
            prevAgentStatusRef.current.delete(oldId);
          }
        }
        initialized = true;

        setAgents(nextAgents);
      },
      (connState) => {
        setConnectionState(connState);
        if (connState === 'offline') {
          syncWithAgents([]);
          syncAutoBindings([]);
          setAgents([]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [setAgents, syncWithAgents, syncAutoBindings, setConnectionState, pushToast]);

  useEffect(() => {
    if (glRef.current) {
      glRef.current.toneMappingExposure = isNight ? 1.15 : 1.05;
    }
  }, [isNight]);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setSceneReady(true);
    }, 4000);
    return () => {
      window.clearTimeout(fallbackTimer);
      if (readyTimerRef.current !== null) {
        window.clearTimeout(readyTimerRef.current);
      }
    };
  }, [setSceneReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'Escape' && selectedCharacterId) {
        setSelectedCharacterId(null);
      }
      if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        useUIStore.getState().toggleNavDebug();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCharacterId, setSelectedCharacterId]);

  const handleCanvasCreated = useCallback(
    (state: { gl: THREE.WebGLRenderer }) => {
      glRef.current = state.gl;
      state.gl.shadowMap.enabled = true;
      state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
      state.gl.toneMapping = THREE.ACESFilmicToneMapping;
      state.gl.toneMappingExposure = useUIStore.getState().isNight ? 1.15 : 1.05;

      if (readyTimerRef.current !== null) {
        window.clearTimeout(readyTimerRef.current);
      }
      readyTimerRef.current = window.setTimeout(() => {
        setSceneReady(true);
      }, 420);
    },
    [setSceneReady]
  );

  const handleChangeFloorViewMode = useCallback(
    (mode: FloorViewMode) => {
      setFloorViewMode(mode);
      if (mode === 'floor1') {
        setAutoRotate(false);
        requestCameraMove(FLOOR1_OVERVIEW_CAMERA);
      } else {
        requestCameraMove(INITIAL_CAMERA);
      }
    },
    [setFloorViewMode, setAutoRotate, requestCameraMove]
  );

  const handleSelectPreset = useCallback(
    (preset: CameraPreset) => {
      markInteracted();
      setSelectedCharacterId(null);
      setFollowCharacterId(null);
      setActivePreset(preset.id);
      if (preset.id !== 'overview') {
        setAutoRotate(false);
      }
      if (preset.floor === 1) {
        setFloorViewMode('floor1');
      } else if (preset.floor === 2) {
        setFloorViewMode('floor2');
      } else {
        setFloorViewMode('all');
      }
      requestCameraMove({
        position: [...preset.position] as Vec3,
        target: [...preset.target] as Vec3,
      });
    },
    [markInteracted, setSelectedCharacterId, setFollowCharacterId, setActivePreset, setAutoRotate, setFloorViewMode, requestCameraMove]
  );

  const handleSelectRoom = useCallback(
    (roomId: RoomId) => {
      if (useUIStore.getState().buildMode) return;
      const target = ROOM_CAMERA_TARGETS[roomId];
      if (!target) return;
      markInteracted();
      setSelectedCharacterId(null);
      setFollowCharacterId(null);
      if (roomId !== 'overview') {
        setAutoRotate(false);
      }
      const floor = ROOM_FLOOR_MAP[roomId];
      if (floor === 1) setFloorViewMode('floor1');
      else if (floor === 2 && useUIStore.getState().floorViewMode === 'floor1') {
        setFloorViewMode('all');
      }
      setActivePreset(isPresetId(roomId) ? roomId : null);
      requestCameraMove({
        position: [...target.position] as Vec3,
        target: [...target.target] as Vec3,
      });
    },
    [markInteracted, setSelectedCharacterId, setFollowCharacterId, setAutoRotate, setFloorViewMode, setActivePreset, requestCameraMove]
  );

  const handleSelectCharacter = useCallback(
    (char: MinifigConfig, currentPosition: Vec3) => {
      if (useUIStore.getState().buildMode) return;
      markInteracted();
      setShowCharacters(true);
      setSelectedCharacterId(char.id);
      setActivePreset(null);
      setAutoRotate(false);
      const isInsideHouse =
        currentPosition[0] >= -16 &&
        currentPosition[0] <= 16 &&
        currentPosition[2] >= -12 &&
        currentPosition[2] <= 12;
      if (isInsideHouse && currentPosition[1] < 4.5) {
        setFloorViewMode('floor1');
      } else if (currentPosition[1] >= 5.2 && useUIStore.getState().floorViewMode === 'floor1') {
        setFloorViewMode('all');
      }
      requestCameraMove(buildCharacterCameraTarget(currentPosition));
    },
    [markInteracted, setShowCharacters, setSelectedCharacterId, setActivePreset, setAutoRotate, setFloorViewMode, requestCameraMove]
  );

  const handleResetView = useCallback(() => {
    markInteracted();
    setFollowCharacterId(null);
    setSelectedCharacterId(null);
    setFloorViewMode('all');
    setActivePreset('overview');
    requestCameraMove(INITIAL_CAMERA);
  }, [markInteracted, setFollowCharacterId, setSelectedCharacterId, setFloorViewMode, setActivePreset, requestCameraMove]);

  const handleToggleFollowCharacter = useCallback(
    (char: MinifigConfig) => {
      markInteracted();
      if (useUIStore.getState().followCharacterId === char.id) {
        setFollowCharacterId(null);
      } else {
        setShowCharacters(true);
        setSelectedCharacterId(char.id);
        setFollowCharacterId(char.id);
      }
    },
    [markInteracted, setShowCharacters, setSelectedCharacterId, setFollowCharacterId]
  );

  const handleSelectCharacterFromUI = useCallback(
    (char: MinifigConfig) => {
      const livePos = characterRuntimeMap.get(char.id)?.position ?? char.startPosition;
      handleSelectCharacter(char, livePos);
    },
    [handleSelectCharacter]
  );

  const handleFocusCharacter = useCallback(
    (char: MinifigConfig) => {
      const livePos = characterRuntimeMap.get(char.id)?.position ?? char.startPosition;
      handleSelectCharacter(char, livePos);
    },
    [handleSelectCharacter]
  );

  const roomFloorColors = useMemo(() => {
    const out: Partial<Record<RoomId, string>> = {};
    for (const [k, v] of Object.entries(floorSettings)) {
      if (v?.color) out[k as RoomId] = v.color;
    }
    return out;
  }, [floorSettings]);

  const agentById = useMemo(() => new Map(agents.map((a) => [a.agentId, a])), [agents]);

  const getLinkedAgent = useCallback(
    (charId: CharacterId): LinkedAgentInfo | null => {
      const aid = characterToAgent[charId];
      if (!aid) return null;
      const ag = agentById.get(aid);
      if (!ag) return null;
      return {
        agentId: ag.agentId,
        name: ag.name,
        title: ag.title,
        status: ag.status,
        task: ag.task ?? null,
        lastCompletedTask: ag.lastCompletedTask ?? null,
        updatedAt: ag.updatedAt,
      };
    },
    [characterToAgent, agentById]
  );

  const getAgentStateForBrain = useCallback((charId: CharacterId) => {
    const st = useAgentStore.getState();
    const aid = st.characterToAgent[charId];
    if (!aid) return { status: null as 'working' | 'idle' | null, lastTask: null };
    const ag = st.agents.find((a) => a.agentId === aid);
    if (!ag) return { status: null as 'working' | 'idle' | null, lastTask: null };
    return {
      status: ag.status,
      lastTask: ag.lastCompletedTask ?? ag.task ?? null,
    };
  }, []);

  return (
    <div
      className={[
        'relative h-screen w-screen overflow-hidden select-none transition-colors duration-700',
        isNight ? 'bg-[#0C1428]' : 'bg-[#87CEEB]',
      ].join(' ')}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: INITIAL_CAMERA.position,
          fov: 38,
          near: 0.5,
          far: 250,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isNight ? 1.15 : 1.05,
        }}
        onCreated={handleCanvasCreated}
      >
        <SceneLighting isNight={isNight} />

        <Suspense fallback={null}>
          <EnvironmentScene isNight={isNight} />
          <House
            isNight={isNight}
            onSelectRoom={handleSelectRoom}
            wallColorOverrides={wallColors}
            trimColorOverrides={trimColors}
            roomFloorColors={roomFloorColors}
          />
          <PlacementController isNight={isNight} />
          <CharactersGroup
            visible={showCharacters}
            selectedId={selectedCharacterId}
            onSelectCharacter={handleSelectCharacter}
            getAgentState={getAgentStateForBrain}
          />
        </Suspense>

        <CameraRig />
      </Canvas>

      <Overlay
        characters={characters}
        isNight={isNight}
        onToggleNight={toggleNight}
        autoRotate={autoRotate}
        onToggleAutoRotate={toggleAutoRotate}
        showCharacters={showCharacters}
        onToggleCharacters={toggleCharacters}
        floorViewMode={floorViewMode}
        onChangeFloorViewMode={handleChangeFloorViewMode}
        buildMode={buildMode}
        onToggleBuildMode={toggleBuildMode}
        onResetView={handleResetView}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        selectedCharacter={selectedCharacter}
        followCharacterId={followCharacterId}
        onToggleFollowCharacter={handleToggleFollowCharacter}
        onStopFollow={() => setFollowCharacterId(null)}
        onSelectCharacterFromUI={handleSelectCharacterFromUI}
        onFocusCharacter={handleFocusCharacter}
        onEditOutfit={(char) => openCreator(char.id)}
        onCreateCharacter={() => openCreator(null)}
        onCloseCharacterCard={() => setSelectedCharacterId(null)}
        hasInteracted={hasInteracted}
        getLinkedAgent={getLinkedAgent}
        onConnectAgent={(char) => openConnectModal(char.id)}
        onDisconnectAgent={(char) => {
          unlinkCharacter(char.id);
          pushToast(`Koneksi OpenBot ${char.name} diputuskan.`);
        }}
        openBotStatusPill={<StatusBadge isNight={isNight} />}
      />

      <BuildModePanel />
      <CharacterCreator />
      <ConnectAgentModal />
      <OpenBotSettingsModal />

      <Loader isReady={sceneReady} isNight={isNight} />
    </div>
  );
}

export default App;
