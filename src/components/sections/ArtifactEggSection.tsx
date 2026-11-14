'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { sounds } from '@/lib/sound';
import {
  CONSTELLATION_FONT_CLASSES,
  ConstellationScript,
  SCRIPT_FONT_FAMILIES,
} from '@/lib/constellation-fonts';
import { EggGreetingConstellation, EGG_GREETINGS } from './EggGreetingConstellation';

const MAX_TAPS = 5;
const VIEW_W = 480;
const VIEW_H = 360;
const PX_SCALE = 1.5;
const CANVAS_W = VIEW_W * PX_SCALE; // 720
const CANVAS_H = VIEW_H * PX_SCALE; // 540

// Ovoid parameters centered inside the 480x360 exhibition plate
const EGG_CX = 240;
const EGG_CY = 166;
const EGG_RX = 82;
const EGG_RY = 104;

// Floor plane band where fallen fragments bounce and settle across the bottom
const FLOOR_GLOW_Y = 286;
const SHATTER_GRAVITY = 1580;

interface FragmentConfig {
  ux: number;
  uy: number;
  crackStage: 1 | 2 | 3 | 4;
  targetX: number; // resting SVG center X [108..368] for wide edge clearance
  groundY: number; // resting SVG floor plane Y [266..318]
  vy0: number;
  targetRot: number; // resting radians
  flipRest: boolean; // true = tumbles concave-shell-up to reveal hollow interior
  spinDir: 1 | -1; // continuous tumble direction
  restPitchScale: number; // perspective tabletop compression on settle
}

const FRAGMENT_CONFIGS: ReadonlyArray<FragmentConfig> = [
  // Asymmetric outer wing shards (coordinated fall arc inside [108..368] so pieces never clip or lag)
  { ux: -0.22, uy: -0.70, crackStage: 3, targetX: 112, groundY: 300, vy0: -128, targetRot: -2.42, flipRest: true, spinDir: -1, restPitchScale: 0.46 },
  { ux: 0.24, uy: -0.66, crackStage: 1, targetX: 368, groundY: 274, vy0: -124, targetRot: 2.18, flipRest: false, spinDir: 1, restPitchScale: 0.48 },
  { ux: -0.56, uy: -0.28, crackStage: 3, targetX: 108, groundY: 270, vy0: -102, targetRot: -1.62, flipRest: false, spinDir: -1, restPitchScale: 0.46 },
  { ux: 0.56, uy: -0.24, crackStage: 1, targetX: 354, groundY: 298, vy0: -98, targetRot: 1.38, flipRest: true, spinDir: 1, restPitchScale: 0.48 },
  { ux: 0.66, uy: 0.28, crackStage: 2, targetX: 332, groundY: 318, vy0: -72, targetRot: 0.78, flipRest: false, spinDir: 1, restPitchScale: 0.52 },

  // Inner-mid scatter ring across back & foreground depths
  { ux: 0.02, uy: -0.40, crackStage: 2, targetX: 172, groundY: 272, vy0: -118, targetRot: -2.14, flipRest: true, spinDir: -1, restPitchScale: 0.48 },
  { ux: -0.34, uy: 0.05, crackStage: 3, targetX: 162, groundY: 312, vy0: -86, targetRot: -0.92, flipRest: true, spinDir: -1, restPitchScale: 0.52 },
  { ux: 0.44, uy: 0.12, crackStage: 1, targetX: 308, groundY: 274, vy0: -92, targetRot: 1.94, flipRest: false, spinDir: 1, restPitchScale: 0.48 },
  { ux: -0.66, uy: 0.24, crackStage: 4, targetX: 132, groundY: 282, vy0: -78, targetRot: -1.42, flipRest: false, spinDir: -1, restPitchScale: 0.49 },

  // Central collapsed crater bed
  { ux: 0.05, uy: 0.02, crackStage: 2, targetX: 224, groundY: 266, vy0: -96, targetRot: -1.85, flipRest: true, spinDir: -1, restPitchScale: 0.46 },
  { ux: -0.38, uy: 0.56, crackStage: 4, targetX: 204, groundY: 304, vy0: -48, targetRot: -0.52, flipRest: false, spinDir: -1, restPitchScale: 0.60 },
  { ux: 0.38, uy: 0.58, crackStage: 4, targetX: 276, groundY: 306, vy0: -46, targetRot: 0.48, flipRest: true, spinDir: 1, restPitchScale: 0.58 },
  { ux: -0.02, uy: 0.78, crackStage: 4, targetX: 238, groundY: 292, vy0: -36, targetRot: 0.16, flipRest: true, spinDir: 1, restPitchScale: 0.64 },
  { ux: 0.02, uy: 0.42, crackStage: 2, targetX: 250, groundY: 318, vy0: -74, targetRot: 2.65, flipRest: false, spinDir: 1, restPitchScale: 0.50 },
];

const FRAGMENT_COUNT = FRAGMENT_CONFIGS.length;

const CRACK_STAGE_LABELS: Record<number, string> = {
  0: 'Break the shell',
  1: 'Testing the surface',
  2: 'Borders fading',
  3: 'World waking',
  4: 'One last tap',
  5: 'No barriers left',
};

const TAP_IMPACT_ORIGINS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 286, y: 145 },
  { x: 246, y: 172 },
  { x: 204, y: 148 },
  { x: 215, y: 208 },
  { x: 240, y: 168 },
];

function createPrng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Ovoid lateral radius at normalized vertical coordinate ny in [-1 (top), 1 (bottom)]. */
function eggHalfWidth(ny: number, rx: number): number {
  if (Math.abs(ny) >= 1) return 0;
  return rx * Math.sqrt(1 - ny * ny) * (1 + 0.145 * ny - 0.032 * ny * ny);
}

/** Surface height Z used to compute exact finite-difference 3D normals on the ovoid. */
function eggSurfaceZ(px: number, py: number, cx: number, cy: number, rx: number, ry: number): number {
  const ny = (py - cy) / ry;
  if (Math.abs(ny) >= 1) return 0;
  const hw = eggHalfWidth(ny, rx);
  if (hw <= 0) return 0;
  const nx = (px - cx) / hw;
  if (Math.abs(nx) >= 1) return 0;
  return hw * Math.sqrt(1 - nx * nx);
}

interface FragmentMeta {
  id: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerXSvg: number;
  centerYSvg: number;
  pixelIndices: number[]; // indices into EggPixelMap arrays
  borderPixelFlags: Uint8Array; // 1 = fractured rim pixel inside this fragment
}

interface EggPixelMap {
  count: number;
  pxX: Uint16Array;
  pxY: Uint16Array;
  pxIdx: Uint32Array;
  effNx: Float32Array;
  effNy: Float32Array;
  effNz: Float32Array;
  geomNz: Float32Array;
  albedoShift: Float32Array;
  edgeCrease: Float32Array;
  fragmentId: Uint8Array;
  seamStage: Uint8Array; // 0 = interior, 1..4 = fracture seam activation stage
  seamDist: Uint8Array; // 1 = crack center, 2 = chamfer bevel lip
  fragments: FragmentMeta[];
}

