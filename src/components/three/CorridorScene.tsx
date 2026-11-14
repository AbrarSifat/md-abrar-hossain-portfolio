'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { sounds } from '@/lib/sound';
import landPointsData from '@/data/land-points.json';

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
const smootherstep = (x: number) => {
  const c = clamp01(x);
  return c * c * c * (c * (c * 6 - 15) + 10);
};
const easeOutCubic = (x: number) => {
  const c = clamp01(x);
  return 1 - Math.pow(1 - c, 3);
};
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const COURT_CAM_POS = new THREE.Vector3(0, 0.02, 5.15);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const GLOBE_ORIGIN = new THREE.Vector3(0, 0, 0);

/* ------------------------------------------------------------------ */
/* Executive Radar Ping — 4s telemetry cadence + instant manual tap   */
/* ------------------------------------------------------------------ */
const CYCLE = 4.0; // 4.0s automatic cadence (balanced, engaging telemetry)
const T = {
  flashIn: [0.0, 0.45],   // target hub flashes gently into view
  draw: [0.2, 1.15],      // hairline arc smoothly glides out (0.95s smooth draw)
  packet: [0.35, 1.25],   // packet smoothly glides along the arc (0.9s glide)
  impact: [1.2, 1.7],     // target receives sync with warm pulse
  dissolve: [1.65, 2.45], // arc dissolves smoothly (0.8s dissipation)
};

const ORIGIN = { id: 'cgp', name: 'Chattogram / Dhaka', lat: 22.3569, lon: 91.7832 }; // Abrar's Hub

