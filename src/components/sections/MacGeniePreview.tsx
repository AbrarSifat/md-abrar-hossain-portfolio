'use client';

import React, { useEffect, useRef } from 'react';

interface MacGeniePreviewProps {
  imageSrc: string | null;
  cursorPos: { x: number; y: number } | null;
  rowCenterY: number | null;
}

const PRELOAD_IMAGES = [
  '/certificates/uc-davis.png',
  '/certificates/university-of-london.jpg',
  '/certificates/wadhwani-foundation.png',
];

export const MacGeniePreview: React.FC<MacGeniePreviewProps> = ({
  imageSrc,
  cursorPos,
  rowCenterY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Dynamic tracking position
  const currentCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentImageSrcRef = useRef<string | null>(null);

  // Target refs
  const targetImageSrcRef = useRef<string | null>(imageSrc);
  const targetCursorRef = useRef<{ x: number; y: number } | null>(cursorPos);
  const targetRowYRef = useRef<number | null>(rowCenterY);

  targetImageSrcRef.current = imageSrc;
  targetCursorRef.current = cursorPos;
  targetRowYRef.current = rowCenterY;

  // Preload all certificate images on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    PRELOAD_IMAGES.forEach((src) => {
      if (!imageCacheRef.current.has(src)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          imageCacheRef.current.set(src, img);
        };
        imageCacheRef.current.set(src, img);
      }
    });
  }, []);

  // Sync canvas size with high-DPI displays
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Genie Effect + Cursor Tracking Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (imageSrc) {
      currentImageSrcRef.current = imageSrc;
    }

    const OPEN_DURATION = 360; // ms
    const CLOSE_DURATION = 260; // ms
    const SLICE_COUNT = 52;
    const CARD_WIDTH = 260;
    const CARD_HEIGHT = 195; // 4:3 certificate ratio
    const LERP_SPEED = 0.18; // smooth spring follow speed

    const render = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(time - lastTimeRef.current, 60);
      lastTimeRef.current = time;

      const isOpening = !!targetImageSrcRef.current;
      const speed = isOpening
        ? delta / OPEN_DURATION
        : delta / CLOSE_DURATION;

      if (isOpening) {
        progressRef.current = Math.min(1, progressRef.current + speed);
      } else {
        progressRef.current = Math.max(0, progressRef.current - speed);
      }

      const p = progressRef.current;
      const cursor = targetCursorRef.current;
      const rowY = targetRowYRef.current;

      // Smoothly update the center position to follow the cursor within the row's line of content
      if (cursor && rowY !== null) {
        const minX = CARD_WIDTH / 2 + 20;
        const maxX = window.innerWidth - CARD_WIDTH / 2 - 20;
        const targetX = Math.max(minX, Math.min(cursor.x, maxX));
        // Stays strictly within its line of content with a subtle, organic float
        const targetY = rowY + (cursor.y - rowY) * 0.28;

        if (currentCenterRef.current.x === 0 && currentCenterRef.current.y === 0) {
          currentCenterRef.current = { x: targetX, y: targetY };
        } else {
          currentCenterRef.current.x += (targetX - currentCenterRef.current.x) * LERP_SPEED;
          currentCenterRef.current.y += (targetY - currentCenterRef.current.y) * LERP_SPEED;
        }
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const imgSrc = currentImageSrcRef.current;
        const img = imgSrc ? imageCacheRef.current.get(imgSrc) : null;
        const center = currentCenterRef.current;

        if (p > 0.001 && center.x > 0 && img && img.complete && img.naturalWidth > 0) {
          // Destination bounds: perfectly centered on the line of content
          const yRestTop = center.y - CARD_HEIGHT / 2;
          const yRestBottom = center.y + CARD_HEIGHT / 2;
          const xRestLeft = center.x - CARD_WIDTH / 2;
          const dockY = center.y + CARD_HEIGHT / 2; // dock line anchor

          let fTop: number;
          let fBot: number;

          if (isOpening) {
            // macOS Genie Unminimize: top shoots up rapidly, bottom anchors and catches up
            const pTop = Math.min(1, p / 0.72);
            fTop = 1 - Math.pow(1 - pTop, 3);

            const pBot = Math.max(0, (p - 0.22) / 0.78);
            fBot = pBot * pBot * (3 - 2 * pBot);
          } else {
            // macOS Genie Minimize: bottom collapses first, top gets sucked in
            const r = 1 - p;
            const pBotClose = Math.min(1, r / 0.72);
            fBot = Math.pow(1 - pBotClose, 3);

            const pTopClose = Math.max(0, (r - 0.22) / 0.78);
            const topEase = pTopClose * pTopClose * (3 - 2 * pTopClose);
            fTop = 1 - topEase;
          }

          const yTop = dockY - (dockY - yRestTop) * fTop;
          const yBot = dockY - (dockY - yRestBottom) * fBot;

          const wDock = 28;
          const wTop = wDock + (CARD_WIDTH - wDock) * fTop;
          const wBot = wDock + (CARD_WIDTH - wDock) * fBot;

          // Compute horizontal slices along the iconic genie funnel
          const leftPoints: { x: number; y: number }[] = [];
          const rightPoints: { x: number; y: number }[] = [];

          for (let i = 0; i < SLICE_COUNT; i++) {
            const v = i / (SLICE_COUNT - 1);
            const sliceY = yTop + v * (yBot - yTop);
            const sliceCenter = center.x;
            // Funnel taper curve: parabolic concave waist
            const curveFactor = Math.pow(v, 1.85);
            const sliceW = Math.max(10, wTop + (wBot - wTop) * curveFactor);

            leftPoints.push({ x: sliceCenter - sliceW / 2, y: sliceY });
            rightPoints.push({ x: sliceCenter + sliceW / 2, y: sliceY });
          }

          // Build path: smooth rounded rectangle when fully open, curved genie polygon when warping
          const buildGeniePath = () => {
            ctx.beginPath();
            if (p >= 0.995 && ctx.roundRect) {
              ctx.roundRect(xRestLeft, yRestTop, CARD_WIDTH, CARD_HEIGHT, 12);
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

          // 1. Draw macOS deep ambient drop shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = 32;
          ctx.shadowOffsetY = 12;

          buildGeniePath();
          ctx.fillStyle = '#0c0d0e';
          ctx.fill();
          ctx.restore();

          // 2. Clip and draw warped image slices
          ctx.save();
          buildGeniePath();
          ctx.clip();

          const imgW = img.naturalWidth || img.width;
          const imgH = img.naturalHeight || img.height;
          const sliceH = (yBot - yTop) / (SLICE_COUNT - 1);
          const srcSliceH = imgH / (SLICE_COUNT - 1);

          for (let i = 0; i < SLICE_COUNT; i++) {
            const v = i / (SLICE_COUNT - 1);
            const sx = 0;
            const sy = v * (imgH - srcSliceH);
            const sw = imgW;
            const sh = srcSliceH;

            const dx = leftPoints[i].x;
            const dy = leftPoints[i].y;
            const dw = rightPoints[i].x - leftPoints[i].x;
            const dh = sliceH + 0.65; // slight overlap eliminates hairline gaps

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
          }
          ctx.restore();

          // 3. Draw crisp macOS specular border around the contour
          ctx.save();
          buildGeniePath();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // Continue animation loop as long as progress is moving or cursor is active
      if ((isOpening && (p < 1 || !!cursor)) || (!isOpening && p > 0)) {
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

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    lastTimeRef.current = null;
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [imageSrc, cursorPos, rowCenterY]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 hidden md:block"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