/** Precomputes ovoid pixel coordinates, Voronoi dimples, 14 interlocking shard clusters, and seam maps once. */
function buildVoronoiEggMap(): EggPixelMap {
  const cx = EGG_CX * PX_SCALE;
  const cy = EGG_CY * PX_SCALE;
  const rx = EGG_RX * PX_SCALE;
  const ry = EGG_RY * PX_SCALE;
  const rand = createPrng(4711);

  const cols = 19;
  const rows = 21;
  const seeds: Array<{
    x: number;
    y: number;
    tx: number;
    ty: number;
    tint: number;
    fragId: number;
  }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ux = ((col + 0.15 + rand() * 0.7) / cols) * 2.15 - 1.075;
      const uy = ((row + 0.15 + rand() * 0.7) / rows) * 2.15 - 1.075;
      if (ux * ux + uy * uy > 1.25) continue;

      // Assign each Voronoi hammered cell to its nearest macro-fragment cluster
      // so fracture boundaries cleanly follow crystalline facet edges.
      let bestFrag = 0;
      let bestFragDist = 1e9;
      for (let f = 0; f < FRAGMENT_COUNT; f++) {
        const anchor = FRAGMENT_CONFIGS[f];
        const d = Math.hypot((ux - anchor.ux) * 1.04, (uy - anchor.uy) * 0.96);
        if (d < bestFragDist) {
          bestFragDist = d;
          bestFrag = f;
        }
      }

      seeds.push({
        x: ux,
        y: uy,
        tx: (rand() - 0.5) * 0.62,
        ty: (rand() - 0.5) * 0.62,
        tint: (rand() - 0.5) * 0.15,
        fragId: bestFrag,
      });
    }
  }

  const GRID = 16;
  const buckets: number[][] = Array.from({ length: GRID * GRID }, () => []);
  const toBucket = (val: number) =>
    Math.min(GRID - 1, Math.max(0, Math.floor(((val + 1.15) / 2.3) * GRID)));

  seeds.forEach((s, idx) => {
    const bx = toBucket(s.x);
    const by = toBucket(s.y);
    buckets[by * GRID + bx].push(idx);
  });

  const minX = Math.max(1, Math.floor(cx - rx * 1.12));
  const maxX = Math.min(CANVAS_W - 2, Math.ceil(cx + rx * 1.12));
  const minY = Math.max(1, Math.floor(cy - ry - 2));
  const maxY = Math.min(CANVAS_H - 2, Math.ceil(cy + ry + 2));
  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;

  const gridFrag = new Int8Array(boxW * boxH).fill(-1);
  const gridPixelIndex = new Int32Array(boxW * boxH).fill(-1);

  const maxPixels = Math.ceil(Math.PI * rx * ry * 1.15);
  const pxX = new Uint16Array(maxPixels);
  const pxY = new Uint16Array(maxPixels);
  const pxIdx = new Uint32Array(maxPixels);
  const effNx = new Float32Array(maxPixels);
  const effNy = new Float32Array(maxPixels);
  const effNz = new Float32Array(maxPixels);
  const geomNz = new Float32Array(maxPixels);
  const albedoShift = new Float32Array(maxPixels);
  const edgeCrease = new Float32Array(maxPixels);
  const fragmentId = new Uint8Array(maxPixels);
  const seamStage = new Uint8Array(maxPixels);
  const seamDist = new Uint8Array(maxPixels);

  let count = 0;

  for (let py = minY; py <= maxY; py++) {
    const ny = (py - cy) / ry;
    const hw = eggHalfWidth(ny, rx);
    if (hw <= 0) continue;

    for (let px = minX; px <= maxX; px++) {
      const nx = (px - cx) / hw;
      if (nx * nx >= 1) continue;

      const zL = eggSurfaceZ(px - 1, py, cx, cy, rx, ry);
      const zR = eggSurfaceZ(px + 1, py, cx, cy, rx, ry);
      const zU = eggSurfaceZ(px, py - 1, cx, cy, rx, ry);
      const zD = eggSurfaceZ(px, py + 1, cx, cy, rx, ry);
      const ddx = (zR - zL) * 0.5;
      const ddy = (zD - zU) * 0.5;
      const invLen = 1 / Math.hypot(ddx, ddy, 1);
      const gNx = -ddx * invLen;
      const gNy = -ddy * invLen;
      const gNz = invLen;

      const ux = (px - cx) / rx;
      const uy = (py - cy) / ry;
      const bx = toBucket(ux);
      const by = toBucket(uy);

      let d1 = 1e9;
      let d2 = 1e9;
      let bestIdx = 0;

      for (let oy = -1; oy <= 1; oy++) {
        const cyBucket = by + oy;
        if (cyBucket < 0 || cyBucket >= GRID) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const cxBucket = bx + ox;
          if (cxBucket < 0 || cxBucket >= GRID) continue;
          const bucket = buckets[cyBucket * GRID + cxBucket];
          for (let k = 0; k < bucket.length; k++) {
            const sIdx = bucket[k];
            const s = seeds[sIdx];
            const dist = Math.hypot(ux - s.x, uy - s.y);
            if (dist < d1) {
              d2 = d1;
              d1 = dist;
              bestIdx = sIdx;
            } else if (dist < d2) {
              d2 = dist;
            }
          }
        }
      }

      const bestSeed = seeds[bestIdx];
      const wobble = 0.045 * Math.sin(ux * 7.5 + uy * 4.2) + 0.03 * Math.cos(uy * 9.0 - ux * 5.0);
      const rimDist = 1 - Math.sqrt(Math.min(1, nx * nx * 0.88 + ny * ny * 0.82)) + wobble;
      const coreBlend = smoothstep(0.08, 0.3, rimDist);

      const eNx = gNx + bestSeed.tx * coreBlend;
      const eNy = gNy + bestSeed.ty * coreBlend;
      const eNz = Math.max(0.08, gNz);
      const eInv = 1 / Math.hypot(eNx, eNy, eNz);
      const crease = (1 - smoothstep(0.0, 0.018, d2 - d1)) * coreBlend;

      const boxIdx = (py - minY) * boxW + (px - minX);
      gridFrag[boxIdx] = bestSeed.fragId;
      gridPixelIndex[boxIdx] = count;

      pxX[count] = px;
      pxY[count] = py;
      pxIdx[count] = (py * CANVAS_W + px) * 4;
      effNx[count] = eNx * eInv;
      effNy[count] = eNy * eInv;
      effNz[count] = eNz * eInv;
      geomNz[count] = gNz;
      albedoShift[count] = bestSeed.tint * coreBlend;
      edgeCrease[count] = crease;
      fragmentId[count] = bestSeed.fragId;
      count++;
    }
  }

  // Build bounding boxes and extract crystalline fracture seams between neighboring fragments
  const fragMinX = new Int32Array(FRAGMENT_COUNT).fill(CANVAS_W);
  const fragMaxX = new Int32Array(FRAGMENT_COUNT).fill(0);
  const fragMinY = new Int32Array(FRAGMENT_COUNT).fill(CANVAS_H);
  const fragMaxY = new Int32Array(FRAGMENT_COUNT).fill(0);
  const fragPixels: number[][] = Array.from({ length: FRAGMENT_COUNT }, () => []);
  const fragBorders: number[][] = Array.from({ length: FRAGMENT_COUNT }, () => []);

  for (let i = 0; i < count; i++) {
    const f = fragmentId[i];
    const px = pxX[i];
    const py = pxY[i];
    if (px < fragMinX[f]) fragMinX[f] = px;
    if (px > fragMaxX[f]) fragMaxX[f] = px;
    if (py < fragMinY[f]) fragMinY[f] = py;
    if (py > fragMaxY[f]) fragMaxY[f] = py;
    fragPixels[f].push(i);

    const gx = px - minX;
    const gy = py - minY;
    let nearestDist = 9;
    let neighborFrag = -1;

    for (let dy = -2; dy <= 2; dy++) {
      const ny = gy + dy;
      if (ny < 0 || ny >= boxH) continue;
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = gx + dx;
        if (nx < 0 || nx >= boxW) continue;
        const other = gridFrag[ny * boxW + nx];
        if (other !== -1 && other !== f) {
          const stepDist = Math.abs(dx) + Math.abs(dy);
          if (stepDist < nearestDist) {
            nearestDist = stepDist;
            neighborFrag = other;
          }
        }
      }
    }

    if (neighborFrag !== -1) {
      seamDist[i] = nearestDist <= 1 ? 1 : nearestDist <= 2 ? 2 : 3;
      const stageA = FRAGMENT_CONFIGS[f].crackStage;
      const stageB = FRAGMENT_CONFIGS[neighborFrag].crackStage;
      seamStage[i] = Math.min(stageA, stageB);
      if (nearestDist <= 2) {
        fragBorders[f].push(1);
      } else {
        fragBorders[f].push(0);
      }
    } else {
      // Also mark outer egg perimeter pixels as borders on shell pieces for clean bevels
      const nyNorm = (py - cy) / ry;
      const hw = eggHalfWidth(nyNorm, rx);
      const isOuterRim = Math.abs(px - cx) >= hw - 2.5 || Math.abs(nyNorm) >= 0.97;
      fragBorders[f].push(isOuterRim ? 1 : 0);
    }
  }

  const fragments: FragmentMeta[] = [];
  for (let f = 0; f < FRAGMENT_COUNT; f++) {
    fragments.push({
      id: f,
      minX: fragMinX[f],
      minY: fragMinY[f],
      maxX: fragMaxX[f],
      maxY: fragMaxY[f],
      centerXSvg: ((fragMinX[f] + fragMaxX[f]) * 0.5) / PX_SCALE,
      centerYSvg: ((fragMinY[f] + fragMaxY[f]) * 0.5) / PX_SCALE,
      pixelIndices: fragPixels[f],
      borderPixelFlags: Uint8Array.from(fragBorders[f]),
    });
  }

  return {
    count,
    pxX: pxX.subarray(0, count),
    pxY: pxY.subarray(0, count),
    pxIdx: pxIdx.subarray(0, count),
    effNx: effNx.subarray(0, count),
    effNy: effNy.subarray(0, count),
    effNz: effNz.subarray(0, count),
    geomNz: geomNz.subarray(0, count),
    albedoShift: albedoShift.subarray(0, count),
    edgeCrease: edgeCrease.subarray(0, count),
    fragmentId: fragmentId.subarray(0, count),
    seamStage: seamStage.subarray(0, count),
    seamDist: seamDist.subarray(0, count),
    fragments,
  };
}