// Iconic world metropolises, spaced across continents to match the real world map cleanly
const CLIENT_HUBS = [
  // Europe
  { id: 'lon', name: 'London', lat: 51.5074, lon: -0.1278 },
  { id: 'fra', name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
  { id: 'sto', name: 'Stockholm', lat: 59.3293, lon: 18.0686 },

  // Middle East
  { id: 'dxb', name: 'Dubai', lat: 25.2048, lon: 55.2708 },

  // East & Southeast Asia
  { id: 'sin', name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { id: 'tyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503 },

  // Oceania
  { id: 'syd', name: 'Sydney', lat: -33.8688, lon: 151.2093 },

  // Africa
  { id: 'cai', name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { id: 'nbo', name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { id: 'cpt', name: 'Cape Town', lat: -33.9249, lon: 18.4241 },

  // North America
  { id: 'nyc', name: 'New York', lat: 40.7128, lon: -74.006 },
  { id: 'chi', name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { id: 'sfo', name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { id: 'tor', name: 'Toronto', lat: 43.6532, lon: -79.3832 },

  // South America
  { id: 'sao', name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
];

const TUBE_SEGMENTS = 140;
const TUBE_RADIAL = 8;

function buildArc(a: THREE.Vector3, b: THREE.Vector3, R: number) {
  const angle = a.angleTo(b);
  const lift = 1.08 + (angle / Math.PI) * 0.28;
  const mid = a.clone().add(b).normalize().multiplyScalar(R * lift);
  const c1 = a.clone().lerp(mid, 0.5).normalize().multiplyScalar(R * (1 + (lift - 1) * 0.7));
  const c2 = b.clone().lerp(mid, 0.5).normalize().multiplyScalar(R * (1 + (lift - 1) * 0.7));
  const curve = new THREE.CatmullRomCurve3([a, c1, mid, c2, b]);
  const tube = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, 0.0036, TUBE_RADIAL, false);
  return { curve, tube };
}

export type GamePhase =
  | 'globe'
  | 'ready_to_spin'
  | 'spinning_transition'
  | 'playing'
  | 'game_over';

interface ShotEvent {
  id: number;
  type: 'swish' | 'bank' | 'miss';
  label: string;
  sublabel: string;
}

interface CourtControlState {
  ballX: number;
  targetBallX: number;
  aimVx: number;
  isAiming: boolean;
  isSwiping: boolean;
  pendingThrow: { vx: number } | null;
}

interface GlobeSpinTracker {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  startTime: number;
  samples: Array<{ x: number; y: number; t: number }>;
  strokeRegisteredAt: number;
  strokeDirX: number;
  strokeDirY: number;
  fastSpinCount: number;
  lastFastSpinAt: number;
}

const COURT_FIT_DIVISOR = 3.0;
const COURT_BALL_R = 0.256;
const COURT_HOOP_SCALE = 1.065;
const COURT_LAUNCH_Y = -0.9;
const COURT_LAUNCH_Z = 0.42;
const COURT_HOOP_Y = 0.66;
const COURT_HOOP_Z = -0.45;

function computeCourtFitScale(width: number, height: number): number {
  return Math.min(1, Math.min(width, height) / COURT_FIT_DIVISOR);
}

function MinimalistSculpture({
  isLight,
  gamePhase,
  spinKickRef,
  fastSpinCount,
  onRegisterTrigger,
  onTransitionComplete,
}: {
  isLight: boolean;
  gamePhase: GamePhase;
  spinKickRef: React.MutableRefObject<number>;
  fastSpinCount: number;
  onRegisterTrigger?: (fn: () => void) => void;
  onTransitionComplete: () => void;
}) {
  const outerGroupRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const ringCRef = useRef<THREE.Mesh>(null);
  const ringAMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringBMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringCMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const landDotsMatRef = useRef<THREE.PointsMaterial>(null);
  const oceanDotsMatRef = useRef<THREE.PointsMaterial>(null);
  const originCoreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const morphTimeRef = useRef(0);
  const transitionDoneRef = useRef(false);
  const embellishFadeRef = useRef(1);
  const spinVelRef = useRef(0);
  const extraRotYRef = useRef(0);

  const arcRef = useRef<THREE.Mesh>(null);
  const arcMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const packetRef = useRef<THREE.Group>(null);
  const packetGlowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const originHaloRef = useRef<THREE.Mesh>(null);
  const originHaloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const hubHaloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hubHaloMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const hubCoreMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const lastPingTimeRef = useRef(0);
  const targetRef = useRef(0);
  const manualTriggerRef = useRef(false);

  const { viewport, camera } = useThree();
  const R = 1.32;
  const rawFitScale = Math.min(viewport.width, viewport.height) / 3.46;
  const fitScale =
    Number.isFinite(rawFitScale) && rawFitScale > 0.1 ? Math.min(1, rawFitScale) : 0.85;
  const rawCourtFitScale = computeCourtFitScale(viewport.width, viewport.height);
  const courtFitScale =
    Number.isFinite(rawCourtFitScale) && rawCourtFitScale > 0.1 ? rawCourtFitScale : 0.85;
  const targetBallScale = courtFitScale * (COURT_BALL_R / R);

  const { originPos, hubPositions, arcs, landDotPositions, oceanDotPositions } = useMemo(() => {
    const origin = latLonToVec3(ORIGIN.lat, ORIGIN.lon, R);
    const hubs = CLIENT_HUBS.map((h) => latLonToVec3(h.lat, h.lon, R));
    const arcList = hubs.map((h) => buildArc(origin, h, R));

    // Real world map land stipple generated from Natural Earth GeoJSON
    const landPositions = new Float32Array(landPointsData);

    // Faint ocean stipple for subtle depth
    const oceanCount = 500;
    const oceanPositions = new Float32Array(oceanCount * 3);
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < oceanCount; i++) {
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / oceanCount);
      oceanPositions[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      oceanPositions[i * 3 + 1] = R * Math.cos(phi);
      oceanPositions[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
    }

    return {
      originPos: origin,
      hubPositions: hubs,
      arcs: arcList,
      landDotPositions: landPositions,
      oceanDotPositions: oceanPositions,
    };
  }, [R]);

  // Pick the next hub — prioritises dots visible to the camera
  const pickTarget = (prev: number) => {
    const group = groupRef.current;
    const camDir = camera.position.clone().normalize();
    const candidates: number[] = [];
    hubPositions.forEach((p, i) => {
      if (i === prev) return;
      if (!group) return candidates.push(i);
      const world = group.localToWorld(p.clone()).normalize();
      if (world.dot(camDir) > 0.05) candidates.push(i);
    });
    const pool = candidates.length
      ? candidates
      : hubPositions.map((_, i) => i).filter((i) => i !== prev);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  useEffect(() => {
    onRegisterTrigger?.(() => {
      manualTriggerRef.current = true;
    });
  }, [onRegisterTrigger]);

  const palette = isLight
    ? {
        coreColor: '#EAE5DC',
        coreRoughness: 0.6,
        landDotColor: '#2C261F',
        landDotOpacity: 0.92,
        landDotSize: 0.015,
        oceanDotColor: '#ABA090',
        oceanDotOpacity: 0.22,
        oceanDotSize: 0.0075,
        originCore: '#D89A38',
        originBeacon: '#C88828',
        hubCore: '#222225',
        glowColor: '#C88828',
        ringPrimary: '#A6987E',
        ringAccent: '#D89A38',
        ringAOpacity: 0.45,
        ringBOpacity: 0.35,
        ringCOpacity: 0.25,
      }
    : {
        coreColor: '#070709',
        coreRoughness: 0.35,
        landDotColor: '#E2D4B7',
        landDotOpacity: 0.78,
        landDotSize: 0.0125,
        oceanDotColor: '#6E6455',
        oceanDotOpacity: 0.18,
        oceanDotSize: 0.007,
        originCore: '#F2D272',
        originBeacon: '#E5C77B',
        hubCore: '#F4F3EF',
        glowColor: '#E5C77B',
        ringPrimary: '#F4F3EF',
        ringAccent: '#E5C77B',
        ringAOpacity: 0.38,
        ringBOpacity: 0.28,
        ringCOpacity: 0.2,
      };

  const glowBlending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

  const applyEmbellishFade = (fade: number) => {
    if (landDotsMatRef.current) landDotsMatRef.current.opacity = palette.landDotOpacity * fade;
    if (oceanDotsMatRef.current) oceanDotsMatRef.current.opacity = palette.oceanDotOpacity * fade;
    if (originCoreMatRef.current) originCoreMatRef.current.opacity = fade;
    if (ringAMatRef.current) ringAMatRef.current.opacity = palette.ringAOpacity * fade;
    if (ringBMatRef.current) ringBMatRef.current.opacity = palette.ringBOpacity * fade;
    if (ringCMatRef.current) ringCMatRef.current.opacity = palette.ringCOpacity * fade;
  };

  useFrame(({ clock, pointer }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    if (outerGroupRef.current) {
      if (gamePhase === 'spinning_transition') {
        outerGroupRef.current.visible = true;
        morphTimeRef.current += dt;
        const p = clamp01(morphTimeRef.current / 1.0);
        // Continuous smootherstep descent + gentle spin deceleration down to basketball launch speed
        const descendEased = smootherstep(clamp01((p - 0.08) / 0.88));
        const spinFade = 1 - smootherstep(clamp01((p - 0.42) / 0.54));
        const embellishFade = 1 - smootherstep(clamp01((p - 0.16) / 0.68));
        embellishFadeRef.current = embellishFade;

        if (groupRef.current) {
          groupRef.current.rotation.y += dt * (2.2 + 22 * spinFade);
          groupRef.current.rotation.x += dt * (1.2 + 6.5 * spinFade);
        }

        const scaleNow = THREE.MathUtils.lerp(fitScale, targetBallScale, descendEased);
        outerGroupRef.current.scale.setScalar(scaleNow);
        outerGroupRef.current.position.set(
          0,
          THREE.MathUtils.lerp(0, COURT_LAUNCH_Y * courtFitScale, descendEased),
          THREE.MathUtils.lerp(0, COURT_LAUNCH_Z * courtFitScale, descendEased)
        );

        applyEmbellishFade(embellishFade);
        if (packetRef.current) packetRef.current.visible = false;
        if (arcRef.current) arcRef.current.visible = embellishFade > 0.01;
        if (arcMatRef.current) {
          arcMatRef.current.opacity = (isLight ? 0.82 : 0.88) * embellishFade;
        }
        if (originHaloMatRef.current) {
          originHaloMatRef.current.opacity = (isLight ? 0.16 : 0.22) * embellishFade;
        }
        hubCoreMatRefs.current.forEach((m) => {
          if (m) m.opacity = 0.7 * embellishFade;
        });
        hubHaloMatRefs.current.forEach((m) => {
          if (m) m.opacity = (isLight ? 0.08 : 0.12) * embellishFade;
        });

        if (p >= 1 && !transitionDoneRef.current) {
          transitionDoneRef.current = true;
          onTransitionComplete();
        }
        return;
      }

      if (gamePhase === 'playing' || gamePhase === 'game_over') {
        outerGroupRef.current.visible = false;
        return;
      }

      // 'globe' or 'ready_to_spin'
      outerGroupRef.current.visible = true;
      morphTimeRef.current = 0;
      transitionDoneRef.current = false;
      embellishFadeRef.current = THREE.MathUtils.lerp(embellishFadeRef.current, 1, 0.14);
      applyEmbellishFade(embellishFadeRef.current);
      const curScale = Number.isFinite(outerGroupRef.current.scale.x)
        ? outerGroupRef.current.scale.x
        : fitScale;
      outerGroupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(curScale, fitScale, 0.14)
      );
      outerGroupRef.current.position.lerp(GLOBE_ORIGIN, 0.14);
    }

    if (groupRef.current) {
      if (spinKickRef.current !== 0) {
        spinVelRef.current += spinKickRef.current;
        spinKickRef.current = 0;
      }
      spinVelRef.current = THREE.MathUtils.lerp(spinVelRef.current, 0, Math.min(1, dt * 3.4));
      extraRotYRef.current += spinVelRef.current * dt;

      // 3.93 radians (~225 deg) brings London, Dubai, and Chattogram facing directly forward!
      const idleSpeed =
        gamePhase === 'ready_to_spin' ? 0.22 + fastSpinCount * 0.14 : 0.08;
      const targetY =
        3.93 + extraRotYRef.current + Math.sin(t * idleSpeed) * 0.22 + pointer.x * 0.25;
      const targetX = 0.22 + pointer.y * 0.14;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.055);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.045);
    }

    /* ---------- Ping cycle (33s automatic cadence + instant tap-to-beam) ---------- */
    if (manualTriggerRef.current) {
      manualTriggerRef.current = false;
      lastPingTimeRef.current = t;
      targetRef.current = pickTarget(targetRef.current);
      if (arcRef.current) arcRef.current.geometry = arcs[targetRef.current].tube;
    } else if (t - lastPingTimeRef.current >= CYCLE) {
      lastPingTimeRef.current = t;
      targetRef.current = pickTarget(targetRef.current);
      if (arcRef.current) arcRef.current.geometry = arcs[targetRef.current].tube;
    }

    const local = t - lastPingTimeRef.current;
    const target = targetRef.current;
    const { curve, tube } = arcs[target];

    // Arc: Silky smooth draw outward from origin, then graceful dissipation
    const drawP = easeOutCubic(span(local, T.draw[0], T.draw[1]));
    const dissolveP = smooth(span(local, T.dissolve[0], T.dissolve[1]));
    const perSeg = TUBE_RADIAL * 6;
    const head = Math.floor(drawP * TUBE_SEGMENTS);
    const tail = Math.floor(dissolveP * TUBE_SEGMENTS * 0.5);
    tube.setDrawRange(tail * perSeg, Math.max(0, head - tail) * perSeg);

    if (arcMatRef.current) {
      const baseAlpha = isLight ? 0.82 : 0.88;
      arcMatRef.current.opacity = baseAlpha * (1 - dissolveP) * embellishFadeRef.current;
    }
    if (arcRef.current) arcRef.current.visible = head > tail && dissolveP < 1;

    // High-velocity light packet gliding smoothly along the drawn arc
    const pP = span(local, T.packet[0], T.packet[1]);
    if (packetRef.current) {
      const active = local >= T.packet[0] && local <= T.packet[1];
      packetRef.current.visible = active;
      if (active) {
        const eased = pP < 0.5 ? 2 * pP * pP : 1 - Math.pow(-2 * pP + 2, 2) / 2;
        packetRef.current.position.copy(curve.getPointAt(eased));
        if (packetGlowMatRef.current) {
          packetGlowMatRef.current.opacity =
            (isLight ? 0.3 : 0.45) * Math.sin(pP * Math.PI) * embellishFadeRef.current;
        }
      }
    }

    // Origin: warm breathing beacon
    const launchKick = Math.sin(span(local, T.draw[0], T.draw[0] + 0.5) * Math.PI) * 0.28;
    const breath = 0.5 + 0.5 * Math.sin(t * 1.5);
    if (originHaloRef.current) originHaloRef.current.scale.setScalar(1.5 + breath * 0.8 + launchKick * 1.2);
    if (originHaloMatRef.current) {
      originHaloMatRef.current.opacity =
        ((isLight ? 0.16 : 0.22) * (0.6 + breath * 0.4) + launchKick * 0.2) *
        embellishFadeRef.current;
    }

    // Hubs: subtle staggered twinkle across all 15 nodes + target flashes
    hubPositions.forEach((_, i) => {
      const halo = hubHaloRefs.current[i];
      const haloMat = hubHaloMatRefs.current[i];
      const coreMat = hubCoreMatRefs.current[i];
      const twinkle = 0.5 + 0.5 * Math.sin(t * 1.2 + i * 1.3);
      let flash = 0;
      if (i === target) {
        const inF = Math.sin(span(local, T.flashIn[0], T.flashIn[1]) * Math.PI);
        const impact = local >= T.impact[0] ? Math.pow(1 - span(local, T.impact[0], T.impact[1]), 2) : 0;
        flash = Math.max(inF * 0.75, impact);
      }
      if (halo) halo.scale.setScalar(1 + twinkle * 0.25 + flash * 2.4);
      if (haloMat) {
        haloMat.opacity =
          ((isLight ? 0.08 : 0.12) + twinkle * 0.05 + flash * (isLight ? 0.38 : 0.58)) *
          embellishFadeRef.current;
      }
      if (coreMat) {
        coreMat.opacity = (0.55 + twinkle * 0.18 + flash * 0.35) * embellishFadeRef.current;
      }
    });

    if (ringARef.current) {
      ringARef.current.rotation.z = t * 0.06;
      ringARef.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.15) * 0.05;
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.z = -t * 0.045;
      ringBRef.current.rotation.y = Math.PI / 3.2 + Math.cos(t * 0.12) * 0.05;
    }
    if (ringCRef.current) {
      ringCRef.current.rotation.x = Math.PI / 2;
      ringCRef.current.rotation.z = t * 0.03;
    }
  });

  return (
    <group ref={outerGroupRef} scale={fitScale}>
      <group ref={groupRef}>
        {/* The Solid Planetary Sphere Body */}
        <mesh>
          <sphereGeometry args={[R * 0.992, 64, 64]} />
          <meshStandardMaterial
            color={palette.coreColor}
            roughness={palette.coreRoughness}
            metalness={isLight ? 0.05 : 0.45}
          />
        </mesh>

        {/* Real World Natural Earth Landmass Points Stipple */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[landDotPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={landDotsMatRef}
            size={palette.landDotSize}
            color={palette.landDotColor}
            transparent
            opacity={palette.landDotOpacity}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* Faint Ocean Latitude Grid Points */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[oceanDotPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={oceanDotsMatRef}
            size={palette.oceanDotSize}
            color={palette.oceanDotColor}
            transparent
            opacity={palette.oceanDotOpacity}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* Luminous Telemetry Hairline Arc */}
        <mesh ref={arcRef} geometry={arcs[0].tube}>
          <meshBasicMaterial
            ref={arcMatRef}
            color={isLight ? '#C88828' : '#F2D272'}
            transparent
            opacity={0.85}
            depthWrite={false}
            blending={glowBlending}
          />
        </mesh>

        {/* High-Velocity Light Packet */}
        <group ref={packetRef} visible={false}>
          <mesh>
            <sphereGeometry args={[0.015, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh scale={2.8}>
            <sphereGeometry args={[0.015, 16, 16]} />
            <meshBasicMaterial
              ref={packetGlowMatRef}
              color={palette.glowColor}
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={glowBlending}
            />
          </mesh>
        </group>

        {/* Personal Origin Node — Warm Golden Beacon (Chattogram/Dhaka Hub) */}
        <group position={originPos}>
          <mesh>
            <sphereGeometry args={[0.024, 20, 20]} />
            <meshBasicMaterial
              ref={originCoreMatRef}
              color={palette.originCore}
              transparent
              opacity={1}
            />
          </mesh>
          <mesh ref={originHaloRef}>
            <sphereGeometry args={[0.046, 20, 20]} />
            <meshBasicMaterial
              ref={originHaloMatRef}
              color={palette.originBeacon}
              transparent
              opacity={0.22}
              depthWrite={false}
              blending={glowBlending}
            />
          </mesh>
        </group>

        {/* 15 Widely Spaced World Metropolises Nodes */}
        {hubPositions.map((pos, i) => (
          <group key={CLIENT_HUBS[i].id} position={pos}>
            <mesh>
              <sphereGeometry args={[0.016, 16, 16]} />
              <meshBasicMaterial
                ref={(m) => {
                  hubCoreMatRefs.current[i] = m;
                }}
                color={palette.hubCore}
                transparent
                opacity={0.75}
              />
            </mesh>
            <mesh
              ref={(m) => {
                hubHaloRefs.current[i] = m;
              }}
            >
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial
                ref={(m) => {
                  hubHaloMatRefs.current[i] = m;
                }}
                color={palette.glowColor}
                transparent
                opacity={0.12}
                depthWrite={false}
                blending={glowBlending}
              />
            </mesh>
          </group>
        ))}

        {/* Architectural Hairline Gyroscope Rings */}
        <mesh ref={ringARef}>
          <torusGeometry args={[R * 1.18, 0.0022, 16, 180]} />
          <meshBasicMaterial ref={ringAMatRef} color={palette.ringPrimary} transparent opacity={palette.ringAOpacity} />
        </mesh>
        <mesh ref={ringBRef}>
          <torusGeometry args={[R * 1.27, 0.0018, 16, 180]} />
          <meshBasicMaterial ref={ringBMatRef} color={palette.ringAccent} transparent opacity={palette.ringBOpacity} />
        </mesh>
        <mesh ref={ringCRef}>
          <torusGeometry args={[R * 1.09, 0.0016, 16, 180]} />
          <meshBasicMaterial ref={ringCMatRef} color={palette.ringPrimary} transparent opacity={palette.ringCOpacity} />
        </mesh>
      </group>
    </group>
  );
}

function buildBasketballSeams(radius: number): Float32Array {
  const segments: number[] = [];
  const steps = 96;

  const pushLoop = (pts: THREE.Vector3[]) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      segments.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };

  // 1. Equatorial seam (y = 0)
  const eq: THREE.Vector3[] = [];
  // 2. Meridian seam (x = 0)
  const mer: THREE.Vector3[] = [];
  // 3. Classic 8-panel saddle seam curve
  const saddle: THREE.Vector3[] = [];
  const aCoef = 0.42;
  const bCoef = 1 - aCoef;
  const cCoef = 2 * Math.sqrt(aCoef * bCoef);

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    eq.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
    mer.push(new THREE.Vector3(0, Math.cos(t) * radius, Math.sin(t) * radius));

    const sx = aCoef * Math.cos(t) + bCoef * Math.cos(3 * t);
    const sy = aCoef * Math.sin(t) - bCoef * Math.sin(3 * t);
    const sz = cCoef * Math.sin(2 * t);
    saddle.push(new THREE.Vector3(sx, sy, sz).normalize().multiplyScalar(radius));
  }

  pushLoop(eq);
  pushLoop(mer);
  pushLoop(saddle);

  return new Float32Array(segments);
}

function buildBackboardLines(): Float32Array {
  const segs: number[] = [];
  const addRect = (w: number, h: number, yCenter: number, z: number) => {
    const hw = w / 2;
    const hh = h / 2;
    const p0 = [-hw, yCenter - hh, z];
    const p1 = [hw, yCenter - hh, z];
    const p2 = [hw, yCenter + hh, z];
    const p3 = [-hw, yCenter + hh, z];
    segs.push(
      p0[0], p0[1], p0[2], p1[0], p1[1], p1[2],
      p1[0], p1[1], p1[2], p2[0], p2[1], p2[2],
      p2[0], p2[1], p2[2], p3[0], p3[1], p3[2],
      p3[0], p3[1], p3[2], p0[0], p0[1], p0[2]
    );
  };
  // Outer backboard frame & inner shooter's square
  addRect(1.16, 0.72, 0.25, -0.32);
  addRect(0.44, 0.30, 0.16, -0.315);
  return new Float32Array(segs);
}

function buildHoopNetLines(topR: number, bottomR: number, height: number): Float32Array {
  const segs: number[] = [];
  const strands = 12;
  const tiers = 3;

  for (let tier = 0; tier < tiers; tier++) {
    const t0 = tier / tiers;
    const t1 = (tier + 1) / tiers;
    const r0 = THREE.MathUtils.lerp(topR, bottomR, t0);
    const r1 = THREE.MathUtils.lerp(topR, bottomR, t1);
    const y0 = -t0 * height;
    const y1 = -t1 * height;
    const twist0 = (tier * Math.PI) / strands;
    const twist1 = ((tier + 1) * Math.PI) / strands;

    for (let i = 0; i < strands; i++) {
      const a0 = (i / strands) * Math.PI * 2 + twist0;
      const aNext = (((i + 1) % strands) / strands) * Math.PI * 2 + twist0;
      const b0 = (i / strands) * Math.PI * 2 + twist1;

      const xTopA = Math.cos(a0) * r0;
      const zTopA = Math.sin(a0) * r0;
      const xTopB = Math.cos(aNext) * r0;
      const zTopB = Math.sin(aNext) * r0;
      const xBot = Math.cos(b0) * r1;
      const zBot = Math.sin(b0) * r1;

      // Left & right diamond diagonals
      segs.push(xTopA, y0, zTopA, xBot, y1, zBot);
      segs.push(xTopB, y0, zTopB, xBot, y1, zBot);
    }
  }
  return new Float32Array(segs);
}

function BasketballCourt3D({
  isLight,
  gamePhase,
  controlRef,
  onScore,
  onMiss,
}: {
  isLight: boolean;
  gamePhase: GamePhase;
  controlRef: React.MutableRefObject<CourtControlState>;
  onScore: (isSwish: boolean) => void;
  onMiss: () => void;
}) {
  const { viewport, camera } = useThree();
  const rawFitScale = computeCourtFitScale(viewport.width, viewport.height);
  const fitScale =
    Number.isFinite(rawFitScale) && rawFitScale > 0.1 ? rawFitScale : 0.85;

  const courtGroupRef = useRef<THREE.Group>(null);
  const hoopGroupRef = useRef<THREE.Group>(null);
  const netGroupRef = useRef<THREE.Group>(null);
  const rimMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ballGroupRef = useRef<THREE.Group>(null);
  const ballMeshGroupRef = useRef<THREE.Group>(null);
  const aimDotsRefs = useRef<Array<THREE.Mesh | null>>([]);

  const hoopPhaseRef = useRef(0);
  const hoopXRef = useRef(0);
  const difficultyRef = useRef(0);
  const netSwishRef = useRef(0);
  const transitionElapsedRef = useRef(0);
  const effectFlashRef = useRef<{ timer: number; color: string }>({ timer: 0, color: '#F2D272' });

  const flightRef = useRef<{
    state: 'ready' | 'flying' | 'resolving';
    time: number;
    startX: number;
    vx: number;
    scored: boolean;
    bounced: boolean;
    bounceVx: number;
    bounceVy: number;
    pos: THREE.Vector3;
  }>({
    state: 'ready',
    time: 0,
    startX: 0,
    vx: 0,
    scored: false,
    bounced: false,
    bounceVx: 0,
    bounceVy: 0,
    pos: new THREE.Vector3(0, COURT_LAUNCH_Y, COURT_LAUNCH_Z),
  });

  const BALL_R = COURT_BALL_R;
  const LAUNCH_Y = COURT_LAUNCH_Y;
  const LAUNCH_Z = COURT_LAUNCH_Z;
  const HOOP_Y = COURT_HOOP_Y;
  const HOOP_Z = COURT_HOOP_Z;
  const FLIGHT_DURATION = 0.56;

  const { seamPositions, backboardPositions, netPositions } = useMemo(
    () => ({
      seamPositions: buildBasketballSeams(BALL_R * 1.012),
      backboardPositions: buildBackboardLines(),
      netPositions: buildHoopNetLines(0.31, 0.18, 0.36),
    }),
    [BALL_R]
  );

  // Reset court state when entering spinning_transition or playing fresh
  useEffect(() => {
    if (gamePhase === 'spinning_transition') {
      difficultyRef.current = 0;
      transitionElapsedRef.current = 0;
      hoopPhaseRef.current = 0;
      hoopXRef.current = 0;
      flightRef.current.state = 'ready';
      flightRef.current.time = 0;
      controlRef.current.ballX = 0;
      controlRef.current.targetBallX = 0;
      controlRef.current.pendingThrow = null;
      if (hoopGroupRef.current) {
        hoopGroupRef.current.position.set(0, 2.55, HOOP_Z);
      }
    }
  }, [gamePhase, controlRef, HOOP_Z]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Defensive recovery if OrbitControls ever produced a non-finite camera coordinate
    if (
      !Number.isFinite(camera.position.x) ||
      !Number.isFinite(camera.position.y) ||
      !Number.isFinite(camera.position.z)
    ) {
      camera.position.copy(COURT_CAM_POS);
      camera.up.copy(WORLD_UP);
      camera.lookAt(0, 0, 0);
    }

    const active =
      gamePhase === 'spinning_transition' ||
      gamePhase === 'playing' ||
      gamePhase === 'game_over';

    if (courtGroupRef.current) {
      courtGroupRef.current.visible = active;
      courtGroupRef.current.scale.setScalar(fitScale);
    }
    if (!active) return;

    if (gamePhase === 'spinning_transition') {
      transitionElapsedRef.current += dt;
    }

    // Spherically align camera straight-on with the court after any globe orbit rotation
    const camDist = camera.position.length() || 5.15;
    camera.position.lerp(COURT_CAM_POS, 0.14);
    if (camera.position.lengthSq() > 0.001) {
      camera.position.setLength(THREE.MathUtils.lerp(camDist, 5.15, 0.14));
    }
    camera.up.lerp(WORLD_UP, 0.16).normalize();
    camera.lookAt(0, 0, 0);

    // 1. Move Hoop Left <-> Right continuously (glides smoothly in from top during transition)
    const speed = 1.08 + Math.min(difficultyRef.current * 0.09, 0.9);
    hoopPhaseRef.current += dt * (gamePhase === 'spinning_transition' ? speed * 0.55 : speed);
    const maxHoopX = 0.92;
    const swayScale =
      gamePhase === 'spinning_transition'
        ? smootherstep(clamp01((transitionElapsedRef.current - 0.52) / 0.45))
        : 1;
    hoopXRef.current = Math.sin(hoopPhaseRef.current) * maxHoopX * swayScale;

    if (hoopGroupRef.current) {
      hoopGroupRef.current.position.x = hoopXRef.current;
      if (gamePhase === 'spinning_transition') {
        const dropEased = smootherstep(clamp01((transitionElapsedRef.current - 0.1) / 0.78));
        hoopGroupRef.current.position.y = THREE.MathUtils.lerp(2.55, HOOP_Y, dropEased);
      } else {
        hoopGroupRef.current.position.y = THREE.MathUtils.lerp(
          hoopGroupRef.current.position.y,
          HOOP_Y,
          0.16
        );
      }
      hoopGroupRef.current.position.z = HOOP_Z;
    }

    // 2. Net Swish & Rim Shockwave Animation
    if (netSwishRef.current > 0) {
      netSwishRef.current = Math.max(0, netSwishRef.current - dt * 2.4);
      const sw = Math.sin(netSwishRef.current * Math.PI);
      if (netGroupRef.current) {
        netGroupRef.current.scale.set(1 + sw * 0.28, 1 - sw * 0.36, 1 + sw * 0.28);
        netGroupRef.current.rotation.z = Math.sin(netSwishRef.current * Math.PI * 3) * 0.12;
      }
    } else if (netGroupRef.current) {
      netGroupRef.current.scale.set(1, 1, 1);
      netGroupRef.current.rotation.z = 0;
    }

    if (effectFlashRef.current.timer > 0) {
      effectFlashRef.current.timer = Math.max(0, effectFlashRef.current.timer - dt * 2.1);
      const p = 1 - effectFlashRef.current.timer;
      if (shockwaveRef.current && shockwaveMatRef.current) {
        shockwaveRef.current.visible = true;
        shockwaveRef.current.scale.setScalar(1 + p * 1.45);
        shockwaveMatRef.current.color.set(effectFlashRef.current.color);
        shockwaveMatRef.current.opacity = (1 - p) * 0.85;
      }
      if (rimMatRef.current) {
        rimMatRef.current.emissive.set(effectFlashRef.current.color);
        rimMatRef.current.emissiveIntensity = (1 - p) * 0.7;
      }
    } else {
      if (shockwaveRef.current) shockwaveRef.current.visible = false;
      if (rimMatRef.current) {
        rimMatRef.current.emissive.set(isLight ? '#C49A3E' : '#E5C77B');
        rimMatRef.current.emissiveIntensity = isLight ? 0.28 : 0.16;
      }
    }

    // 3. Basketball Position, Throw Flight, & Collision Physics
    const ctrl = controlRef.current;
    const fl = flightRef.current;

    if (gamePhase === 'playing' && fl.state === 'ready' && ctrl.pendingThrow) {
      const throwCmd = ctrl.pendingThrow;
      ctrl.pendingThrow = null;
      fl.state = 'flying';
      fl.time = 0;
      fl.startX = ctrl.ballX;
      fl.vx = throwCmd.vx;
      fl.scored = false;
      fl.bounced = false;
      sounds.playBasketballLaunch();
    }

    if (fl.state === 'ready') {
      ctrl.ballX = THREE.MathUtils.lerp(ctrl.ballX, ctrl.targetBallX, ctrl.isAiming ? 0.62 : 0.28);
      fl.pos.set(ctrl.ballX, LAUNCH_Y, LAUNCH_Z);
      if (ballMeshGroupRef.current) {
        ballMeshGroupRef.current.rotation.z = -ctrl.ballX * 2.1;
        ballMeshGroupRef.current.rotation.x += dt * (gamePhase === 'spinning_transition' ? 16 : 1.15);
        ballMeshGroupRef.current.rotation.y += dt * (gamePhase === 'spinning_transition' ? 22 : 0.75);
      }
      if (ballGroupRef.current) {
        ballGroupRef.current.scale.setScalar(1);
      }
    } else if (fl.state === 'flying') {
      fl.time += dt;
      const u = fl.time / FLIGHT_DURATION;

      const curX = fl.startX + fl.vx * u;
      const curZ = THREE.MathUtils.lerp(LAUNCH_Z, HOOP_Z, u);
      const linearY = THREE.MathUtils.lerp(LAUNCH_Y, HOOP_Y, u);
      const arcLift = 4 * u * (1 - u) * 0.96;
      const curY = linearY + arcLift;

      fl.pos.set(curX, curY, curZ);

      if (ballMeshGroupRef.current) {
        ballMeshGroupRef.current.rotation.x -= dt * 19;
        ballMeshGroupRef.current.rotation.z = -fl.vx * 0.8;
      }
      if (ballGroupRef.current) {
        ballGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.84, clamp01(u)));
      }

      // Reached the hoop plane! Evaluate swish / bank-in / rim-clank / miss
      if (u >= 1) {
        const dx = curX - hoopXRef.current;
        const absDx = Math.abs(dx);

        if (absDx <= 0.165 * COURT_HOOP_SCALE) {
          // Pure Swish
          fl.scored = true;
          fl.state = 'resolving';
          fl.time = 0;
          difficultyRef.current += 1;
          netSwishRef.current = 1;
          effectFlashRef.current = { timer: 1, color: '#F2D272' };
          sounds.playBasketballSwish();
          onScore(true);
        } else if (absDx <= 0.275 * COURT_HOOP_SCALE) {
          // Rim-In / Bank Shot
          fl.scored = true;
          fl.state = 'resolving';
          fl.time = 0;
          difficultyRef.current += 1;
          netSwishRef.current = 0.85;
          effectFlashRef.current = { timer: 1, color: '#E5C77B' };
          sounds.playVolumeTick();
          sounds.playBasketballSwish();
          onScore(false);
        } else {
          // Miss (Rim Clank or Airball)
          fl.scored = false;
          fl.state = 'resolving';
          fl.time = 0;
          fl.bounced = absDx <= 0.44 * COURT_HOOP_SCALE;
          fl.bounceVx = fl.bounced ? Math.sign(dx || 1) * 1.45 : fl.vx * 0.6;
          fl.bounceVy = fl.bounced ? 0.55 : -1.2;
          effectFlashRef.current = { timer: 1, color: '#EF4444' };
          sounds.playBasketballRimMiss();
          onMiss();
        }
      }
    } else if (fl.state === 'resolving') {
      fl.time += dt;
      if (fl.scored) {
        // Guide ball cleanly down through the center of the net
        fl.pos.x = THREE.MathUtils.lerp(fl.pos.x, hoopXRef.current, 0.3);
        fl.pos.y = HOOP_Y - fl.time * 1.85;
        fl.pos.z = HOOP_Z;
      } else {
        // Rim bounce or airball gravity drop
        fl.pos.x += fl.bounceVx * dt;
        fl.pos.y += fl.bounceVy * dt;
        fl.bounceVy -= 6.8 * dt;
      }

      if (ballMeshGroupRef.current) {
        ballMeshGroupRef.current.rotation.x -= dt * 12;
      }

      if (fl.time >= 0.36) {
        fl.state = 'ready';
        fl.time = 0;
        if (ballGroupRef.current) ballGroupRef.current.scale.setScalar(1);
      }
    }

    if (ballGroupRef.current) {
      ballGroupRef.current.position.copy(fl.pos);
    }

    // 4. Update Trajectory Aim Preview Dots when swiping upward to shoot
    const showAim =
      gamePhase === 'playing' && fl.state === 'ready' && ctrl.isAiming && ctrl.isSwiping;
    aimDotsRefs.current.forEach((dot, idx) => {
      if (!dot) return;
      dot.visible = showAim;
      if (!showAim) return;
      const stepU = (idx + 1) / (aimDotsRefs.current.length + 1);
      const ax = ctrl.ballX + ctrl.aimVx * stepU;
      const az = THREE.MathUtils.lerp(LAUNCH_Z, HOOP_Z, stepU);
      const ay =
        THREE.MathUtils.lerp(LAUNCH_Y, HOOP_Y, stepU) + 4 * stepU * (1 - stepU) * 0.96;
      dot.position.set(ax, ay, az);
    });
  });

  const frameBarColor = isLight ? '#27272A' : '#C8B89A';
  const targetSquareColor = isLight ? '#C69D45' : '#E5C77B';

  return (
    <group
      ref={courtGroupRef}
      scale={fitScale}
      visible={
        gamePhase === 'spinning_transition' ||
        gamePhase === 'playing' ||
        gamePhase === 'game_over'
      }
    >
      {/* Moving Architectural Hoop Assembly */}
      <group ref={hoopGroupRef} position={[0, 2.55, HOOP_Z]} scale={COURT_HOOP_SCALE}>
        {/* Smoked Glass / Frosted Pearl Crystal Backboard Panel */}
        <mesh position={[0, 0.25, -0.33]}>
          <boxGeometry args={[1.16, 0.72, 0.018]} />
          <meshStandardMaterial
            color={isLight ? '#FFFFFF' : '#121216'}
            emissive={isLight ? '#F6F5F0' : '#000000'}
            emissiveIntensity={isLight ? 0.45 : 0}
            roughness={isLight ? 0.14 : 0.28}
            metalness={isLight ? 0.04 : 0.25}
            transparent
            opacity={isLight ? 0.62 : 0.72}
          />
        </mesh>

        {/* Sculpted 3D Outer Backboard Frame Bars (crisp at all DPIs in Light & Dark Mode) */}
        <mesh position={[0, 0.61, -0.318]}>
          <boxGeometry args={[1.18, 0.018, 0.016]} />
          <meshBasicMaterial color={frameBarColor} />
        </mesh>
        <mesh position={[0, -0.11, -0.318]}>
          <boxGeometry args={[1.18, 0.018, 0.016]} />
          <meshBasicMaterial color={frameBarColor} />
        </mesh>
        <mesh position={[-0.58, 0.25, -0.318]}>
          <boxGeometry args={[0.018, 0.74, 0.016]} />
          <meshBasicMaterial color={frameBarColor} />
        </mesh>
        <mesh position={[0.58, 0.25, -0.318]}>
          <boxGeometry args={[0.018, 0.74, 0.016]} />
          <meshBasicMaterial color={frameBarColor} />
        </mesh>

        {/* Sculpted 3D Inner Shooter's Target Square Bars */}
        <mesh position={[0, 0.31, -0.314]}>
          <boxGeometry args={[0.45, 0.015, 0.014]} />
          <meshBasicMaterial color={targetSquareColor} />
        </mesh>
        <mesh position={[0, 0.01, -0.314]}>
          <boxGeometry args={[0.45, 0.015, 0.014]} />
          <meshBasicMaterial color={targetSquareColor} />
        </mesh>
        <mesh position={[-0.22, 0.16, -0.314]}>
          <boxGeometry args={[0.015, 0.315, 0.014]} />
          <meshBasicMaterial color={targetSquareColor} />
        </mesh>
        <mesh position={[0.22, 0.16, -0.314]}>
          <boxGeometry args={[0.015, 0.315, 0.014]} />
          <meshBasicMaterial color={targetSquareColor} />
        </mesh>

        {/* Backboard Hairline Accent */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[backboardPositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isLight ? '#52525B' : frameBarColor}
            transparent
            opacity={isLight ? 0.55 : 0.85}
          />
        </lineSegments>

        {/* Rim Mounting Bracket */}
        <mesh position={[0, 0.02, -0.31]}>
          <boxGeometry args={[0.15, 0.055, 0.065]} />
          <meshStandardMaterial
            color={isLight ? '#27272A' : '#C8B89A'}
            metalness={isLight ? 0.35 : 0.6}
            roughness={isLight ? 0.45 : 0.3}
          />
        </mesh>

        {/* Metallic Champagne-Gold Rim */}
        <mesh rotation={[Math.PI / 2 + 0.14, 0, 0]}>
          <torusGeometry args={[0.32, 0.019, 16, 64]} />
          <meshStandardMaterial
            ref={rimMatRef}
            color={isLight ? '#DCBA66' : '#E5C77B'}
            emissive={isLight ? '#C49A3E' : '#E5C77B'}
            emissiveIntensity={isLight ? 0.28 : 0.16}
            metalness={isLight ? 0.48 : 0.72}
            roughness={0.22}
          />
        </mesh>

        {/* Expanding Score / Miss Shockwave Ring */}
        <mesh ref={shockwaveRef} rotation={[Math.PI / 2 + 0.14, 0, 0]} visible={false}>
          <ringGeometry args={[0.33, 0.37, 48]} />
          <meshBasicMaterial
            ref={shockwaveMatRef}
            color={isLight ? '#D4AF5A' : '#F2D272'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Dynamic Geometric Net */}
        <group ref={netGroupRef} rotation={[0.14, 0, 0]}>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[netPositions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={isLight ? '#71717A' : '#E8DAC0'}
              transparent
              opacity={isLight ? 0.68 : 0.72}
            />
          </lineSegments>
          {/* Mid & Bottom Net Rings for crisp 3D definition */}
          <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.245, 0.0045, 8, 36]} />
            <meshBasicMaterial
              color={isLight ? '#52525B' : '#C8B89A'}
              transparent
              opacity={isLight ? 0.58 : 0.55}
            />
          </mesh>
          <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.005, 8, 36]} />
            <meshBasicMaterial
              color={isLight ? '#52525B' : '#C8B89A'}
              transparent
              opacity={isLight ? 0.62 : 0.65}
            />
          </mesh>
        </group>
      </group>

      {/* Dotted Trajectory Aim Preview Arc */}
      {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
        <mesh
          key={`aim-dot-${idx}`}
          ref={(el) => {
            aimDotsRefs.current[idx] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.024 * (1 - idx * 0.08), 12, 12]} />
          <meshBasicMaterial
            color={isLight ? '#C69E4B' : '#E5C77B'}
            transparent
            opacity={0.82 - idx * 0.08}
          />
        </mesh>
      ))}

      {/* The Luxury Tactile 3D Basketball */}
      <group
        ref={ballGroupRef}
        position={[0, LAUNCH_Y, LAUNCH_Z]}
        visible={gamePhase === 'playing' || gamePhase === 'game_over'}
      >
        <group ref={ballMeshGroupRef}>
          <mesh>
            <sphereGeometry args={[BALL_R, 48, 48]} />
            <meshStandardMaterial
              color={isLight ? '#EFECE6' : '#2D1A10'}
              emissive={isLight ? '#D6D2C9' : '#1A0E08'}
              emissiveIntensity={isLight ? 0.3 : 0.22}
              roughness={isLight ? 0.34 : 0.38}
              metalness={isLight ? 0.08 : 0.22}
            />
          </mesh>

          {/* 3D Sculpted Equatorial & Meridian Seam Rings */}
          {[
            [Math.PI / 2, 0, 0] as const,
            [0, Math.PI / 2, 0] as const,
          ].map((rot, idx) => (
            <mesh key={`ball-seam-ring-${idx}`} rotation={rot}>
              <torusGeometry args={[BALL_R * 1.003, isLight ? 0.0036 : 0.0065, 10, 64]} />
              <meshBasicMaterial color={isLight ? '#232328' : '#E5C77B'} />
            </mesh>
          ))}

          {/* 8-Panel Basketball Saddle Seam Ribs */}
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[seamPositions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={isLight ? '#232328' : '#F2D272'}
              transparent
              opacity={0.95}
            />
          </lineSegments>
        </group>

        {/* Subtle Launch Pad Ground Ring */}
        <mesh position={[0, -BALL_R - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.278, 0.31, 36]} />
          <meshBasicMaterial
            color={isLight ? '#B89548' : '#C8B89A'}
            side={THREE.DoubleSide}
            transparent
            opacity={isLight ? 0.65 : 0.36}
          />
        </mesh>
      </group>
    </group>
  );
}

