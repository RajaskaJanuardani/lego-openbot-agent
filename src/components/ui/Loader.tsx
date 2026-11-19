import React, { useEffect, useState } from 'react';

export interface LoaderProps {
  isReady: boolean;
  isNight?: boolean;
}

interface StackBrickSpec {
  id: string;
  color: string;
  shadowColor: string;
  studHighlight: string;
  widthClass: string;
  animationName: string;
}

const STACK_BRICKS: StackBrickSpec[] = [
  {
    id: 'pink-top',
    color: '#F07DA8',
    shadowColor: '#C21878',
    studHighlight: '#F9C6D9',
    widthClass: 'w-20',
    animationName: 'legoDrop3',
  },
  {
    id: 'yellow-mid',
    color: '#F6C915',
    shadowColor: '#C49A00',
    studHighlight: '#FFE87A',
    widthClass: 'w-24',
    animationName: 'legoDrop2',
  },
  {
    id: 'red-mid',
    color: '#D92B2B',
    shadowColor: '#991B1B',
    studHighlight: '#F87171',
    widthClass: 'w-28',
    animationName: 'legoDrop1',
  },
  {
    id: 'mint-base',
    color: '#8FD6BE',
    shadowColor: '#4BA085',
    studHighlight: '#C2ECE0',
    widthClass: 'w-32',
    animationName: 'legoDrop0',
  },
];

const LOADER_STYLES = `
@keyframes legoDrop0 {
  0%   { opacity: 0; transform: translateY(-48px) scale(0.92); }
  10%  { opacity: 1; transform: translateY(3px) scale(1.03, 0.96); }
  15%  { opacity: 1; transform: translateY(0) scale(1); }
  84%  { opacity: 1; transform: translateY(0) scale(1); }
  94%  { opacity: 0; transform: translateY(10px) scale(0.95); }
  100% { opacity: 0; transform: translateY(-48px) scale(0.92); }
}
@keyframes legoDrop1 {
  0%, 15% { opacity: 0; transform: translateY(-54px) scale(0.92); }
  26%     { opacity: 1; transform: translateY(3px) scale(1.03, 0.96); }
  31%     { opacity: 1; transform: translateY(0) scale(1); }
  84%     { opacity: 1; transform: translateY(0) scale(1); }
  94%     { opacity: 0; transform: translateY(10px) scale(0.95); }
  100%    { opacity: 0; transform: translateY(-54px) scale(0.92); }
}
@keyframes legoDrop2 {
  0%, 31% { opacity: 0; transform: translateY(-60px) scale(0.92); }
  42%     { opacity: 1; transform: translateY(3px) scale(1.03, 0.96); }
  47%     { opacity: 1; transform: translateY(0) scale(1); }
  84%     { opacity: 1; transform: translateY(0) scale(1); }
  94%     { opacity: 0; transform: translateY(10px) scale(0.95); }
  100%    { opacity: 0; transform: translateY(-60px) scale(0.92); }
}
@keyframes legoDrop3 {
  0%, 47% { opacity: 0; transform: translateY(-66px) scale(0.92); }
  58%     { opacity: 1; transform: translateY(3px) scale(1.04, 0.95); }
  64%     { opacity: 1; transform: translateY(0) scale(1); }
  84%     { opacity: 1; transform: translateY(0) scale(1); }
  94%     { opacity: 0; transform: translateY(10px) scale(0.95); }
  100%    { opacity: 0; transform: translateY(-66px) scale(0.92); }
}
@keyframes legoPulseDot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
  40% { transform: translateY(-5px); opacity: 1; }
}
@keyframes legoShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(260%); }
}
`;

export const Loader: React.FC<LoaderProps> = ({ isReady, isNight = false }) => {
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    const timer = window.setTimeout(() => {
      setUnmounted(true);
    }, 560);
    return () => window.clearTimeout(timer);
  }, [isReady]);

  if (unmounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat rumah LEGO 3D"
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ease-out',
        isReady ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100',
      ].join(' ')}
      style={{
        background: isNight
          ? 'radial-gradient(circle at 50% 35%, #1A3461 0%, #0C1428 72%, #060B18 100%)'
          : 'radial-gradient(circle at 50% 30%, #BCE8FF 0%, #87CEEB 48%, #F6EBD4 100%)',
      }}
    >
      <style>{LOADER_STYLES}</style>

      {/* Subtle LEGO stud pattern backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: isNight
            ? 'radial-gradient(rgba(148, 185, 255, 0.35) 2.5px, transparent 2.5px)'
            : 'radial-gradient(rgba(255, 255, 255, 0.75) 2.5px, transparent 2.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Central card */}
      <div
        className={[
          'relative flex flex-col items-center rounded-3xl border-2 px-9 py-8 shadow-2xl backdrop-blur-md',
          isNight
            ? 'border-indigo-400/30 bg-slate-900/75 text-white'
            : 'border-white/80 bg-white/80 text-slate-800',
        ].join(' ')}
      >
        {/* Animated stacking LEGO bricks */}
        <div className="relative flex h-36 w-40 flex-col items-center justify-end pb-1">
          <div className="flex flex-col items-center">
            {STACK_BRICKS.map((brick) => (
              <div
                key={brick.id}
                className={`relative h-6 ${brick.widthClass} rounded-[5px]`}
                style={{
                  backgroundColor: brick.color,
                  boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 ${brick.shadowColor}, 0 4px 10px rgba(15,23,42,0.18)`,
                  animation: `${brick.animationName} 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite`,
                }}
              >
                {/* Raised circular LEGO studs along top edge */}
                <div className="absolute -top-[6px] inset-x-2 flex justify-around">
                  {[0, 1, 2].map((studIdx) => (
                    <span
                      key={studIdx}
                      className="block h-[6px] w-3.5 rounded-t-[3px]"
                      style={{
                        backgroundColor: brick.color,
                        boxShadow: `inset 0 1.5px 0 ${brick.studHighlight}, inset -1px 0 0 ${brick.shadowColor}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Green LEGO baseplate under the stack */}
          <div
            className="mt-0.5 h-2.5 w-36 rounded-sm"
            style={{
              backgroundColor: '#52BA4E',
              boxShadow: 'inset 0 1px 0 #8BE087, inset 0 -2px 0 #1E6B34, 0 4px 8px rgba(15,23,42,0.2)',
            }}
          />
        </div>

        {/* Title & loading text */}
        <h1
          className={[
            "mt-4 font-['Lilita_One',_'Fredoka',_sans-serif] text-2xl sm:text-3xl tracking-wide",
            isNight ? 'text-amber-200' : 'text-slate-900',
          ].join(' ')}
        >
          LEGO OpenBot Agent
        </h1>

        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={[
              "font-['Fredoka',_sans-serif] text-sm font-semibold tracking-wide",
              isNight ? 'text-sky-200' : 'text-slate-600',
            ].join(' ')}
          >
            Menyusun Bata LEGO
          </span>
          <span className="inline-flex items-center gap-1 pt-0.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: dot === 0 ? '#D92B2B' : dot === 1 ? '#F6C915' : '#2E9E47',
                  animation: `legoPulseDot 1.1s ease-in-out ${dot * 0.16}s infinite`,
                }}
              />
            ))}
          </span>
        </div>

        {/* Playful LEGO progress strip */}
        <div
          className={[
            'mt-4 h-2 w-48 overflow-hidden rounded-full',
            isNight ? 'bg-slate-800' : 'bg-slate-200/90',
          ].join(' ')}
        >
          <div
            className="h-full w-20 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #D92B2B 0%, #F6C915 50%, #F07DA8 100%)',
              animation: 'legoShimmer 1.35s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
};
