'use client';

import React, { useState, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { sounds } from '@/lib/sound';

export type StackCategory = 'All' | 'AI & Systems' | 'Agile & Governance' | 'Engineering' | 'Operations';

export interface StackTool {
  id: string;
  name: string;
  sub: string;
  category: 'AI & Systems' | 'Agile & Governance' | 'Engineering' | 'Operations';
  brandColor: string;
  useCase: string;
  auditedImpact: string;
  renderLogo: (active?: boolean) => React.ReactNode;
}

function DualToneLogo({
  active = true,
  mono,
  color,
}: {
  active?: boolean;
  mono: React.ReactNode;
  color: React.ReactNode;
}) {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          active ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {mono}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {color}
      </span>
    </span>
  );
}

function AgenticWorkflowLogo({ active = true }: { active?: boolean }) {
  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 3v3.5M12 17.5V21M4.8 7.5l3 1.75M16.2 14.75l3 1.75M19.2 7.5l-3 1.75M7.8 14.75l-3 1.75"
            stroke="var(--logo-gold)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <circle cx="12" cy="12" r="3.2" fill="var(--logo-gold)" />
          <circle cx="12" cy="3" r="1.5" fill="var(--logo-white)" />
          <circle cx="4.5" cy="7.5" r="1.4" fill="var(--logo-bronze)" />
          <circle cx="19.5" cy="7.5" r="1.4" fill="var(--logo-white)" />
          <circle cx="4.5" cy="16.5" r="1.4" fill="var(--logo-gold)" />
          <circle cx="19.5" cy="16.5" r="1.4" fill="var(--logo-bronze)" />
          <circle cx="12" cy="21" r="1.5" fill="var(--logo-white)" />
        </svg>
      }
      color={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 3v3.5M12 17.5V21M4.8 7.5l3 1.75M16.2 14.75l3 1.75M19.2 7.5l-3 1.75M7.8 14.75l-3 1.75"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <circle cx="12" cy="12" r="3.3" fill="#F59E0B" />
          <circle cx="12" cy="12" r="1.3" fill="#FFFBEB" />
          <circle cx="12" cy="3" r="1.5" fill="#38BDF8" />
          <circle cx="4.5" cy="7.5" r="1.4" fill="#FBBF24" />
          <circle cx="19.5" cy="7.5" r="1.4" fill="#38BDF8" />
          <circle cx="4.5" cy="16.5" r="1.4" fill="#38BDF8" />
          <circle cx="19.5" cy="16.5" r="1.4" fill="#FBBF24" />
          <circle cx="12" cy="21" r="1.5" fill="#D97757" />
        </svg>
      }
    />
  );
}

function ClaudeLogo({ active = true }: { active?: boolean }) {
  const pathData =
    'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="var(--logo-gold)" aria-hidden="true">
          <path d={pathData} />
        </svg>
      }
      color={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#D97757" aria-hidden="true">
          <path d={pathData} />
        </svg>
      }
    />
  );
}

function ClickUpLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const arcGrad = `${uid}-arc`;
  const arrowGrad = `${uid}-arrow`;
  const arcPath =
    'M0,50.6l10.1-7.8c5.4,7,11.1,10.3,17.4,10.3c6.3,0,11.9-3.2,17-10.2l10.3,7.6c-7.4,10-16.6,15.3-27.3,15.3C16.9,65.8,7.6,60.5,0,50.6z';
  const arrowPath = 'M27.5,16.9l-18,15.5l-8.3-9.7L27.6,0l26.2,22.7l-8.4,9.6L27.5,16.9z';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="-5 -2 64.8 69.8" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" fill="var(--logo-gold)" d={arcPath} />
          <path fillRule="evenodd" clipRule="evenodd" fill="var(--logo-white)" d={arrowPath} />
        </svg>
      }
      color={
        <svg viewBox="-5 -2 64.8 69.8" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient
              id={arcGrad}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="15.0492"
              x2="54.8446"
              y2="15.0492"
              gradientTransform="matrix(1 0 0 -1 0 69.3604)"
            >
              <stop offset="0" stopColor="#8930FD" />
              <stop offset="1" stopColor="#49CCF9" />
            </linearGradient>
            <linearGradient
              id={arrowGrad}
              gradientUnits="userSpaceOnUse"
              x1="1.1953"
              y1="53.166"
              x2="53.7447"
              y2="53.166"
              gradientTransform="matrix(1 0 0 -1 0 69.3604)"
            >
              <stop offset="0" stopColor="#FF02F0" />
              <stop offset="1" stopColor="#FFC800" />
            </linearGradient>
          </defs>
          <path fillRule="evenodd" clipRule="evenodd" fill={`url(#${arcGrad})`} d={arcPath} />
          <path fillRule="evenodd" clipRule="evenodd" fill={`url(#${arrowGrad})`} d={arrowPath} />
        </svg>
      }
    />
  );
}

function JiraLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const midGrad = `${uid}-mid`;
  const lowGrad = `${uid}-low`;
  const topWing =
    'M244.658 0H121.707a55.5 55.5 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.466 55.467V10.666C255.324 4.777 250.55 0 244.658 0';
  const midWing =
    'M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.466 55.467h22.649v21.938c.039 30.625 24.877 55.43 55.502 55.43V71.93c0-5.891-4.776-10.667-10.667-10.667';
  const lowWing =
    'M122.951 122.489H0c0 30.653 24.85 55.502 55.502 55.502h22.72v21.867c.02 30.597 24.798 55.408 55.396 55.466V133.156c0-5.891-4.776-10.667-10.667-10.667';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="-8 -8 272 272" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="var(--logo-white)" d={topWing} />
          <path fill="var(--logo-gold)" d={midWing} />
          <path fill="var(--logo-bronze)" d={lowWing} />
        </svg>
      }
      color={
        <svg viewBox="-8 -8 272 272" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={midGrad} x1="98.031%" x2="58.888%" y1=".161%" y2="40.766%">
              <stop offset="18%" stopColor="#0052CC" />
              <stop offset="100%" stopColor="#2684FF" />
            </linearGradient>
            <linearGradient id={lowGrad} x1="100.665%" x2="55.402%" y1=".455%" y2="44.727%">
              <stop offset="18%" stopColor="#0052CC" />
              <stop offset="100%" stopColor="#2684FF" />
            </linearGradient>
          </defs>
          <path fill="#2684FF" d={topWing} />
          <path fill={`url(#${midGrad})`} d={midWing} />
          <path fill={`url(#${lowGrad})`} d={lowWing} />
        </svg>
      }
    />
  );
}

function CanvaLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const clipId = `${uid}-clip`;
  const r0 = `${uid}-r0`;
  const r1 = `${uid}-r1`;
  const r2 = `${uid}-r2`;
  const r3 = `${uid}-r3`;
  const monoGrad = `${uid}-mono-gold`;
  const circlePath = 'M40 80c22.091 0 40-17.909 40-40S62.091 0 40 0S0 17.909 0 40s17.909 40 40 40';
  const cMarkPath =
    'M57.27 48.205c-.331 0-.622.279-.924.888c-3.414 6.922-9.31 11.82-16.133 11.82c-7.89 0-12.776-7.122-12.776-16.96c0-16.668 9.286-26.304 17.443-26.304c3.811 0 6.139 2.395 6.139 6.207c0 4.524-2.57 6.919-2.57 8.514c0 .716.445 1.15 1.328 1.15c3.55 0 7.715-4.078 7.715-9.84c0-5.585-4.862-9.691-13.018-9.691c-13.48 0-25.46 12.497-25.46 29.788c0 13.384 7.643 22.23 19.436 22.23c12.517 0 19.754-12.454 19.754-16.497c0-.895-.457-1.305-.935-1.305';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 80 80" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={monoGrad} x1="12" y1="8" x2="68" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E6DAC3" />
              <stop offset="52%" stopColor="#C8B89A" />
              <stop offset="100%" stopColor="#8E8068" />
            </linearGradient>
          </defs>
          <path fill={`url(#${monoGrad})`} d={circlePath} />
          <path fill="#0B0B0D" d={cMarkPath} />
        </svg>
      }
      color={
        <svg viewBox="0 0 80 80" className="h-5 w-5" fill="none" aria-hidden="true">
          <g clipPath={`url(#${clipId})`}>
            <path fill="#7D2AE7" d={circlePath} />
            <path fill={`url(#${r0})`} d={circlePath} />
            <path fill={`url(#${r1})`} d={circlePath} />
            <path fill={`url(#${r2})`} d={circlePath} />
            <path fill={`url(#${r3})`} d={circlePath} />
            <path fill="#FFFFFF" d={cMarkPath} />
          </g>
          <defs>
            <radialGradient
              id={r0}
              cx="0"
              cy="0"
              r="1"
              gradientTransform="rotate(-49.416 84.778 18.66)scale(61.8733)"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6420FF" />
              <stop offset="1" stopColor="#6420FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id={r1}
              cx="0"
              cy="0"
              r="1"
              gradientTransform="rotate(54.703 1.799 25.019)scale(69.7735)"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00C4CC" />
              <stop offset="1" stopColor="#00C4CC" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id={r2}
              cx="0"
              cy="0"
              r="1"
              gradientTransform="rotate(-45.195 92.905 16.89)scale(61.1242 28.1118)"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6420FF" />
              <stop offset="1" stopColor="#6420FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id={r3}
              cx="0"
              cy="0"
              r="1"
              gradientTransform="rotate(66.52 8.14 30.33)scale(62.9836 105.512)"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00C4CC" stopOpacity=".726" />
              <stop offset="0" stopColor="#00C4CC" />
              <stop offset="1" stopColor="#00C4CC" stopOpacity="0" />
            </radialGradient>
            <clipPath id={clipId}>
              <path fill="#fff" d="M0 0h80v80H0z" />
            </clipPath>
          </defs>
        </svg>
      }
    />
  );
}

function DigitalForensicsLogo({ active = true }: { active?: boolean }) {
  const shieldPath = 'M12 2.5L4.5 5.8v5.4c0 4.9 3.2 9.4 7.5 10.6c4.3-1.2 7.5-5.7 7.5-10.6V5.8L12 2.5Z';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d={shieldPath}
            fill="#0B0B0D"
            fillOpacity="0.72"
            stroke="var(--logo-gold)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11.2" cy="10.8" r="3" stroke="#F6F5F0" strokeWidth="1.7" />
          <path d="M13.4 13l2.2 2.2" stroke="#F6F5F0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      }
      color={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d={shieldPath}
            stroke="#EF4444"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11.2" cy="10.8" r="3" stroke="#FCA5A5" strokeWidth="1.7" />
          <path d="M13.4 13l2.2 2.2" stroke="#FCA5A5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      }
    />
  );
}

function VsCodeLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const maskId = `${uid}-mask`;
  const glossGrad = `${uid}-gloss`;
  const monoMaskId = `${uid}-mono-mask`;
  const ribbonOutline =
    'M180.828 252.605a15.87 15.87 0 0 0 12.65-.486l52.501-25.262a15.94 15.94 0 0 0 9.025-14.364V41.197a15.94 15.94 0 0 0-9.025-14.363l-52.5-25.263a15.88 15.88 0 0 0-18.115 3.084L74.857 96.35l-43.78-33.232a10.614 10.614 0 0 0-13.56.603L3.476 76.494c-4.63 4.211-4.635 11.495-.012 15.713l37.967 34.638l-37.967 34.637c-4.623 4.219-4.618 11.502.012 15.714l14.041 12.772a10.614 10.614 0 0 0 13.56.604l43.78-33.233l100.507 91.695a15.85 15.85 0 0 0 5.464 3.571m10.464-183.649l-76.262 57.889l76.262 57.888z';
  const armOne =
    'M246.135 26.873L193.593 1.575a15.885 15.885 0 0 0-18.123 3.08L3.466 161.482c-4.626 4.219-4.62 11.502.012 15.714l14.05 12.772a10.625 10.625 0 0 0 13.569.604L238.229 33.436c6.949-5.271 16.93-.315 16.93 8.407v-.61a15.94 15.94 0 0 0-9.024-14.36';
  const armTwo =
    'm246.135 226.816l-52.542 25.298a15.89 15.89 0 0 1-18.123-3.08L3.466 92.207c-4.626-4.218-4.62-11.502.012-15.713l14.05-12.773a10.625 10.625 0 0 1 13.569-.603l207.132 157.135c6.949 5.271 16.93.315 16.93-8.408v.611a15.94 15.94 0 0 1-9.024 14.36';
  const spine =
    'M193.428 252.134a15.89 15.89 0 0 1-18.125-3.083c5.881 5.88 15.938 1.715 15.938-6.603V11.273c0-8.318-10.057-12.483-15.938-6.602a15.89 15.89 0 0 1 18.125-3.084l52.533 25.263a15.94 15.94 0 0 1 9.03 14.363V212.51c0 6.125-3.51 11.709-9.03 14.363z';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="-6 -6 268 266" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <mask id={monoMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="254">
              <path fill="#FFFFFF" d={ribbonOutline} />
            </mask>
          </defs>
          <g mask={`url(#${monoMaskId})`}>
            <path fill="var(--logo-bronze)" d={armOne} />
            <path fill="var(--logo-gold)" d={armTwo} />
            <path fill="var(--logo-white)" d={spine} />
          </g>
        </svg>
      }
      color={
        <svg viewBox="-6 -6 268 266" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={glossGrad} x1="50%" x2="50%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="254">
              <path fill="#FFFFFF" d={ribbonOutline} />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <path fill="#0065A9" d={armOne} />
            <path fill="#007ACC" d={armTwo} />
            <path fill="#1F9CF0" d={spine} />
            <path fill={`url(#${glossGrad})`} fillOpacity=".25" d={ribbonOutline} />
          </g>
        </svg>
      }
    />
  );
}

function WordPressLogo({ active = true }: { active?: boolean }) {
  const leftW =
    'M8.708 61.26c0 20.802 12.089 38.779 29.619 47.298L13.258 39.872a52.35 52.35 0 0 0-4.55 21.388m88.032-2.652c0-6.495-2.333-10.993-4.334-14.494c-2.664-4.329-5.161-7.995-5.161-12.324c0-4.831 3.664-9.328 8.825-9.328c.233 0 .454.029.681.042c-9.35-8.566-21.807-13.796-35.489-13.796c-18.36 0-34.513 9.42-43.91 23.688c1.233.037 2.395.063 3.382.063c5.497 0 14.006-.667 14.006-.667c2.833-.167 3.167 3.994.337 4.329c0 0-2.847.335-6.015.501L48.2 93.547l11.501-34.493l-8.188-22.434c-2.83-.166-5.511-.501-5.511-.501c-2.832-.166-2.5-4.496.332-4.329c0 0 8.679.667 13.843.667c5.496 0 14.006-.667 14.006-.667c2.835-.167 3.168 3.994.337 4.329c0 0-2.853.335-6.015.501l18.992 56.494l5.242-17.517c2.272-7.269 4.001-12.49 4.001-16.989';
  const rightW =
    'm62.184 65.857l-15.768 45.819a52.6 52.6 0 0 0 14.846 2.141c6.12 0 11.989-1.058 17.452-2.979a4.6 4.6 0 0 1-.374-.724zm45.192-29.811c.226 1.674.354 3.471.354 5.404c0 5.333-.996 11.328-3.996 18.824l-16.053 46.413c15.624-9.111 26.133-26.038 26.133-45.426c.001-9.137-2.333-17.729-6.438-25.215';
  const outerRing =
    'M61.262 0C27.483 0 0 27.481 0 61.26c0 33.783 27.483 61.263 61.262 61.263s61.265-27.48 61.265-61.263C122.526 27.481 95.04 0 61.262 0m0 119.715c-32.23 0-58.453-26.223-58.453-58.455c0-32.23 26.222-58.451 58.453-58.451c32.229 0 58.45 26.221 58.45 58.451c0 32.232-26.221 58.455-58.45 58.455';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 122.52 122.523" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="var(--logo-white)" d={leftW} />
          <path fill="var(--logo-white)" d={rightW} />
          <path fill="var(--logo-gold)" d={outerRing} />
        </svg>
      }
      color={
        <svg viewBox="0 0 122.52 122.523" className="h-5 w-5" fill="#2D94C4" aria-hidden="true">
          <path d={leftW} />
          <path d={rightW} />
          <path d={outerRing} />
        </svg>
      }
    />
  );
}

function HostingerLogo({ active = true }: { active?: boolean }) {
  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="-1 -1 26 26" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="var(--logo-gold)" d="M16.415 0v7.16l5.785 3.384V2.949z" />
          <path fill="var(--logo-white)" d="M1.8 0v11.237h18.815L14.89 8.09l-7.457-.003V3.024z" />
          <path
            fill="var(--logo-gold)"
            d="M16.415 20.894v-5.019l-7.514-.005c.007.033-5.82-3.197-5.82-3.197l19.119.091V24z"
          />
          <path fill="var(--logo-bronze)" d="M1.8 13.551v7.343l5.633 2.949v-6.988z" />
        </svg>
      }
      color={
        <svg viewBox="-1 -1 26 26" className="h-5 w-5" fill="#744DF2" aria-hidden="true">
          <path d="M16.415 0v7.16l5.785 3.384V2.949zM1.8 0v11.237h18.815L14.89 8.09l-7.457-.003V3.024zm14.615 20.894v-5.019l-7.514-.005c.007.033-5.82-3.197-5.82-3.197l19.119.091V24zM1.8 13.551v7.343l5.633 2.949v-6.988z" />
        </svg>
      }
    />
  );
}

function GoogleLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const clip = `${uid}-clip`;
  const monoClip = `${uid}-mclip`;
  const b0 = `${uid}-b0`;
  const b1 = `${uid}-b1`;
  const b2 = `${uid}-b2`;
  const b3 = `${uid}-b3`;
  const b4 = `${uid}-b4`;
  const b5 = `${uid}-b5`;
  const b6 = `${uid}-b6`;
  const b7 = `${uid}-b7`;
  const l0 = `${uid}-l0`;
  const r0 = `${uid}-r0`;
  const r1 = `${uid}-r1`;
  const r2 = `${uid}-r2`;
  const r3 = `${uid}-r3`;
  const r4 = `${uid}-r4`;
  const r5 = `${uid}-r5`;
  const r6 = `${uid}-r6`;
  const f0 = `${uid}-f0`;
  const f1 = `${uid}-f1`;
  const gSilhouette =
    'M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786c-4.674 7.773-10.451 13.69-16.373 18.196c-17.74 13.498-38.42 16.258-52.783 16.258c-36.283 0-67.283-23.286-79.285-54.928c-.484-1.149-.805-2.335-1.197-3.507a81.1 81.1 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398c11.285-32.897 42.985-57.467 80.179-57.467c7.481 0 14.685.884 21.517 2.648a77.7 77.7 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32c-30.878 0-59.386 9.553-82.748 25.7c-18.945 13.093-34.483 30.625-44.97 50.985c-9.753 18.879-15.094 39.8-15.094 62.294c0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988c15.997 11.386 44.68 26.551 84.031 26.551c22.63 0 42.687-4.051 60.375-11.644c12.76-5.478 24.065-12.622 34.301-21.804c13.525-12.132 24.117-27.139 31.347-44.404s11.097-36.79 11.097-57.957c0-9.858-.998-19.87-2.689-28.968';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="0 0 268.152 273.883" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <clipPath id={monoClip} clipPathUnits="userSpaceOnUse">
              <path d={gSilhouette} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${monoClip})`} transform="matrix(.95792 0 0 .98525 -90.174 -78.856)">
            <path fill="var(--logo-gold)" d={gSilhouette} />
            <path
              fill="var(--logo-white)"
              d="M90 78h250l-42 84c-25-24-62-36-96-24c-22 8-40 24-52 44l-60-36Z"
            />
            <path
              fill="var(--logo-bronze)"
              d="M92 220c1.5 34 19 66 44 92l44-42c-16-14-26-34-26-50Z"
            />
            <path
              fill="var(--logo-champagne)"
              d="M235 191h144v74l-54 68l-88-34v-40h76c2-12 2-20 0-24H235Z"
            />
          </g>
        </svg>
      }
      color={
        <svg viewBox="0 0 268.152 273.883" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={b0}>
              <stop offset="0" stopColor="#0FBC5C" />
              <stop offset="1" stopColor="#0CBA65" />
            </linearGradient>
            <linearGradient id={b1}>
              <stop offset=".231" stopColor="#0FBC5F" />
              <stop offset=".312" stopColor="#0FBC5F" />
              <stop offset=".366" stopColor="#0FBC5E" />
              <stop offset=".458" stopColor="#0FBC5D" />
              <stop offset=".54" stopColor="#12BC58" />
              <stop offset=".699" stopColor="#28BF3C" />
              <stop offset=".771" stopColor="#38C02B" />
              <stop offset=".861" stopColor="#52C218" />
              <stop offset=".915" stopColor="#67C30F" />
              <stop offset="1" stopColor="#86C504" />
            </linearGradient>
            <linearGradient id={b2}>
              <stop offset=".142" stopColor="#1ABD4D" />
              <stop offset=".248" stopColor="#6EC30D" />
              <stop offset=".312" stopColor="#8AC502" />
              <stop offset=".366" stopColor="#A2C600" />
              <stop offset=".446" stopColor="#C8C903" />
              <stop offset=".54" stopColor="#EBCB03" />
              <stop offset=".616" stopColor="#F7CD07" />
              <stop offset=".699" stopColor="#FDCD04" />
              <stop offset=".771" stopColor="#FDCE05" />
              <stop offset=".861" stopColor="#FFCE0A" />
            </linearGradient>
            <linearGradient id={b3}>
              <stop offset=".316" stopColor="#FF4C3C" />
              <stop offset=".604" stopColor="#FF692C" />
              <stop offset=".727" stopColor="#FF7825" />
              <stop offset=".885" stopColor="#FF8D1B" />
              <stop offset="1" stopColor="#FF9F13" />
            </linearGradient>
            <linearGradient id={b4}>
              <stop offset=".231" stopColor="#FF4541" />
              <stop offset=".312" stopColor="#FF4540" />
              <stop offset=".458" stopColor="#FF4640" />
              <stop offset=".54" stopColor="#FF473F" />
              <stop offset=".699" stopColor="#FF5138" />
              <stop offset=".771" stopColor="#FF5B33" />
              <stop offset=".861" stopColor="#FF6C29" />
              <stop offset="1" stopColor="#FF8C18" />
            </linearGradient>
            <linearGradient id={b5}>
              <stop offset=".408" stopColor="#FB4E5A" />
              <stop offset="1" stopColor="#FF4540" />
            </linearGradient>
            <linearGradient id={b6}>
              <stop offset=".132" stopColor="#0CBA65" />
              <stop offset=".21" stopColor="#0BB86D" />
              <stop offset=".297" stopColor="#09B479" />
              <stop offset=".396" stopColor="#08AD93" />
              <stop offset=".477" stopColor="#0AA6A9" />
              <stop offset=".568" stopColor="#0D9CC6" />
              <stop offset=".667" stopColor="#1893DD" />
              <stop offset=".769" stopColor="#258BF1" />
              <stop offset=".859" stopColor="#3086FF" />
            </linearGradient>
            <linearGradient id={b7}>
              <stop offset=".366" stopColor="#FF4E3A" />
              <stop offset=".458" stopColor="#FF8A1B" />
              <stop offset=".54" stopColor="#FFA312" />
              <stop offset=".616" stopColor="#FFB60C" />
              <stop offset=".771" stopColor="#FFCD0A" />
              <stop offset=".861" stopColor="#FECF0A" />
              <stop offset=".915" stopColor="#FECF08" />
              <stop offset="1" stopColor="#FDCD01" />
            </linearGradient>
            <linearGradient
              id={l0}
              x1="219.7"
              x2="254.467"
              y1="329.535"
              y2="329.535"
              gradientUnits="userSpaceOnUse"
              href={`#${b0}`}
            />
            <radialGradient
              id={r0}
              cx="109.627"
              cy="135.862"
              r="71.46"
              fx="109.627"
              fy="135.862"
              gradientTransform="matrix(-1.93688 1.043 1.45573 2.55542 290.525 -400.634)"
              gradientUnits="userSpaceOnUse"
              href={`#${b4}`}
            />
            <radialGradient
              id={r1}
              cx="45.259"
              cy="279.274"
              r="71.46"
              fx="45.259"
              fy="279.274"
              gradientTransform="matrix(-3.5126 -4.45809 -1.69255 1.26062 870.8 191.554)"
              gradientUnits="userSpaceOnUse"
              href={`#${b6}`}
            />
            <radialGradient
              id={r2}
              cx="304.017"
              cy="118.009"
              r="47.854"
              fx="304.017"
              fy="118.009"
              gradientTransform="matrix(2.06435 0 0 2.59204 -297.679 -151.747)"
              gradientUnits="userSpaceOnUse"
              href={`#${b5}`}
            />
            <radialGradient
              id={r3}
              cx="181.001"
              cy="177.201"
              r="71.46"
              fx="181.001"
              fy="177.201"
              gradientTransform="matrix(-.24858 2.08314 2.96249 .33417 -255.146 -331.164)"
              gradientUnits="userSpaceOnUse"
              href={`#${b7}`}
            />
            <radialGradient
              id={r4}
              cx="207.673"
              cy="108.097"
              r="41.102"
              fx="207.673"
              fy="108.097"
              gradientTransform="matrix(-1.2492 1.34326 -3.89684 -3.4257 880.501 194.905)"
              gradientUnits="userSpaceOnUse"
              href={`#${b3}`}
            />
            <radialGradient
              id={r5}
              cx="109.627"
              cy="135.862"
              r="71.46"
              fx="109.627"
              fy="135.862"
              gradientTransform="matrix(-1.93688 -1.043 1.45573 -2.55542 290.525 838.683)"
              gradientUnits="userSpaceOnUse"
              href={`#${b1}`}
            />
            <radialGradient
              id={r6}
              cx="154.87"
              cy="145.969"
              r="71.46"
              fx="154.87"
              fy="145.969"
              gradientTransform="matrix(-.0814 -1.93722 2.92674 -.11625 -215.135 632.86)"
              gradientUnits="userSpaceOnUse"
              href={`#${b2}`}
            />
            <filter id={f0} width="1.097" height="1.116" x="-.048" y="-.058" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="1.701" />
            </filter>
            <filter id={f1} width="1.033" height="1.02" x="-.017" y="-.01" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation=".242" />
            </filter>
            <clipPath id={clip} clipPathUnits="userSpaceOnUse">
              <path d={gSilhouette} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`} transform="matrix(.95792 0 0 .98525 -90.174 -78.856)">
            <path
              fill={`url(#${r6})`}
              d="M92.076 219.958c.148 22.14 6.501 44.983 16.117 63.424v.127c6.949 13.392 16.445 23.97 27.26 34.452l65.327-23.67c-12.36-6.235-14.246-10.055-23.105-17.026c-9.054-9.066-15.802-19.473-20.004-31.677h-.17l.17-.127c-2.765-8.058-3.037-16.613-3.14-25.503Z"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${r2})`}
              d="M237.083 79.025c-6.456 22.526-3.988 44.421 0 57.161c7.457.006 14.64.888 21.45 2.647a77.66 77.66 0 0 1 33.424 18.25l41.88-40.726c-24.81-22.59-54.667-37.297-96.754-37.332"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${r0})`}
              d="M236.943 78.847c-31.67 0-60.91 9.798-84.871 26.359a145.5 145.5 0 0 0-24.332 21.15c-1.904 17.744 14.257 39.551 46.262 39.37c15.528-17.936 38.495-29.542 64.056-29.542l.07.002l-1.044-57.335z"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${r1})`}
              d="m341.475 226.379l-28.268 19.285c-1.24 7.562-4.028 15.002-8.107 21.786c-4.674 7.772-10.45 13.69-16.373 18.196c-17.702 13.47-38.328 16.244-52.687 16.255c-14.842 25.102-17.444 37.675 1.043 57.934c22.877-.016 43.157-4.117 61.046-11.796c12.931-5.551 24.388-12.792 34.761-22.097c13.706-12.295 24.442-27.503 31.769-45s11.245-37.282 11.245-58.734Z"
              filter={`url(#${f1})`}
            />
            <path
              fill="#3086FF"
              d="M234.996 191.21v57.498h136.006c1.196-7.874 5.152-18.064 5.152-26.5c0-9.858-.996-21.899-2.687-30.998Z"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${r3})`}
              d="M128.39 124.327c-8.394 9.119-15.564 19.326-21.249 30.364c-9.753 18.879-15.094 41.83-15.094 64.324c0 .317.026.627.029.944c4.32 8.224 59.666 6.649 62.456 0c-.004-.31-.039-.613-.039-.924c0-9.226 1.57-16.026 4.43-24.367c3.53-10.289 9.056-19.763 16.123-27.926c1.602-2.031 5.875-6.397 7.121-9.016c.475-.997-.862-1.557-.937-1.908c-.083-.393-1.876-.077-2.277-.37c-1.275-.929-3.8-1.414-5.334-1.845c-3.277-.921-8.708-2.953-11.725-5.06c-9.536-6.658-24.417-14.612-33.505-24.216Z"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${r4})`}
              d="M162.099 155.857c22.112 13.301 28.471-6.714 43.173-12.977l-25.574-52.664a144.7 144.7 0 0 0-26.543 14.504c-12.316 8.512-23.192 18.9-32.176 30.72Z"
              filter={`url(#${f0})`}
            />
            <path
              fill={`url(#${r5})`}
              d="M171.099 290.222c-29.683 10.641-34.33 11.023-37.062 29.29a145 145 0 0 0 16.792 13.984c15.996 11.386 46.766 26.551 86.118 26.551l.137-.004v-59.157l-.094.002c-14.736 0-26.512-3.843-38.585-10.527c-2.977-1.648-8.378 2.777-11.123.799c-3.786-2.729-12.9 2.35-16.183-.938"
              filter={`url(#${f1})`}
            />
            <path
              fill={`url(#${l0})`}
              d="M219.7 299.023v59.996c5.506.64 11.236 1.028 17.247 1.028c6.026 0 11.855-.307 17.52-.872v-59.748a105 105 0 0 1-17.477 1.461c-5.932 0-11.7-.686-17.29-1.865"
              filter={`url(#${f1})`}
              opacity=".5"
            />
          </g>
        </svg>
      }
    />
  );
}

