import React from 'react';
import type { MinifigConfig } from './types';

export interface MinifigAvatarProps {
  character: MinifigConfig;
  size?: number;
  className?: string;
}

/**
 * Dynamic SVG Minifigure Portrait synchronized directly to MinifigConfig
 * so every outfit, skin tone, hair, hat, face, and accessory change reflects immediately
 * in the Character Dock, CharacterCard, and Character Creator!
 */
export const MinifigAvatar: React.FC<MinifigAvatarProps> = ({
  character,
  size = 48,
  className = '',
}) => {
  const skin = character.skinColor || '#FAD21B';
  const hair = character.hairColor || '#4E2E18';
  const hat = character.headwearColor || '#F7F7F5';
  const { face, hairStyle, headwear, accessories } = character;

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-2xl border-2 border-white/85 shadow-inner',
        className,
      ].join(' ')}
      style={{
        width: size,
        height: size,
        backgroundColor: character.avatarBg || character.torsoColor || '#F6EBD4',
      }}
    >
      <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" className="block h-full w-full">
        <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.22)" />
        <circle cx="24" cy="18" r="24" fill="rgba(255,255,255,0.25)" />

        {/* Rear Hair (sanggul / long / ponytail / hijab) */}
        {hairStyle === 'sanggul' && (
          <g>
            <circle cx="57" cy="27" r="10.5" fill={hair} />
            <circle cx="55" cy="23" r="2.8" fill="#FFFFFF" />
            <circle cx="59" cy="26" r="2.2" fill="#F6C915" />
          </g>
        )}
        {hairStyle === 'ponytail' && (
          <path d="M54 27 Q66 32 61 48 Q56 42 54 32 Z" fill={hair} />
        )}
        {hairStyle === 'long' && (
          <rect x="21" y="26" width="38" height="34" rx="12" fill={hair} />
        )}
        {hairStyle === 'hijab' && (
          <path d="M18 42 C18 20, 28 16, 40 16 C52 16, 62 20, 62 42 L64 66 L16 66 Z" fill={hair} />
        )}

        {/* Arms & Torso */}
        <path d="M25 58 C18 60, 16 70, 17 82 L27 82 L27 58 Z" fill={character.armColor} />
        <path d="M55 58 C62 60, 64 70, 63 82 L53 82 L53 58 Z" fill={character.armColor} />
        <path d="M25 57 Q40 53 55 57 L58 82 L22 82 Z" fill={character.torsoColor} />

        {/* Torso style accent */}
        {character.torsoStyle === 'apron' && (
          <path d="M30 61 L50 61 L52 82 L28 82 Z" fill={character.torsoSecondaryColor} />
        )}
        {character.torsoStyle === 'hoodie' && (
          <g>
            <line x1="36" y1="60" x2="36" y2="72" stroke={character.torsoSecondaryColor} strokeWidth="2" />
            <line x1="44" y1="60" x2="44" y2="72" stroke={character.torsoSecondaryColor} strokeWidth="2" />
          </g>
        )}
        {character.torsoStyle === 'kebaya' && (
          <g>
            <path d="M33 56 L40 67 L47 56" fill="none" stroke={character.torsoSecondaryColor} strokeWidth="2.4" />
            <path d="M40 62 L43 66 L40 70 L37 66 Z" fill="#E6A82E" />
          </g>
        )}
        {character.torsoStyle === 'hawaiian' && (
          <g>
            <circle cx="32" cy="66" r="3" fill="#F6C915" />
            <circle cx="48" cy="70" r="3" fill="#F07DA8" />
          </g>
        )}

        {/* Neck Accessories */}
        {accessories.neckSlot === 'camera' && (
          <g>
            <path d="M30 56 L40 68 L50 56" fill="none" stroke="#202226" strokeWidth="1.8" />
            <rect x="33.5" y="66" width="13" height="8" rx="2" fill="#202226" />
            <circle cx="40" cy="70" r="2.5" fill="#C0C6CC" />
          </g>
        )}
        {accessories.neckSlot === 'scarf' && (
          <rect x="28" y="52" width="24" height="7" rx="3" fill="#D92B2B" />
        )}

        {/* Neck & Head */}
        <rect x="34" y="49" width="12" height="8" rx="2" fill={skin} opacity="0.88" />
        <rect x="33" y="21" width="14" height="6" rx="2" fill={skin} />
        <rect
          x="25"
          y="26"
          width="30"
          height="26"
          rx={character.headShape === 'round' ? 13 : 8.5}
          fill={skin}
        />
        <rect x="28.5" y="29.5" width="3.5" height="16" rx="1.75" fill="rgba(255,255,255,0.38)" />

        {/* Blush & Freckles */}
        {face.blush && (
          <g fill="#F46FA4" opacity="0.42">
            <ellipse cx="30.5" cy="43" rx="2.4" ry="1.4" />
            <ellipse cx="49.5" cy="43" rx="2.4" ry="1.4" />
          </g>
        )}
        {face.freckles && (
          <g fill="#8B5533" opacity="0.55">
            <circle cx="30" cy="42" r="0.8" />
            <circle cx="32" cy="43.5" r="0.8" />
            <circle cx="50" cy="42" r="0.8" />
            <circle cx="48" cy="43.5" r="0.8" />
          </g>
        )}

        {/* Eyes */}
        {face.eyes === 'wink' ? (
          <>
            <circle cx="34" cy="39" r="2.2" fill="#1C1E24" />
            <path d="M43.5 39.5 Q46 37 48.5 39.5" fill="none" stroke="#1C1E24" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : face.eyes === 'sleepy' ? (
          <g stroke="#1C1E24" strokeWidth="1.8" strokeLinecap="round">
            <line x1="31.5" y1="39" x2="36.5" y2="39" />
            <line x1="43.5" y1="39" x2="48.5" y2="39" />
          </g>
        ) : (
          <g>
            <circle cx="34" cy="39" r={face.eyes === 'oval' ? 2.4 : 2.1} fill="#1C1E24" />
            <circle cx="34.6" cy="38.2" r="0.7" fill="#FFFFFF" />
            <circle cx="46" cy="39" r={face.eyes === 'oval' ? 2.4 : 2.1} fill="#1C1E24" />
            <circle cx="46.6" cy="38.2" r="0.7" fill="#FFFFFF" />
          </g>
        )}

        {/* Glasses / Sunglasses */}
        {(face.eyes === 'glasses' || accessories.faceSlot !== 'none') && (
          <g stroke="#1E293B" strokeWidth="1.5">
            <rect
              x="29.5"
              y="35.5"
              width="9"
              height="7"
              rx="2"
              fill={accessories.faceSlot === 'sunglasses' ? '#111827' : 'rgba(203,239,255,0.35)'}
            />
            <rect
              x="41.5"
              y="35.5"
              width="9"
              height="7"
              rx="2"
              fill={accessories.faceSlot === 'sunglasses' ? '#111827' : 'rgba(203,239,255,0.35)'}
            />
            <line x1="38.5" y1="38.5" x2="41.5" y2="38.5" />
          </g>
        )}

        {/* Mouth */}
        {face.mouth === 'laugh' ? (
          <path d="M34 44.5 Q40 50.5 46 44.5 Z" fill="#1C1E24" />
        ) : face.mouth === 'surprised' ? (
          <circle cx="40" cy="46.5" r="2.6" fill="#1C1E24" />
        ) : face.mouth === 'neutral' ? (
          <line x1="36" y1="46.5" x2="44" y2="46.5" stroke="#1C1E24" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M35 45.2 Q40 49 45 45.2" fill="none" stroke="#1C1E24" strokeWidth="1.9" strokeLinecap="round" />
        )}

        {/* Mustache / Beard */}
        {(face.facialHair === 'mustache' || face.facialHair === 'beard') && (
          <path d="M33 44.5 Q40 42 47 44.5 Q40 47 33 44.5 Z" fill="#5C3A24" />
        )}

        {/* Front Hair */}
        {hairStyle !== 'none' && hairStyle !== 'hijab' && (
          <g fill={hair}>
            {hairStyle === 'curly' ? (
              <>
                <circle cx="30" cy="23" r="6" />
                <circle cx="40" cy="20" r="7" />
                <circle cx="50" cy="23" r="6" />
                <circle cx="24" cy="29" r="5" />
                <circle cx="56" cy="29" r="5" />
              </>
            ) : hairStyle === 'mohawk' ? (
              <rect x="36.5" y="13" width="7" height="15" rx="2" />
            ) : (
              <path d="M23.5 34 C23 22, 30 16, 40 16 C50 16, 57 22, 56.5 34 C53 28, 47 26, 40 27 C33 26, 27 28, 23.5 34 Z" />
            )}
          </g>
        )}

        {/* Headwear */}
        {headwear === 'chef-hat' && (
          <g>
            <path d="M25 26 C21 22, 22 13, 30 13 C32 7, 48 7, 50 13 C58 13, 59 22, 55 26 Z" fill={hat} stroke="#CBD5E1" strokeWidth="1" />
            <rect x="25" y="23.5" width="30" height="5" rx="2" fill={hat} />
          </g>
        )}
        {headwear === 'bucket-hat' && (
          <g>
            <path d="M26 25 L29 14 Q40 11 51 14 L54 25 Z" fill={hat} />
            <path d="M17 29.5 Q40 22 63 29.5 Q40 32.5 17 29.5 Z" fill={hat} stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          </g>
        )}
        {headwear === 'baseball-cap' && (
          <g fill={hat}>
            <path d="M25 26 C25 16, 55 16, 55 26 Z" />
            <rect x="24" y="24" width="38" height="4" rx="2" />
          </g>
        )}
        {headwear === 'peci' && (
          <rect x="25" y="15" width="30" height="12" rx="3" fill={hat} />
        )}
        {headwear === 'crown' && (
          <path d="M27 26 L27 16 L34 21 L40 14 L46 21 L53 16 L53 26 Z" fill="#E6A82E" />
        )}
        {headwear === 'helmet' && (
          <path d="M22 33 C22 14, 58 14, 58 33 Z" fill={hat} opacity="0.92" />
        )}
        {headwear === 'bandana' && (
          <rect x="24" y="23" width="32" height="5.5" rx="2" fill={hat} />
        )}

        {/* Over-ear Headphones */}
        {accessories.headSlot === 'headphones' && (
          <g>
            <path d="M21.5 38 C21 20, 30 12.5, 40 12.5 C50 12.5, 59 20, 58.5 38" fill="none" stroke="#202226" strokeWidth="3.8" strokeLinecap="round" />
            <rect x="18" y="33" width="6.5" height="12" rx="3" fill="#202226" />
            <rect x="55.5" y="33" width="6.5" height="12" rx="3" fill="#202226" />
            <rect x="19.5" y="35.5" width="2.8" height="7" rx="1.4" fill="#5BB6E5" />
            <rect x="57.7" y="35.5" width="2.8" height="7" rx="1.4" fill="#5BB6E5" />
          </g>
        )}
      </svg>
    </div>
  );
};
