'use client';

import React, { useEffect, useRef } from 'react';
import { sounds } from '@/lib/sound';
import {
  CONSTELLATION_FONT_CLASSES,
  ConstellationScript,
  SCRIPT_FONT_FAMILIES,
} from '@/lib/constellation-fonts';

export interface EggGreetingItem {
  text: string;
  tier: 1 | 2 | 3;
  script: ConstellationScript;
  italic?: boolean;
  rtl?: boolean;
}

/**
 * Curated multilingual greeting constellation emerging when the Voronoi egg hatches.
 * Styled in the portfolio's editorial Cormorant Garamond Light/Italic, Inter Light,
 * and Classical Script Serifs across three refined visual depth tiers.
 */
export const EGG_GREETINGS: ReadonlyArray<EggGreetingItem> = [
  { text: 'Hello', tier: 1, script: 'cormorant', italic: true },
  { text: '你好', tier: 1, script: 'sc' },
  { text: 'नमस्ते', tier: 1, script: 'devanagari' },
  { text: 'Hola', tier: 2, script: 'cormorant', italic: true },
  { text: 'Bonjour', tier: 1, script: 'cormorant', italic: true },
  { text: 'مرحبا', tier: 1, script: 'arabic', rtl: true },
  { text: 'নমস্কার', tier: 1, script: 'bengali' },
  { text: 'Olá', tier: 2, script: 'cormorant', italic: true },
  { text: 'Здравствуйте', tier: 2, script: 'cormorant' },
  { text: 'こんにちは', tier: 1, script: 'jp' },
  { text: 'Hallo', tier: 2, script: 'sans' },
  { text: '안녕하세요', tier: 2, script: 'kr' },
  { text: 'Ciao', tier: 2, script: 'cormorant', italic: true },
  { text: 'Merhaba', tier: 2, script: 'cormorant' },
  { text: 'Xin chào', tier: 3, script: 'cormorant', italic: true },
  { text: 'வணக்கம்', tier: 2, script: 'tamil' },
  { text: 'السلام علیکم', tier: 1, script: 'arabic', rtl: true },
  { text: 'سلام', tier: 3, script: 'arabic', rtl: true },
  { text: 'Halo', tier: 3, script: 'sans' },
  { text: 'สวัสดี', tier: 2, script: 'thai' },
  { text: 'Jambo', tier: 3, script: 'cormorant', italic: true },
  { text: 'Cześć', tier: 3, script: 'cormorant' },
  { text: 'Γεια σας', tier: 2, script: 'greek' },
  { text: 'שלום', tier: 2, script: 'hebrew', rtl: true },
  { text: 'Hej', tier: 3, script: 'sans' },
  { text: 'Привіт', tier: 3, script: 'cormorant', italic: true },
  { text: 'నమస్కారం', tier: 3, script: 'telugu' },
  { text: 'नमस्कार', tier: 3, script: 'devanagari' },
  { text: 'Kumusta', tier: 3, script: 'sans' },
  { text: 'ሰላም', tier: 3, script: 'ethiopic' },
];

interface GreetingBoxSize {
  w: number;
  h: number;
}

interface GreetingTarget {
  anchorX: number;
  anchorY: number;
  baseRot: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

interface GreetingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Analytical parabolic fountain arc parameters
  launchX: number;
  launchY: number;
  vx0: number;
  vy0: number;
  grav: number;
  flightDur: number;
  handedOff: boolean;
  // Equilibrium constellation state
  anchorX: number;
  anchorY: number;
  rot: number;
  rotVel: number;
  baseRot: number;
  scale: number;
  opacity: number;
  targetOpacity: number;
  delay: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  w: number;
  h: number;
  pulseBoost: number;
  trail: TrailPoint[];
  trailAlpha: number;
}

interface FountainSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grav: number;
  drag: number;
  delay: number;
  age: number;
  life: number;
  size: number;
  warmth: number;
  ambient: boolean;
  trail: TrailPoint[];
}

interface ConstellationProps {
  isCracked: boolean;
  isLight: boolean;
  stageRef: React.RefObject<HTMLButtonElement | null>;
}

const FX_PAD_X = 56;
const FX_PAD_TOP = 84;
const FX_PAD_BOTTOM = 24;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Deterministic PRNG matching section physics cadence. */
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Computes closed-form parabolic launch velocity + gravity to peak at apexY and hit target at flightDur. */
function solveFountainArc(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  apexY: number,
  T: number
): { vx0: number; vy0: number; grav: number } {
  const safeApex = Math.min(apexY, Math.min(y0, y1) - 10);
  const h0 = Math.max(10, y0 - safeApex);
  const h1 = Math.max(10, y1 - safeApex);
  const rootSum = Math.sqrt(h0) + Math.sqrt(h1);
  const grav = (2 * rootSum * rootSum) / (T * T);
  const vy0 = -Math.sqrt(2 * grav * h0);
  const vx0 = (x1 - x0) / T;
  return { vx0, vy0, grav };
}

/**
 * Computes non-overlapping architectural constellation anchors arching over and flanking
 * the settled broken egg shells while guaranteeing zero clipping at desktop & mobile edges.
 */