function MicrosoftLogo({ active = true }: { active?: boolean }) {
  const tl = 'M121.666 121.666H0V0h121.666z';
  const tr = 'M256 121.666H134.335V0H256z';
  const bl = 'M121.663 256.002H0V134.336h121.663z';
  const br = 'M256 256.002H134.335V134.336H256z';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="-16 -16 288 288" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="var(--logo-white)" d={tl} />
          <path fill="var(--logo-gold)" d={tr} />
          <path fill="var(--logo-bronze)" d={bl} />
          <path fill="var(--logo-champagne)" d={br} />
        </svg>
      }
      color={
        <svg viewBox="-16 -16 288 288" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="#F1511B" d={tl} />
          <path fill="#80CC28" d={tr} />
          <path fill="#00ADEF" d={bl} />
          <path fill="#FBBC09" d={br} />
        </svg>
      }
    />
  );
}

function PythonLogo({ active = true }: { active?: boolean }) {
  const uid = useId();
  const blueGrad = `${uid}-blue`;
  const yellowGrad = `${uid}-yellow`;
  const topSnake =
    'M31.885 16c-8.124 0-7.617 3.523-7.617 3.523l.01 3.65h7.752v1.095H21.197S16 23.678 16 31.876c0 8.196 4.537 7.906 4.537 7.906h2.708v-3.804s-.146-4.537 4.465-4.537h7.688s4.32.07 4.32-4.175v-7.019S40.374 16 31.885 16m-4.275 2.454a1.394 1.394 0 1 1 0 2.79a1.393 1.393 0 0 1-1.395-1.395c0-.771.624-1.395 1.395-1.395';
  const bottomSnake =
    'M32.115 47.833c8.124 0 7.617-3.523 7.617-3.523l-.01-3.65H31.97v-1.095h10.832S48 40.155 48 31.958s-4.537-7.906-4.537-7.906h-2.708v3.803s.146 4.537-4.465 4.537h-7.688s-4.32-.07-4.32 4.175v7.019s-.656 4.247 7.833 4.247m4.275-2.454a1.393 1.393 0 0 1-1.395-1.395a1.394 1.394 0 1 1 1.395 1.395';

  return (
    <DualToneLogo
      active={active}
      mono={
        <svg viewBox="15 15 34 34" className="h-5 w-5" fill="none" aria-hidden="true">
          <path fill="var(--logo-white)" d={topSnake} />
          <path fill="var(--logo-gold)" d={bottomSnake} />
        </svg>
      }
      color={
        <svg viewBox="15 15 34 34" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={blueGrad} x1="19.075" x2="34.898" y1="18.782" y2="34.658" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4B8BBE" />
              <stop offset="1" stopColor="#306998" />
            </linearGradient>
            <linearGradient id={yellowGrad} x1="28.809" x2="45.803" y1="28.882" y2="45.163" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE873" />
              <stop offset="1" stopColor="#FFD43B" />
            </linearGradient>
          </defs>
          <path fill={`url(#${blueGrad})`} d={topSnake} />
          <path fill={`url(#${yellowGrad})`} d={bottomSnake} />
        </svg>
      }
    />
  );
}

