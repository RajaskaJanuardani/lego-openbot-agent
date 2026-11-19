import React, { useMemo } from 'react';
import { getLegoMaterial } from '../../../lib/materials';
import { LEGO_COLORS } from '../../../lib/colors';
import type { HairStyle } from '../types';

export interface HairPartProps {
  style: HairStyle;
  color: string;
}

/**
 * Modular LEGO Hairpiece (10 styles: none/bald, short, buzz, bangs, curly,
 * long, ponytail, sanggul, hijab, mohawk). Positioned in head-local coordinates.
 */
export const HairPart: React.FC<HairPartProps> = ({ style, color }) => {
  const mat = useMemo(() => getLegoMaterial(color, { roughness: 0.3 }), [color]);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.35 }), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);

  if (style === 'none') return null;

  return (
    <group name={`hair-${style}`}>
      {style === 'short' && (
        <group>
          <mesh position={[0, 0.25, -0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          </mesh>
          <mesh position={[0, 0.08, -0.14]} material={mat} castShadow>
            <cylinderGeometry args={[0.41, 0.4, 0.34, 14, 1, false, Math.PI * 0.65, Math.PI * 1.7]} />
          </mesh>
          {/* Side sweep fringe */}
          <mesh position={[-0.08, 0.28, 0.34]} rotation={[0.15, 0, -0.18]} material={mat} castShadow>
            <boxGeometry args={[0.56, 0.16, 0.2]} />
          </mesh>
        </group>
      )}

      {style === 'buzz' && (
        <mesh position={[0, 0.22, -0.01]} material={mat} castShadow>
          <sphereGeometry args={[0.405, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
      )}

      {style === 'bangs' && (
        <group>
          <mesh position={[0, 0.25, -0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.43, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
          <mesh position={[0, 0.24, 0.35]} material={mat} castShadow>
            <boxGeometry args={[0.68, 0.19, 0.18]} />
          </mesh>
          <mesh position={[-0.36, 0.0, 0.05]} material={mat} castShadow>
            <boxGeometry args={[0.14, 0.45, 0.36]} />
          </mesh>
          <mesh position={[0.36, 0.0, 0.05]} material={mat} castShadow>
            <boxGeometry args={[0.14, 0.45, 0.36]} />
          </mesh>
        </group>
      )}

      {style === 'curly' && (
        <group>
          {[
            [0, 0.42, 0, 0.28],
            [-0.28, 0.32, 0.12, 0.22],
            [0.28, 0.32, 0.12, 0.22],
            [-0.32, 0.26, -0.16, 0.23],
            [0.32, 0.26, -0.16, 0.23],
            [0, 0.32, -0.3, 0.25],
            [-0.18, 0.38, -0.22, 0.22],
            [0.18, 0.38, -0.22, 0.22],
            [0, 0.14, -0.34, 0.22],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} material={mat} castShadow>
              <sphereGeometry args={[r, 10, 10]} />
            </mesh>
          ))}
        </group>
      )}

      {style === 'long' && (
        <group>
          <mesh position={[0, 0.25, -0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.43, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          </mesh>
          {/* Long rear drape */}
          <mesh position={[0, -0.26, -0.28]} material={mat} castShadow>
            <boxGeometry args={[0.84, 0.92, 0.26]} />
          </mesh>
          {/* Side locks */}
          <mesh position={[-0.38, -0.18, 0.02]} material={mat} castShadow>
            <boxGeometry args={[0.15, 0.72, 0.38]} />
          </mesh>
          <mesh position={[0.38, -0.18, 0.02]} material={mat} castShadow>
            <boxGeometry args={[0.15, 0.72, 0.38]} />
          </mesh>
        </group>
      )}

      {style === 'ponytail' && (
        <group>
          <mesh position={[0, 0.24, -0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
          <mesh position={[0, 0.12, -0.44]} material={goldMat}>
            <torusGeometry args={[0.12, 0.04, 8, 12]} />
          </mesh>
          <mesh position={[0, -0.18, -0.52]} rotation={[0.25, 0, 0]} material={mat} castShadow>
            <coneGeometry args={[0.18, 0.68, 10]} />
          </mesh>
        </group>
      )}

      {style === 'sanggul' && (
        <group>
          <mesh position={[0, 0.24, -0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
          {/* Traditional rear bun (sanggul) */}
          <mesh position={[0, 0.08, -0.44]} material={mat} castShadow>
            <sphereGeometry args={[0.24, 14, 12]} />
          </mesh>
          {/* Golden hairpin & jasmine blossoms */}
          <mesh position={[0, 0.2, -0.42]} rotation={[0, 0, 0.45]} material={goldMat}>
            <cylinderGeometry args={[0.022, 0.022, 0.56, 8]} />
          </mesh>
          <mesh position={[0.16, 0.16, -0.44]} material={whiteMat}>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
          <mesh position={[0.2, 0.06, -0.42]} material={whiteMat}>
            <sphereGeometry args={[0.055, 8, 8]} />
          </mesh>
        </group>
      )}

      {style === 'hijab' && (
        <group>
          {/* Outer dome wrap framing face cleanly */}
          <mesh position={[0, 0.12, -0.04]} material={mat} castShadow>
            <sphereGeometry args={[0.45, 16, 14]} />
          </mesh>
          {/* Cut-out feel front neck wrap & chest drape */}
          <mesh position={[0, -0.38, 0.04]} material={mat} castShadow>
            <cylinderGeometry args={[0.42, 0.52, 0.42, 14]} />
          </mesh>
          {/* Pin accent under chin */}
          <mesh position={[0, -0.22, 0.4]} material={goldMat}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
        </group>
      )}

      {style === 'mohawk' && (
        <group>
          {[0.24, 0.08, -0.08, -0.24].map((z, idx) => (
            <mesh key={idx} position={[0, 0.46 + (idx === 1 ? 0.06 : 0), z]} material={mat} castShadow>
              <boxGeometry args={[0.14, 0.34, 0.14]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