function computeGreetingTargets(
  wrapW: number,
  wrapH: number,
  shellBox: { left: number; right: number; topY: number },
  originY: number,
  dims: GreetingBoxSize[]
): Array<GreetingTarget> {
  const count = dims.length;
  const cx = wrapW * 0.5;
  const isCompact = wrapW < 500;
  const isPanoramic = wrapW >= 920;
  const edgePad = isCompact ? 8 : isPanoramic ? 14 : 18;
  const topPad = isCompact ? 6 : 8;
  const padX = isCompact ? 10 : isPanoramic ? 20 : 14;
  const padY = isCompact ? 10 : isPanoramic ? 13 : 11;

  // Desktop widths (>=580) provide generous left/right lateral wings beside the fallen shells
  const hasWings = wrapW >= 580 && shellBox.left >= 82;
  const shellKeepLeft = shellBox.left - 12;
  const shellKeepRight = shellBox.right + 12;
  const shellKeepTop = shellBox.topY - 6;

  const haloCy = hasWings
    ? Math.min(shellKeepTop - 42, originY + 28)
    : (topPad + shellKeepTop) * 0.52;
  const rxMax = Math.max(96, cx - edgePad - (isCompact ? 26 : isPanoramic ? 12 : 34));
  const ryUp = Math.max(58, haloCy - topPad - (isCompact ? 12 : 16));
  const ryDownWing = hasWings
    ? Math.max(48, wrapH - 18 - haloCy)
    : Math.max(24, shellKeepTop - 16 - haloCy);
  const maxYAll = hasWings ? wrapH - 16 : shellKeepTop - 6;

  const initialHomes: Array<{ hx: number; hy: number; baseRot: number }> = new Array(count);

  if (hasWings) {
    const ringFractions = isPanoramic ? [0.42, 0.74, 1.0] : [0.36, 0.68, 0.96];
    const xPow = isPanoramic ? 0.65 : 0.86;
    for (let idx = 0; idx < count; idx++) {
      const dim = dims[idx];
      const ringIdx = idx % 3;
      const ringCount = Math.ceil((count - ringIdx) / 3);
      const slot = Math.floor(idx / 3);
      const strat = ((slot * 7 + ringIdx * 2) % ringCount + 0.5) / ringCount;

      const minAng =
        ringIdx === 0
          ? -Math.PI * 0.92
          : ringIdx === 1
            ? -Math.PI * (isPanoramic ? 1.22 : 1.18)
            : -Math.PI * (isPanoramic ? 1.29 : 1.24);
      const maxAng =
        ringIdx === 0
          ? -Math.PI * 0.08
          : ringIdx === 1
            ? Math.PI * (isPanoramic ? 0.22 : 0.18)
            : Math.PI * (isPanoramic ? 0.29 : 0.24);
      const angle = minAng + (maxAng - minAng) * strat;

      const radialScale = ringFractions[ringIdx] * (0.95 + ((idx * 7) % 5) * 0.018);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const shapedCos = Math.sign(cosA) * Math.pow(Math.abs(cosA), xPow);
      let hx = cx + shapedCos * rxMax * radialScale;
      const ry = sinA >= 0 ? ryDownWing : ryUp;
      const hy = haloCy + sinA * ry * (sinA >= 0 ? Math.max(0.72, radialScale) : radialScale);

      if (hy + dim.h * 0.5 > shellKeepTop - 6) {
        const halfW = dim.w * 0.5;
        if (cosA < 0) {
          hx = Math.min(hx, shellKeepLeft - halfW - 18 - (idx % 3) * 18);
        } else {
          hx = Math.max(hx, shellKeepRight + halfW + 18 + (idx % 3) * 18);
        }
      }

      initialHomes[idx] = {
        hx,
        hy,
        baseRot: ((idx % 5) - 2) * (isPanoramic ? 1.25 : 1.15),
      };
    }
  } else {
    const rowCount = 6;
    const baseCaps = [4, 5, 6, 6, 5, 4];
    const rowCaps = baseCaps.map((cap, idx) =>
      idx === rowCount - 1 && count > 30 ? cap + (count - 30) : cap
    );
    const sortedByWidth = Array.from({ length: count }, (_, i) => i).sort(
      (a, b) => dims[b].w - dims[a].w
    );
    const rows: number[][] = Array.from({ length: rowCount }, () => []);
    const rowWidths = new Array(rowCount).fill(0);

    for (const id of sortedByWidth) {
      let bestRow = -1;
      let bestScore = Infinity;
      for (let r = 0; r < rowCount; r++) {
        if (rows[r].length < rowCaps[r]) {
          const spanScale = r === 0 || r === 5 ? 0.78 : r === 1 || r === 4 ? 0.92 : 1.0;
          const load = rowWidths[r] / spanScale;
          if (load < bestScore) {
            bestScore = load;
            bestRow = r;
          }
        }
      }
      if (bestRow === -1) bestRow = 0;
      rows[bestRow].push(id);
      rowWidths[bestRow] += dims[id].w;
    }

    const availW = Math.max(140, wrapW - edgePad * 2);
    const minRowY = topPad + 16;
    const maxRowY = Math.max(minRowY + 40, maxYAll - 14);

    for (let r = 0; r < rowCount; r++) {
      const raw = rows[r];
      const balanced: number[] = [];
      let l = 0;
      let ri = raw.length - 1;
      while (l <= ri) {
        if (r % 2 === 0) {
          balanced.push(raw[l++]);
          if (l <= ri) balanced.push(raw[ri--]);
        } else {
          balanced.push(raw[ri--]);
          if (l <= ri) balanced.push(raw[l++]);
        }
      }

      const spanFrac = r === 0 ? 0.74 : r === 5 ? 0.84 : r === 1 || r === 4 ? 0.92 : 1.0;
      const rowSpanW = availW * spanFrac;
      const rowLeft = cx - rowSpanW * 0.5;
      const totalTextW = balanced.reduce((sum, id) => sum + dims[id].w, 0);
      const gap = Math.max(8, (rowSpanW - totalTextW) / (balanced.length + 0.4));
      let cursorX = rowLeft + ((r % 2) * 0.35 + 0.12) * gap;
      const baseRowY = minRowY + ((maxRowY - minRowY) * r) / Math.max(1, rowCount - 1);

      for (let c = 0; c < balanced.length; c++) {
        const id = balanced[c];
        const w = dims[id].w;
        const colNorm = ((c + 0.5) / balanced.length) * 2 - 1;
        const archY =
          r === 0
            ? -(1 - colNorm * colNorm) * 10
            : r === rowCount - 1
              ? -(1 - colNorm * colNorm) * 11
              : -(1 - colNorm * colNorm) * 5;
        const microY = (((r * 7 + c * 11) % 5) - 2) * 2.0;
        const hx = clamp(cursorX + w * 0.5, edgePad + w * 0.5, wrapW - edgePad - w * 0.5);
        const hy = clamp(
          baseRowY + archY + microY,
          topPad + dims[id].h * 0.5,
          maxYAll - dims[id].h * 0.5
        );

        initialHomes[id] = {
          hx,
          hy,
          baseRot: ((id % 3) - 1) * 0.85,
        };
        cursorX += w + gap;
      }
    }
  }

  const pos = initialHomes.map((h) => ({ x: h.hx, y: h.hy }));

  // Iteratively relax pairs, shell exclusion & strict bound pinning (zero final overlap guaranteed)
  const totalPasses = 140;
  for (let pass = 0; pass < totalPasses; pass++) {
    const pullHome = pass < totalPasses - 45 ? 0.045 : 0;

    if (pullHome > 0) {
      for (let i = 0; i < count; i++) {
        pos[i].x += (initialHomes[i].hx - pos[i].x) * pullHome;
        pos[i].y += (initialHomes[i].hy - pos[i].y) * pullHome;
      }
    }

    for (let i = 0; i < count; i++) {
      const hw = dims[i].w * 0.5;
      const hh = dims[i].h * 0.5;
      if (!hasWings) {
        pos[i].y = Math.min(pos[i].y, shellKeepTop - hh - 2);
      } else {
        const boxLeft = pos[i].x - hw;
        const boxRight = pos[i].x + hw;
        const boxBottom = pos[i].y + hh;
        if (boxRight > shellKeepLeft && boxLeft < shellKeepRight && boxBottom > shellKeepTop) {
          const pushUp = boxBottom - shellKeepTop;
          const pushLeft = boxRight - shellKeepLeft;
          const pushRight = shellKeepRight - boxLeft;
          const minSide = Math.min(pushLeft, pushRight);
          if (pushUp <= minSide + 10) {
            pos[i].y = shellKeepTop - hh - 4;
          } else if (pushLeft < pushRight) {
            pos[i].x = shellKeepLeft - hw - 6;
          } else {
            pos[i].x = shellKeepRight + hw + 6;
          }
        }
      }

      const minX = edgePad + hw;
      const maxX = Math.max(minX, wrapW - edgePad - hw);
      const minY = topPad + hh;
      const maxY = Math.max(minY, maxYAll - hh);
      pos[i].x = clamp(pos[i].x, minX, maxX);
      pos[i].y = clamp(pos[i].y, minY, maxY);
    }

    const sepGain = pass < totalPasses - 20 ? 0.56 : 0.72;
    for (let i = 0; i < count; i++) {
      const hwI = dims[i].w * 0.5;
      const hhI = dims[i].h * 0.5;
      const minXI = edgePad + hwI;
      const maxXI = Math.max(minXI, wrapW - edgePad - hwI);
      const minYI = topPad + hhI;
      const maxYI = Math.max(minYI, maxYAll - hhI);

      for (let j = i + 1; j < count; j++) {
        let dx = pos[j].x - pos[i].x;
        let dy = pos[j].y - pos[i].y;
        const rotMargin = (dims[i].w + dims[j].w) * 0.025;
        const reqW = hwI + dims[j].w * 0.5 + padX;
        const reqH = hhI + dims[j].h * 0.5 + padY + rotMargin;

        if (Math.abs(dx) < reqW && Math.abs(dy) < reqH) {
          if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            dx = (i % 2 === 0 ? 1 : -1) * 0.6;
            dy = -0.6;
          }
          const penX = reqW - Math.abs(dx);
          const penY = reqH - Math.abs(dy);
          const dirX = dx >= 0 ? 1 : -1;
          const dirY = dy >= 0 ? 1 : -1;
          const hwJ = dims[j].w * 0.5;
          const hhJ = dims[j].h * 0.5;
          const minXJ = edgePad + hwJ;
          const maxXJ = Math.max(minXJ, wrapW - edgePad - hwJ);
          const minYJ = topPad + hhJ;
          const maxYJ = Math.max(minYJ, maxYAll - hhJ);
          const roomXI = dirX > 0 ? Math.max(0, pos[i].x - minXI) : Math.max(0, maxXI - pos[i].x);
          const roomXJ = dirX > 0 ? Math.max(0, maxXJ - pos[j].x) : Math.max(0, pos[j].x - minXJ);
          const roomYI = dirY > 0 ? Math.max(0, pos[i].y - minYI) : Math.max(0, maxYI - pos[i].y);
          const roomYJ = dirY > 0 ? Math.max(0, maxYJ - pos[j].y) : Math.max(0, pos[j].y - minYJ);
          const roomSumX = roomXI + roomXJ;
          const roomSumY = roomYI + roomYJ;

          const preferX =
            (penX * 0.9 < penY && roomSumX >= penX * 0.5) || roomSumY < penY * 0.5;

          if (preferX) {
            const totalPush = penX * sepGain;
            const shareI = roomSumX > 0.1 ? roomXI / roomSumX : 0.5;
            pos[i].x = clamp(pos[i].x - dirX * totalPush * shareI, minXI, maxXI);
            pos[j].x = clamp(pos[j].x + dirX * totalPush * (1 - shareI), minXJ, maxXJ);
          } else {
            const totalPush = penY * sepGain;
            const shareI = roomSumY > 0.1 ? roomYI / roomSumY : 0.5;
            pos[i].y = clamp(pos[i].y - dirY * totalPush * shareI, minYI, maxYI);
            pos[j].y = clamp(pos[j].y + dirY * totalPush * (1 - shareI), minYJ, maxYJ);
          }
        }
      }

      if (Math.hypot(pos[i].x - cx, pos[i].y - originY) < 12) {
        pos[i].y = clamp(pos[i].y - 16, minYI, maxYI);
      }
    }
  }

  return pos.map((p, idx) => ({
    anchorX: p.x,
    anchorY: p.y,
    baseRot: initialHomes[idx].baseRot,
  }));
}

