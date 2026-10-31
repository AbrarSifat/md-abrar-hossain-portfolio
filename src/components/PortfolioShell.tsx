'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CustomCursor } from '@/components/CustomCursor';
import { Preloader } from '@/components/Preloader';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { ImpactSection } from '@/components/sections/ImpactSection';
import { WorkSection } from '@/components/sections/WorkSection';
import { TrajectorySection } from '@/components/sections/TrajectorySection';
import { CredentialsSection } from '@/components/sections/CredentialsSection';
import { FooterSection } from '@/components/sections/FooterSection';
import { AiBriefModal } from '@/components/AiBriefModal';

export const PortfolioShell: React.FC = () => {
  const [aiBriefOpen, setAiBriefOpen] = useState(false);
  const [, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      prevent: (node: HTMLElement) => !!node.closest('[role="dialog"]'),
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiBriefOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-void text-alabaster transition-colors duration-500">
        <div
          aria-hidden="true"
          className="awwwards-grain no-print pointer-events-none fixed inset-0 z-[90]"
        />

        <Preloader onComplete={handleLoaded} />
        <CustomCursor />
        <Navbar onOpenAiBrief={() => setAiBriefOpen(true)} />

        <main>
          <HeroSection />
          <ImpactSection />
          <WorkSection />
          <TrajectorySection />
          <CredentialsSection />
        </main>

        <FooterSection />
        <AiBriefModal open={aiBriefOpen} onOpenChange={setAiBriefOpen} />
      </div>
    </ThemeProvider>
  );
};
