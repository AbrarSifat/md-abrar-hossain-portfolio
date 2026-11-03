'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { IMPACT_METRICS } from '@/data/portfolio';

const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({
  value,
  prefix = '',
  suffix = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  // Initialize with `value` so SSR HTML renders exact audited KPIs (+50%, +25%, +30%) for crawlers
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const start = performance.now();
    const duration = 1100;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export const ImpactSection: React.FC = () => {
  return (
    <section
      id="impact"
      className="mx-auto max-w-[1360px] px-6 py-28 sm:py-36 lg:px-12"
    >
      {/* Swiss 4 / 8 Asymmetric Executive Profile Grid */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Column: Section Index + Authentic Editorial Portrait */}
        <div className="lg:col-span-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            01 — Executive Profile
          </span>

          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8 }}
            className="mt-8 max-w-[290px]"
          >
            <div className="aspect-[4/5] w-full overflow-hidden border border-alabaster/[0.1] bg-obsidian">
              <img
                src="/portrait.png"
                width={837}
                height={1024}
                alt="Md. Abrar Hossain — Business Relationship Manager & Project Leader at CompileQ"
                className="h-full w-full object-cover object-top grayscale-[22%] contrast-[1.03] transition-all duration-700 hover:grayscale-0"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-center border-b border-alabaster/[0.08] pb-3 text-center font-mono text-[11px] text-ink-muted">
              <span className="text-alabaster">Md. Abrar Hossain (Sifat)</span>
            </figcaption>
          </motion.figure>
        </div>

        {/* Right Column: Editorial Narrative + Pure Architectural Hairline Metrics */}
        <div className="flex flex-col justify-between lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-light leading-[1.36] tracking-[-0.025em] text-alabaster sm:text-4xl">
              An interdisciplinary engineer turned{' '}
              <span className="font-serif italic font-normal text-sand-light">
                commercial relationship leader
              </span>
              —aligning executive client governance, financial prudence, and cross-functional squads so complex engagements ship on schedule and compound in retention.
            </h2>

            <p className="mt-6 max-w-2xl text-sm font-light leading-[1.8] text-ink-muted sm:text-[15px]">
              With a Bachelor of Engineering in Educational Technology &amp; Engineering from UFTB and multi-year leadership across CompileQ and Qamla Ltd in London, Abrar operates natively between boardroom commercial structuring and hands-on day-to-day technical and sub-technical execution—driving system architecture, operational precision, and cross-functional delivery.
            </p>
          </motion.div>

          {/* 4 Pure Hairline Metrics (Zero Clunky Cards) */}
          <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-12 border-t border-alabaster/[0.09] pt-12 sm:grid-cols-4">
            {IMPACT_METRICS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.07 }}
              >
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  0{idx + 1}
                </span>
                <div className="mt-3 text-4xl font-light tracking-[-0.04em] text-alabaster sm:text-5xl">
                  <AnimatedCounter
                    value={item.value}
                    prefix={item.prefix}
                    suffix={item.suffix}
                  />
                </div>
                <h3 className="mt-3 text-xs font-medium tracking-wide text-ink-secondary">
                  {item.label}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-ink-subtle">
                  {item.sublabel}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
