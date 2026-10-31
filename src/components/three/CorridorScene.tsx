'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function MinimalistSculpture({ isLight }: { isLight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const packetRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const ringCRef = useRef<THREE.Mesh>(null);

  const { viewport } = useThree();
  const R = 1.32;
  // Outer ring diameter is 2 * (1.32 * 1.27) = 3.35 units; fit cleanly within viewport on all 4 sides
  const fitScale = Math.min(1, Math.min(viewport.width, viewport.height) / 3.46);

  const { cgpPos, lonPos, curve, arcGeo, dotPositions } = useMemo(() => {
    const cgp = latLonToVec3(22.3569, 91.7832, R);
    const lon = latLonToVec3(51.5074, -0.1278, R);

    const mid = cgp.clone().add(lon).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.26);
    const ctrl1 = cgp.clone().lerp(mid, 0.5).normalize().multiplyScalar(R * 1.18);
    const ctrl2 = lon.clone().lerp(mid, 0.5).normalize().multiplyScalar(R * 1.18);

    const bezier = new THREE.CatmullRomCurve3([cgp, ctrl1, mid, ctrl2, lon]);
    const tube = new THREE.TubeGeometry(bezier, 80, 0.0052, 8, false);

    // Fine architectural Fibonacci stipple
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      positions[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = R * Math.cos(phi);
      positions[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
    }

    return {
      cgpPos: cgp,
      lonPos: lon,
      curve: bezier,
      arcGeo: tube,
      dotPositions: positions,
    };
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      const targetY = -0.82 + Math.sin(t * 0.12) * 0.16 + pointer.x * 0.25;
      const targetX = 0.24 + pointer.y * 0.14;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.035);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.035);
    }

    if (packetRef.current) {
      const u = (t * 0.18) % 1;
      packetRef.current.position.copy(curve.getPointAt(u));
    }

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
        coreColor: '#E9E5DC',
        coreRoughness: 0.44,
        coreMetalness: 0.14,
        clearcoat: 0.62,
        clearcoatRoughness: 0.32,
        dotsColor: '#27272A',
        dotsOpacity: 0.28,
        arcColor: '#7C6643',
        arcOpacity: 0.85,
        beadColor: '#111113',
        cgpColor: '#846C4A',
        lonColor: '#111113',
        ringPrimary: '#18181B',
        ringAccent: '#846C4A',
        ringAOpacity: 0.17,
        ringBOpacity: 0.25,
        ringCOpacity: 0.11,
      }
    : {
        coreColor: '#0B0B0E',
        coreRoughness: 0.38,
        coreMetalness: 0.82,
        clearcoat: 0.75,
        clearcoatRoughness: 0.28,
        dotsColor: '#E2D7C1',
        dotsOpacity: 0.3,
        arcColor: '#C8B89A',
        arcOpacity: 0.72,
        beadColor: '#F4F3EF',
        cgpColor: '#C8B89A',
        lonColor: '#F4F3EF',
        ringPrimary: '#F4F3EF',
        ringAccent: '#C8B89A',
        ringAOpacity: 0.16,
        ringBOpacity: 0.19,
        ringCOpacity: 0.1,
      };

  return (
    <group scale={fitScale}>
      <group ref={groupRef}>
        {/* Matte Sculpted Core Sphere (Brushed Obsidian in Dark / Architectural Porcelain in Light) */}
        <mesh>
          <sphereGeometry args={[R * 0.99, 64, 64]} />
          <meshPhysicalMaterial
            color={palette.coreColor}
            roughness={palette.coreRoughness}
            metalness={palette.coreMetalness}
            clearcoat={palette.clearcoat}
            clearcoatRoughness={palette.clearcoatRoughness}
          />
        </mesh>

        {/* Ultra-Fine Surface Stipple */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.01}
            color={palette.dotsColor}
            transparent
            opacity={palette.dotsOpacity}
            sizeAttenuation
          />
        </points>

        {/* Delicate Chattogram <-> London Great-Circle Hairline Arc */}
        <mesh geometry={arcGeo}>
          <meshBasicMaterial color={palette.arcColor} transparent opacity={palette.arcOpacity} />
        </mesh>

        {/* Single Serene Light Bead */}
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshBasicMaterial color={palette.beadColor} />
        </mesh>

        {/* Minimalist Corridor Anchor Points */}
        <mesh position={cgpPos}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshBasicMaterial color={palette.cgpColor} />
        </mesh>
        <mesh position={lonPos}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshBasicMaterial color={palette.lonColor} />
        </mesh>

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

  return (
    <div className="relative h-full w-full cursor-grab active:cursor-grabbing">
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
        <MinimalistSculpture isLight={isLight} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.45}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>
    </div>
  );
};