/** Maps scalar illumination into an antique bronze -> champagne gold -> ivory specular ramp. */
function computeGoldRgb(
  lit: number,
  specSharp: number,
  amberBounce: number,
  isLight: boolean
): [number, number, number] {
  const t = clamp01(lit);
  let r: number;
  let g: number;
  let b: number;

  if (t < 0.28) {
    const k = t / 0.28;
    r = (isLight ? 92 : 76) + k * 66;
    g = (isLight ? 58 : 48) + k * 52;
    b = (isLight ? 16 : 12) + k * 24;
  } else if (t < 0.68) {
    const k = (t - 0.28) / 0.4;
    r = 158 + k * 66;
    g = 110 + k * 76;
    b = 40 + k * 74;
  } else {
    const k = (t - 0.68) / 0.32;
    r = 224 + k * 28;
    g = 186 + k * 58;
    b = 114 + k * 108;
  }

  r += specSharp * 58 + amberBounce * 54;
  g += specSharp * 58 + amberBounce * 26;
  b += specSharp * 54 + amberBounce * 4;

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
}

interface ShardSprites {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  shadow: HTMLCanvasElement;
  wSvg: number;
  hSvg: number;
}

/** Pre-renders dome-up hammered-gold, concave 3D satin interior, and silhouette shadow sprites for each piece. */
function createFragmentSprites(
  eggMap: EggPixelMap,
  tiltX: number,
  tiltY: number,
  isLight: boolean
): ShardSprites[] {
  const PAD = 4; // padding for 3D cross-section bevel thickness
  const lxRaw = -0.34 + tiltX * 0.25;
  const lyRaw = -0.36 + tiltY * 0.2;
  const lzRaw = 0.87;
  const lInv = 1 / Math.hypot(lxRaw, lyRaw, lzRaw);
  const lx = lxRaw * lInv;
  const ly = lyRaw * lInv;
  const lz = lzRaw * lInv;

  const hxRaw = lx;
  const hyRaw = ly;
  const hzRaw = lz + 1;
  const hInv = 1 / Math.hypot(hxRaw, hyRaw, hzRaw);
  const hx = hxRaw * hInv;
  const hy = hyRaw * hInv;
  const hz = hzRaw * hInv;

  const shadowR = isLight ? 28 : 0;
  const shadowG = isLight ? 24 : 0;
  const shadowB = isLight ? 20 : 0;

  return eggMap.fragments.map((frag, fragIdx) => {
    const wPx = frag.maxX - frag.minX + 1 + PAD * 2;
    const hPx = frag.maxY - frag.minY + 1 + PAD * 2;
    // Transform global key light into the shard's settled local rotation frame for consistent bowl lighting
    const targetRot = FRAGMENT_CONFIGS[fragIdx].targetRot;
    const cosR = Math.cos(-targetRot);
    const sinR = Math.sin(-targetRot);
    const bLx = lx * cosR - ly * sinR;
    const bLy = lx * sinR + ly * cosR;
    const bHx = hx * cosR - hy * sinR;
    const bHy = hx * sinR + hy * cosR;
    const front = document.createElement('canvas');
    front.width = wPx;
    front.height = hPx;
    const back = document.createElement('canvas');
    back.width = wPx;
    back.height = hPx;
    const shadow = document.createElement('canvas');
    shadow.width = wPx;
    shadow.height = hPx;

    const fCtx = front.getContext('2d')!;
    const bCtx = back.getContext('2d')!;
    const sCtx = shadow.getContext('2d')!;
    const fImg = fCtx.createImageData(wPx, hPx);
    const bImg = bCtx.createImageData(wPx, hPx);
    const sImg = sCtx.createImageData(wPx, hPx);
    const fData = fImg.data;
    const bData = bImg.data;
    const sData = sImg.data;

    const midX = (frag.minX + frag.maxX) * 0.5;
    const midY = (frag.minY + frag.maxY) * 0.5;
    const maxRadius = Math.max(12, Math.hypot(frag.maxX - frag.minX, frag.maxY - frag.minY) * 0.52);

    // First pass: paint fractured shell cross-section wall shifted down-right for 3D thickness
    for (let k = 0; k < frag.pixelIndices.length; k++) {
      const idx = frag.pixelIndices[k];
      const sx = eggMap.pxX[idx] - frag.minX + PAD;
      const sy = eggMap.pxY[idx] - frag.minY + PAD;
      for (const [ox, oy] of [
        [2, 2],
        [1, 2],
      ]) {
        const tx = sx + ox;
        const ty = sy + oy;
        if (tx >= wPx || ty >= hPx) continue;
        const off = (ty * wPx + tx) * 4;
        // Exposed fractured gold-porcelain shell edge thickness
        fData[off] = 126;
        fData[off + 1] = 88;
        fData[off + 2] = 36;
        fData[off + 3] = 255;

        bData[off] = 148;
        bData[off + 1] = 110;
        bData[off + 2] = 52;
        bData[off + 3] = 255;

        sData[off] = shadowR;
        sData[off + 1] = shadowG;
        sData[off + 2] = shadowB;
        sData[off + 3] = 215;
      }
    }

    // Second pass: paint front hammered-gold mosaic, back concave 3D porcelain-gold bowl, and shadow mask
    for (let k = 0; k < frag.pixelIndices.length; k++) {
      const idx = frag.pixelIndices[k];
      const sx = eggMap.pxX[idx] - frag.minX + PAD;
      const sy = eggMap.pxY[idx] - frag.minY + PAD;
      const off = (sy * wPx + sx) * 4;

      const nx = eggMap.effNx[idx];
      const ny = eggMap.effNy[idx];
      const nz = eggMap.effNz[idx];
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
      const nDotH = Math.max(0, nx * hx + ny * hy + nz * hz);
      const specWide = Math.pow(nDotH, 10) * 0.24;
      const specSharp = Math.pow(nDotH, 46);
      const rim = Math.pow(1 - eggMap.geomNz[idx], 2.2);
      const amberBounce = rim * Math.max(0, 0.65 - diff) * 0.85;
      const lit =
        0.16 +
        diff * 0.66 +
        specWide +
        eggMap.albedoShift[idx] +
        rim * 0.08 -
        eggMap.edgeCrease[idx] * 0.14;

      const [r, g, b] = computeGoldRgb(lit, specSharp, amberBounce, isLight);
      const isBorder = frag.borderPixelFlags[k] === 1;
      // Sharp champagne glint along fractured rim cuts
      fData[off] = Math.min(255, isBorder ? r + 24 : r);
      fData[off + 1] = Math.min(255, isBorder ? g + 18 : g);
      fData[off + 2] = Math.min(255, isBorder ? b + 10 : b);
      fData[off + 3] = 255;

      sData[off] = shadowR;
      sData[off + 1] = shadowG;
      sData[off + 2] = shadowB;
      sData[off + 3] = 255;

      // Reversed-normal concave shell interior: upper-left pocket shadow -> luminous champagne-alabaster cavity
      const cdx = (eggMap.pxX[idx] - midX) / maxRadius;
      const cdy = (eggMap.pxY[idx] - midY) / maxRadius;
      const rSq = Math.min(0.88, cdx * cdx + cdy * cdy);
      const bNx = -cdx * 0.72 - nx * 0.14;
      const bNy = -cdy * 0.72 - ny * 0.14;
      const bNz = Math.sqrt(Math.max(0.18, 1 - Math.min(0.82, bNx * bNx + bNy * bNy)));
      const cupDiff = Math.max(0, bNx * bLx + bNy * bLy + bNz * lz);
      const cupH = Math.max(0, bNx * bHx + bNy * bHy + bNz * hz);
      const cupSpec = Math.pow(cupH, 16) * 0.28;
      const cupAO = 0.78 + 0.22 * Math.sqrt(rSq);
      const cav = clamp01(
        (0.18 +
          cupDiff * 0.68 +
          cupSpec +
          eggMap.albedoShift[idx] * 0.24 -
          eggMap.edgeCrease[idx] * 0.08) *
          cupAO
      );

      if (isBorder) {
        // Crisper metallic gold bevel framing the concave cup rim in both dark & paper themes
        bData[off] = isLight ? 204 : 238;
        bData[off + 1] = isLight ? 156 : 206;
        bData[off + 2] = isLight ? 64 : 134;
        bData[off + 3] = 255;
      } else {
        // Deep bronze cavity shadow (#4E3415) -> champagne satin (#DFC896) -> warm alabaster rim gleam (#F4E7C8)
        let cr: number;
        let cg: number;
        let cb: number;
        if (cav < 0.48) {
          const u = cav / 0.48;
          cr = 78 + (192 - 78) * u;
          cg = 52 + (154 - 52) * u;
          cb = 22 + (92 - 22) * u;
        } else {
          const u = (cav - 0.48) / 0.52;
          cr = 192 + (244 - 192) * u;
          cg = 154 + (231 - 154) * u;
          cb = 92 + (196 - 92) * u;
        }
        // Darken brightest cavity highlights subtly in Light Mode so cup rim pops on #F6F5F0 museum paper
        const paperTone = isLight ? 0.91 : 1;
        bData[off] = Math.min(255, cr * paperTone);
        bData[off + 1] = Math.min(255, cg * paperTone);
        bData[off + 2] = Math.min(255, cb * paperTone);
        bData[off + 3] = 255;
      }
    }

    fCtx.putImageData(fImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);
    sCtx.putImageData(sImg, 0, 0);

    return {
      front,
      back,
      shadow,
      wSvg: wPx / PX_SCALE,
      hSvg: hPx / PX_SCALE,
    };
  });
}

