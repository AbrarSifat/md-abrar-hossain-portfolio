'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Volume1, Volume2, VolumeX, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { sounds } from '@/lib/sound';

interface NavbarProps {
  onOpenAiBrief: () => void;
}

const NAV_ITEMS = [
  { label: 'Profile', href: '#impact' },
  { label: 'Selected Work', href: '#work' },
  { label: 'Corridor', href: '#corridor' },
  { label: 'Experience', href: '#trajectory' },
  { label: 'Credentials', href: '#credentials' },
  { label: 'Contact', href: '#contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiBrief }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volumePercent, setVolumePercent] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSliderTickRef = useRef<number>(0);

  useEffect(() => {
    setSoundEnabled(sounds.isEnabled());
    setVolumePercent(sounds.getVolume());
    return sounds.subscribe((enabled, vol) => {
      setSoundEnabled(enabled);
      setVolumePercent(vol);
    });
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    sounds.setVolume(val);
    const now = performance.now();
    if (now - lastSliderTickRef.current > 35) {
      sounds.playVolumeTick();
      lastSliderTickRef.current = now;
    }
  };

  const handleVolumeButtonClick = () => {
    if (!isHovered) {
      setIsHovered(true);
    } else {
      sounds.toggle();
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    sounds.playApertureClick();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.div
        style={{ scaleX }}
        className="no-print fixed left-0 right-0 top-0 z-[60] h-[1px] origin-left bg-alabaster/60"
      />

      <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-alabaster/[0.07] bg-void/80 backdrop-blur-xl transition-colors duration-500">
        <nav
          aria-label="Primary Navigation"
          className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-12"
        >
          {/* Left Identity — Clean Minimalist Wordmark */}
          <a
            href="#top"
            onClick={(e) => scrollToSection(e, '#top')}
            className="text-sm font-medium tracking-tight text-alabaster transition-opacity hover:opacity-75 truncate mr-2"
          >
            Md. Abrar Hossain
          </a>

          {/* Right Navigation + Leica Audio + Theme Toggle + Executive Brief */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-6 mr-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className="text-xs font-normal tracking-wide text-ink-muted transition-colors hover:text-alabaster"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Audio Haptics Toggle & Responsive Volume Slider */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={handleVolumeButtonClick}
                className="inline-flex h-7 w-7 items-center justify-center border border-alabaster/[0.14] text-ink-muted transition-colors duration-300 hover:border-alabaster/50 hover:text-alabaster focus:outline-none"
                aria-label="Toggle Audio System"
              >
                {!soundEnabled || volumePercent === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-ink-subtle" />
                ) : volumePercent < 50 ? (
                  <Volume1 className="h-3.5 w-3.5 text-sand" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-sand" />
                )}
              </button>

              {/* Floating Backdrop for Touch/Mobile dismiss */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="volume-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[6px] sm:hidden"
                    onClick={() => setIsHovered(false)}
                  />
                )}
              </AnimatePresence>

              {/* Floating Volume Slider Popover (Apple Frosted Glass HUD) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="volume-popover"
                    initial={{ opacity: 0, scale: 0.9, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 440 }}
                    className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-[320px] rounded-2xl p-4 select-none
                      bg-white/95 text-zinc-900 border border-white/80
                      shadow-[0_20px_50px_rgba(0,0,0,0.22),_0_0_0_1px_rgba(255,255,255,0.9)_inset,0_1px_1px_rgba(255,255,255,1)_inset]
                      backdrop-blur-2xl
                      dark:bg-[#141418]/94 dark:text-zinc-100 dark:border-white/[0.14]
                      dark:shadow-[0_28px_70px_rgba(0,0,0,0.85),_0_0_0_1px_rgba(255,255,255,0.12)_inset]
                      sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-68 sm:p-4 sm:mx-0"
                  >
                    {/* Header: Clean Label + Live Level + Mobile Close */}
                    <div className="flex items-center justify-between pb-3 border-b border-black/[0.07] dark:border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          {soundEnabled && volumePercent > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B59458] opacity-75" />
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              soundEnabled && volumePercent > 0 ? 'bg-[#B59458]' : 'bg-zinc-400 dark:bg-zinc-600'
                            }`}
                          />
                        </span>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
                          Volume
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tabular-nums text-zinc-950 dark:text-[#E2D7C1] bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-md border border-black/[0.05] dark:border-white/[0.08]">
                          {soundEnabled && volumePercent > 0 ? `${volumePercent}%` : 'MUTED'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsHovered(false)}
                          className="sm:hidden text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          aria-label="Close Volume Panel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Custom Range Slider (0 to 100) */}
                    <div className="pt-3.5 pb-2">
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={soundEnabled ? volumePercent : 0}
                          onChange={handleSliderChange}
                          className="apple-glass-slider w-full"
                          style={{
                            background: `linear-gradient(to right, #B59458 0%, #B59458 ${soundEnabled ? volumePercent : 0}%, rgba(120, 120, 128, 0.22) ${soundEnabled ? volumePercent : 0}%, rgba(120, 120, 128, 0.22) 100%)`,
                            accentColor: '#B59458',
                          }}
                          aria-label="Volume Slider (0% to 100%)"
                        />
                      </div>
                    </div>

                    {/* Notches / Presets: 0% (Mute), 25%, 50% (Default), 100% (Max) */}
                    <div className="mt-2.5 flex items-center justify-between font-mono text-[10px]">
                      {[
                        { val: 0, label: '0%' },
                        { val: 25, label: '25%' },
                        { val: 50, label: '50%·Def' },
                        { val: 100, label: '100%·Max' },
                      ].map((preset) => {
                        const isActive = soundEnabled && volumePercent === preset.val;
                        return (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              sounds.setVolume(preset.val);
                              sounds.playVolumeTick();
                            }}
                            className={`px-2 py-1 rounded-md transition-all ${
                              isActive
                                ? 'bg-[#B59458]/15 text-[#8A6A34] dark:bg-sand/20 dark:text-sand font-semibold shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => {
                sounds.playLensMount();
                onOpenAiBrief();
              }}
              className="inline-flex h-7 items-center gap-1.5 sm:gap-2 border border-alabaster/[0.14] px-2.5 sm:px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-secondary transition-colors duration-300 hover:border-alabaster/50 hover:text-alabaster focus:outline-none shrink-0"
              title="Executive Brief (Ctrl+K / Cmd+K)"
            >
              <span>Brief</span>
              <span className="text-ink-subtle hidden sm:inline">⌘K</span>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
};
