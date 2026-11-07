'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
const easeOutCubic = (x: number) => {
  const c = clamp01(x);
  return 1 - Math.pow(1 - c, 3);
};
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

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

function MinimalistSculpture({
  isLight,
  onRegisterTrigger,
}: {
  isLight: boolean;
  onRegisterTrigger?: (fn: () => void) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const ringCRef = useRef<THREE.Mesh>(null);

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
  const fitScale = Math.min(1, Math.min(viewport.width, viewport.height) / 3.46);

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

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      // 3.93 radians (~225 deg) brings London, Dubai, and Chattogram facing directly forward!
      const targetY = 3.93 + Math.sin(t * 0.08) * 0.18 + pointer.x * 0.25;
      const targetX = 0.22 + pointer.y * 0.14;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.035);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.035);
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
      arcMatRef.current.opacity = baseAlpha * (1 - dissolveP);
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
          packetGlowMatRef.current.opacity = (isLight ? 0.3 : 0.45) * Math.sin(pP * Math.PI);
        }
      }
    }

    // Origin: warm breathing beacon
    const launchKick = Math.sin(span(local, T.draw[0], T.draw[0] + 0.5) * Math.PI) * 0.28;
    const breath = 0.5 + 0.5 * Math.sin(t * 1.5);
    if (originHaloRef.current) originHaloRef.current.scale.setScalar(1.5 + breath * 0.8 + launchKick * 1.2);
    if (originHaloMatRef.current) {
      originHaloMatRef.current.opacity = (isLight ? 0.16 : 0.22) * (0.6 + breath * 0.4) + launchKick * 0.2;
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
      if (haloMat) haloMat.opacity = (isLight ? 0.08 : 0.12) + twinkle * 0.05 + flash * (isLight ? 0.38 : 0.58);
      if (coreMat) coreMat.opacity = 0.55 + twinkle * 0.18 + flash * 0.35;
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

  return (
    <group scale={fitScale}>
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
            <meshBasicMaterial color={palette.originCore} />
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
          <meshBasicMaterial color={palette.ringPrimary} transparent opacity={palette.ringAOpacity} />
        </mesh>
        <mesh ref={ringBRef}>
          <torusGeometry args={[R * 1.27, 0.0018, 16, 180]} />
          <meshBasicMaterial color={palette.ringAccent} transparent opacity={palette.ringBOpacity} />
        </mesh>
        <mesh ref={ringCRef}>
          <torusGeometry args={[R * 1.09, 0.0016, 16, 180]} />
          <meshBasicMaterial color={palette.ringPrimary} transparent opacity={palette.ringCOpacity} />
        </mesh>
      </group>
    </group>
  );
}

export const CorridorScene: React.FC<{ modeOverride?: ThemeMode }> = ({ modeOverride }) => {
  const { theme } = useTheme();
  const isLight = (modeOverride ?? theme) === 'light';
  const triggerFnRef = useRef<(() => void) | null>(null);
  const [tapPulsing, setTapPulsing] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTriggerTimeRef = useRef(0);

  const handleTrigger = () => {
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 200) return;
    lastTriggerTimeRef.current = now;
    sounds.playLeicaShutter();
    setTapPulsing(true);
    setTimeout(() => setTapPulsing(false), 300);
    triggerFnRef.current?.();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    // Tap detection: short tap/click without long orbit drag
    if (dx < 10 && dy < 10 && dt < 400) {
      handleTrigger();
    }
    pointerStartRef.current = null;
  };

  return (
    <div
      className="relative h-full w-full cursor-grab active:cursor-grabbing select-none touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      data-cursor="BEAM"
    >
      <Canvas
        camera={{ position: [0, 0.02, 5.15], fov: 39 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
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
          onRegisterTrigger={(fn) => {
            triggerFnRef.current = fn;
          }}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.45}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>

      {/* Catchy Floating "Tap" Micro-Pill */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTrigger();
          }}
          className={`pointer-events-auto group flex items-center gap-2 rounded-full border border-sand/35 bg-obsidian/90 px-3.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 hover:border-sand hover:scale-105 active:scale-95 ${
            tapPulsing ? 'border-sand bg-sand/25 scale-105 ring-2 ring-sand/40' : ''
          }`}
          aria-label="Tap to shoot telemetry beam"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-light font-medium transition-colors group-hover:text-alabaster">
            Tap
          </span>
          <span className="font-mono text-[9px] text-ink-subtle">
            to beam
          </span>
        </button>
      </div>
    </div>
  );
};