export const STACK_TOOLS: StackTool[] = [
  {
    id: 'agentic-ai',
    name: 'Agentic AI Systems',
    sub: 'AI-Orchestrated Workflows & Automation',
    category: 'AI & Systems',
    brandColor: '#C8B89A',
    useCase: 'Directs AI models as task-driven agents—architecting custom data pipelines, automated gatekeepers, and connected spreadsheet/web systems that replace repetitive manual workflows.',
    auditedImpact: 'Custom AI Workflows',
    renderLogo: (active = true) => <AgenticWorkflowLogo active={active} />,
  },
  {
    id: 'frontier-llms',
    name: 'Frontier LLMs',
    sub: 'Gemini · Claude · Antigravity · Kimi',
    category: 'AI & Systems',
    brandColor: '#D97757',
    useCase: 'Few-shot prompt architecture, synthetic operational data generation, and executive RAG knowledge distillation across complex client briefs.',
    auditedImpact: 'Vanderbilt Certified',
    renderLogo: (active = true) => <ClaudeLogo active={active} />,
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    sub: 'Cross-Border Sprint Velocity',
    category: 'Agile & Governance',
    brandColor: '#7B68EE',
    useCase: 'Multi-squad cross-border engineering delivery coordination linking London E1 leadership with offshore engineering squads.',
    auditedImpact: '+50% delivery velocity',
    renderLogo: (active = true) => <ClickUpLogo active={active} />,
  },
  {
    id: 'jira',
    name: 'Jira',
    sub: 'Atlassian SLA & Risk Governance',
    category: 'Agile & Governance',
    brandColor: '#2684FF',
    useCase: 'Sprint board architecture, SLA risk matrix tracking, and cross-timezone QA gating across multi-quarter UK client rollouts.',
    auditedImpact: 'Zero SLA breaches',
    renderLogo: (active = true) => <JiraLogo active={active} />,
  },
  {
    id: 'canva',
    name: 'Canva',
    sub: 'Executive Presentation Decks',
    category: 'Operations',
    brandColor: '#00C4CC',
    useCase: 'High-polish investor presentation decks, client proposals, and commercial marketing collateral approval for UK enterprise groups.',
    auditedImpact: 'Executive buy-in',
    renderLogo: (active = true) => <CanvaLogo active={active} />,
  },
  {
    id: 'digital-forensics',
    name: 'Digital Forensics',
    sub: 'Autopsy & Systems Audit',
    category: 'Engineering',
    brandColor: '#EF4444',
    useCase: 'Systems artifacts investigation, forensic file carving, memory verification, and deep audit discipline.',
    auditedImpact: 'Audit rigor verified',
    renderLogo: (active = true) => <DigitalForensicsLogo active={active} />,
  },
  {
    id: 'vscode',
    name: 'VS Code & Windsurf',
    sub: 'TypeScript & Next.js Stacks',
    category: 'Engineering',
    brandColor: '#1F9CF0',
    useCase: 'Full-stack engineering, TypeScript architecture, agentic IDE development, and technical feasibility testing.',
    auditedImpact: 'Rapid execution',
    renderLogo: (active = true) => <VsCodeLogo active={active} />,
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    sub: 'CMS & Restaurant Gateways',
    category: 'Operations',
    brandColor: '#2D94C4',
    useCase: 'Custom client portals, digital menu integration, and rapid site launches for Soho & West End UK hospitality venues.',
    auditedImpact: 'Zero-downtime rollouts',
    renderLogo: (active = true) => <WordPressLogo active={active} />,
  },
  {
    id: 'hostinger',
    name: 'Hostinger Ecosystem',
    sub: 'Cloud & UK DNS Operations',
    category: 'Operations',
    brandColor: '#744DF2',
    useCase: 'Hostinger Cloud Professional orchestration, DNS zone cutovers, and custom UK domain routing.',
    auditedImpact: '99.98% uptime',
    renderLogo: (active = true) => <HostingerLogo active={active} />,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    sub: 'Cross-Border Governance',
    category: 'Operations',
    brandColor: '#3086FF',
    useCase: 'Centralized document vaults, proposal repositories, and calendar synchronization across timezones.',
    auditedImpact: '+30% team sync',
    renderLogo: (active = true) => <GoogleLogo active={active} />,
  },
  {
    id: 'microsoft-suite',
    name: 'Microsoft Suite',
    sub: 'Financial P&L Modeling',
    category: 'Operations',
    brandColor: '#00ADEF',
    useCase: 'Advanced Excel financial and budget allocations, quarterly forecast models, and formal commercial contracts.',
    auditedImpact: '100% on-budget SLA',
    renderLogo: (active = true) => <MicrosoftLogo active={active} />,
  },
  {
    id: 'python-pandas',
    name: 'Python (Pandas & Plotly)',
    sub: 'Retail Analytics Engine',
    category: 'Engineering',
    brandColor: '#4B8BBE',
    useCase: 'Data cleansing, multi-dimensional retail analytics (Supermart Engine), and automated KPI visualizations.',
    auditedImpact: 'Engineering core',
    renderLogo: (active = true) => <PythonLogo active={active} />,
  },
];

