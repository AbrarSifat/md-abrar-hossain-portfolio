'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

export const CustomCursor: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState<string>('');
  const [isPointerFine, setIsPointerFine] = useState(false);
  const { theme } = useTheme();

  const mouseX = useSpring(0, { stiffness: 500, damping: 36, mass: 0.35 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 36, mass: 0.35 });

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setIsPointerFine(mq.matches);
    if (!mq.matches) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      const cursorEl = target?.closest('[data-cursor]') as HTMLElement | null;
      setLabel(cursorEl?.getAttribute('data-cursor') || '');
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [mouseX, mouseY, visible]);

  if (!isPointerFine) return null;

  const isLight = theme === 'light';
  const fillActive = isLight ? 'rgba(17, 17, 19, 0.94)' : 'rgba(244, 243, 239, 0.96)';
  const fillIdle = isLight ? 'rgba(17, 17, 19, 0.82)' : 'rgba(244, 243, 239, 0.85)';

  return (
    <motion.div
      aria-hidden="true"
      className="no-print pointer-events-none fixed left-0 top-0 z-[100] hidden md:flex items-center justify-center"
      style={{
        x: mouseX,
        y: mouseY,
        translateX: '-50%',
        translateY: '-50%',
        opacity: visible ? 1 : 0,
      }}
    >
      <motion.div
        animate={{
          width: label ? 64 : 10,
          height: label ? 64 : 10,
          backgroundColor: label ? fillActive : fillIdle,
        }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="flex items-center justify-center rounded-full"
      >
        {label && (
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-void">
            {label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};
