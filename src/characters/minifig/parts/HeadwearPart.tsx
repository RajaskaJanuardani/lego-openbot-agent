import React, { useMemo } from 'react';
import { getLegoMaterial } from '../../../lib/materials';
import { LEGO_COLORS } from '../../../lib/colors';
import type { HeadwearStyle } from '../types';

export interface HeadwearPartProps {
  style: HeadwearStyle;
  color: string;
}

/**
 * Modular LEGO Headwear (7 hats + none): chef-hat, bucket-hat, baseball-cap,
 * helmet, peci, crown, bandana. Positioned in head-local coordinates.
 */
export const HeadwearPart: React.FC<HeadwearPartProps> = ({ style, color }) => {
  const mat = useMemo(() => getLegoMaterial(color, { roughness: 0.28 }), [color]);
  const accentMat = useMemo(() => getLegoMaterial(LEGO_COLORS.turquoise), []);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.45 }), []);
  const redGemMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  const visorMat = useMemo(
    () => getLegoMaterial('#CBEFFF', { roughness: 0.1, transparent: true, opacity: 0.5 }),
    []
  );

  if (style === 'none') return null;

  return (
    <group name={`headwear-${style}`}>
      {style === 'chef-hat' && (
        <group position={[0, 0.34, 0]}>
          <mesh position={[0, 0.08, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.4, 0.38, 0.22, 16]} />
          </mesh>
          <mesh position={[0, 0.36, 0]} material={mat} castShadow>
            <sphereGeometry args={[0.42, 14, 12]} />
          </mesh>
          {[
            [-0.22, 0.36, 0.16],
            [0.22, 0.36, 0.16],
            [-0.2, 0.36, -0.18],
            [0.2, 0.36, -0.18],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} material={mat} castShadow>
              <sphereGeometry args={[0.24, 10, 10]} />
            </mesh>
          ))}
        </group>
      )}

      {style === 'bucket-hat' && (
        <group position={[0, 0.32, 0]}>
          <mesh position={[0, 0.18, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.35, 0.41, 0.32, 16]} />
          </mesh>
          <mesh position={[0, 0.07, 0]} material={accentMat}>
            <cylinderGeometry args={[0.415, 0.42, 0.08, 16]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.42, 0.62, 0.11, 18]} />
          </mesh>
        </group>
      )}

      {style === 'baseball-cap' && (
        <group position={[0, 0.3, 0]}>
          <mesh position={[0, 0.02, 0]} material={mat} castShadow>
            <sphereGeometry args={[0.43, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {/* Front visor bill */}
          <mesh position={[0, 0.02, 0.42]} rotation={[0.08, 0, 0]} material={mat} castShadow>
            <boxGeometry args={[0.64, 0.07, 0.36]} />
          </mesh>
          <mesh position={[0, 0.44, 0]} material={mat}>
            <sphereGeometry args={[0.07, 8, 8]} />
          </mesh>
        </group>
      )}

      {style === 'helmet' && (
        <group position={[0, 0.18, -0.02]}>
          <mesh position={[0, 0.1, 0]} material={mat} castShadow>
            <sphereGeometry args={[0.48, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          </mesh>
          <mesh position={[0, 0.02, 0.32]} material={visorMat}>
            <cylinderGeometry args={[0.45, 0.45, 0.24, 14, 1, true, -Math.PI * 0.32, Math.PI * 0.64]} />
          </mesh>
        </group>
      )}

      {style === 'peci' && (
        <group position={[0, 0.34, 0]}>
          {/* Classic Indonesian oval velvet peci / kopiah */}
          <mesh position={[0, 0.16, 0]} scale={[0.92, 1, 1.1]} material={mat} castShadow>
            <cylinderGeometry args={[0.37, 0.4, 0.34, 16]} />
          </mesh>
        </group>
      )}

      {style === 'crown' && (
        <group position={[0, 0.36, 0]}>
          <mesh position={[0, 0.08, 0]} material={goldMat} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.14, 16]} />
          </mesh>
          {[0, 1, 2, 3, 4].map((p) => {
            const a = (p / 5) * Math.PI * 2;
            return (
              <mesh
                key={p}
                position={[Math.sin(a) * 0.34, 0.22, Math.cos(a) * 0.34]}
                material={goldMat}
                castShadow
              >
                <coneGeometry args={[0.09, 0.22, 6]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.1, 0.38]} material={redGemMat}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
        </group>
      )}

      {style === 'bandana' && (
        <group position={[0, 0.24, 0]}>
          <mesh material={mat} castShadow>
            <cylinderGeometry args={[0.425, 0.425, 0.16, 16]} />
          </mesh>
          {/* Rear bandana knot tails */}
          <mesh position={[-0.08, -0.06, -0.44]} rotation={[0.4, 0, 0.25]} material={mat}>
            <boxGeometry args={[0.1, 0.28, 0.06]} />
          </mesh>
          <mesh position={[0.08, -0.08, -0.44]} rotation={[0.45, 0, -0.25]} material={mat}>
            <boxGeometry args={[0.1, 0.24, 0.06]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
