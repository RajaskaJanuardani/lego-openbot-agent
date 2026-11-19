import React, { Component, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

class EnvironmentErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const ProceduralDayEnvironment: React.FC = () => (
  <Environment resolution={256} frames={1} environmentIntensity={0.35}>
    <Lightformer
      form="circle"
      intensity={3.5}
      color="#FFF2D6"
      position={[20, 22, 16]}
      scale={12}
      target={[0, 0, 0]}
    />
    <Lightformer
      form="rect"
      intensity={1.4}
      color="#87CEEB"
      position={[0, 18, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[40, 40, 1]}
    />
    <Lightformer
      form="rect"
      intensity={0.9}
      color="#7BC96F"
      position={[0, -10, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[40, 40, 1]}
    />
  </Environment>
);

const ProceduralNightEnvironment: React.FC = () => (
  <Environment resolution={128} frames={1} environmentIntensity={0.12}>
    <Lightformer
      form="circle"
      intensity={1.5}
      color="#A8C7FA"
      position={[-18, 22, -16]}
      scale={8}
      target={[0, 0, 0]}
    />
    <Lightformer
      form="rect"
      intensity={0.6}
      color="#1C2E5A"
      position={[0, 16, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[36, 36, 1]}
    />
  </Environment>
);

const NightStarfield: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const starGeometry = useMemo(() => {
    const count = 340;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Deterministic seeded stars so night sky looks crisp and balanced
    let seed = 4217;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const starPalette = [
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#DCEBFF'),
      new THREE.Color('#FFF4D2'),
    ];

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI * 0.44; // Upper sky dome
      const radius = 92 + rand() * 32;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 10 + radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const c = starPalette[i % starPalette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.004;
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={starGeometry}>
        <pointsMaterial
          size={1.05}
          vertexColors
          transparent
          opacity={0.88}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Soft glowing LEGO moon high in the night sky */}
      <mesh position={[-42, 54, -46]}>
        <sphereGeometry args={[3.4, 20, 20]} />
        <meshBasicMaterial color="#FFF6DC" />
      </mesh>
    </group>
  );
};

export interface SceneLightingProps {
  isNight: boolean;
}

export const SceneLighting: React.FC<SceneLightingProps> = ({ isNight }) => {
  return (
    <>
      <color attach="background" args={[isNight ? '#0C1428' : '#87CEEB']} />
      <fog attach="fog" args={[isNight ? '#0C1428' : '#A6DCEF', 88, 190]} />

      {!isNight ? (
        <>
          <ambientLight intensity={0.45} color="#FFF9F0" />
          <hemisphereLight args={['#87CEEB', '#4CAF50', 0.55]} />

          {/* Warm late-afternoon sun casting crisp soft shadows */}
          <directionalLight
            color="#FFF0D4"
            intensity={2.0}
            position={[26, 36, 22]}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-32}
            shadow-camera-right={32}
            shadow-camera-top={32}
            shadow-camera-bottom={-32}
            shadow-camera-near={6}
            shadow-camera-far={115}
            shadow-bias={-0.0005}
            shadow-normalBias={0.04}
          />

          {/* Subtle cool sky fill light from front-left so shadow faces stay vibrant */}
          <directionalLight
            color="#D2ECFF"
            intensity={0.32}
            position={[-24, 18, 18]}
          />

          <EnvironmentErrorBoundary fallback={<ProceduralDayEnvironment />}>
            <Suspense fallback={<ProceduralDayEnvironment />}>
              <Environment preset="sunset" environmentIntensity={0.35} />
            </Suspense>
          </EnvironmentErrorBoundary>
        </>
      ) : (
        <>
          <ambientLight intensity={0.16} color="#8BA8E0" />
          <hemisphereLight args={['#1E3163', '#13261A', 0.25]} />

          {/* Low cool moonlight directional */}
          <directionalLight
            color="#7BA3E0"
            intensity={0.45}
            position={[-24, 34, -20]}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-32}
            shadow-camera-right={32}
            shadow-camera-top={32}
            shadow-camera-bottom={-32}
            shadow-camera-near={6}
            shadow-camera-far={115}
            shadow-bias={-0.0005}
            shadow-normalBias={0.04}
          />

          <ProceduralNightEnvironment />
          <NightStarfield />
        </>
      )}
    </>
  );
};
