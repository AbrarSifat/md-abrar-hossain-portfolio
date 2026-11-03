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
                  <div
                    key="volume-backdrop"
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] sm:hidden"
                    onClick={() => setIsHovered(false)}
                  />
                )}
              </AnimatePresence>

              {/* Floating Volume Slider Popover (Centered on mobile, right-anchored on desktop) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="volume-popover"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-[320px] rounded-xl border border-alabaster/[0.14] bg-void/98 p-4 shadow-2xl backdrop-blur-2xl text-alabaster select-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:p-3.5 sm:mx-0"
                  >
                    {/* Header: Clean Label + Live Level + Mobile Close */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-alabaster/[0.08]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-sand animate-pulse" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-subtle">
                          Volume
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] font-semibold text-sand-light tabular-nums">
                          {soundEnabled ? `${volumePercent}%` : 'MUTED'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsHovered(false)}
                          className="sm:hidden text-ink-subtle hover:text-alabaster p-0.5"
                          aria-label="Close Volume Panel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Custom Range Slider (0 to 100) */}
                    <div className="pt-3 pb-1">
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={soundEnabled ? volumePercent : 0}
                          onChange={handleSliderChange}
                          className="w-full h-1.5 cursor-pointer appearance-none rounded-full outline-none transition-all"
                          style={{
                            background: `linear-gradient(to right, #C8B89A 0%, #C8B89A ${soundEnabled ? volumePercent : 0}%, rgba(244, 243, 239, 0.12) ${soundEnabled ? volumePercent : 0}%, rgba(244, 243, 239, 0.12) 100%)`,
                            accentColor: '#C8B89A',
                          }}
                          aria-label="Volume Slider (0% to 100%)"
                        />
                      </div>
                    </div>

                    {/* Notches / Presets: 0% (Mute), 25%, 50% (Default), 100% (Max) */}
                    <div className="mt-2.5 flex items-center justify-between font-mono text-[9px] text-ink-subtle">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.setVolume(0);
                          sounds.playVolumeTick();
                        }}
                        className="hover:text-sand transition-colors py-1"
                      >
                        0%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.setVolume(25);
                          sounds.playVolumeTick();
                        }}
                        className="hover:text-sand transition-colors py-1"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.setVolume(50);
                          sounds.playVolumeTick();
                        }}
                        className={`transition-colors font-medium py-1 ${
                          volumePercent === 50 && soundEnabled ? 'text-sand' : 'hover:text-sand'
                        }`}
                        title="Default (50%)"
                      >
                        50%·Def
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.setVolume(100);
                          sounds.playVolumeTick();
                        }}
                        className={`transition-colors py-1 ${
                          volumePercent === 100 && soundEnabled ? 'text-sand font-medium' : 'hover:text-sand'
                        }`}
                        title="Maximum Output (100%)"
                      >
                        100%·Max
                      </button>
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