interface FallingPieceState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundY: number;
  rot: number;
  rotVel: number;
  tumble: number;
  tumbleVel: number;
  flipRest: boolean;
  settled: boolean;
  bounces: number;
  scale: number;
  pitchScale: number;
  restPitchScale: number;
  fallTime: number;
  elapsed: number;
}

interface FallingCrumbState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundY: number;
  rot: number;
  rotVel: number;
  w: number;
  h: number;
  shade: 'bright' | 'mid' | 'dark';
  settled: boolean;
}

function buildInitialPhysics(
  eggMap: EggPixelMap,
  preDroppedCrumbs: FallingCrumbState[]
): { pieces: FallingPieceState[]; crumbs: FallingCrumbState[] } {
  const rand = createPrng(8813);

  const pieces: FallingPieceState[] = eggMap.fragments.map((frag, idx) => {
    const cfg = FRAGMENT_CONFIGS[idx];
    const dy = Math.max(8, cfg.groundY - frag.centerYSvg);
    // Solve exact parabolic freefall + 1 low bounce duration so fragments land naturally at targetX/targetRot without snapping
    const tAir =
      (-cfg.vy0 + Math.sqrt(cfg.vy0 * cfg.vy0 + 2 * SHATTER_GRAVITY * dy)) /
      SHATTER_GRAVITY;
    const vImpact = cfg.vy0 + SHATTER_GRAVITY * tAir;
    const tHop = (2 * 0.22 * vImpact) / SHATTER_GRAVITY;
    const effectiveTime = Math.max(0.08, tAir + 0.52 * tHop);
    const vx0 = (cfg.targetX - frag.centerXSvg) / effectiveTime;
    const rotVel0 = cfg.targetRot / effectiveTime;
    const tumbleVel0 = cfg.flipRest ? (cfg.spinDir * Math.PI) / tAir : 0;

    return {
      id: idx,
      x: frag.centerXSvg,
      y: frag.centerYSvg,
      vx: vx0,
      vy: cfg.vy0,
      groundY: cfg.groundY,
      rot: 0,
      rotVel: rotVel0,
      tumble: 0,
      tumbleVel: tumbleVel0,
      flipRest: cfg.flipRest,
      settled: false,
      bounces: 0,
      scale: 0.85 + ((cfg.groundY - 262) / 60) * 0.17,
      pitchScale: 1,
      restPitchScale: cfg.restPitchScale,
      fallTime: tAir,
      elapsed: 0,
    };
  });

  // Extra jagged micro-splinters and golden dust collapsing cleanly with the crater shards
  const extraCrumbs: FallingCrumbState[] = Array.from({ length: 24 }, (_, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    const spread = 12 + rand() * 115;
    const shadePool: Array<'bright' | 'mid' | 'dark'> = ['bright', 'mid', 'dark'];
    return {
      x: EGG_CX + (rand() - 0.5) * 82,
      y: EGG_CY + (rand() - 0.5) * 90,
      vx: dir * (36 + spread),
      vy: -40 - rand() * 95,
      groundY: 266 + rand() * 54,
      rot: rand() * Math.PI * 2,
      rotVel: (rand() - 0.5) * 12,
      w: 3.5 + rand() * 5.5,
      h: 2.2 + rand() * 3.8,
      shade: shadePool[i % 3],
      settled: false,
    };
  });

  return { pieces, crumbs: [...preDroppedCrumbs, ...extraCrumbs] };
}

