import * as THREE from 'three';

export interface LegoMaterialOptions {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getLegoMaterial(
  color: string,
  opts?: LegoMaterialOptions
): THREE.MeshStandardMaterial {
  const roughness = opts?.roughness ?? 0.28;
  const metalness = opts?.metalness ?? 0;
  const transparent = opts?.transparent ?? false;
  const opacity = opts?.opacity ?? 1;
  const emissive = opts?.emissive ?? '';
  const emissiveIntensity = opts?.emissiveIntensity ?? 0;

  const key = `${color}|r${roughness}|m${metalness}|t${transparent ? 1 : 0}|o${opacity}|e${emissive}|ei${emissiveIntensity}`;
  const cached = materialCache.get(key);
  if (cached) {
    return cached;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    transparent,
    opacity,
    ...(emissive
      ? {
          emissive: new THREE.Color(emissive),
          emissiveIntensity,
        }
      : {}),
  });

  materialCache.set(key, mat);
  return mat;
}

export function getEmissiveMaterial(
  color: string,
  intensity = 1.6
): THREE.MeshStandardMaterial {
  return getLegoMaterial(color, {
    roughness: 0.2,
    metalness: 0,
    emissive: color,
    emissiveIntensity: intensity,
  });
}
