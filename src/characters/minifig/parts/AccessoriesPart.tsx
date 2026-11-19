import React, { useMemo } from 'react';
import { getLegoMaterial, getEmissiveMaterial } from '../../../lib/materials';
import { LEGO_COLORS } from '../../../lib/colors';
import type { MinifigAccessories } from '../types';

/** Head-slot accessories (headphones) */
export const HeadSlotAccessory: React.FC<{ slot: MinifigAccessories['headSlot'] }> = ({ slot }) => {
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const cyanMat = useMemo(() => getEmissiveMaterial(LEGO_COLORS.lightBlue, 0.55), []);
  if (slot !== 'headphones') return null;

  return (
    <group name="acc-headphones">
      <mesh position={[0, 0.06, 0]} material={blackMat}>
        <torusGeometry args={[0.46, 0.055, 8, 18, Math.PI]} />
      </mesh>
      {[-0.45, 0.45].map((x, idx) => (
        <group key={idx} position={[x, 0.02, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={blackMat} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
          </mesh>
          <mesh position={[x < 0 ? -0.065 : 0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={cyanMat}>
            <cylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Face-slot accessories (glasses, sunglasses) */
export const FaceSlotAccessory: React.FC<{ slot: MinifigAccessories['faceSlot'] }> = ({ slot }) => {
  const frameMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const lensMat = useMemo(
    () =>
      slot === 'sunglasses'
        ? getLegoMaterial('#111827', { roughness: 0.1, metalness: 0.35 })
        : getLegoMaterial('#CBEFFF', { roughness: 0.08, transparent: true, opacity: 0.42 }),
    [slot]
  );
  if (slot === 'none') return null;

  return (
    <group name={`acc-${slot}`} position={[0, 0.04, 0.39]}>
      {[-0.15, 0.15].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh material={frameMat}>
            <boxGeometry args={[0.22, 0.15, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.015]} material={lensMat}>
            <boxGeometry args={[0.17, 0.1, 0.03]} />
          </mesh>
        </group>
      ))}
      <mesh material={frameMat}>
        <boxGeometry args={[0.1, 0.035, 0.04]} />
      </mesh>
    </group>
  );
};

/** Neck-slot accessories (camera, necklace, scarf) */
export const NeckSlotAccessory: React.FC<{ slot: MinifigAccessories['neckSlot'] }> = ({ slot }) => {
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.45 }), []);
  const lensMat = useMemo(() => getLegoMaterial(LEGO_COLORS.seaDeep, { roughness: 0.1 }), []);
  const goldMat = useMemo(() => getLegoMaterial(LEGO_COLORS.gold, { metalness: 0.45 }), []);
  const scarfMat = useMemo(() => getLegoMaterial(LEGO_COLORS.red), []);
  if (slot === 'none') return null;

  return (
    <group name={`acc-${slot}`}>
      {slot === 'camera' && (
        <group position={[0, 0.56, 0.34]}>
          <mesh position={[-0.16, 0.24, -0.08]} rotation={[0.1, 0, 0.38]} material={blackMat}>
            <boxGeometry args={[0.04, 0.46, 0.03]} />
          </mesh>
          <mesh position={[0.16, 0.24, -0.08]} rotation={[0.1, 0, -0.38]} material={blackMat}>
            <boxGeometry args={[0.04, 0.46, 0.03]} />
          </mesh>
          <mesh material={blackMat} castShadow>
            <boxGeometry args={[0.38, 0.24, 0.16]} />
          </mesh>
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={silverMat}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={lensMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
          </mesh>
        </group>
      )}

      {slot === 'necklace' && (
        <group position={[0, 0.96, 0.22]}>
          <mesh rotation={[0.7, 0, 0]} material={goldMat}>
            <torusGeometry args={[0.2, 0.03, 8, 16, Math.PI]} />
          </mesh>
          <mesh position={[0, -0.14, 0.12]} material={goldMat}>
            <octahedronGeometry args={[0.075, 0]} />
          </mesh>
        </group>
      )}

      {slot === 'scarf' && (
        <group position={[0, 1.04, 0]}>
          <mesh material={scarfMat} castShadow>
            <cylinderGeometry args={[0.32, 0.34, 0.18, 14]} />
          </mesh>
          <mesh position={[0.18, -0.26, 0.28]} rotation={[0.12, 0, -0.08]} material={scarfMat} castShadow>
            <boxGeometry args={[0.18, 0.48, 0.08]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/** Back-slot accessory (backpack) */
export const BackSlotAccessory: React.FC<{ slot: MinifigAccessories['backSlot'] }> = ({ slot }) => {
  const packMat = useMemo(() => getLegoMaterial(LEGO_COLORS.orange), []);
  const pocketMat = useMemo(() => getLegoMaterial(LEGO_COLORS.darkWood), []);
  if (slot !== 'backpack') return null;

  return (
    <group name="acc-backpack" position={[0, 0.56, -0.44]}>
      <mesh material={packMat} castShadow>
        <boxGeometry args={[0.74, 0.84, 0.36]} />
      </mesh>
      <mesh position={[0, -0.14, -0.19]} material={pocketMat}>
        <boxGeometry args={[0.52, 0.36, 0.1]} />
      </mesh>
    </group>
  );
};

/** Hand-held accessories (spatula, fan, coffee-cup, laptop, watch) */
export const HandSlotAccessory: React.FC<{
  slot: MinifigAccessories['leftHandSlot'] | MinifigAccessories['rightHandSlot'];
}> = ({ slot }) => {
  const silverMat = useMemo(() => getLegoMaterial(LEGO_COLORS.silver, { metalness: 0.5 }), []);
  const blackMat = useMemo(() => getLegoMaterial(LEGO_COLORS.black), []);
  const whiteMat = useMemo(() => getLegoMaterial(LEGO_COLORS.white), []);
  const brownMat = useMemo(() => getLegoMaterial(LEGO_COLORS.brownWood), []);
  const pinkMat = useMemo(() => getLegoMaterial(LEGO_COLORS.pinkLight), []);
  const screenMat = useMemo(() => getEmissiveMaterial('#38BDF8', 0.8), []);

  if (slot === 'none') return null;

  return (
    <group name={`acc-hand-${slot}`}>
      {slot === 'spatula' && (
        <group position={[0, -0.02, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, -0.12, 0]} material={blackMat}>
            <cylinderGeometry args={[0.045, 0.045, 0.3, 8]} />
          </mesh>
          <mesh position={[0, 0.18, 0]} material={silverMat}>
            <cylinderGeometry args={[0.028, 0.028, 0.36, 8]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={silverMat} castShadow>
            <boxGeometry args={[0.24, 0.28, 0.035]} />
          </mesh>
        </group>
      )}

      {slot === 'fan' && (
        <group position={[0, 0.04, 0.22]} rotation={[0.45, 0, 0]}>
          <mesh material={brownMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
          </mesh>
          <mesh position={[0, 0.18, 0]} material={pinkMat} castShadow>
            <cylinderGeometry args={[0.3, 0.04, 0.04, 12, 1, false, -Math.PI * 0.4, Math.PI * 0.8]} />
          </mesh>
        </group>
      )}

      {slot === 'coffee-cup' && (
        <group position={[0, 0.02, 0.18]}>
          <mesh material={whiteMat} castShadow>
            <cylinderGeometry args={[0.11, 0.095, 0.24, 12]} />
          </mesh>
          <mesh position={[0, 0.11, 0]} material={brownMat}>
            <cylinderGeometry args={[0.095, 0.095, 0.03, 12]} />
          </mesh>
        </group>
      )}

      {slot === 'laptop' && (
        <group position={[0, 0.04, 0.3]} rotation={[0.15, 0, 0]}>
          <mesh material={silverMat} castShadow>
            <boxGeometry args={[0.52, 0.04, 0.36]} />
          </mesh>
          <mesh position={[0, 0.18, -0.16]} rotation={[-0.25, 0, 0]} material={silverMat}>
            <boxGeometry args={[0.52, 0.34, 0.04]} />
          </mesh>
          <mesh position={[0, 0.18, -0.135]} rotation={[-0.25, 0, 0]} material={screenMat}>
            <boxGeometry args={[0.44, 0.26, 0.02]} />
          </mesh>
        </group>
      )}

      {slot === 'watch' && (
        <group position={[0, 0.14, 0]}>
          <mesh material={blackMat}>
            <cylinderGeometry args={[0.125, 0.125, 0.08, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.11]} material={silverMat}>
            <boxGeometry args={[0.1, 0.1, 0.04]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
