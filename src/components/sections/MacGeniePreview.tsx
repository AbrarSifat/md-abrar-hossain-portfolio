'use client';

import React, { useEffect, useRef } from 'react';
import { VERIFIED_CREDENTIALS } from '@/data/portfolio';

export interface MacGeniePointerTarget {
  x: number;
  y: number;
  rowY: number;
}

interface MacGeniePreviewProps {
  imageSrc: string | null;
  pointerRef: React.RefObject<MacGeniePointerTarget | null>;
}

interface DirtyRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PRELOAD_IMAGES = VERIFIED_CREDENTIALS.map((cred) => cred.image);

const OPEN_DURATION = 320; // ms
const CLOSE_DURATION = 220; // ms
const SLICE_COUNT = 30;
const CARD_WIDTH = 260;
const CARD_HEIGHT = 195; // 4:3 certificate ratio
const FOLLOW_DAMPING = 20; // frame-rate independent spring constant

export const MacGeniePreview: React.FC<MacGeniePreviewProps> = ({
  imageSrc,
  pointerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const dprRef = useRef<number>(1);
  const lastDirtyRectRef = useRef<DirtyRect | null>(null);
  const lastDrawnStateRef = useRef<{ x: number; y: number; p: number; src: string | null }>({
    x: -1,
    y: -1,
    p: -1,
    src: null,
  });

  // Dynamic tracking position & active texture
  const currentCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentImageSrcRef = useRef<string | null>(null);
  const targetImageSrcRef = useRef<string | null>(imageSrc);

  targetImageSrcRef.current = imageSrc;

  // Preload and pre-decode all certificate images once on mount to avoid first-hover decode stalls
  useEffect(() => {
    if (typeof window === 'undefined') return;

    PRELOAD_IMAGES.forEach((src) => {
      if (!imageCacheRef.current.has(src)) {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
        imageCacheRef.current.set(src, img);
      }
    });
  }, []);

  // Sync canvas backing dimensions cleanly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d');

    const handleResize = () => {
      const targetCanvas = canvasRef.current;
      if (!targetCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      dprRef.current = dpr;
      targetCanvas.width = Math.floor(window.innerWidth * dpr);
      targetCanvas.height = Math.floor(window.innerHeight * dpr);
      lastDirtyRectRef.current = null;
      lastDrawnStateRef.current = { x: -1, y: -1, p: -1, src: null };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  // Trigger or update animation ONLY when hovered certificate changes — never tear down on mousemove
  useEffect(() => {
    if (imageSrc) {
      currentImageSrcRef.current = imageSrc;
      if (!imageCacheRef.current.has(imageSrc)) {
        const img = new Image();
        img.decoding = 'async';
        img.src = imageSrc;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
        imageCacheRef.current.set(imageSrc, img);
      }
    }

    const render = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      const isOpening = !!targetImageSrcRef.current;
      const step = isOpening ? delta / OPEN_DURATION : delta / CLOSE_DURATION;

      progressRef.current = isOpening
        ? Math.min(1, progressRef.current + step)
        : Math.max(0, progressRef.current - step);

      const p = progressRef.current;
      const target = pointerRef.current;

      // Update smoothed card center without touching React state
      let isMoving = false;
      if (target) {
        const minX = CARD_WIDTH / 2 + 20;
        const maxX = window.innerWidth - CARD_WIDTH / 2 - 20;
        const targetX = Math.max(minX, Math.min(target.x, maxX));
        const targetY = target.rowY + (target.y - target.rowY) * 0.28;

        if (currentCenterRef.current.x === 0 && currentCenterRef.current.y === 0) {
          currentCenterRef.current = { x: targetX, y: targetY };
        } else {
          const alpha = 1 - Math.exp(-FOLLOW_DAMPING * (delta / 1000));
          const dx = targetX - currentCenterRef.current.x;
          const dy = targetY - currentCenterRef.current.y;
          currentCenterRef.current.x += dx * alpha;
          currentCenterRef.current.y += dy * alpha;
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) {
            isMoving = true;
          }
        }
      }

      const center = currentCenterRef.current;
      const imgSrc = currentImageSrcRef.current;
      const drawn = lastDrawnStateRef.current;
      const needsDraw =
        Math.abs(drawn.x - center.x) > 0.1 ||
        Math.abs(drawn.y - center.y) > 0.1 ||
        Math.abs(drawn.p - p) > 0.001 ||
        drawn.src !== imgSrc ||
        p <= 0.001;

      const ctx = ctxRef.current;
      if (ctx && needsDraw) {
        const dpr = dprRef.current;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Dirty-rect clear is vastly faster than wiping full 4K viewport every frame
        if (lastDirtyRectRef.current) {
          const r = lastDirtyRectRef.current;
          ctx.clearRect(r.x, r.y, r.w, r.h);
        }

        const img = imgSrc ? imageCacheRef.current.get(imgSrc) : null;

        if (p > 0.001 && center.x > 0 && img && img.complete && img.naturalWidth > 0) {
          const yRestTop = center.y - CARD_HEIGHT / 2;
          const yRestBottom = center.y + CARD_HEIGHT / 2;
          const xRestLeft = center.x - CARD_WIDTH / 2;
          const dockY = center.y + CARD_HEIGHT / 2;

          let fTop: number;
          let fBot: number;

          if (isOpening) {
            const pTop = Math.min(1, p / 0.72);
            fTop = 1 - Math.pow(1 - pTop, 3);
            const pBot = Math.max(0, (p - 0.22) / 0.78);
            fBot = pBot * pBot * (3 - 2 * pBot);
          } else {
            const r = 1 - p;
            const pBotClose = Math.min(1, r / 0.72);
            fBot = Math.pow(1 - pBotClose, 3);
            const pTopClose = Math.max(0, (r - 0.22) / 0.78);
            const topEase = pTopClose * pTopClose * (3 - 2 * pTopClose);
            fTop = 1 - topEase;
          }

          const yTop = dockY - (dockY - yRestTop) * fTop;
          const yBot = dockY - (dockY - yRestBottom) * fBot;

          const pad = 22;
          lastDirtyRectRef.current = {
            x: Math.floor(xRestLeft - pad),
            y: Math.floor(Math.min(yTop, yRestTop) - pad),
            w: Math.ceil(CARD_WIDTH + pad * 2),
            h: Math.ceil(Math.max(yBot - yTop, CARD_HEIGHT) + pad * 2),
          };

          const buildOpenOrWarpedPath = (
            leftPoints?: { x: number; y: number }[],
            rightPoints?: { x: number; y: number }[]
          ) => {
            ctx.beginPath();
            if (!leftPoints || !rightPoints) {
              if (ctx.roundRect) {
                ctx.roundRect(xRestLeft, yRestTop, CARD_WIDTH, CARD_HEIGHT, 10);
              } else {
                ctx.rect(xRestLeft, yRestTop, CARD_WIDTH, CARD_HEIGHT);
              }
            } else {
              ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
              ctx.lineTo(rightPoints[0].x, rightPoints[0].y);
              for (let i = 1; i < SLICE_COUNT; i++) {
                ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
              }
              ctx.lineTo(leftPoints[SLICE_COUNT - 1].x, leftPoints[SLICE_COUNT - 1].y);
              for (let i = SLICE_COUNT - 2; i >= 0; i--) {
                ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
              }
              ctx.closePath();
            }
          };

          // Fast path once unminimized: single GPU-accelerated drawImage instead of sliced warp
          if (p >= 0.995) {
            buildOpenOrWarpedPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#0c0d0e';
            ctx.fill();

            ctx.save();
            buildOpenOrWarpedPath();
            ctx.clip();
            ctx.drawImage(img, xRestLeft, yRestTop, CARD_WIDTH, CARD_HEIGHT);
            ctx.restore();

            buildOpenOrWarpedPath();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.stroke();
          } else {
            // Active macOS Genie funnel warp
            const wDock = 28;
            const wTop = wDock + (CARD_WIDTH - wDock) * fTop;
            const wBot = wDock + (CARD_WIDTH - wDock) * fBot;

            const leftPoints: { x: number; y: number }[] = [];
            const rightPoints: { x: number; y: number }[] = [];

            for (let i = 0; i < SLICE_COUNT; i++) {
              const v = i / (SLICE_COUNT - 1);
              const sliceY = yTop + v * (yBot - yTop);
              const curveFactor = Math.pow(v, 1.85);
              const sliceW = Math.max(10, wTop + (wBot - wTop) * curveFactor);

              leftPoints.push({ x: center.x - sliceW / 2, y: sliceY });
              rightPoints.push({ x: center.x + sliceW / 2, y: sliceY });
            }

            buildOpenOrWarpedPath(leftPoints, rightPoints);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.fillStyle = '#0c0d0e';
            ctx.fill();

            ctx.save();
            buildOpenOrWarpedPath(leftPoints, rightPoints);
            ctx.clip();

            const imgW = img.naturalWidth || img.width;
            const imgH = img.naturalHeight || img.height;
            const sliceH = (yBot - yTop) / (SLICE_COUNT - 1);
            const srcSliceH = imgH / (SLICE_COUNT - 1);

            for (let i = 0; i < SLICE_COUNT; i++) {
              const v = i / (SLICE_COUNT - 1);
              const dx = leftPoints[i].x;
              const dy = leftPoints[i].y;
              const dw = rightPoints[i].x - leftPoints[i].x;
              ctx.drawImage(
                img,
                0,
                v * (imgH - srcSliceH),
                imgW,
                srcSliceH,
                dx,
                dy,
                dw,
                sliceH + 0.75
              );
            }
            ctx.restore();

            buildOpenOrWarpedPath(leftPoints, rightPoints);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
            ctx.stroke();
          }

          lastDrawnStateRef.current = { x: center.x, y: center.y, p, src: imgSrc };
        } else {
          lastDirtyRectRef.current = null;
          lastDrawnStateRef.current = { x: -1, y: -1, p: 0, src: null };
        }

        ctx.restore();
      }

      if ((isOpening && (p < 1 || isMoving || !!target)) || (!isOpening && p > 0)) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        if (!isOpening && p <= 0) {
          currentImageSrcRef.current = null;
          currentCenterRef.current = { x: 0, y: 0 };
        }
        animFrameRef.current = null;
        lastTimeRef.current = null;
      }
    };

    if (animFrameRef.current === null && (imageSrc || progressRef.current > 0)) {
      lastTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(render);
    }
  }, [imageSrc, pointerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 hidden md:block"
      style={{
        width: '100vw',
        height: '100vh',
        transform: 'translateZ(0)',
      }}
    />
  );
};
