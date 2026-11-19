import React from 'react';
import { Html } from '@react-three/drei';
import { Laptop } from 'lucide-react';

export interface CharacterOverheadUIProps {
  speechText: string | null;
  isWorking: boolean;
  isSleeping?: boolean;
  hidden?: boolean;
  yOffset?: number;
}

/**
 * Compact floating overhead indicator:
 * - Slim, wide horizontal chat speech pill with light readable font
 * - Animated green Working badge (strictly when OpenBot status === 'working')
 * - Soft floating "Zzz" pill when sleeping on a bed
 */
export const CharacterOverheadUI: React.FC<CharacterOverheadUIProps> = ({
  speechText,
  isWorking,
  isSleeping = false,
  hidden = false,
  yOffset = 3.7,
}) => {
  if (hidden || (!speechText && !isWorking && !isSleeping)) return null;

  return (
    <Html
      position={[0, yOffset, 0]}
      center
      distanceFactor={24}
      zIndexRange={[15, 0]}
      style={{ pointerEvents: 'none' }}
    >
      {speechText ? (
        <div className="relative w-max max-w-[270px] rounded-full border border-amber-400/90 bg-white/95 px-2.5 py-0.5 text-center font-sans text-[10px] font-normal leading-tight text-slate-700 shadow-[0_3px_10px_rgba(15,23,42,0.16)]">
          <span className="block truncate">{speechText}</span>
          <span
            aria-hidden="true"
            className="absolute -bottom-[4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-amber-400/90 bg-white"
          />
        </div>
      ) : isWorking ? (
        <div className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-400 bg-emerald-600/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">
          <Laptop className="h-2.5 w-2.5 shrink-0" />
          <span>Working</span>
        </div>
      ) : isSleeping ? (
        <div className="whitespace-nowrap rounded-full border border-sky-300/80 bg-white/90 px-2 py-0.5 text-[10px] font-medium tracking-wider text-sky-600 shadow-sm animate-pulse">
          Zzz…
        </div>
      ) : null}
    </Html>
  );
};