export const ArtifactEggSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [taps, setTaps] = useState(0);
  const [tapPulseKey, setTapPulseKey] = useState(0);
  const wobbleDirRef = useRef(1);
  const wobbleControls = useAnimation();

  const stageRef = useRef<HTMLButtonElement>(null);
  const intactCanvasRef = useRef<HTMLCanvasElement>(null);
  const shatterCanvasRef = useRef<HTMLCanvasElement>(null);
  const hoverTargetRef = useRef({ x: 0, y: 0 });
  const lightRafRef = useRef<number | null>(null);
  const physicsRafRef = useRef<number | null>(null);

  const intactBufferRef = useRef<ImageData | null>(null);
  const shardSpritesRef = useRef<ShardSprites[] | null>(null);
  const preCrumbsRef = useRef<FallingCrumbState[]>([]);
  const physicsRef = useRef<{
    pieces: FallingPieceState[];
    crumbs: FallingCrumbState[];
    burstAge: number;
  } | null>(null);

  const eggMap = useMemo(() => buildVoronoiEggMap(), []);

  // Draws intact golden Voronoi shell + progressive crystalline Voronoi seam cracks (taps 0..4)
  const drawIntactEgg = useCallback(
    (tiltX: number, tiltY: number, currentTaps: number, lightMode: boolean) => {
      if (typeof ImageData === 'undefined') return;
      if (!intactBufferRef.current) {
        intactBufferRef.current = new ImageData(CANVAS_W, CANVAS_H);
      }
      const buffer = intactBufferRef.current;
      const out = buffer.data;

      const lxRaw = -0.34 + tiltX * 0.28;
      const lyRaw = -0.36 + tiltY * 0.22;
      const lzRaw = 0.87;
      const lInv = 1 / Math.hypot(lxRaw, lyRaw, lzRaw);
      const lx = lxRaw * lInv;
      const ly = lyRaw * lInv;
      const lz = lzRaw * lInv;

      const hxRaw = lx;
      const hyRaw = ly;
      const hzRaw = lz + 1;
      const hInv = 1 / Math.hypot(hxRaw, hyRaw, hzRaw);
      const hx = hxRaw * hInv;
      const hy = hyRaw * hInv;
      const hz = hzRaw * hInv;

      const {
        count,
        pxIdx,
        effNx,
        effNy,
        effNz,
        geomNz,
        albedoShift,
        edgeCrease,
        seamStage,
        seamDist,
      } = eggMap;

      for (let i = 0; i < count; i++) {
        const sStage = seamStage[i];
        const sDist = seamDist[i];
        const activeCrack = currentTaps > 0 && sStage > 0 && sStage <= currentTaps;

        if (activeCrack && sDist === 1) {
          // Deep Voronoi seam crevice, glowing warm amber when taps reach 3..4
          if (currentTaps >= 3) {
            const heat = currentTaps === 4 ? 1 : 0.45;
            out[pxIdx[i]] = Math.round(38 + heat * 165);
            out[pxIdx[i] + 1] = Math.round(22 + heat * 96);
            out[pxIdx[i] + 2] = Math.round(6 + heat * 20);
          } else {
            out[pxIdx[i]] = 34;
            out[pxIdx[i] + 1] = 19;
            out[pxIdx[i] + 2] = 5;
          }
          out[pxIdx[i] + 3] = 255;
          continue;
        }

        const nx = effNx[i];
        const ny = effNy[i];
        const nz = effNz[i];
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        const nDotH = Math.max(0, nx * hx + ny * hy + nz * hz);
        const specWide = Math.pow(nDotH, 10) * 0.24;
        const specSharp = Math.pow(nDotH, 46);
        const rim = Math.pow(1 - geomNz[i], 2.2);
        const amberBounce = rim * Math.max(0, 0.65 - diff) * 0.85;
        const lit =
          0.14 +
          diff * 0.66 +
          specWide +
          albedoShift[i] +
          rim * 0.08 -
          edgeCrease[i] * 0.14;

        let [r, g, b] = computeGoldRgb(lit, specSharp, amberBounce, lightMode);

        // Widen older fractures at tap 4 + chamfer sunlit catch-light along crack borders
        if (activeCrack && sDist === 2) {
          if (currentTaps >= 4 && sStage <= 2) {
            r = 56;
            g = 34;
            b = 10;
          } else {
            r = Math.min(255, r + 26);
            g = Math.min(255, g + 22);
            b = Math.min(255, b + 14);
          }
        }

        out[pxIdx[i]] = r;
        out[pxIdx[i] + 1] = g;
        out[pxIdx[i] + 2] = b;
        out[pxIdx[i] + 3] = 255;
      }

      intactCanvasRef.current?.getContext('2d')?.putImageData(buffer, 0, 0);
    },
    [eggMap]
  );

  // Renders shattered Voronoi shell pieces + crumbs + floor contact shadows + floor sheen onto shatterCanvas
  const renderShatterFrame = useCallback(
    (lightMode: boolean) => {
      const canvas = shatterCanvasRef.current;
      const state = physicsRef.current;
      const sprites = shardSpritesRef.current;
      if (!canvas || !state) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(PX_SCALE, 0, 0, PX_SCALE, 0, 0);
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

      // Feathered neutral floor occlusion grounding the collapsed crater without synthetic color glow
      const horizonGrad = ctx.createRadialGradient(
        EGG_CX + 6,
        FLOOR_GLOW_Y + 8,
        12,
        EGG_CX + 6,
        FLOOR_GLOW_Y + 8,
        162
      );
      if (lightMode) {
        horizonGrad.addColorStop(0, 'rgba(28, 24, 20, 0.085)');
        horizonGrad.addColorStop(0.55, 'rgba(28, 24, 20, 0.032)');
        horizonGrad.addColorStop(1, 'rgba(28, 24, 20, 0)');
      } else {
        horizonGrad.addColorStop(0, 'rgba(0, 0, 0, 0.36)');
        horizonGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.14)');
        horizonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.save();
      ctx.translate(EGG_CX + 6, FLOOR_GLOW_Y + 8);
      ctx.scale(1, 0.22);
      ctx.translate(-(EGG_CX + 6), -(FLOOR_GLOW_Y + 8));
      ctx.fillStyle = horizonGrad;
      ctx.beginPath();
      ctx.arc(EGG_CX + 6, FLOOR_GLOW_Y + 8, 162, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Depth sort pieces back-to-front by floor groundY for realistic pile occlusion
      const sortedPieces = state.pieces.slice().sort((a, b) => a.groundY - b.groundY);

      if (sprites) {
        // Pass 1: tight contact ambient occlusion + directional silhouette shadow cast lower-right
        for (const p of sortedPieces) {
          const sp = sprites[p.id];
          const heightAboveFloor = Math.max(0, p.groundY - p.y);
          const airFactor = clamp01(1 - heightAboveFloor / 190);
          const tumbleScale = Math.max(0.64, Math.abs(Math.cos(p.tumble)));

          const aoW = sp.wSvg * p.scale * (0.34 + (1 - airFactor) * 0.14);
          const aoH = Math.max(4, sp.hSvg * p.pitchScale * 0.22);
          ctx.save();
          ctx.translate(p.x + 2, p.groundY + 2);
          ctx.fillStyle = lightMode
            ? `rgba(28, 24, 20, ${(0.05 + airFactor * 0.13).toFixed(3)})`
            : `rgba(0, 0, 0, ${(0.14 + airFactor * 0.34).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, aoW, aoH, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const castDx = 7 + (1 - airFactor) * 4;
          const castDy = 5 + (1 - airFactor) * 5;
          ctx.save();
          ctx.globalAlpha = lightMode ? 0.06 + airFactor * 0.17 : 0.14 + airFactor * 0.32;
          ctx.translate(p.x + castDx, p.groundY + castDy);
          ctx.scale(p.scale * 1.02, p.scale * p.pitchScale * 0.88);
          ctx.rotate(p.rot);
          ctx.scale(1, tumbleScale);
          ctx.drawImage(sp.shadow, -sp.wSvg * 0.5, -sp.hSvg * 0.5, sp.wSvg, sp.hSvg);
          ctx.restore();
        }

        // Pass 2: tabletop-foreshortened shell fragment sprites (hammered gold dome or concave interior)
        for (const p of sortedPieces) {
          const sp = sprites[p.id];
          const cosT = Math.cos(p.tumble);
          const img = cosT >= 0 ? sp.front : sp.back;
          const tumbleScale = Math.max(0.64, Math.abs(cosT));

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(p.scale, p.scale * p.pitchScale);
          ctx.rotate(p.rot);
          ctx.scale(1, tumbleScale);
          ctx.drawImage(img, -sp.wSvg * 0.5, -sp.hSvg * 0.5, sp.wSvg, sp.hSvg);
          ctx.restore();
        }
      }

      // Pass 3: chipped golden crumbs & tiny faceted debris spread across the floor
      for (const c of state.crumbs) {
        const air = clamp01(1 - Math.max(0, c.groundY - c.y) / 160);
        ctx.fillStyle = lightMode
          ? `rgba(28, 24, 20, ${(0.12 + air * 0.18).toFixed(2)})`
          : `rgba(0, 0, 0, ${(0.28 + air * 0.42).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(c.x + 1.5, c.groundY + 2, c.w * 0.55, c.h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle =
          c.shade === 'bright'
            ? '#F3DFAA'
            : c.shade === 'mid'
              ? '#C99E44'
              : '#785219';
        ctx.fillRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h);
        ctx.restore();
      }

      ctx.restore();
    },
    []
  );

  // Sync intact shell OR rebuild theme-adapted sprites when theme switches while broken
  useEffect(() => {
    if (taps < MAX_TAPS) {
      drawIntactEgg(hoverTargetRef.current.x, hoverTargetRef.current.y, taps, isLight);
      if (preCrumbsRef.current.length > 0) {
        physicsRef.current = { pieces: [], crumbs: preCrumbsRef.current, burstAge: 1 };
        renderShatterFrame(isLight);
      } else if (shatterCanvasRef.current) {
        const ctx = shatterCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
      }
    } else if (typeof document !== 'undefined') {
      shardSpritesRef.current = createFragmentSprites(
        eggMap,
        hoverTargetRef.current.x,
        hoverTargetRef.current.y,
        isLight
      );
      renderShatterFrame(isLight);
    }
  }, [drawIntactEgg, renderShatterFrame, eggMap, taps, isLight]);

  useEffect(() => {
    return () => {
      if (lightRafRef.current !== null) cancelAnimationFrame(lightRafRef.current);
      if (physicsRafRef.current !== null) cancelAnimationFrame(physicsRafRef.current);
    };
  }, []);

  const runPhysicsStep = useCallback(
    (lightMode: boolean) => {
      if (physicsRafRef.current !== null) cancelAnimationFrame(physicsRafRef.current);

      let lastTime = performance.now();

      const step = (now: number) => {
        const dt = Math.min(0.032, Math.max(0.004, (now - lastTime) / 1000));
        lastTime = now;
        const st = physicsRef.current;
        if (!st) return;

        st.burstAge += dt;
        let anyMoving = false;

        for (const p of st.pieces) {
          if (p.settled) continue;
          anyMoving = true;

          p.elapsed += dt;
          p.vy += SHATTER_GRAVITY * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.rotVel * dt;

          // Smooth monotonic mid-air flip up to +-PI so settled orientation matches the fall path
          if (p.flipRest && p.tumbleVel !== 0) {
            const nextTumble = p.tumble + p.tumbleVel * dt;
            if (Math.abs(nextTumble) >= Math.PI) {
              p.tumble = p.tumbleVel > 0 ? Math.PI : -Math.PI;
              p.tumbleVel = 0;
            } else {
              p.tumble = nextTumble;
            }
          }

          // Ease perspective tabletop tilt during freefall so landing happens already flush to the floor plane
          const fallProgress = clamp01(p.elapsed / Math.max(0.05, p.fallTime));
          const easeOut = 1 - Math.pow(1 - fallProgress, 2.2);
          p.pitchScale = 1 + (p.restPitchScale - 1) * easeOut;

          if (p.y >= p.groundY) {
            p.y = p.groundY;
            p.bounces++;
            if (p.bounces >= 2 || Math.abs(p.vy) < 40) {
              p.vy = 0;
              p.vx = 0;
              p.rotVel = 0;
              p.tumbleVel = 0;
              p.pitchScale = p.restPitchScale;
              p.settled = true;
            } else {
              p.vy = -p.vy * 0.22;
              p.vx *= 0.52;
              p.rotVel *= 0.52;
            }
          }
        }

        for (const c of st.crumbs) {
          if (c.settled) continue;
          anyMoving = true;

          c.vy += SHATTER_GRAVITY * 0.92 * dt;
          c.x = Math.min(VIEW_W - 68, Math.max(68, c.x + c.vx * dt));
          c.y += c.vy * dt;
          c.rot += c.rotVel * dt;

          if (c.y >= c.groundY) {
            c.y = c.groundY;
            if (Math.abs(c.vy) < 60) {
              c.vy = 0;
              c.vx = 0;
              c.rotVel = 0;
              c.settled = true;
            } else {
              c.vy = -c.vy * 0.22;
              c.vx *= 0.52;
              c.rotVel *= 0.45;
            }
          }
        }

        renderShatterFrame(lightMode);
        if (anyMoving) {
          physicsRafRef.current = requestAnimationFrame(step);
        } else {
          physicsRafRef.current = null;
        }
      };

      physicsRafRef.current = requestAnimationFrame(step);
    },
    [renderShatterFrame]
  );

  const scheduleLightUpdate = (nx: number, ny: number) => {
    hoverTargetRef.current = { x: nx, y: ny };
    if (taps >= MAX_TAPS) return;
    if (lightRafRef.current !== null) return;
    lightRafRef.current = requestAnimationFrame(() => {
      lightRafRef.current = null;
      drawIntactEgg(hoverTargetRef.current.x, hoverTargetRef.current.y, taps, isLight);
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse' || !stageRef.current || taps >= MAX_TAPS) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    scheduleLightUpdate(nx, ny);
  };

  const handlePointerLeave = () => {
    scheduleLightUpdate(0, 0);
  };

  const triggerWobble = (intensity: number) => {
    wobbleDirRef.current *= -1;
    const dir = wobbleDirRef.current;
    wobbleControls.start({
      rotate: [dir * (3.2 + intensity * 1.4), -dir * (1.4 + intensity * 0.5), 0],
      scaleX: [1.032, 0.988, 1],
      scaleY: [0.962, 1.012, 1],
      y: [3, -1, 0],
      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
    });
  };

  const handleCrackTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTapPulseKey((k) => k + 1);

    if (taps >= MAX_TAPS) {
      sounds.playChime();
      return;
    }

    const next = taps + 1;
    setTaps(next);

    if (next >= MAX_TAPS) {
      sounds.playEggHatch();
      shardSpritesRef.current = createFragmentSprites(
        eggMap,
        hoverTargetRef.current.x,
        hoverTargetRef.current.y,
        isLight
      );
      physicsRef.current = {
        ...buildInitialPhysics(eggMap, preCrumbsRef.current),
        burstAge: 0,
      };
      runPhysicsStep(isLight);

      const targetEl = e.currentTarget;
      const { clientX, clientY } = e;
      if (clientX > 0 || clientY > 0) {
        requestAnimationFrame(() => {
          targetEl.dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX, clientY })
          );
        });
      }
    } else {
      triggerWobble(next);
      sounds.playEggTapCrack(next);

      // Chip small golden flakes on strikes 2..4 so debris builds naturally on the base plane
      if (next >= 2) {
        const origin = TAP_IMPACT_ORIGINS[next - 1];
        const rand = createPrng(3100 + next * 97);
        const newChips: FallingCrumbState[] = Array.from({ length: 3 }, (_, idx) => {
          const dir = (idx + next) % 2 === 0 ? -1 : 1;
          return {
            x: origin.x + (rand() - 0.5) * 12,
            y: origin.y,
            vx: dir * (38 + rand() * 68),
            vy: -40 - rand() * 55,
            groundY: 268 + rand() * 24,
            rot: rand() * Math.PI,
            rotVel: (rand() - 0.5) * 10,
            w: 4 + rand() * 3.5,
            h: 2.5 + rand() * 2,
            shade: idx === 0 ? 'bright' : 'mid',
            settled: false,
          };
        });
        preCrumbsRef.current = [...preCrumbsRef.current, ...newChips];
        physicsRef.current = {
          pieces: [],
          crumbs: preCrumbsRef.current,
          burstAge: 0,
        };
        runPhysicsStep(isLight);
      }
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playApertureClick();
    if (physicsRafRef.current !== null) {
      cancelAnimationFrame(physicsRafRef.current);
      physicsRafRef.current = null;
    }
    preCrumbsRef.current = [];
    physicsRef.current = null;
    setTaps(0);
    setTapPulseKey(0);
    wobbleControls.set({ rotate: 0, scaleX: 1, scaleY: 1, y: 0 });
  };

  const isCracked = taps >= MAX_TAPS;
  const stageLabel = CRACK_STAGE_LABELS[taps] ?? CRACK_STAGE_LABELS[0];
  const impactOrigin =
    TAP_IMPACT_ORIGINS[Math.min(MAX_TAPS - 1, Math.max(0, taps - 1))];

  const warmerSamples = useMemo(() => {
    const byScript = new Map<ConstellationScript, string>();
    for (const item of EGG_GREETINGS) {
      const prev = byScript.get(item.script) ?? '';
      byScript.set(item.script, prev ? `${prev}${item.text}` : item.text);
    }
    return Array.from(byScript.entries());
  }, []);

  return (
    <section
      id="artifact"
      aria-label="Break the barrier — interactive golden egg"
      className={`relative overflow-x-clip border-t border-alabaster/[0.08] bg-void py-16 sm:py-24 transition-colors duration-500 ${CONSTELLATION_FONT_CLASSES}`}
    >
      {/* Pre-warm asynchronous script WOFF2 fonts cleanly as soon as the user begins tapping */}
      {taps >= 1 && !isCracked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0 select-none"
        >
          {warmerSamples.map(([script, text]) => (
            <React.Fragment key={script}>
              <span
                className={script === 'arabic' ? 'font-normal' : 'font-medium'}
                style={{ fontFamily: SCRIPT_FONT_FAMILIES[script] }}
              >
                {text}
              </span>
              <span
                className={script === 'arabic' ? 'font-bold' : 'font-semibold'}
                style={{ fontFamily: SCRIPT_FONT_FAMILIES[script] }}
              >
                {text}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* Interactive Egg Gallery & Floor Shatter Stage (panoramic wrap lets hatched greetings fan wide across wings) */}
          <div className="relative flex w-full flex-col items-center">
            <div className="relative flex w-full max-w-[1240px] justify-center">
              <button
              ref={stageRef}
              type="button"
              onClick={handleCrackTap}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              data-cursor={isCracked ? undefined : 'CRACK'}
              aria-label={
                isCracked
                  ? 'Golden faceted egg shattered into shells across the floor after 5 taps, releasing global greetings'
                  : `Golden faceted egg, ${taps} of ${MAX_TAPS} cracks. Tap or click to crack.`
              }
              className="group relative aspect-[4/3] w-full max-w-[480px] cursor-pointer touch-manipulation select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-sand/50"
            >
              {/* Soft Feathered Tabletop Ground Shadow (no border frame or synthetic glow) */}
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <defs>
                  <radialGradient id="egg-cast-shadow" cx="50%" cy="50%" r="50%">
                    <stop
                      offset="0%"
                      stopColor={isLight ? '#1C1814' : '#000000'}
                      stopOpacity={isLight ? 0.23 : 0.72}
                    />
                    <stop
                      offset="52%"
                      stopColor={isLight ? '#1C1814' : '#000000'}
                      stopOpacity={isLight ? 0.1 : 0.34}
                    />
                    <stop
                      offset="100%"
                      stopColor={isLight ? '#1C1814' : '#000000'}
                      stopOpacity="0"
                    />
                  </radialGradient>
                  <radialGradient id="egg-contact-ao" cx="50%" cy="50%" r="50%">
                    <stop
                      offset="0%"
                      stopColor={isLight ? '#120F0C' : '#000000'}
                      stopOpacity={isLight ? 0.36 : 0.9}
                    />
                    <stop
                      offset="58%"
                      stopColor={isLight ? '#120F0C' : '#000000'}
                      stopOpacity={isLight ? 0.14 : 0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor={isLight ? '#120F0C' : '#000000'}
                      stopOpacity="0"
                    />
                  </radialGradient>
                </defs>

                <motion.g
                  animate={{
                    scale: tapPulseKey > 0 && !isCracked ? [1, 0.95, 1] : 1,
                    opacity: isCracked ? 0 : 1,
                  }}
                  transition={{ duration: 0.32 }}
                  style={{ transformOrigin: `${EGG_CX}px ${EGG_CY + EGG_RY}px` }}
                >
                  {/* Directional studio cast shadow anchored to lower-right tabletop */}
                  <ellipse
                    cx={EGG_CX + 22}
                    cy={EGG_CY + EGG_RY - 2}
                    rx={88}
                    ry={23}
                    transform={`rotate(-4 ${EGG_CX + 22} ${EGG_CY + EGG_RY - 2})`}
                    fill="url(#egg-cast-shadow)"
                  />
                  {/* Tight base contact ambient occlusion */}
                  <ellipse
                    cx={EGG_CX + 2}
                    cy={EGG_CY + EGG_RY - 1}
                    rx={44}
                    ry={9}
                    fill="url(#egg-contact-ao)"
                  />
                </motion.g>
              </svg>

              {/* Shatter Physics Canvas (holds fallen flakes on taps 2-4 AND full spread shells on tap 5) */}
              <canvas
                ref={shatterCanvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              />

              {/* Intact & Progressive Fractured Golden Egg Canvas (Taps 0 to 4) */}
              {!isCracked && (
                <motion.div
                  animate={wobbleControls}
                  whileTap={{ scale: 0.965 }}
                  className="pointer-events-none relative z-10 h-full w-full"
                >
                  <canvas
                    ref={intactCanvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-[1.015]"
                  />

                  {/* Tactile Impact Dust Motes */}
                  <AnimatePresence>
                    {tapPulseKey > 0 && (
                      <motion.div
                        key={`burst-${tapPulseKey}`}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-30"
                      >
                        {[0, 1, 2, 3, 4].map((idx) => {
                          const angle = ((idx * 72 + tapPulseKey * 37) * Math.PI) / 180;
                          const dist = 24 + (idx % 3) * 14;
                          return (
                            <motion.span
                              key={`dust-${idx}`}
                              style={{
                                left: `${(impactOrigin.x / VIEW_W) * 100}%`,
                                top: `${(impactOrigin.y / VIEW_H) * 100}%`,
                              }}
                              initial={{ opacity: 0.95, scale: 1, x: 0, y: 0 }}
                              animate={{
                                opacity: 0,
                                scale: 0.2,
                                x: Math.cos(angle) * dist,
                                y: Math.sin(angle) * dist,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.45, ease: 'easeOut' }}
                              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sand-light shadow-[0_0_6px_rgba(226,215,193,0.9)]"
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </button>

              <EggGreetingConstellation
                isCracked={isCracked}
                isLight={isLight}
                stageRef={stageRef}
              />
            </div>

            {/* Unified Hero-Matched Fracture Progress Pill & Reset Control */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleCrackTap}
                aria-label={`${stageLabel} (${taps} of ${MAX_TAPS})`}
                className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isLight
                    ? 'shadow-[0_4px_16px_rgba(17,17,19,0.08)]'
                    : 'shadow-[0_4px_20px_rgba(0,0,0,0.65)]'
                } ${
                  taps > 0
                    ? 'border-sand bg-obsidian/95 ring-1 ring-sand/35'
                    : 'border-sand/35 bg-obsidian/90 hover:border-sand'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {!isCracked && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isCracked ? 'bg-emerald-400' : 'bg-sand'
                    }`}
                  />
                </span>

                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-sand-light transition-colors group-hover:text-alabaster whitespace-nowrap">
                  {stageLabel}
                </span>

                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const lit = idx < taps;
                    return (
                      <span
                        key={`egg-pip-${idx}`}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                          lit
                            ? 'bg-sand scale-110 shadow-[0_0_6px_rgba(229,199,123,0.85)]'
                            : 'border border-sand/45 bg-transparent opacity-60'
                        }`}
                      />
                    );
                  })}
                </span>
              </button>

              {isCracked && (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-alabaster/[0.14] bg-obsidian/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:border-sand hover:text-alabaster"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Egg</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
