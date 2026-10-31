'use client';

import React from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
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
          className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-6 lg:px-12"
        >
          {/* Left Identity — Clean Minimalist Wordmark */}
          <a
            href="#top"
            onClick={(e) => scrollToSection(e, '#top')}
            className="text-sm font-medium tracking-tight text-alabaster transition-opacity hover:opacity-75"
          >
            Md. Abrar Hossain
          </a>

          {/* Right Navigation + Minimalist Theme Toggle + Subtle Brief Trigger */}
          <div className="flex items-center gap-3 sm:gap-5">
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

            <button
              type="button"
              onClick={toggleTheme}
              data-cursor="THEME"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex h-7 w-7 items-center justify-center border border-alabaster/[0.14] text-ink-secondary transition-colors duration-300 hover:border-alabaster/50 hover:text-alabaster focus:outline-none"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, rotate: -45, scale: 0.75 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.75 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="h-[13px] w-[13px]" strokeWidth={1.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, rotate: 45, scale: 0.75 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -45, scale: 0.75 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="h-[13px] w-[13px]" strokeWidth={1.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={onOpenAiBrief}
              className="inline-flex h-7 items-center gap-2 border border-alabaster/[0.14] px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-secondary transition-colors duration-300 hover:border-alabaster/50 hover:text-alabaster focus:outline-none"
              title="Executive Brief (Ctrl+K / Cmd+K)"
            >
              <span>Brief</span>
              <span className="text-ink-subtle">⌘K</span>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
};
