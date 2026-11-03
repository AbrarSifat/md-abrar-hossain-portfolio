'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';
import { sounds } from '@/lib/sound';

const CorridorScene = dynamic(
  () => import('@/components/three/CorridorScene').then((mod) => mod.CorridorScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border border-alabaster/15 border-t-alabaster/70" />
      </div>
    ),
  }
);

export const HeroSection: React.FC = () => {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-between pt-24"
    >
      {/* Subtle Ambient Studio Falloff */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/4 h-[520px] w-[520px] rounded-full bg-sand/[0.05] blur-[160px]"
      />

      {/* Main Asymmetric Stage */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1360px] flex-1 grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-12 lg:gap-8 lg:px-12">
        {/* Left Editorial Typography */}
        <div className="relative z-20 lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-subtle"
          >
            Business Relationship Manager &amp; Project Leader
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-[clamp(2.75rem,5.6vw,5.35rem)] font-light leading-[1.04] tracking-[-0.038em] text-alabaster"
          >
            Bridging commercial{' '}
            <span className="font-serif italic font-normal text-sand-light">
              strategy
            </span>{' '}
            &amp; engineering velocity.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36 }}
            className="mt-8 max-w-lg text-[15px] font-light leading-[1.75] text-ink-muted sm:text-base"
          >
            Leading UK B2B client partnerships, Automation360° hospitality ecosystems, and cross-functional delivery across the United Kingdom and Bangladesh for both CompileQ and Qamla.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.46 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button size="lg" asChild>
              <a
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  sounds.playLeicaShutter();
                  document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Selected Work</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </Button>

            <Button variant="outline" size="lg" asChild>
              <a
                href="/Md_Abrar_Hossain_Resume.pdf"
                download="Md_Abrar_Hossain_Resume.pdf"
                onClick={() => sounds.playLeicaShutter()}
              >
                <span>Curriculum Vitae</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Right Sculptural 3D WebGL Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="relative z-10 h-[440px] w-full sm:h-[520px] lg:col-span-5 lg:h-[620px]"
        >
          <div className="absolute inset-y-0 inset-x-0 lg:-inset-x-12 xl:-inset-x-16">
            <WebGLErrorBoundary>
              <CorridorScene />
            </WebGLErrorBoundary>
          </div>
        </motion.div>
      </div>

      {/* Minimalist Architectural Ledger Strip */}
      <div className="border-t border-alabaster/[0.08]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-6 px-6 py-6 sm:grid-cols-4 lg:px-12">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
              Current Role
            </span>
            <span className="mt-1 block text-xs font-normal text-ink-secondary">
              BRM — CompileQ (UK)
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
              Operating Corridor
            </span>
            <span className="mt-1 block text-xs font-normal text-ink-secondary">
              Across the Globe
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
              Academic Pedigree
            </span>
            <span className="mt-1 block text-xs font-normal text-ink-secondary">
              B.Engg. — UFTB (3.4)
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
              Status
            </span>
            <span className="mt-1 inline-flex items-center gap-2 text-xs font-normal text-alabaster">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
              Open to Work
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