const CATEGORIES: StackCategory[] = [
  'All',
  'AI & Systems',
  'Agile & Governance',
  'Engineering',
  'Operations',
];

export const DarkroomSpotlightGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<StackCategory>('All');
  const [hoveredTool, setHoveredTool] = useState<StackTool | null>(null);
  const [selectedTool, setSelectedTool] = useState<StackTool>(STACK_TOOLS[0]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 300, y: 150 });
  const [isHoveringGrid, setIsHoveringGrid] = useState<boolean>(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover)').matches || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const filteredTools = STACK_TOOLS.filter((t) => {
    if (activeCategory === 'All') return true;
    return t.category === activeCategory;
  });

  const activeDossier = hoveredTool || selectedTool;

  return (
    <div className="flex flex-col w-full">
      {/* Minimalist Category Navigation */}
      <div className="relative flex items-center border-b border-alabaster/[0.08] pb-0">
        <nav className="flex w-full items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px" aria-label="Stack categories">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? STACK_TOOLS.length
                : STACK_TOOLS.filter((t) => t.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sounds.playApertureClick();
                  setActiveCategory(cat);
                }}
                className={`group relative shrink-0 whitespace-nowrap pb-2.5 pt-1 px-2 sm:px-2.5 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] transition-colors ${
                  isActive
                    ? 'text-alabaster font-medium'
                    : 'text-ink-subtle hover:text-alabaster'
                }`}
              >
                <span className="relative z-10">{cat}</span>
                <span
                  className={`relative z-10 ml-1 text-[9px] font-normal transition-colors ${
                    isActive ? 'text-sand/80' : 'text-ink-muted/50 group-hover:text-ink-subtle'
                  }`}
                >
                  ({count})
                </span>
                {isActive && (
                  <motion.div
                    layoutId="stack-tab-indicator"
                    className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-sand rounded-full shadow-[0_0_8px_rgba(200,184,154,0.45)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Responsive Flex Container: Docks Telemetry Strip Above Grid on Mobile, Below Grid on Desktop */}
      <div className="flex flex-col">
        {/* Fresh Minimalist Modern Spotlight Canvas */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => {
            if (window.matchMedia('(hover: hover)').matches) setIsHoveringGrid(true);
          }}
          onMouseLeave={() => {
            setIsHoveringGrid(false);
            setHoveredTool(null);
          }}
          className="order-2 sm:order-1 relative mt-3.5 sm:mt-5 w-full select-none"
        >
          {/* Soft Warm-Sand Optical Spotlight Beam (Quiet Luxury, Desktop Hover Only) */}
          <div
            className="pointer-events-none hidden sm:block absolute inset-0 transition-opacity duration-500 rounded-xl"
            style={{
              background: isHoveringGrid
                ? `radial-gradient(480px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200, 184, 154, 0.08), rgba(200, 184, 154, 0.015) 45%, transparent 70%)`
                : 'none',
              opacity: isHoveringGrid ? 1 : 0,
            }}
          />

          {/* Compact 2-Col Mobile / 4-Col Desktop Cards Grid with Touch-Safe Sibling Dimming */}
          <div className="group/stack-grid relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {filteredTools.map((tool) => {
              const isHovered = hoveredTool?.id === tool.id;
              const isSelected = selectedTool?.id === tool.id;

              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    sounds.playApertureClick();
                    setHoveredTool(null);
                    setSelectedTool(tool);
                  }}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches) {
                      sounds.playScrollTick(0.12);
                      setHoveredTool(tool);
                    }
                  }}
                  className={`group relative flex items-center gap-2.5 sm:gap-3.5 rounded-lg border px-2.5 py-2.5 sm:px-3.5 sm:py-3 cursor-pointer transition-all duration-300 [@media(hover:hover)]:group-hover/stack-grid:opacity-40 [@media(hover:hover)]:hover:!opacity-100 ${
                    isSelected
                      ? 'border-sand/60 bg-alabaster/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                      : isHovered
                      ? 'border-alabaster/[0.24] bg-alabaster/[0.02]'
                      : 'border-alabaster/[0.07] bg-obsidian/40 hover:border-alabaster/[0.2] hover:bg-alabaster/[0.02]'
                  }`}
                >
                  {/* Minimalist Logo Badge Container */}
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 [&>*]:scale-[0.85] sm:[&>*]:scale-100 ${
                      isSelected
                        ? 'border-sand/40 bg-sand/10 shadow-[0_0_12px_rgba(200,184,154,0.18)]'
                        : isHovered
                        ? 'border-alabaster/[0.18] bg-alabaster/[0.04]'
                        : 'border-alabaster/[0.08] bg-void/80 group-hover:border-alabaster/[0.16]'
                    }`}
                  >
                    {tool.renderLogo(isSelected || isHovered)}
                  </div>

                  {/* Content Block: Clean Editorial Typography */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-[11px] sm:text-xs font-normal tracking-[-0.01em] transition-colors leading-tight sm:leading-snug truncate sm:whitespace-normal ${
                        isSelected
                          ? 'text-alabaster font-medium'
                          : isHovered
                          ? 'text-alabaster'
                          : 'text-alabaster/90 group-hover:text-alabaster'
                      }`}
                    >
                      {tool.name}
                    </h4>
                    <p className="font-mono text-[8.5px] sm:text-[9px] text-ink-subtle leading-tight mt-0.5 truncate">
                      {tool.sub}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Fresh Minimalist Executive Telemetry Strip (Pinned Above Grid on Mobile) */}
        <AnimatePresence mode="wait">
          {activeDossier && (
            <motion.div
              key={activeDossier.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="order-1 sm:order-2 mt-3.5 sm:mt-4 rounded-lg sm:rounded-none border sm:border-0 sm:border-t border-alabaster/[0.09] sm:border-alabaster/[0.08] bg-obsidian/55 sm:bg-transparent p-3 sm:px-0 sm:pb-0 sm:pt-4"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-12 sm:items-center">
                {/* Left Identity Badge */}
                <div className="sm:col-span-4 flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-sand/30 bg-sand/10 [&>*]:scale-[0.85] sm:[&>*]:scale-100">
                    {activeDossier.renderLogo(true)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-light text-alabaster tracking-[-0.01em] truncate">
                      {activeDossier.name}
                    </h5>
                    <span className="font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-sand">
                      {activeDossier.category}
                    </span>
                  </div>
                </div>

                {/* Middle Operational Context */}
                <div className="sm:col-span-5">
                  <p className="text-[11px] sm:text-xs font-light text-ink-muted leading-relaxed">
                    {activeDossier.useCase}
                  </p>
                </div>

                {/* Right Audited Metric Pill */}
                <div className="sm:col-span-3 sm:text-right flex items-center sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sand/30 bg-sand/[0.08] px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[9.5px] sm:text-[10px] text-sand-light tracking-[0.04em]">
                    <Check className="h-3 w-3 text-sand shrink-0" />
                    <span>{activeDossier.auditedImpact}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