function CanvasTouchActionSync({ touchAction }: { touchAction: 'pan-y' | 'none' }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.domElement.style.touchAction = touchAction;
  }, [gl, touchAction]);
  return null;
}

export const CorridorScene: React.FC<{
  modeOverride?: ThemeMode;
  onCourtActiveChange?: (active: boolean) => void;
}> = ({ modeOverride, onCourtActiveChange }) => {
  const { theme } = useTheme();
  const isLight = (modeOverride ?? theme) === 'light';
  const triggerFnRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [gamePhase, setGamePhase] = useState<GamePhase>('globe');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [shotEvent, setShotEvent] = useState<ShotEvent | null>(null);
  const [fastSpinCount, setFastSpinCount] = useState(0);

  const isCourtActive =
    gamePhase === 'spinning_transition' ||
    gamePhase === 'playing' ||
    gamePhase === 'game_over';

  useEffect(() => {
    onCourtActiveChange?.(isCourtActive);
  }, [isCourtActive, onCourtActiveChange]);

  const [tapPulsing, setTapPulsing] = useState(false);
  const [globeHitEl, setGlobeHitEl] = useState<HTMLDivElement | null>(null);
  const [isGlobeOnlyTouch, setIsGlobeOnlyTouch] = useState(false);
  const [globeDiameterPx, setGlobeDiameterPx] = useState<number | null>(null);
  const [controlsReady, setControlsReady] = useState(false);

  const lastTriggerTimeRef = useRef(0);
  const spinKickRef = useRef(0);
  const globeSpinRef = useRef<GlobeSpinTracker>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    samples: [],
    strokeRegisteredAt: 0,
    strokeDirX: 0,
    strokeDirY: 0,
    fastSpinCount: 0,
    lastFastSpinAt: 0,
  });

  // Court drag & swipe-to-shoot state
  const controlRef = useRef<CourtControlState>({
    ballX: 0,
    targetBallX: 0,
    aimVx: 0,
    isAiming: false,
    isSwiping: false,
    pendingThrow: null,
  });
  const courtPointerRef = useRef<{
    active: boolean;
    pointerId: number | null;
    prevX: number;
    prevY: number;
    originX: number;
    originY: number;
  }>({
    active: false,
    pointerId: null,
    prevX: 0,
    prevY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px), (pointer: coarse)');
    const updateMode = () => setIsGlobeOnlyTouch(mq.matches);
    updateMode();
    mq.addEventListener('change', updateMode);
    setControlsReady(true);

    const el = containerRef.current;
    if (!el) return () => mq.removeEventListener('change', updateMode);

    const updateDiameter = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setGlobeDiameterPx(Math.round(Math.min(rect.width, rect.height) * 0.76));
      }
    };
    updateDiameter();

    const observer = new ResizeObserver(updateDiameter);
    observer.observe(el);

    return () => {
      mq.removeEventListener('change', updateMode);
      observer.disconnect();
    };
  }, []);

  // Expire registered fast spins if user does not complete 3 fast spins within 2.2s
  useEffect(() => {
    if (gamePhase !== 'ready_to_spin') {
      globeSpinRef.current.fastSpinCount = 0;
      globeSpinRef.current.lastFastSpinAt = 0;
      if (fastSpinCount !== 0) setFastSpinCount(0);
      return;
    }
    if (fastSpinCount <= 0 || fastSpinCount >= 3) return;

    const timer = setTimeout(() => {
      globeSpinRef.current.fastSpinCount = 0;
      globeSpinRef.current.lastFastSpinAt = 0;
      setFastSpinCount(0);
    }, 2200);
    return () => clearTimeout(timer);
  }, [gamePhase, fastSpinCount]);

  // Auto-clear shot feedback toast
  useEffect(() => {
    if (!shotEvent) return;
    const timer = setTimeout(() => setShotEvent(null), 1150);
    return () => clearTimeout(timer);
  }, [shotEvent]);

  const startSpinTransition = () => {
    globeSpinRef.current.fastSpinCount = 0;
    globeSpinRef.current.lastFastSpinAt = 0;
    globeSpinRef.current.active = false;
    setFastSpinCount(0);
    sounds.playChime();
    setScore(0);
    setStreak(0);
    setLives(3);
    setShotEvent(null);
    setGamePhase('spinning_transition');
  };

  const resetGlobeTracker = () => {
    globeSpinRef.current.fastSpinCount = 0;
    globeSpinRef.current.lastFastSpinAt = 0;
    setFastSpinCount(0);
  };

  const registerFastSpin = (dirX: number, dirY: number, now: number) => {
    const tracker = globeSpinRef.current;
    if (tracker.lastFastSpinAt > 0 && now - tracker.lastFastSpinAt < 140) return;
    if (tracker.lastFastSpinAt > 0 && now - tracker.lastFastSpinAt > 2200) {
      tracker.fastSpinCount = 0;
    }

    const nextCount = tracker.fastSpinCount + 1;
    tracker.fastSpinCount = nextCount;
    tracker.lastFastSpinAt = now;
    tracker.strokeRegisteredAt = now;
    tracker.strokeDirX = dirX;
    tracker.strokeDirY = dirY;

    const kickDir = Math.abs(dirX) >= Math.abs(dirY) ? (dirX >= 0 ? 1 : -1) : dirY >= 0 ? 1 : -1;
    spinKickRef.current += kickDir * 14;

    if (nextCount >= 3) {
      startSpinTransition();
    } else {
      sounds.playApertureClick();
      setFastSpinCount(nextCount);
    }
  };

  const handleTrigger = () => {
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 200) return;
    lastTriggerTimeRef.current = now;
    sounds.playLeicaShutter();
    setTapPulsing(true);
    setTimeout(() => setTapPulsing(false), 300);
    triggerFnRef.current?.();

    if (gamePhase === 'globe') {
      resetGlobeTracker();
      setGamePhase('ready_to_spin');
    }
  };

  const handleGlobePointerDown = (e: React.PointerEvent) => {
    const now = performance.now();
    const tracker = globeSpinRef.current;
    if (tracker.lastFastSpinAt > 0 && now - tracker.lastFastSpinAt > 2200) {
      resetGlobeTracker();
      if (fastSpinCount !== 0) setFastSpinCount(0);
    }
    tracker.active = true;
    tracker.pointerId = e.pointerId;
    tracker.startX = e.clientX;
    tracker.startY = e.clientY;
    tracker.startTime = now;
    tracker.samples = [{ x: e.clientX, y: e.clientY, t: now }];
    tracker.strokeRegisteredAt = 0;
    tracker.strokeDirX = 0;
    tracker.strokeDirY = 0;
  };

  const handleGlobePointerMove = (e: React.PointerEvent) => {
    const tracker = globeSpinRef.current;
    if (!tracker.active || tracker.pointerId !== e.pointerId) return;
    if (gamePhase !== 'ready_to_spin') return;

    const now = performance.now();
    tracker.samples.push({ x: e.clientX, y: e.clientY, t: now });
    while (tracker.samples.length > 2 && now - tracker.samples[0].t > 150) {
      tracker.samples.shift();
    }

    const anchor = tracker.samples[0];
    const dt = now - anchor.t;
    const dx = e.clientX - anchor.x;
    const dy = e.clientY - anchor.y;
    const dist = Math.hypot(dx, dy);

    const minDist = isGlobeOnlyTouch ? 64 : 88;
    if (dist < minDist || dt < 8) return;
    const speed = dist / dt; // px per ms (>= 0.92 desktop / >= 0.68 compact touch requires a really fast spin)
    const minSpeed = isGlobeOnlyTouch ? 0.68 : 0.92;
    if (speed < minSpeed) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    // Prevent counting a single long swipe twice; allow a reversal count only after cooldown and sharp (>120 deg) turn
    if (tracker.strokeRegisteredAt > 0) {
      if (now - tracker.strokeRegisteredAt < 260) return;
      const dot = dirX * tracker.strokeDirX + dirY * tracker.strokeDirY;
      if (dot > -0.5) return;
    }

    registerFastSpin(dirX, dirY, now);
    tracker.samples = [{ x: e.clientX, y: e.clientY, t: now }];
  };

  const handleGlobePointerUp = (e: React.PointerEvent) => {
    const tracker = globeSpinRef.current;
    if (!tracker.active || tracker.pointerId !== e.pointerId) return;

    const now = performance.now();
    const totalDx = e.clientX - tracker.startX;
    const totalDy = e.clientY - tracker.startY;
    const totalDist = Math.hypot(totalDx, totalDy);
    const totalDt = now - tracker.startTime;

    // Catch short explosive flicks coalesced right before release
    const minReleaseDist = isGlobeOnlyTouch ? 64 : 88;
    const minReleaseSpeed = isGlobeOnlyTouch ? 0.62 : 0.85;
    if (
      gamePhase === 'ready_to_spin' &&
      tracker.strokeRegisteredAt === 0 &&
      totalDist >= minReleaseDist &&
      totalDt > 0 &&
      totalDt <= 280 &&
      totalDist / totalDt >= minReleaseSpeed
    ) {
      registerFastSpin(totalDx / totalDist, totalDy / totalDist, now);
    } else if (Math.abs(totalDx) < 10 && Math.abs(totalDy) < 10 && totalDt < 400) {
      handleTrigger();
    }

    tracker.active = false;
    tracker.pointerId = null;
  };

  const handleGlobePointerCancel = () => {
    globeSpinRef.current.active = false;
    globeSpinRef.current.pointerId = null;
  };

  // Basketball Court Drag Left/Right + Swipe Up to Throw Handlers
  const getCourtProjectionMetrics = (rect: DOMRect) => {
    const safeW = Math.max(1, rect.width);
    const safeH = Math.max(1, rect.height);
    const aspect = safeW / safeH;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(39 / 2));
    const vpH = 2 * 5.15 * tanHalfFov;
    const vpW = vpH * aspect;
    const fitScale = computeCourtFitScale(vpW, vpH);

    const launchDist = 5.15 - COURT_LAUNCH_Z * fitScale;
    const hoopDist = 5.15 - COURT_HOOP_Z * fitScale;
    const halfHLaunch = launchDist * tanHalfFov;
    const halfHHoop = hoopDist * tanHalfFov;

    const pxPerWorldXLaunch = safeW / ((2 * halfHLaunch * aspect) / fitScale);
    const pxPerWorldXHoop = safeW / ((2 * halfHHoop * aspect) / fitScale);

    const ballScreenY = ((1 - (COURT_LAUNCH_Y * fitScale - 0.02) / halfHLaunch) * 0.5) * safeH;
    const hoopScreenY = ((1 - (COURT_HOOP_Y * fitScale - 0.02) / halfHHoop) * 0.5) * safeH;
    const dyBallToHoopPx = Math.max(48, ballScreenY - hoopScreenY);

    return {
      pxPerWorldXLaunch,
      pxPerWorldXHoop,
      dyBallToHoopPx,
    };
  };

  const computeSwipeVx = (
    ballX: number,
    dxPx: number,
    upPx: number,
    rect: DOMRect
  ) => {
    const m = getCourtProjectionMetrics(rect);
    const slope = dxPx / Math.max(upPx, 24);
    const projectedDeltaScreenX = slope * m.dyBallToHoopPx;
    const ballScreenOffsetPx = ballX * m.pxPerWorldXLaunch;
    const targetHoopX = THREE.MathUtils.clamp(
      (ballScreenOffsetPx + projectedDeltaScreenX) / m.pxPerWorldXHoop,
      -1.55,
      1.55
    );
    return THREE.MathUtils.clamp(targetHoopX - ballX, -2.35, 2.35);
  };

  const handleCourtPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gamePhase !== 'playing') return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic events where pointerId is inactive
    }
    controlRef.current.isAiming = true;
    controlRef.current.isSwiping = false;
    controlRef.current.aimVx = 0;
    controlRef.current.pendingThrow = null;
    courtPointerRef.current = {
      active: true,
      pointerId: e.pointerId,
      prevX: e.clientX,
      prevY: e.clientY,
      originX: e.clientX,
      originY: e.clientY,
    };
  };

  const handleCourtPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ptr = courtPointerRef.current;
    if (gamePhase !== 'playing' || !ptr.active) return;
    if (ptr.pointerId !== null && e.pointerId !== ptr.pointerId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const stepDx = e.clientX - ptr.prevX;
    const stepDy = e.clientY - ptr.prevY;
    ptr.prevX = e.clientX;
    ptr.prevY = e.clientY;

    const ctrl = controlRef.current;

    if (!ctrl.isSwiping) {
      const dxFromOrigin = e.clientX - ptr.originX;
      const upFromOrigin = ptr.originY - e.clientY;
      const absDxOrigin = Math.abs(dxFromOrigin);
      const absStepDx = Math.abs(stepDx);
      const upStep = Math.max(0, -stepDy);

      // Dragging within +-21deg of horizontal (or downward) slides ball 1:1 left <-> right
      const isHorizontalOrDownStep =
        stepDy > 1.5 || absStepDx > upStep * 2.5;
      const isOverallHorizontalDrag =
        upFromOrigin < 22 && absDxOrigin > Math.max(8, Math.abs(upFromOrigin) * 2.2);

      if (isHorizontalOrDownStep || isOverallHorizontalDrag || upFromOrigin < 2) {
        const { pxPerWorldXLaunch } = getCourtProjectionMetrics(rect);
        ctrl.targetBallX = THREE.MathUtils.clamp(
          ctrl.targetBallX + stepDx / pxPerWorldXLaunch,
          -1.02,
          1.02
        );
        // Anchor throw origin at end of horizontal placement so curving up aims accurately
        if (stepDy > 1.5 || (upFromOrigin < 16 && absStepDx > upStep * 2.2)) {
          ptr.originX = e.clientX;
          ptr.originY = e.clientY;
        }
      }

      // Engage upward swipe aiming once pointer climbs >= 22px at >= 23deg upward slope
      const finalDx = e.clientX - ptr.originX;
      const finalUp = ptr.originY - e.clientY;
      if (finalUp >= 22 && finalUp >= Math.abs(finalDx) * 0.42) {
        ctrl.isSwiping = true;
        ctrl.aimVx = computeSwipeVx(ctrl.ballX, finalDx, finalUp, rect);
      }
      return;
    }

    // Active upward swipe: pulling back down cancels the throw cleanly
    const dx = e.clientX - ptr.originX;
    const up = ptr.originY - e.clientY;
    if (up < 14) {
      ctrl.isSwiping = false;
      ctrl.aimVx = 0;
      ptr.originX = e.clientX;
      ptr.originY = e.clientY;
      return;
    }

    ctrl.aimVx = computeSwipeVx(ctrl.ballX, dx, up, rect);
  };

  const handleCourtPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ptr = courtPointerRef.current;
    if (gamePhase !== 'playing' || !ptr.active) return;
    if (ptr.pointerId !== null && e.pointerId !== ptr.pointerId) return;
    ptr.active = false;
    ptr.pointerId = null;

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors on synthetic events
    }

    const ctrl = controlRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    const dx = e.clientX - ptr.originX;
    const up = ptr.originY - e.clientY;

    ctrl.isAiming = false;
    ctrl.isSwiping = false;
    ctrl.aimVx = 0;

    if (rect && rect.width > 0 && rect.height > 0 && up >= 22 && up >= Math.abs(dx) * 0.42) {
      ctrl.pendingThrow = { vx: computeSwipeVx(ctrl.ballX, dx, up, rect) };
    }
  };

  const handleCourtPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const ptr = courtPointerRef.current;
    if (ptr.pointerId !== null && e.pointerId !== ptr.pointerId) return;
    ptr.active = false;
    ptr.pointerId = null;
    controlRef.current.isAiming = false;
    controlRef.current.isSwiping = false;
    controlRef.current.aimVx = 0;
  };

  const handleScore = (isSwish: boolean) => {
    setScore((prev) => {
      const next = prev + 1;
      setBestScore((b) => Math.max(b, next));
      return next;
    });
    setStreak((prev) => {
      const nextStreak = prev + 1;
      setShotEvent({
        id: Date.now(),
        type: isSwish ? 'swish' : 'bank',
        label:
          nextStreak >= 2
            ? `${isSwish ? 'PURE SWISH' : 'BANK IN'} · STREAK ×${nextStreak}`
            : isSwish
            ? 'PURE SWISH · +1'
            : 'BANK SHOT · +1',
        sublabel: 'TARGET SYNCHRONIZED',
      });
      return nextStreak;
    });
  };

  const handleMiss = () => {
    setStreak(0);
    setLives((prev) => {
      const nextLives = Math.max(0, prev - 1);
      setShotEvent({
        id: Date.now(),
        type: 'miss',
        label: nextLives === 0 ? 'OUT OF LIVES' : 'RIM MISS · -1 LIFE',
        sublabel:
          nextLives === 0
            ? 'SESSION COMPLETE'
            : `${nextLives} ${nextLives === 1 ? 'LIFE' : 'LIVES'} REMAINING`,
      });
      if (nextLives === 0) {
        setTimeout(() => {
          setGamePhase((curr) => (curr === 'playing' ? 'game_over' : curr));
        }, 420);
      }
      return nextLives;
    });
  };

  const handleReplay = () => {
    sounds.playLeicaShutter();
    setScore(0);
    setStreak(0);
    setLives(3);
    setShotEvent(null);
    controlRef.current.ballX = 0;
    controlRef.current.targetBallX = 0;
    controlRef.current.aimVx = 0;
    controlRef.current.isAiming = false;
    controlRef.current.isSwiping = false;
    controlRef.current.pendingThrow = null;
    courtPointerRef.current.active = false;
    setGamePhase('playing');
  };

  const handleReturnToGlobe = () => {
    sounds.playLeicaShutter();
    setShotEvent(null);
    controlRef.current.ballX = 0;
    controlRef.current.targetBallX = 0;
    controlRef.current.aimVx = 0;
    controlRef.current.isAiming = false;
    controlRef.current.isSwiping = false;
    controlRef.current.pendingThrow = null;
    courtPointerRef.current.active = false;
    resetGlobeTracker();
    setGamePhase('globe');
  };

  const isGlobeMode = gamePhase === 'globe' || gamePhase === 'ready_to_spin';

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full select-none touch-pan-y ${
        isGlobeMode && !isGlobeOnlyTouch ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      onPointerDown={isGlobeMode && !isGlobeOnlyTouch ? handleGlobePointerDown : undefined}
      onPointerMove={isGlobeMode && !isGlobeOnlyTouch ? handleGlobePointerMove : undefined}
      onPointerUp={isGlobeMode && !isGlobeOnlyTouch ? handleGlobePointerUp : undefined}
      onPointerCancel={isGlobeMode && !isGlobeOnlyTouch ? handleGlobePointerCancel : undefined}
      data-cursor={isGlobeMode && !isGlobeOnlyTouch ? 'BEAM' : undefined}
    >
      <Canvas
        camera={{ position: [0, 0.02, 5.15], fov: 39 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        style={{
          pointerEvents: isGlobeMode && !isGlobeOnlyTouch ? 'auto' : 'none',
          touchAction: isGlobeMode && isGlobeOnlyTouch ? 'pan-y' : 'none',
        }}
      >
        <CanvasTouchActionSync
          touchAction={isGlobeMode && isGlobeOnlyTouch ? 'pan-y' : 'none'}
        />
        <ambientLight intensity={isLight ? 1.15 : 0.55} />
        <directionalLight
          position={[5, 6, 4]}
          intensity={isLight ? 1.55 : 1.8}
          color={isLight ? '#FFFFFF' : '#F4F3EF'}
        />
        <directionalLight
          position={[-5, -3, -2]}
          intensity={isLight ? 0.65 : 0.75}
          color="#C8B89A"
        />
        <MinimalistSculpture
          isLight={isLight}
          gamePhase={gamePhase}
          spinKickRef={spinKickRef}
          fastSpinCount={fastSpinCount}
          onRegisterTrigger={(fn) => {
            triggerFnRef.current = fn;
          }}
          onTransitionComplete={() => {
            setGamePhase((curr) => (curr === 'spinning_transition' ? 'playing' : curr));
          }}
        />
        <BasketballCourt3D
          isLight={isLight}
          gamePhase={gamePhase}
          controlRef={controlRef}
          onScore={handleScore}
          onMiss={handleMiss}
        />
        {controlsReady && (!isGlobeOnlyTouch || Boolean(globeHitEl)) && (
          <OrbitControls
            enabled={isGlobeMode}
            domElement={isGlobeOnlyTouch && globeHitEl ? globeHitEl : undefined}
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.45}
            dampingFactor={0.05}
            enableDamping
          />
        )}
      </Canvas>

      {/* Mobile / touch circular hitbox in Globe mode: stays mounted so OrbitControls domElement never detaches mid-drag */}
      {isGlobeOnlyTouch && (
        <div
          ref={setGlobeHitEl}
          onPointerDown={isGlobeMode ? handleGlobePointerDown : undefined}
          onPointerMove={isGlobeMode ? handleGlobePointerMove : undefined}
          onPointerUp={isGlobeMode ? handleGlobePointerUp : undefined}
          onPointerCancel={isGlobeMode ? handleGlobePointerCancel : undefined}
          data-cursor={isGlobeMode ? 'BEAM' : undefined}
          style={
            globeDiameterPx
              ? { width: `${globeDiameterPx}px`, height: `${globeDiameterPx}px` }
              : undefined
          }
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[76%] aspect-square rounded-full z-10 ${
            isGlobeMode
              ? 'pointer-events-auto cursor-grab active:cursor-grabbing touch-none'
              : 'pointer-events-none'
          }`}
          aria-label="Drag globe to rotate or tap to beam"
        />
      )}

      {/* Interactive Basketball Court Touch/Drag Surface (leaves 16px side scroll rails on mobile) */}
      {gamePhase === 'playing' && (
        <div
          onPointerDown={handleCourtPointerDown}
          onPointerMove={handleCourtPointerMove}
          onPointerUp={handleCourtPointerUp}
          onPointerCancel={handleCourtPointerCancel}
          style={{ touchAction: 'none' }}
          className="absolute inset-y-0 inset-x-4 sm:inset-x-0 z-10 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag left or right to aim basketball and swipe up to shoot"
        />
      )}

      {/* Minimalist Architectural Score & 3-Lives HUD during Active Game */}
      <AnimatePresence>
        {(gamePhase === 'playing' || gamePhase === 'game_over') && (
          <motion.div
            key="court-hud"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-x-3 top-2 sm:inset-x-6 sm:top-4 z-20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-alabaster/15 bg-obsidian/85 px-3 py-1 backdrop-blur-md">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-subtle">
                Score
              </span>
              <span className="font-mono text-xs font-semibold text-alabaster">
                {String(score).padStart(2, '0')}
              </span>
              {streak >= 2 && (
                <span className="rounded-full bg-sand/20 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-light">
                  ×{streak}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 3 Lives Indicator */}
              <div
                className="flex items-center gap-1.5 rounded-full border border-alabaster/15 bg-obsidian/85 px-3 py-1.5 backdrop-blur-md"
                aria-label={`${lives} lives remaining`}
              >
                {[0, 1, 2].map((idx) => {
                  const alive = idx < lives;
                  return (
                    <span
                      key={`life-${idx}`}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        alive
                          ? 'bg-sand shadow-[0_0_8px_rgba(229,199,123,0.8)] scale-100'
                          : 'border border-alabaster/25 bg-transparent scale-90 opacity-40'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Exit back to Globe */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReturnToGlobe();
                }}
                className="pointer-events-auto rounded-full border border-alabaster/15 bg-obsidian/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-subtle transition-colors hover:border-sand/50 hover:text-alabaster backdrop-blur-md"
                aria-label="Exit game and return to globe"
              >
                × Globe
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aesthetic Score / Miss Shot Telemetry Toast */}
      {shotEvent && (
        <div
          key={shotEvent.id}
          className="pointer-events-none absolute left-1/2 top-12 sm:top-16 -translate-x-1/2 z-20 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
        >
          <div
            className={`rounded-full border px-3.5 py-1 backdrop-blur-md ${
              isLight
                ? 'shadow-[0_4px_18px_rgba(0,0,0,0.08)]'
                : 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            } ${
              shotEvent.type === 'miss'
                ? isLight
                  ? 'border-red-600/35 bg-obsidian/95 text-red-700'
                  : 'border-red-500/40 bg-obsidian/90 text-red-300'
                : 'border-sand/50 bg-obsidian/90 text-sand-light'
            }`}
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] font-medium whitespace-nowrap">
              {shotEvent.label}
            </span>
          </div>
        </div>
      )}

      {/* Game Over Modal Overlay (When 3 Lives Are Spent) */}
      {gamePhase === 'game_over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-void/65 backdrop-blur-sm p-4">
          <div
            className={`flex w-full max-w-[280px] flex-col items-center rounded-2xl border border-sand/30 bg-obsidian/95 p-5 text-center ${
              isLight ? 'shadow-[0_16px_48px_rgba(0,0,0,0.12)]' : 'shadow-[0_16px_48px_rgba(0,0,0,0.75)]'
            }`}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-sand-light">
              Court Session Complete
            </span>
            <div className="mt-3 flex items-baseline gap-4">
              <div>
                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-subtle">
                  Score
                </span>
                <span className="mt-0.5 block font-serif text-3xl text-alabaster">
                  {String(score).padStart(2, '0')}
                </span>
              </div>
              <div className="h-7 w-px bg-alabaster/10" />
              <div>
                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-subtle">
                  Best
                </span>
                <span className="mt-0.5 block font-serif text-3xl text-sand-light">
                  {String(bestScore).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="mt-5 flex w-full items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                className="flex-1 rounded-full bg-alabaster py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-void transition-opacity hover:opacity-90"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={handleReturnToGlobe}
                className="flex-1 rounded-full border border-alabaster/20 bg-transparent py-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-alabaster transition-colors hover:border-sand/50 hover:text-sand-light"
              >
                Globe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Pill: "Tap to beam" -> "Spin fast to play" -> Court Controls Hint */}
      <div className="pointer-events-none absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isGlobeMode ? (
            <motion.button
              key="globe-pill"
              type="button"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => {
                e.stopPropagation();
                handleTrigger();
              }}
              className={`pointer-events-auto group flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                isLight ? 'shadow-[0_4px_16px_rgba(0,0,0,0.08)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.65)]'
              } ${
                gamePhase === 'ready_to_spin'
                  ? fastSpinCount > 0
                    ? 'border-sand bg-obsidian/95 ring-2 ring-sand/45'
                    : 'border-sand bg-obsidian/95 ring-1 ring-sand/35'
                  : 'border-sand/35 bg-obsidian/90 hover:border-sand'
              } ${tapPulsing ? 'border-sand bg-sand/25 scale-105 ring-2 ring-sand/40' : ''}`}
              aria-label={
                gamePhase === 'ready_to_spin'
                  ? `Spin the globe fast three times repeatedly to play basketball (${fastSpinCount} of 3)`
                  : 'Tap to shoot telemetry beam'
              }
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
              </span>
              {gamePhase === 'ready_to_spin' ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-light font-medium whitespace-nowrap transition-colors group-hover:text-alabaster">
                    Spin fast to play
                  </span>
                  <span className="flex items-center gap-1" aria-hidden="true">
                    {[0, 1, 2].map((idx) => {
                      const lit = idx < fastSpinCount;
                      return (
                        <span
                          key={`spin-pip-${idx}`}
                          className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                            lit
                              ? 'bg-sand scale-110 shadow-[0_0_6px_rgba(229,199,123,0.9)]'
                              : 'border border-sand/45 bg-transparent opacity-60'
                          }`}
                        />
                      );
                    })}
                  </span>
                </span>
              ) : (
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-light font-medium transition-colors group-hover:text-alabaster">
                    Tap
                  </span>
                  <span className="font-mono text-[9px] text-ink-subtle">
                    to beam
                  </span>
                </>
              )}
            </motion.button>
          ) : gamePhase === 'playing' ? (
            <motion.div
              key="court-pill"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-full border border-alabaster/10 bg-obsidian/80 px-3 py-1 backdrop-blur-md"
            >
              <span className="font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.16em] text-ink-subtle whitespace-nowrap">
                Drag ← → to Aim · Swipe ↑ to Shoot
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
