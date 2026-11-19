import * as THREE from 'three';
import type {
  BottomPattern,
  MinifigFaceConfig,
  TorsoPattern,
  TorsoStyle,
} from './types';

const faceTextureCache = new Map<string, THREE.CanvasTexture>();
const torsoTextureCache = new Map<string, THREE.CanvasTexture>();
const bottomTextureCache = new Map<string, THREE.CanvasTexture>();

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates & caches a crisp 512x256 cylindrical wrap LEGO face CanvasTexture
 * keyed strictly by skinColor + face config combination.
 */
export function getCachedFaceTexture(
  skinColor: string,
  face: MinifigFaceConfig
): THREE.CanvasTexture {
  const key = `${skinColor}|${face.eyes}|${face.eyebrows}|${face.mouth}|${face.blush ? 1 : 0}|${face.freckles ? 1 : 0}|${face.facialHair}`;
  const cached = faceTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 512, 256);

  // Cylinder wrap front center in Three.js CylinderGeometry is u = 0.5 -> x = 256
  const cx = 256;
  const eyeY = 114;
  const eyeSep = 40;

  // 1. Rosy cheeks
  if (face.blush) {
    ctx.fillStyle = 'rgba(244, 111, 164, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx - 56, 146, 15, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 56, 146, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Freckles
  if (face.freckles) {
    ctx.fillStyle = 'rgba(139, 85, 51, 0.55)';
    const dots = [
      [-60, 140], [-52, 147], [-45, 141],
      [60, 140], [52, 147], [45, 141],
    ];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(cx + dx, dy, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Eyes
  ctx.fillStyle = '#181A20';
  ctx.strokeStyle = '#181A20';
  ctx.lineCap = 'round';

  const drawDotEye = (ex: number, r = 11) => {
    ctx.beginPath();
    ctx.arc(ex, eyeY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 3.5, eyeY - 3.5, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#181A20';
  };

  if (face.eyes === 'dot' || face.eyes === 'glasses') {
    drawDotEye(cx - eyeSep, 11.5);
    drawDotEye(cx + eyeSep, 11.5);
  } else if (face.eyes === 'oval') {
    for (const ex of [cx - eyeSep, cx + eyeSep]) {
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 9.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 2.5, eyeY - 4.5, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#181A20';
    }
  } else if (face.eyes === 'sleepy') {
    for (const ex of [cx - eyeSep, cx + eyeSep]) {
      ctx.beginPath();
      ctx.arc(ex, eyeY + 2, 10, 0, Math.PI);
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(ex - 13, eyeY + 1);
      ctx.lineTo(ex + 13, eyeY + 1);
      ctx.stroke();
    }
  } else if (face.eyes === 'wink') {
    drawDotEye(cx - eyeSep, 11.5);
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(cx + eyeSep, eyeY + 4, 12, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  // Printed glasses if face.eyes === 'glasses'
  if (face.eyes === 'glasses') {
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 5;
    ctx.fillStyle = 'rgba(203, 239, 255, 0.28)';
    for (const ex of [cx - eyeSep, cx + eyeSep]) {
      ctx.beginPath();
      ctx.roundRect(ex - 22, eyeY - 17, 44, 34, 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - eyeSep + 22, eyeY - 2);
    ctx.lineTo(cx + eyeSep - 22, eyeY - 2);
    ctx.stroke();
  }

  // 4. Eyebrows
  ctx.strokeStyle = '#2B1B12';
  ctx.lineWidth = face.eyebrows === 'thick' ? 8 : 5;
  ctx.lineCap = 'round';
  const browY = face.eyebrows === 'raised' ? 80 : 88;
  for (const side of [-1, 1]) {
    const bx = cx + side * eyeSep;
    ctx.beginPath();
    if (face.eyebrows === 'angry') {
      ctx.moveTo(bx - side * 14, browY - 4);
      ctx.lineTo(bx + side * 14, browY + 8);
    } else if (face.eyebrows === 'raised') {
      ctx.moveTo(bx - 13, browY + 5);
      ctx.quadraticCurveTo(bx, browY - 9, bx + 13, browY + 4);
    } else {
      ctx.moveTo(bx - 13, browY + 2);
      ctx.quadraticCurveTo(bx, browY - 5, bx + 13, browY + 2);
    }
    ctx.stroke();
  }

  // 5. Mouth
  ctx.strokeStyle = '#181A20';
  ctx.fillStyle = '#181A20';
  ctx.lineWidth = 6;
  const mouthY = 160;
  if (face.mouth === 'smile') {
    ctx.beginPath();
    ctx.arc(cx, mouthY - 12, 26, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
  } else if (face.mouth === 'laugh') {
    ctx.beginPath();
    ctx.moveTo(cx - 28, mouthY - 4);
    ctx.quadraticCurveTo(cx, mouthY + 34, cx + 28, mouthY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 20, mouthY - 3, 40, 8);
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + 13, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (face.mouth === 'neutral') {
    ctx.beginPath();
    ctx.moveTo(cx - 18, mouthY + 4);
    ctx.lineTo(cx + 18, mouthY + 4);
    ctx.stroke();
  } else if (face.mouth === 'surprised') {
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + 4, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (face.mouth === 'tongue') {
    ctx.beginPath();
    ctx.arc(cx, mouthY - 10, 24, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.ellipse(cx + 11, mouthY + 15, 9, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#181A20';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 6. Facial Hair (mustache / beard)
  if (face.facialHair === 'mustache' || face.facialHair === 'beard') {
    ctx.fillStyle = '#4A2B18';
    ctx.beginPath();
    ctx.moveTo(cx, 146);
    ctx.bezierCurveTo(cx - 14, 138, cx - 28, 152, cx - 38, 146);
    ctx.bezierCurveTo(cx - 28, 162, cx - 10, 158, cx, 152);
    ctx.bezierCurveTo(cx + 10, 158, cx + 28, 162, cx + 38, 146);
    ctx.bezierCurveTo(cx + 28, 152, cx + 14, 138, cx, 146);
    ctx.fill();
  }
  if (face.facialHair === 'beard') {
    ctx.fillStyle = 'rgba(74, 43, 24, 0.85)';
    ctx.beginPath();
    ctx.moveTo(cx - 46, 152);
    ctx.quadraticCurveTo(cx - 44, 212, cx, 218);
    ctx.quadraticCurveTo(cx + 44, 212, cx + 46, 152);
    ctx.lineTo(cx + 34, 158);
    ctx.quadraticCurveTo(cx, 198, cx - 34, 158);
    ctx.closePath();
    ctx.fill();
  }

  const tex = makeTexture(canvas);
  faceTextureCache.set(key, tex);
  return tex;
}

/**
 * Generates & caches a crisp 256x256 front torso decal CanvasTexture
 * supporting all 10 torso styles + 5 print patterns!
 */
export function getCachedTorsoTexture(
  style: TorsoStyle,
  primary: string,
  secondary: string,
  pattern: TorsoPattern
): THREE.CanvasTexture {
  const key = `${style}|${primary}|${secondary}|${pattern}`;
  const cached = torsoTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 256, 256);

  // Base print pattern
  if (pattern === 'stripes') {
    ctx.fillStyle = secondary;
    for (let y = 24; y < 245; y += 34) {
      ctx.fillRect(0, y, 256, 14);
    }
  } else if (pattern === 'floral' || style === 'hawaiian') {
    const flowers = [
      [52, 68, '#F6C915'],
      [196, 84, '#F07DA8'],
      [88, 174, '#F07818'],
      [178, 196, '#F6C915'],
      [130, 118, secondary],
    ] as const;
    for (const [fx, fy, col] of flowers) {
      ctx.fillStyle = '#52BA4E';
      ctx.beginPath();
      ctx.ellipse(fx + 14, fy + 10, 14, 7, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * 9, fy + Math.sin(a) * 9, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'batik') {
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 4;
    for (let gx = 24; gx < 256; gx += 48) {
      for (let gy = 24; gy < 256; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, gy - 14);
        ctx.lineTo(gx + 14, gy);
        ctx.lineTo(gx, gy + 14);
        ctx.lineTo(gx - 14, gy);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'logo') {
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.arc(128, 118, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(128, 90);
    ctx.lineTo(137, 110);
    ctx.lineTo(158, 112);
    ctx.lineTo(142, 126);
    ctx.lineTo(146, 146);
    ctx.lineTo(128, 136);
    ctx.lineTo(110, 146);
    ctx.lineTo(114, 126);
    ctx.lineTo(98, 112);
    ctx.lineTo(119, 110);
    ctx.closePath();
    ctx.fill();
  }

  // Style-specific garment overlay
  if (style === 'apron') {
    // Crisp chef apron & pocket
    ctx.fillStyle = secondary;
    ctx.fillRect(66, 0, 18, 60);
    ctx.fillRect(172, 0, 18, 60);
    ctx.fillRect(46, 52, 164, 204);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 4;
    ctx.strokeRect(46, 52, 164, 204);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(88, 148, 80, 56);
    // Collar scarf
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(92, 0);
    ctx.lineTo(128, 46);
    ctx.lineTo(164, 0);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'hoodie') {
    // Drawstrings + kangaroo pocket
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 0, 48, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(106, 26);
    ctx.lineTo(106, 108);
    ctx.moveTo(150, 26);
    ctx.lineTo(150, 108);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.roundRect(60, 166, 136, 68, 14);
    ctx.fill();
  } else if (style === 'shirt' || style === 'school-uniform') {
    // Button placket + collar + optional tie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(86, 0);
    ctx.lineTo(128, 42);
    ctx.lineTo(170, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(128, 42);
    ctx.lineTo(128, 256);
    ctx.stroke();
    if (style === 'school-uniform') {
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(118, 30);
      ctx.lineTo(138, 30);
      ctx.lineTo(144, 152);
      ctx.lineTo(128, 174);
      ctx.lineTo(112, 152);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = secondary;
      for (let by = 68; by <= 220; by += 38) {
        ctx.beginPath();
        ctx.arc(128, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (style === 'jacket' || style === 'suit') {
    // Inner shirt V + lapels
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(86, 0);
    ctx.lineTo(170, 0);
    ctx.lineTo(148, 256);
    ctx.lineTo(108, 256);
    ctx.closePath();
    ctx.fill();
    if (style === 'suit') {
      ctx.fillStyle = '#D92B2B';
      ctx.beginPath();
      ctx.moveTo(120, 16);
      ctx.lineTo(136, 16);
      ctx.lineTo(140, 180);
      ctx.lineTo(128, 200);
      ctx.lineTo(116, 180);
      ctx.closePath();
      ctx.fill();
    }
    // Zipper / lapel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(86, 0);
    ctx.lineTo(108, 256);
    ctx.moveTo(170, 0);
    ctx.lineTo(148, 256);
    ctx.stroke();
  } else if (style === 'kebaya') {
    // Traditional Indonesian Kebaya neckline + golden brocade & bros
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(82, 0);
    ctx.lineTo(128, 92);
    ctx.lineTo(174, 0);
    ctx.stroke();
    // Golden bros (brooch)
    ctx.fillStyle = '#E6A82E';
    ctx.beginPath();
    ctx.moveTo(128, 66);
    ctx.lineTo(144, 88);
    ctx.lineTo(128, 112);
    ctx.lineTo(112, 88);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFF7CC';
    ctx.beginPath();
    ctx.arc(128, 88, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'jersey') {
    // Sports number & stripe trim
    ctx.fillStyle = secondary;
    ctx.fillRect(0, 212, 256, 22);
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', 128, 124);
  } else if (style === 'tshirt') {
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 0, 38, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  const tex = makeTexture(canvas);
  torsoTextureCache.set(key, tex);
  return tex;
}

/**
 * Generates & caches a 128x128 leg/skirt CanvasTexture for batik, jeans, or striped bottoms.
 */
export function getCachedBottomTexture(
  color: string,
  pattern: BottomPattern
): THREE.CanvasTexture | null {
  if (pattern === 'solid') return null;
  const key = `${color}|${pattern}`;
  const cached = bottomTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);

  if (pattern === 'batik') {
    ctx.strokeStyle = '#E6A82E';
    ctx.lineWidth = 3;
    for (let x = 16; x < 128; x += 32) {
      for (let y = 16; y < 128; y += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x - 10, y);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#F6EBD4';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'jeans') {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    for (let y = 4; y < 128; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y + 4);
      ctx.stroke();
    }
    ctx.strokeStyle = '#E6A82E';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 8, 108, 34);
  } else if (pattern === 'stripes') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 12; x < 128; x += 24) {
      ctx.fillRect(x, 0, 8, 128);
    }
  }

  const tex = makeTexture(canvas);
  bottomTextureCache.set(key, tex);
  return tex;
}
