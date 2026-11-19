import React from 'react';
import { Plate, Tile } from '../lego';
import { LEGO_COLORS } from '../../lib/colors';
import type { Vec3 } from '../../types';

export interface ChairProps {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
  cushionColor?: string;
}

/** Classic wooden LEGO dining chair (facing +Z) */
export const WoodChair: React.FC<ChairProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.brownWood,
  cushionColor,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* 4 legs */}
      <Tile position={[-0.4, 0, -0.4]} size={[0.18, 0.18]} height={0.9} color={LEGO_COLORS.darkWood} />
      <Tile position={[0.4, 0, -0.4]} size={[0.18, 0.18]} height={0.9} color={LEGO_COLORS.darkWood} />
      <Tile position={[-0.4, 0, 0.4]} size={[0.18, 0.18]} height={0.9} color={LEGO_COLORS.darkWood} />
      <Tile position={[0.4, 0, 0.4]} size={[0.18, 0.18]} height={0.9} color={LEGO_COLORS.darkWood} />

      {/* Seat */}
      <Tile position={[0, 0.9, 0]} size={[1.0, 1.0]} height={0.18} color={color} />
      {cushionColor && (
        <Tile position={[0, 1.08, 0.04]} size={[0.84, 0.84]} height={0.12} color={cushionColor} />
      )}

      {/* Backrest posts & horizontal slats */}
      <Tile position={[-0.4, 1.08, -0.42]} size={[0.16, 0.16]} height={1.18} color={LEGO_COLORS.darkWood} />
      <Tile position={[0.4, 1.08, -0.42]} size={[0.16, 0.16]} height={1.18} color={LEGO_COLORS.darkWood} />
      <Tile position={[0, 1.48, -0.42]} size={[0.92, 0.14]} height={0.22} color={color} />
      <Tile position={[0, 1.98, -0.42]} size={[0.98, 0.16]} height={0.28} color={color} />
    </group>
  );
};

/** Indonesian woven rattan dining chair (facing +Z) */
export const RattanChair: React.FC<ChairProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.rattan,
  cushionColor = LEGO_COLORS.creamWall,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Legs with cross braces */}
      <Tile position={[-0.42, 0, -0.42]} size={[0.16, 0.16]} height={0.92} color={color} />
      <Tile position={[0.42, 0, -0.42]} size={[0.16, 0.16]} height={0.92} color={color} />
      <Tile position={[-0.42, 0, 0.42]} size={[0.16, 0.16]} height={0.92} color={color} />
      <Tile position={[0.42, 0, 0.42]} size={[0.16, 0.16]} height={0.92} color={color} />
      <Tile position={[0, 0.35, -0.42]} size={[0.8, 0.1]} height={0.1} color={LEGO_COLORS.brownWood} />
      <Tile position={[0, 0.35, 0.42]} size={[0.8, 0.1]} height={0.1} color={LEGO_COLORS.brownWood} />

      {/* Woven seat frame + soft cushion */}
      <Tile position={[0, 0.92, 0]} size={[1.05, 1.05]} height={0.18} color={color} />
      <Tile position={[0, 1.1, 0.04]} size={[0.86, 0.86]} height={0.14} color={cushionColor} />

      {/* Curved-feel slatted rattan backrest */}
      <Tile position={[-0.44, 1.1, -0.44]} size={[0.15, 0.15]} height={1.25} color={color} />
      <Tile position={[0.44, 1.1, -0.44]} size={[0.15, 0.15]} height={1.25} color={color} />
      {/* Vertical rattan ribs */}
      {[-0.22, 0, 0.22].map((rx) => (
        <Tile key={rx} position={[rx, 1.18, -0.45]} size={[0.1, 0.1]} height={1.0} color={LEGO_COLORS.brownWood} />
      ))}
      <Tile position={[0, 2.16, -0.44]} size={[1.04, 0.18]} height={0.22} color={color} />
    </group>
  );
};

