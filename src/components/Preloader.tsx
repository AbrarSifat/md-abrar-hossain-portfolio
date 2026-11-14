'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Preloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 700;

    // Guaranteed failsafe timer so preloader never hangs under background tab/low-power mode
    const safetyTimer = setTimeout(() => {
      setProgress(100);
      setDone(true);
      onComplete();
    }, 1200);

    const tick = (now: number) => {
      const pct = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setDone(true);
          setTimeout(onComplete, 400);
        }, 100);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          aria-hidden="true"
          data-nosnippet
          initial={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.68, ease: [0.76, 0, 0.24, 1] }}
          className="no-print fixed inset-0 z-[120] flex flex-col justify-between bg-void px-6 py-8 sm:px-12 sm:py-10"
        >
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            <span>Md. Abrar Hossain</span>
            <span>Portfolio</span>
          </div>

          <div className="my-auto text-center">
            <p className="font-serif text-3xl italic text-alabaster sm:text-5xl">
              Clarity, Governance &amp; Velocity.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-alabaster/[0.08] pt-5 font-mono text-xs text-ink-muted">
            <span>Hello there!</span>
            <span className="tabular-nums text-alabaster">{String(progress).padStart(3, '0')}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