export const EggGreetingConstellation: React.FC<ConstellationProps> = ({
  isCracked,
  isLight,
  stageRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const wordRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const particlesRef = useRef<GreetingParticle[]>([]);
  const sparksRef = useRef<FountainSpark[]>([]);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const rafRef = useRef<number | null>(null);
  const dimsRef = useRef<GreetingBoxSize[]>([]);
  const metricsRef = useRef<{
    wrapW: number;
    wrapH: number;
    originX: number;
    originY: number;
    craterY: number;
    shellLeft: number;
    shellRight: number;
    shellTopY: number;
  } | null>(null);

  const measureGeometry = () => {
    const container = containerRef.current;
    const stageEl = stageRef.current;
    if (!container || !stageEl) return null;

    const cRect = container.getBoundingClientRect();
    const sRect = stageEl.getBoundingClientRect();
    if (cRect.width < 120 || cRect.height < 120) return null;

    const relLeft = sRect.left - cRect.left;
    const relTop = sRect.top - cRect.top;

    const dims = EGG_GREETINGS.map((_, i) => {
      const el = wordRefs.current[i];
      if (!el) return { w: 54, h: 22 };
      return { w: el.offsetWidth || 54, h: el.offsetHeight || 22 };
    });
    dimsRef.current = dims;

    const geom = {
      wrapW: cRect.width,
      wrapH: cRect.height,
      originX: relLeft + sRect.width * 0.5,
      originY: relTop + sRect.height * 0.48,
      craterY: relTop + sRect.height * 0.62,
      shellLeft: relLeft + sRect.width * 0.16,
      shellRight: relLeft + sRect.width * 0.84,
      shellTopY: relTop + sRect.height * (cRect.width < 580 ? 0.745 : 0.72),
    };
    metricsRef.current = geom;
    return { geom, dims };
  };

  // Pointer tracking across container for breeze sweep & ambient swirl
  useEffect(() => {
    if (!isCracked) return;

    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left - 36 &&
        e.clientX <= rect.right + 36 &&
        e.clientY >= rect.top - 36 &&
        e.clientY <= rect.bottom + 36;
      if (inside) {
        pointerRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          active: true,
        };
      } else {
        pointerRef.current.active = false;
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      pointerRef.current.active = false;
    };
  }, [isCracked]);

  // Spawn parabolic fountain eruption + sparkler VFX trails + living orbital constellation
  useEffect(() => {
    if (!isCracked) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      particlesRef.current = [];
      sparksRef.current = [];
      return;
    }

    const measured = measureGeometry();
    if (!measured) return;

    const { geom, dims } = measured;
    const targets = computeGreetingTargets(
      geom.wrapW,
      geom.wrapH,
      { left: geom.shellLeft, right: geom.shellRight, topY: geom.shellTopY },
      geom.originY,
      dims
    );

    const hasWingsOnInit = geom.wrapW >= 580 && geom.shellLeft >= 82;
    const isPanoramicOnInit = hasWingsOnInit && geom.wrapW >= 920;
    const rand = seededRand(4747);
    const hasExisting = particlesRef.current.length === EGG_GREETINGS.length;

    const syncFxCanvasSize = () => {
      const canvas = fxCanvasRef.current;
      const m = metricsRef.current;
      if (!canvas || !m) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = Math.round(m.wrapW + FX_PAD_X * 2);
      const cssH = Math.round(m.wrapH + FX_PAD_TOP + FX_PAD_BOTTOM);
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };
    syncFxCanvasSize();

    if (!hasExisting) {
      particlesRef.current = EGG_GREETINGS.map((item, idx) => {
        const tgt = targets[idx];
        const launchX = geom.originX + ((idx % 5) - 2) * 5 + (rand() - 0.5) * 8;
        const launchY = geom.craterY + (rand() - 0.35) * 10;

        // Compact cascading launch waves; distant wing words soar slightly longer on wider panoramic arcs
        const distFrac = clamp(
          Math.abs(tgt.anchorX - launchX) / Math.max(240, geom.wrapW * 0.46),
          0,
          1
        );
        const waveDelay = (idx % 6) * 0.017 + Math.floor(idx / 6) * 0.013;
        const flightDur =
          (isPanoramicOnInit ? 0.6 : hasWingsOnInit ? 0.6 : 0.54) +
          distFrac * (isPanoramicOnInit ? 0.25 : 0.1) +
          (idx % 3) * 0.025 +
          rand() * 0.025;

        // Compute sweeping high fountain apex overhead before arching smoothly down to anchor
        const rawLift = hasWingsOnInit
          ? 58 + distFrac * (isPanoramicOnInit ? 44 : 20) + (idx % 4) * 10 + rand() * 14
          : 34 + (idx % 4) * 8 + rand() * 12;
        const topSafety = hasWingsOnInit ? 12 : 10;
        const desiredApex = Math.max(
          topSafety,
          Math.min(launchY, tgt.anchorY) - rawLift
        );

        const arc = solveFountainArc(
          launchX,
          launchY,
          tgt.anchorX,
          tgt.anchorY,
          desiredApex,
          flightDur
        );

        const targetOpacity = item.tier === 1 ? 0.98 : item.tier === 2 ? 0.94 : 0.9;

        return {
          x: launchX,
          y: launchY,
          vx: arc.vx0,
          vy: arc.vy0,
          launchX,
          launchY,
          vx0: arc.vx0,
          vy0: arc.vy0,
          grav: arc.grav,
          flightDur,
          handedOff: false,
          anchorX: tgt.anchorX,
          anchorY: tgt.anchorY,
          rot: clamp((tgt.anchorX - launchX) * 0.036, -18, 18),
          rotVel: (rand() - 0.5) * 24,
          baseRot: tgt.baseRot,
          scale: 0.16,
          opacity: 0,
          targetOpacity,
          delay: waveDelay,
          freqX: 1.15 + rand() * 0.65,
          freqY: 1.25 + rand() * 0.75,
          phaseX: rand() * Math.PI * 2,
          phaseY: rand() * Math.PI * 2,
          ampX: isPanoramicOnInit ? 7.2 + rand() * 4.5 : hasWingsOnInit ? 5.8 + rand() * 4.2 : 3.2 + rand() * 2.2,
          ampY: isPanoramicOnInit ? 5.4 + rand() * 3.8 : hasWingsOnInit ? 5.0 + rand() * 3.8 : 2.6 + rand() * 2.0,
          w: dims[idx].w,
          h: dims[idx].h,
          pulseBoost: 0,
          trail: [],
          trailAlpha: 1,
        };
      });

      // Spawn two-tier molten fountain: central vertical geyser + sweeping wide-wing spark streamers
      const fountainSparks: FountainSpark[] = [];
      const coreSparkCount = isPanoramicOnInit ? 74 : hasWingsOnInit ? 72 : 64;
      for (let i = 0; i < coreSparkCount; i++) {
        const centerFocus = i % 3 === 0 ? 0.34 : 0.86;
        const spreadAngle = -Math.PI * 0.5 + (rand() - 0.5) * (Math.PI * 0.74 * centerFocus);
        const speed = (hasWingsOnInit ? 320 : 250) + rand() * (hasWingsOnInit ? 340 : 240);
        const sx = geom.originX + (rand() - 0.5) * 20;
        const sy = geom.craterY + (rand() - 0.5) * 10;
        fountainSparks.push({
          x: sx,
          y: sy,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          grav: 1220 + rand() * 440,
          drag: 0.62 + rand() * 0.35,
          delay: rand() * 0.16,
          age: 0,
          life: 0.85 + rand() * 0.62,
          size: 1.4 + rand() * 1.9,
          warmth: rand(),
          ambient: false,
          trail: [{ x: sx, y: sy }],
        });
      }

      if (hasWingsOnInit) {
        const wingStreamerCount = isPanoramicOnInit ? 48 : 28;
        for (let i = 0; i < wingStreamerCount; i++) {
          const goRight = i % 2 === 0;
          const elev = 0.08 + rand() * 0.24; // shallow flanking sweep across wide sky [14°..58° above horizon]
          const ang = goRight ? -Math.PI * elev : -Math.PI * (1 - elev);
          const speed = (isPanoramicOnInit ? 520 : 380) + rand() * (isPanoramicOnInit ? 420 : 280);
          const sx = geom.originX + (goRight ? 8 : -8) + (rand() - 0.5) * 14;
          const sy = geom.craterY + (rand() - 0.4) * 10;
          fountainSparks.push({
            x: sx,
            y: sy,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            grav: 820 + rand() * 320,
            drag: 0.38 + rand() * 0.2,
            delay: rand() * 0.14,
            age: 0,
            life: 0.92 + rand() * 0.55,
            size: 1.3 + rand() * 1.6,
            warmth: 0.35 + rand() * 0.65,
            ambient: false,
            trail: [{ x: sx, y: sy }],
          });
        }
      }

      // Add slow continuous rising golden stardust across both the cracked shell crater & wide outer sky
      const ambientCount = isPanoramicOnInit ? 30 : hasWingsOnInit ? 20 : 12;
      for (let i = 0; i < ambientCount; i++) {
        const inWings = isPanoramicOnInit && i % 5 >= 3;
        const sx = inWings
          ? 24 + rand() * Math.max(120, geom.wrapW - 48)
          : geom.shellLeft + rand() * Math.max(80, geom.shellRight - geom.shellLeft);
        const sy = inWings
          ? geom.shellTopY - 26 + rand() * 58
          : geom.shellTopY + 6 + rand() * 24;
        fountainSparks.push({
          x: sx,
          y: sy,
          vx: (rand() - 0.5) * (inWings ? 26 : 18),
          vy: -(20 + rand() * 28),
          grav: -4,
          drag: 0.1,
          delay: 0.4 + rand() * 1.6,
          age: 0,
          life: 1.9 + rand() * 1.5,
          size: 1.1 + rand() * 1.3,
          warmth: 0.3 + rand() * 0.7,
          ambient: true,
          trail: [{ x: sx, y: sy }],
        });
      }

      sparksRef.current = fountainSparks;
    }

    const resyncMetrics = () => {
      const upd = measureGeometry();
      if (!upd) return;
      syncFxCanvasSize();
      const newTargets = computeGreetingTargets(
        upd.geom.wrapW,
        upd.geom.wrapH,
        { left: upd.geom.shellLeft, right: upd.geom.shellRight, topY: upd.geom.shellTopY },
        upd.geom.originY,
        upd.dims
      );
      const wide = upd.geom.wrapW >= 580 && upd.geom.shellLeft >= 82;
      const pan = wide && upd.geom.wrapW >= 920;
      particlesRef.current.forEach((p, i) => {
        p.anchorX = newTargets[i].anchorX;
        p.anchorY = newTargets[i].anchorY;
        p.baseRot = newTargets[i].baseRot;
        p.ampX = pan ? 7.2 + (i % 5) * 1.0 : wide ? 5.8 + (i % 5) * 0.85 : 3.2 + (i % 4) * 0.55;
        p.ampY = pan ? 5.4 + (i % 4) * 0.95 : wide ? 5.0 + (i % 4) * 0.9 : 2.6 + (i % 3) * 0.65;
        p.w = upd.dims[i].w;
        p.h = upd.dims[i].h;
      });
    };

    const ro = new ResizeObserver(resyncMetrics);
    if (containerRef.current) ro.observe(containerRef.current);

    let cancelled = false;
    const handleFontsDone = () => {
      if (!cancelled) resyncMetrics();
    };
    const fontSet = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fontSet) {
      fontSet.ready.then(handleFontsDone).catch(() => {});
      fontSet.addEventListener?.('loadingdone', handleFontsDone);
    }

    let lastNow = performance.now();
    let elapsed = 0;

    const paintParticle = (
      i: number,
      p: GreetingParticle,
      glowRatio: number,
      shimmerOpacity: number,
      lightMode: boolean
    ) => {
      const el = wordRefs.current[i];
      if (!el) return;
      el.style.transform = `translate3d(${(p.x - p.w * 0.5).toFixed(2)}px, ${(p.y - p.h * 0.5).toFixed(2)}px, 0) rotate(${p.rot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
      el.style.opacity = String(clamp(p.opacity + shimmerOpacity, 0, 1).toFixed(3));
      const warmGlow = glowRatio > 0.04;
      if (warmGlow) {
        const gAlpha = (glowRatio * (lightMode ? 0.42 : 0.72)).toFixed(2);
        el.style.textShadow = lightMode
          ? `0 0 ${Math.round(8 + glowRatio * 10)}px rgba(184, 128, 36, ${gAlpha})`
          : `0 0 ${Math.round(10 + glowRatio * 16)}px rgba(242, 206, 132, ${gAlpha})`;
      } else if (el.style.textShadow) {
        el.style.textShadow = '';
      }
    };

    const drawRibbon = (
      ctx: CanvasRenderingContext2D,
      pts: TrailPoint[],
      alpha: number,
      headWidth: number,
      lightMode: boolean,
      warmth: number
    ) => {
      if (pts.length < 2 || alpha <= 0.01) return;
      for (let k = 1; k < pts.length; k++) {
        const frac = k / (pts.length - 1);
        const p0 = pts[k - 1];
        const p1 = pts[k];
        ctx.beginPath();
        ctx.moveTo(p0.x + FX_PAD_X, p0.y + FX_PAD_TOP);
        ctx.lineTo(p1.x + FX_PAD_X, p1.y + FX_PAD_TOP);
        const segAlpha = alpha * frac * frac;
        if (lightMode) {
          ctx.strokeStyle =
            frac > 0.72
              ? `rgba(166, 114, 28, ${(segAlpha * 0.92).toFixed(3)})`
              : `rgba(205, 152, 62, ${(segAlpha * 0.7).toFixed(3)})`;
        } else {
          ctx.strokeStyle =
            frac > 0.78 && warmth > 0.45
              ? `rgba(255, 246, 214, ${(segAlpha * 0.95).toFixed(3)})`
              : `rgba(232, 184, 92, ${(segAlpha * 0.78).toFixed(3)})`;
        }
        ctx.lineWidth = Math.max(0.4, headWidth * frac);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.028, Math.max(0.004, (now - lastNow) / 1000));
      lastNow = now;
      elapsed += dt;

      const list = particlesRef.current;
      const m = metricsRef.current;
      if (!m || list.length === 0) return;

      const hasWings = m.wrapW >= 580 && m.shellLeft >= 82;
      const isPanoramic = hasWings && m.wrapW >= 920;
      const maxFloorY = hasWings ? m.wrapH - 14 : m.shellTopY - 8;
      const padPairX = m.wrapW < 500 ? 8 : isPanoramic ? 14 : 11;
      const padPairY = m.wrapW < 500 ? 7 : isPanoramic ? 10 : 9;
      const ptr = pointerRef.current;
      const ptrRadius = m.wrapW < 500 ? 82 : isPanoramic ? 158 : 128;
      const lightMode = isLightRef.current;

      // 1. Update erupting parabolic fountain trajectories -> smooth spring capture -> living orbital drift
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const age = elapsed - p.delay;
        if (age < 0) {
          const el = wordRefs.current[i];
          if (el) el.style.opacity = '0';
          continue;
        }

        if (!p.handedOff && age < p.flightDur) {
          // Pure parabolic fountain kinematics so words visibly rocket high out of the crack & arch across sky
          const tFlight = age;
          p.x = p.launchX + p.vx0 * tFlight;
          p.y = p.launchY + p.vy0 * tFlight + 0.5 * p.grav * tFlight * tFlight;
          p.vx = p.vx0;
          p.vy = p.vy0 + p.grav * tFlight;

          const u = tFlight / p.flightDur;
          // Heroic nozzle pop (0.16 -> 1.24) tapering cleanly down toward 1.0 as it crests
          const popScale =
            u < 0.28
              ? 0.16 + 1.08 * Math.sin((u / 0.28) * Math.PI * 0.5)
              : 1.24 - 0.22 * ((u - 0.28) / 0.72);
          p.scale = popScale;
          p.opacity = p.targetOpacity * clamp(u / 0.14, 0, 1);

          // Tilt softly along arc tangent during launch
          const speedAngle = clamp(p.vx * 0.018 + p.vy * 0.011, -13, 13);
          p.rot = speedAngle * (1 - u * 0.55) + p.baseRot * (u * 0.55);

          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > (isPanoramic ? 17 : 13)) p.trail.shift();
          p.trailAlpha = 1;
        } else {
          if (!p.handedOff) {
            p.handedOff = true;
            // Preserve partial momentum into underdamped magnetic catch for natural air-cushion bounce
            p.vx = p.vx * 0.22;
            p.vy = p.vy * 0.22;
          }

          p.trailAlpha = Math.max(0, p.trailAlpha - dt * (isPanoramic ? 2.2 : 2.8));
          if (p.trailAlpha > 0.02 && p.trail.length > 1) {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > (isPanoramic ? 18 : 14)) p.trail.shift();
          }

          const settleAge = age - p.flightDur;
          const breathBlend = clamp(settleAge / 0.28, 0, 1);

          // Underdamped magnetic catch transitioning smoothly into lively figure-eight drift
          const stiffness = 24;
          const damping = 4.8;

          const goalX =
            p.anchorX +
            (Math.sin(elapsed * p.freqX + p.phaseX) * p.ampX +
              Math.cos(elapsed * 0.55 + p.phaseY) * (p.ampX * 0.28)) *
              breathBlend;
          const goalY =
            p.anchorY +
            (Math.cos(elapsed * p.freqY + p.phaseY) * p.ampY +
              Math.sin(elapsed * 0.62 + p.phaseX) * (p.ampY * 0.28)) *
              breathBlend;

          let ax = (goalX - p.x) * stiffness - p.vx * damping;
          let ay = (goalY - p.y) * stiffness - p.vy * damping;

          // Aerodynamic cursor deflection + wake
          let hoverHighlight = 0;
          if (ptr.active) {
            const pdx = p.x - ptr.x;
            const pdy = p.y - ptr.y;
            const pDist = Math.hypot(pdx, pdy);
            if (pDist < ptrRadius && pDist > 1) {
              const strength = 1 - pDist / ptrRadius;
              const pushAccel = strength * strength * 1650;
              ax += (pdx / pDist) * pushAccel;
              ay += (pdy / pDist) * pushAccel;
              hoverHighlight = strength * 0.26;
            }
          }

          p.vx += ax * dt;
          p.vy += ay * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Subtle scale breathing pulse + click pop boost
          const idleBreathScale = 1 + Math.sin(elapsed * 1.45 + p.phaseX) * 0.024 * breathBlend;
          const scaleGoal = idleBreathScale + p.pulseBoost * 0.24;
          p.scale += (scaleGoal - p.scale) * Math.min(1, dt * 11);
          p.pulseBoost = Math.max(0, p.pulseBoost - dt * 1.85);

          const opGoal = clamp(p.targetOpacity + p.pulseBoost * 0.28 + hoverHighlight * 0.14, 0, 1);
          p.opacity += (opGoal - p.opacity) * Math.min(1, dt * 8);

          const rotTarget =
            p.baseRot + Math.sin(elapsed * 1.05 + p.phaseX) * 2.6 * breathBlend;
          p.rotVel += ((rotTarget - p.rot) * 16 - p.rotVel * 5.0) * dt;
          p.rot += p.rotVel * dt;

          // Boundary cushions inside settled visible bounds
          const minX = 10 + p.w * 0.5;
          const maxX = Math.max(minX, m.wrapW - 10 - p.w * 0.5);
          const minY = 6 + p.h * 0.5;
          const maxY = Math.max(minY, maxFloorY - p.h * 0.5);
          if (p.x < minX) {
            p.x = minX;
            if (p.vx < 0) p.vx = -p.vx * 0.35;
          } else if (p.x > maxX) {
            p.x = maxX;
            if (p.vx > 0) p.vx = -p.vx * 0.35;
          }
          if (p.y < minY) {
            p.y = minY;
            if (p.vy < 0) p.vy = -p.vy * 0.35;
          } else if (p.y > maxY) {
            p.y = maxY;
            if (p.vy > 0) p.vy = -p.vy * 0.35;
          }
        }
      }

      // 2. Ramp smooth runtime overlap prevention once words descend into the settled sky zone
      for (let i = 0; i < list.length; i++) {
        const ageI = elapsed - list[i].delay;
        if (ageI < list[i].flightDur * 0.85) continue;
        for (let j = i + 1; j < list.length; j++) {
          const ageJ = elapsed - list[j].delay;
          if (ageJ < list[j].flightDur * 0.85) continue;
          const a = list[i];
          const b = list[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const reqW = (a.w + b.w) * 0.5 + padPairX;
          const reqH = (a.h + b.h) * 0.5 + padPairY + (a.w + b.w) * 0.025;
          if (Math.abs(dx) < reqW && Math.abs(dy) < reqH) {
            const penX = reqW - Math.abs(dx);
            const penY = reqH - Math.abs(dy);
            const blend = a.handedOff && b.handedOff ? 0.34 : 0.16;
            if (penX < penY) {
              const s = (dx >= 0 ? 1 : -1) * penX * blend;
              a.x -= s;
              b.x += s;
              a.vx -= s * 6;
              b.vx += s * 6;
            } else {
              const s = (dy >= 0 ? 1 : -1) * penY * blend;
              a.y -= s;
              b.y += s;
              a.vy -= s * 6;
              b.vy += s * 6;
            }
          }
        }
      }

      // Final boundary clamp pass for handed-off particles after separation push
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p.handedOff) continue;
        p.x = clamp(p.x, 8 + p.w * 0.5, Math.max(8 + p.w * 0.5, m.wrapW - 8 - p.w * 0.5));
        p.y = clamp(p.y, 6 + p.h * 0.5, Math.max(6 + p.h * 0.5, maxFloorY - p.h * 0.5));
      }

      // 3. Flush transforms + dynamic eruption/living shimmer glow to GPU word layers
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const age = elapsed - p.delay;
        if (age < 0) continue;
        const eruptGlow = p.handedOff
          ? clamp(1 - (age - p.flightDur) / 0.35, 0, 1) * 0.65
          : 0.95;
        const waveShimmer =
          p.handedOff
            ? Math.max(0, Math.sin(elapsed * 2.1 - (p.x / Math.max(200, m.wrapW)) * 4.2 + p.phaseX)) *
              0.12
            : 0;
        const totalGlow = clamp(eruptGlow + waveShimmer * 2.2 + p.pulseBoost * 0.9, 0, 1);
        paintParticle(i, p, totalGlow, waveShimmer * 0.65, lightMode);
      }

      // 4. Render Volcanic Spark Fountain, Explosion Halo Flash & Word Comet Trails onto HiDPI Canvas
      const fxCanvas = fxCanvasRef.current;
      const ctx = fxCanvas?.getContext('2d');
      if (fxCanvas && ctx) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, fxCanvas.width / dpr, fxCanvas.height / dpr);

        const cxCanvas = m.originX + FX_PAD_X;
        const cyCanvas = m.craterY + FX_PAD_TOP;

        // Core egg-hatch supernova flash & wide panoramic shockwave ellipses (0 .. 0.74s)
        const ringWindow = isPanoramic ? 0.74 : 0.65;
        if (elapsed < ringWindow) {
          const flashU = clamp(elapsed / 0.44, 0, 1);
          const flashAlpha = Math.pow(1 - flashU, 1.8) * (lightMode ? 0.48 : 0.86);
          const flashRadius = 20 + flashU * (isPanoramic ? 235 : hasWings ? 165 : 110);
          const grad = ctx.createRadialGradient(
            cxCanvas,
            cyCanvas,
            0,
            cxCanvas,
            cyCanvas,
            flashRadius
          );
          if (lightMode) {
            grad.addColorStop(0, `rgba(182, 128, 34, ${flashAlpha.toFixed(3)})`);
            grad.addColorStop(0.45, `rgba(214, 166, 74, ${(flashAlpha * 0.45).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(214, 166, 74, 0)');
          } else {
            grad.addColorStop(0, `rgba(255, 247, 218, ${flashAlpha.toFixed(3)})`);
            grad.addColorStop(0.38, `rgba(232, 186, 98, ${(flashAlpha * 0.55).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(232, 186, 98, 0)');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cxCanvas, cyCanvas, flashRadius, 0, Math.PI * 2);
          ctx.fill();

          // Concentric shockwave ellipses sweeping across the wings from ruptured shell center
          for (let rIdx = 0; rIdx < 2; rIdx++) {
            const ringDur = isPanoramic ? 0.64 : 0.52;
            const ringT = clamp((elapsed - rIdx * 0.09) / ringDur, 0, 1);
            if (ringT > 0 && ringT < 1) {
              const ringR =
                16 + ringT * (isPanoramic ? 490 : hasWings ? 260 : 140) * (1 - rIdx * 0.16);
              const ryAspect = isPanoramic ? 0.36 : 0.62;
              const ringAlpha = (1 - ringT) * (1 - ringT) * (lightMode ? 0.45 : 0.64);
              ctx.beginPath();
              ctx.ellipse(cxCanvas, cyCanvas, ringR, ringR * ryAspect, 0, 0, Math.PI * 2);
              ctx.strokeStyle = lightMode
                ? `rgba(166, 114, 28, ${ringAlpha.toFixed(3)})`
                : `rgba(244, 218, 162, ${ringAlpha.toFixed(3)})`;
              ctx.lineWidth = Math.max(0.5, (1 - ringT) * 1.9);
              ctx.stroke();
            }
          }
        }

        // Draw parabolic comet ribbons tracing each erupting greeting word
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          if (p.trailAlpha <= 0.02 || elapsed < p.delay) continue;
          drawRibbon(
            ctx,
            p.trail,
            p.trailAlpha * (p.opacity > 0 ? 0.72 : 0.4),
            p.w > 70 ? 2.4 : 1.9,
            lightMode,
            (i % 3) * 0.4
          );
        }

        // Advance & render parabolic fountain sparks + continuous ambient drifting stardust
        const sparks = sparksRef.current;
        for (let i = 0; i < sparks.length; i++) {
          const sp = sparks[i];
          if (elapsed < sp.delay) continue;
          sp.age += dt;

          if (sp.age >= sp.life) {
            if (sp.ambient) {
              // Recycle ambient dust motes seamlessly over the cracked shell shards & wide panoramic wings
              sp.age = 0;
              const recycleWing = isPanoramic && i % 5 >= 3;
              const frac = ((i * 37 + Math.floor(elapsed * 29)) % 100) * 0.01;
              sp.x = recycleWing
                ? 24 + frac * Math.max(120, m.wrapW - 48)
                : m.shellLeft + frac * Math.max(80, m.shellRight - m.shellLeft);
              sp.y = recycleWing
                ? m.shellTopY - 24 + ((i * 23) % 54)
                : m.shellTopY + 8 + ((i * 19) % 22);
              sp.vx = Math.sin(elapsed + i) * (recycleWing ? 20 : 14);
              sp.vy = -(20 + (i % 5) * 6);
              sp.trail = [{ x: sp.x, y: sp.y }];
            }
            continue;
          }

          const dragFactor = Math.max(0, 1 - sp.drag * dt);
          sp.vx *= dragFactor;
          sp.vy = sp.vy * dragFactor + sp.grav * dt;
          if (sp.ambient) {
            sp.vx += Math.sin(elapsed * 2.1 + i) * 18 * dt;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;

          // Fade falling volcanic sparks right as they kiss the tabletop under the settled shells
          if (!sp.ambient && sp.y > m.shellTopY + 44) {
            sp.age = Math.max(sp.age, sp.life - 0.08);
            sp.y = m.shellTopY + 44;
            sp.vy = 0;
            sp.vx *= 0.85;
          }

          sp.trail.push({ x: sp.x, y: sp.y });
          const maxLen = sp.ambient ? 4 : 16;
          if (sp.trail.length > maxLen) sp.trail.shift();

          const lifeFrac = sp.age / sp.life;
          const alpha = sp.ambient
            ? Math.sin(lifeFrac * Math.PI) * (lightMode ? 0.42 : 0.52)
            : Math.pow(1 - lifeFrac, 1.35) * (lightMode ? 0.85 : 0.96);

          if (!sp.ambient) {
            drawRibbon(ctx, sp.trail, alpha, sp.size, lightMode, sp.warmth);
          }

          // Bright molten spark head ember
          const hx = sp.x + FX_PAD_X;
          const hy = sp.y + FX_PAD_TOP;
          ctx.beginPath();
          ctx.arc(hx, hy, sp.ambient ? sp.size * 0.85 : sp.size * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = lightMode
            ? `rgba(166, 114, 24, ${alpha.toFixed(3)})`
            : sp.warmth > 0.55
              ? `rgba(255, 248, 224, ${alpha.toFixed(3)})`
              : `rgba(232, 186, 98, ${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      ro.disconnect();
      fontSet?.removeEventListener?.('loadingdone', handleFontsDone);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isCracked, stageRef]);

  const handleGreetingInteract = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playChime();

    const list = particlesRef.current;
    const origin = list[idx];
    if (!origin) return;

    origin.pulseBoost = 1;

    // Emit localized celebratory burst of 14 golden sparkler trails from the tapped word
    const sparks = sparksRef.current;
    for (let k = 0; k < 14; k++) {
      const ang = (k / 14) * Math.PI * 2 + (idx % 5) * 0.2;
      const spd = 95 + (k % 4) * 55;
      sparks.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 45,
        grav: 420,
        drag: 1.4,
        delay: 0,
        age: 0,
        life: 0.55 + (k % 3) * 0.14,
        size: 1.4 + (k % 2) * 0.6,
        warmth: 0.85,
        ambient: false,
        trail: [{ x: origin.x, y: origin.y }],
      });
    }
    if (sparks.length > 160) {
      sparks.splice(0, sparks.length - 160);
    }

    // Send kinetic radial shockwave ripple across surrounding greetings
    const shockRadius = (metricsRef.current?.wrapW ?? 0) >= 920 ? 300 : 240;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (i === idx) continue;
      const dx = p.x - origin.x;
      const dy = p.y - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < shockRadius && dist > 1) {
        const falloff = 1 - dist / shockRadius;
        const impulse = falloff * 330;
        p.vx += (dx / dist) * impulse;
        p.vy += (dy / dist) * impulse - 35 * falloff;
        p.rotVel += (i % 2 === 0 ? 1 : -1) * 18 * falloff;
        p.pulseBoost = Math.max(p.pulseBoost, falloff * 0.45);
      }
    }
  };

  if (!isCracked) return null;

  return (
    <div
      ref={containerRef}
      aria-label="Global greetings emerging from the hatched artifact"
      className={`pointer-events-none absolute -top-8 sm:-top-6 inset-x-0 bottom-0 z-30 overflow-visible ${CONSTELLATION_FONT_CLASSES}`}
    >
      <canvas
        ref={fxCanvasRef}
        aria-hidden="true"
        style={{
          left: `-${FX_PAD_X}px`,
          right: `-${FX_PAD_X}px`,
          top: `-${FX_PAD_TOP}px`,
          bottom: `-${FX_PAD_BOTTOM}px`,
          width: `calc(100% + ${FX_PAD_X * 2}px)`,
          height: `calc(100% + ${FX_PAD_TOP + FX_PAD_BOTTOM}px)`,
        }}
        className="pointer-events-none absolute z-0"
      />

      {EGG_GREETINGS.map((item, idx) => {
        const isCormorant = item.script === 'cormorant';
        const isArabic = item.script === 'arabic';
        const isHairlineScript =
          item.script === 'telugu' ||
          item.script === 'ethiopic' ||
          (item.script === 'devanagari' && item.tier === 3);

        const opticalScaleCls = isCormorant
          ? item.tier === 1
            ? 'text-[15.5px] sm:text-[22px] md:text-[24.5px]'
            : item.tier === 2
              ? 'text-[13.5px] sm:text-[18.5px] md:text-[20.5px]'
              : 'text-[12px] sm:text-[16px] md:text-[18px]'
          : isArabic
            ? item.tier === 1
              ? 'text-[15px] sm:text-[20.5px] md:text-[23px]'
              : item.tier === 2
                ? 'text-[13.5px] sm:text-[18px] md:text-[20px]'
                : 'text-[12.5px] sm:text-[16.5px] md:text-[18.5px]'
            : item.tier === 1
              ? 'text-[13.5px] sm:text-[19px] md:text-[21px]'
              : item.tier === 2
                ? 'text-[12px] sm:text-[16px] md:text-[17.5px]'
                : 'text-[11px] sm:text-[14.5px] md:text-[16px]';

        const weightCls = isArabic
          ? item.tier === 3
            ? 'font-bold'
            : 'font-normal'
          : isCormorant
            ? item.tier === 3
              ? 'font-semibold'
              : 'font-medium'
            : isHairlineScript
              ? 'font-semibold'
              : item.script === 'sans' && item.tier === 2
                ? 'font-normal'
                : 'font-medium';

        const trackingCls =
          isCormorant || item.script === 'sans' || item.script === 'greek'
            ? 'tracking-[-0.015em]'
            : 'tracking-normal';

        const colorCls =
          item.tier === 1
            ? item.italic
              ? isLight
                ? 'text-[#685030] hover:text-[#111113]'
                : 'text-[#F2E9D8] hover:text-white'
              : isLight
                ? 'text-[#111113] hover:text-[#685030]'
                : 'text-[#F6F5F0] hover:text-[#E2D7C1]'
            : item.tier === 2
              ? isLight
                ? 'text-[#423522] hover:text-[#111113]'
                : 'text-[#E4D8C2] hover:text-[#F6F5F0]'
              : isLight
                ? 'text-[#574C3C] hover:text-[#111113]'
                : 'text-[#CFC2AB] hover:text-[#F2E9D8]';

        const fontFamily = SCRIPT_FONT_FAMILIES[item.script];

        return (
          <button
            key={`${item.text}-${idx}`}
            ref={(el) => {
              wordRefs.current[idx] = el;
            }}
            type="button"
            dir={item.rtl ? 'rtl' : 'auto'}
            onClick={(e) => handleGreetingInteract(idx, e)}
            style={{
              fontFamily,
              opacity: 0,
              willChange: 'transform, opacity',
            }}
            className={`pointer-events-auto absolute left-0 top-0 z-10 select-none whitespace-nowrap leading-[1.12] px-1 py-0.5 cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-sand/60 ${
              item.italic ? 'italic' : ''
            } ${opticalScaleCls} ${weightCls} ${trackingCls} ${colorCls}`}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
};
