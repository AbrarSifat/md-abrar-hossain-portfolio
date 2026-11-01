'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={!isDark}
      onClick={toggleTheme}
      data-cursor="THEME"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="group relative flex h-7 w-[54px] cursor-pointer items-center rounded-full border border-alabaster/[0.16] bg-void/90 p-[3px] backdrop-blur-md transition-colors duration-500 hover:border-alabaster/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-alabaster/50"
    >
      {/* Background Track Ambient Atmosphere */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        {/* Night Atmosphere (Stars in track when in Dark Mode) */}
        <motion.div
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0.7,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-end pr-2.5 text-alabaster/35"
        >
          {/* Micro-star 1 */}
          <motion.svg
            animate={{ opacity: isDark ? [0.25, 0.75, 0.25] : 0 }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            className="h-2 w-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8L12 0Z" />
          </motion.svg>
          {/* Micro-star 2 */}
          <motion.div
            animate={{ opacity: isDark ? [0.4, 0.9, 0.4] : 0 }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.6 }}
            className="ml-1.5 h-1 w-1 rounded-full bg-alabaster/40"
          />
        </motion.div>

        {/* Day Atmosphere (Warm Sky glow when in Light Mode) */}
        <motion.div
          animate={{
            opacity: !isDark ? 1 : 0,
            scale: !isDark ? 1 : 0.7,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-start pl-2.5"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-sand/40 blur-[0.5px]" />
          <div className="ml-1 h-1 w-1 rounded-full bg-sand/25" />
        </motion.div>
      </div>

      {/* Sleek Sliding Interactive Thumb */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 480,
          damping: 30,
        }}
        animate={{
          x: isDark ? 0 : 26,
        }}
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-alabaster/25 bg-alabaster/10 text-alabaster shadow-sm backdrop-blur-md transition-colors duration-300 group-hover:border-alabaster/50 group-hover:bg-alabaster/15"
      >
        {/* Sleek SVG Morph: Sun ↔ Moon */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            rotate: isDark ? -10 : 360,
          }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 24,
          }}
          className="h-3 w-3 overflow-visible"
        >
          {/* Mask for creating the organic crescent Moon cut */}
          <mask id="sleek-theme-mask">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <motion.circle
              initial={false}
              animate={{
                cx: isDark ? 16 : 28,
                cy: isDark ? 8 : 4,
                r: isDark ? 6 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 440,
                damping: 28,
              }}
              fill="black"
            />
          </mask>

          {/* Central Celestial Orb (Becomes crescent Moon when dark, full Sun when light) */}
          <motion.circle
            cx="12"
            cy="12"
            initial={false}
            animate={{
              r: isDark ? 7 : 4.5,
            }}
            transition={{
              type: 'spring',
              stiffness: 440,
              damping: 28,
            }}
            fill="currentColor"
            mask="url(#sleek-theme-mask)"
          />

          {/* Sun Rays: Retracted in Moon/Dark state, Blooming outward in Sun/Light state */}
          <motion.g
            initial={false}
            animate={{
              scale: isDark ? 0 : 1,
              opacity: isDark ? 0 : 1,
              rotate: isDark ? -75 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 440,
              damping: 28,
            }}
            style={{ originX: '12px', originY: '12px' }}
          >
            <line x1="12" y1="1" x2="12" y2="3.5" />
            <line x1="12" y1="20.5" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.99" y2="5.99" />
            <line x1="18.01" y1="18.01" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3.5" y2="12" />
            <line x1="20.5" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.99" y2="18.01" />
            <line x1="18.01" y1="5.99" x2="19.78" y2="4.22" />
          </motion.g>
        </motion.svg>
      </motion.div>
    </motion.button>
  );
};