/** Plush tropical rattan armchair for Living Room (facing +Z) */
export const RattanArmchair: React.FC<ChairProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.rattan,
  cushionColor = LEGO_COLORS.pinkCushion,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Legs */}
      <Tile position={[-0.62, 0, -0.58]} size={[0.2, 0.2]} height={0.55} color={LEGO_COLORS.brownWood} />
      <Tile position={[0.62, 0, -0.58]} size={[0.2, 0.2]} height={0.55} color={LEGO_COLORS.brownWood} />
      <Tile position={[-0.62, 0, 0.58]} size={[0.2, 0.2]} height={0.55} color={LEGO_COLORS.brownWood} />
      <Tile position={[0.62, 0, 0.58]} size={[0.2, 0.2]} height={0.55} color={LEGO_COLORS.brownWood} />

      {/* Rattan seat box */}
      <Tile position={[0, 0.5, 0]} size={[1.5, 1.4]} height={0.28} color={color} />

      {/* Woven armrests */}
      <Tile position={[-0.66, 0.78, 0.02]} size={[0.22, 1.32]} height={0.78} color={color} />
      <Tile position={[-0.66, 1.56, 0.02]} size={[0.28, 1.4]} height={0.16} color={LEGO_COLORS.brownWood} />
      <Tile position={[0.66, 0.78, 0.02]} size={[0.22, 1.32]} height={0.78} color={color} />
      <Tile position={[0.66, 1.56, 0.02]} size={[0.28, 1.4]} height={0.16} color={LEGO_COLORS.brownWood} />

      {/* Woven backrest */}
      <Tile position={[0, 0.78, -0.62]} size={[1.5, 0.22]} height={1.42} color={color} />
      <Tile position={[0, 2.2, -0.62]} size={[1.56, 0.26]} height={0.18} color={LEGO_COLORS.brownWood} />

      {/* Thick seat & back cushions */}
      <Tile position={[0, 0.78, 0.1]} size={[1.08, 1.1]} height={0.32} color={cushionColor} />
      <Tile position={[0, 1.1, -0.36]} size={[1.04, 0.28]} height={0.88} color={LEGO_COLORS.pinkLight} />
    </group>
  );
};

/** Classic colorful tropical outdoor plastic monobloc LEGO chair (facing +Z) */
export const PlasticChair: React.FC<ChairProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.brightGreen,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Slightly splayed sturdy plastic legs */}
      <Tile position={[-0.44, 0, -0.44]} size={[0.16, 0.16]} height={0.86} color={color} />
      <Tile position={[0.44, 0, -0.44]} size={[0.16, 0.16]} height={0.86} color={color} />
      <Tile position={[-0.44, 0, 0.44]} size={[0.16, 0.16]} height={0.86} color={color} />
      <Tile position={[0.44, 0, 0.44]} size={[0.16, 0.16]} height={0.86} color={color} />

      {/* Molded seat */}
      <Plate position={[0, 0.86, 0]} size={[1.08, 0.45, 1.08]} color={color} studs={false} />

      {/* Plastic armrests */}
      <Tile position={[-0.5, 1.04, 0.0]} size={[0.14, 0.96]} height={0.46} color={color} />
      <Tile position={[0.5, 1.04, 0.0]} size={[0.14, 0.96]} height={0.46} color={color} />

      {/* Slatted backrest */}
      <Tile position={[-0.45, 1.04, -0.46]} size={[0.16, 0.14]} height={1.12} color={color} />
      <Tile position={[0.45, 1.04, -0.46]} size={[0.16, 0.14]} height={1.12} color={color} />
      <Tile position={[0, 1.92, -0.46]} size={[1.06, 0.14]} height={0.28} color={color} />
      <Tile position={[0, 1.54, -0.46]} size={[0.82, 0.1]} height={0.22} color={color} />
      <Tile position={[0, 1.24, -0.46]} size={[0.82, 0.1]} height={0.18} color={color} />
    </group>
  );
};

/** Small LEGO terrace / vanity stool */
export const Stool: React.FC<ChairProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = LEGO_COLORS.red,
  cushionColor,
}) => {
  return (
    <group position={position} rotation={rotation}>
      <Tile position={[-0.32, 0, -0.32]} size={[0.15, 0.15]} height={0.78} color={color} />
      <Tile position={[0.32, 0, -0.32]} size={[0.15, 0.15]} height={0.78} color={color} />
      <Tile position={[-0.32, 0, 0.32]} size={[0.15, 0.15]} height={0.78} color={color} />
      <Tile position={[0.32, 0, 0.32]} size={[0.15, 0.15]} height={0.78} color={color} />
      {/* Cross support */}
      <Tile position={[0, 0.32, 0]} size={[0.68, 0.12]} height={0.1} color={color} />
      <Tile position={[0, 0.32, 0]} size={[0.12, 0.68]} height={0.1} color={color} />
      {/* Seat top */}
      <Tile position={[0, 0.78, 0]} size={[0.88, 0.88]} height={0.18} color={color} />
      {cushionColor && (
        <Tile position={[0, 0.96, 0]} size={[0.74, 0.74]} height={0.14} color={cushionColor} />
      )}
    </group>
  );
};
