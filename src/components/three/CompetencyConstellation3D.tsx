'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { TrackballControls, Line, Html } from '@react-three/drei';
import { sounds } from '@/lib/sound';

// Keep a single depth-sorted z-index band across all nodes so front nodes naturally occlude rear nodes regardless of selection state.
const UNIFORM_HTML_Z_INDEX_RANGE: [number, number] = [16000000, 100];

export interface SkillConstellationNode {
id: string;
index: string;
label: string;
shortLabel: string;
category: 'commercial' | 'delivery' | 'strategy';
position: [number, number, number];
proofRole: string;
proofDossier: string;
proofCredential?: string;
proofCredentialId?: string;
auditedMetric: string;
evidenceSummary: string;
connectedIds: string[];
}

export const SKILL_NODES: SkillConstellationNode[] = [
{
id: 'stakeholder-brm',
index: '01',
label: 'Stakeholder & Client Relationship Mgmt',
shortLabel: 'Client & BRM',
category: 'commercial',
position: [-2.18, 0.5, -0.17],
proofRole: 'Business Relationship Manager @ CompileQ',
proofDossier: 'Dossier 01 · Automation360° UK Hospitality',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: '+50% Client Satisfaction & Retention',
evidenceSummary: 'Led commercial scoping, executive quarterly business reviews, and multi-site retention across Chelsea, Soho, and Central London accounts.',
connectedIds: ['cross-border', 'budgeting', 'strategic-planning', 'business-analysis', 'risk-mgmt'],
},
{
id: 'project-mgmt',
index: '02',
label: 'Project Management',
shortLabel: 'Project Mgmt',
category: 'delivery',
position: [0.08, 1.22, -0.73],
proofRole: 'Technical Project Manager @ CompileQ',
proofDossier: 'Dossier 02 · Cross-Border Agile Delivery Engine',
proofCredential: 'UC Davis · Cross-Cultural Management',
proofCredentialId: 'uc-davis',
auditedMetric: '+50% Project Delivery Velocity',
evidenceSummary: 'Orchestrated sprint cadences, dual-stage QA, and release management connecting London discovery with offshore execution.',
connectedIds: ['risk-mgmt', 'team-leadership', 'schedule-workflow', 'agentic-ai', 'business-analysis'],
},
{
id: 'strategic-planning',
index: '03',
label: 'Strategic Planning',
shortLabel: 'Strategy',
category: 'strategy',
position: [1.88, 0.49, 0.67],
proofRole: 'Business Relationship Manager & Project Leader',
proofDossier: 'Dossier 03 · Qamla Operational Architecture',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: 'Long-term commercial roadmap execution',
evidenceSummary: 'Formulated multi-quarter product roadmaps and strategic business development pipelines for UK hospitality technology clients.',
connectedIds: ['stakeholder-brm', 'budgeting', 'business-analysis', 'agentic-ai', 'problem-solving'],
},
{
id: 'talent-acquisition',
index: '04',
label: 'Talent Acquisition',
shortLabel: 'Talent & HR',
category: 'delivery',
position: [-1.01, -1.12, -0.63],
proofRole: 'Operations & Admin Lead @ CompileQ / Qamla Ltd',
proofDossier: 'Dossier 03 · Qamla Operational Architecture',
proofCredential: 'Wadhwani Foundation · Employability & Leadership',
proofCredentialId: 'wadhwani',
auditedMetric: '+25% HR & Team Retention Uplift',
evidenceSummary: 'Built and onboarded high-performance technical squads, developer talent pipelines, and cross-functional design teams.',
connectedIds: ['team-leadership', 'cross-border', 'budgeting', 'mentoring-comms'],
},
{
id: 'risk-mgmt',
index: '05',
label: 'Risk Management',
shortLabel: 'Risk & SLA',
category: 'delivery',
position: [-1.05, 0.3, -1.18],
proofRole: 'Business Relationship Manager @ CompileQ',
proofDossier: 'Dossier 01 · Automation360° UK Hospitality',
proofCredential: 'Vanderbilt University · Agentic AI for Leaders',
proofCredentialId: 'vanderbilt-agentic-ai',
auditedMetric: 'Zero critical SLA breaches',
evidenceSummary: 'Authored comprehensive risk registers, mitigation contingency plans, and automated escalation triggers across live deployments.',
connectedIds: ['stakeholder-brm', 'project-mgmt', 'schedule-workflow', 'compliance-monitoring', 'problem-solving'],
},
{
id: 'budgeting',
index: '06',
label: 'Budgeting, Cost Control & Resource Allocation',
shortLabel: 'P&L & Budget',
category: 'commercial',
position: [-1.73, -0.67, 0.67],
proofRole: 'Business Relationship Manager @ CompileQ',
proofDossier: 'Dossier 02 · Cross-Border Agile Delivery Engine',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: '100% on-budget milestone governance',
evidenceSummary: 'Managed commercial project budgets, hardware quotes, and resource burn rates with rigorous fiscal governance.',
connectedIds: ['stakeholder-brm', 'strategic-planning', 'talent-acquisition', 'purchasing-procurement'],
},
{
id: 'purchasing-procurement',
index: '07',
label: 'Purchasing & Procurement',
shortLabel: 'Procurement',
category: 'commercial',
position: [0.66, -1.32, -0.4],
proofRole: 'Business Relationship Manager @ CompileQ',
proofDossier: 'Dossier 01 · Automation360° UK Hospitality',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: 'Vendor contract SLA enforcement',
evidenceSummary: 'Negotiated vendor supply contracts, EPOS hardware staging purchases (C-KIOSK, DOJO EMV), and cloud licensing terms.',
connectedIds: ['budgeting', 'compliance-monitoring', 'problem-solving'],
},
{
id: 'team-leadership',
index: '08',
label: 'Team Leadership',
shortLabel: 'Leadership',
category: 'delivery',
position: [0.8, -0.37, 1.22],
proofRole: 'Project Leader & Squad Lead @ CompileQ',
proofDossier: 'Dossier 02 · Cross-Border Agile Delivery Engine',
proofCredential: 'Wadhwani Foundation · Employability & Leadership',
proofCredentialId: 'wadhwani',
auditedMetric: 'Multi-squad cross-border leadership',
evidenceSummary: 'Fostered a culture of psychological safety, continuous sprint improvement, and operational discipline across engineering squads.',
connectedIds: ['project-mgmt', 'talent-acquisition', 'mentoring-comms', 'schedule-workflow'],
},
{
id: 'cross-border',
index: '09',
label: 'Cross-Functional Collaboration',
shortLabel: 'London ↔ BD',
category: 'commercial',
position: [-0.97, 1.28, 0.31],
proofRole: 'BRM & Project Leader (London E1 ↔ Chattogram)',
proofDossier: 'Dossier 02 · Cross-Border Agile Delivery Engine',
proofCredential: 'UC Davis · Cross-Cultural Communication',
proofCredentialId: 'uc-davis',
auditedMetric: '+30% cross-border communication clarity',
evidenceSummary: 'Harmonized London executive business context with Bangladesh engineering sprints, turning a 6-hour offset into a continuous delivery engine.',
connectedIds: ['stakeholder-brm', 'talent-acquisition', 'mentoring-comms'],
},
{
id: 'schedule-workflow',
index: '10',
label: 'Schedule & Workflow Management',
shortLabel: 'Sprint Cadence',
category: 'delivery',
position: [0.41, -0.15, -1.32],
proofRole: 'Technical PM @ CompileQ',
proofDossier: 'Dossier 02 · Cross-Border Agile Delivery Engine',
proofCredential: 'UC Davis · Cross-Cultural Management',
proofCredentialId: 'uc-davis',
auditedMetric: 'Zero milestone slippages',
evidenceSummary: 'Architected ClickUp & Jira sprint backlogs, release trains, and milestone gating for reliable, on-time client handoffs.',
connectedIds: ['project-mgmt', 'risk-mgmt', 'team-leadership', 'problem-solving', 'agentic-ai'],
},
{
id: 'problem-solving',
index: '11',
label: 'Advanced Problem Solving',
shortLabel: 'Incident Triage',
category: 'strategy',
position: [2.01, -0.62, -0.39],
proofRole: 'BRM & Technical PM @ CompileQ',
proofDossier: 'Dossier 01 · Automation360° UK Hospitality',
proofCredential: 'Bangladesh University of Frontier Technology · B.Engg.',
proofCredentialId: 'uftb-degree',
auditedMetric: 'Rapid root-cause resolution',
evidenceSummary: 'Spearheaded root-cause triage during peak Friday rush hospitality POS drop simulations and complex data discrepancy audits.',
connectedIds: ['strategic-planning', 'risk-mgmt', 'purchasing-procurement', 'schedule-workflow', 'agentic-ai'],
},
{
id: 'compliance-monitoring',
index: '12',
label: 'Documentation & Compliance Monitoring',
shortLabel: 'Compliance',
category: 'delivery',
position: [-0.33, -1.21, 0.72],
proofRole: 'BRM & Admin Lead @ CompileQ / Qamla Ltd',
proofDossier: 'Dossier 03 · Qamla Operational Architecture',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: '100% audit-ready project documentation',
evidenceSummary: 'Authored comprehensive client handoff documentation, Gherkin acceptance criteria, and corporate compliance logs.',
connectedIds: ['risk-mgmt', 'purchasing-procurement', 'business-analysis'],
},
{
id: 'business-analysis',
index: '13',
label: 'Competitive & Business Analysis',
shortLabel: 'Market Analysis',
category: 'strategy',
position: [0.5, 1.16, 0.75],
proofRole: 'Business Relationship Manager @ CompileQ',
proofDossier: 'Dossier 01 · Automation360° UK Hospitality',
proofCredential: 'University of London · International Business',
proofCredentialId: 'u-london',
auditedMetric: 'Data-backed B2B scoping',
evidenceSummary: 'Evaluated UK hospitality market benchmarks, vendor differentiation, and unit-economics models to guide client expansion.',
connectedIds: ['stakeholder-brm', 'project-mgmt', 'strategic-planning', 'compliance-monitoring', 'mentoring-comms'],
},
{
id: 'agentic-ai',
index: '14',
label: 'Agentic AI & Intelligent Automation',
shortLabel: 'Agentic AI',
category: 'strategy',
position: [1.5, 0.76, -0.76],
proofRole: 'BRM & AI Workflow Architect @ CompileQ',
proofDossier: 'Dossier 04 · Retail Intelligence & EdTech Systems',
proofCredential: 'Vanderbilt University · Agentic AI for Leaders',
proofCredentialId: 'vanderbilt-agentic-ai',
auditedMetric: 'Vanderbilt Agentic AI Certified',
evidenceSummary: 'Applies frontier LLMs (Gemini, Claude, Antigravity, Kimi) and agentic workflows to automate client briefs, QA triage, and operational reporting.',
connectedIds: ['project-mgmt', 'strategic-planning', 'schedule-workflow', 'problem-solving'],
},
{
id: 'mentoring-comms',
index: '15',
label: 'Executive Mentoring & Cross-Cultural Comms',
shortLabel: 'Mentoring & Comms',
category: 'delivery',
position: [-0.61, 0.19, 1.29],
proofRole: "Tutor @ AB's Edulab & Squad Lead @ CompileQ",
proofDossier: 'Dossier 04 · Retail Intelligence & EdTech Systems',
proofCredential: 'UC Davis · Cross-Cultural Communication',
proofCredentialId: 'uc-davis',
auditedMetric: '5+ yrs coaching · Bilingual EN/BN',
evidenceSummary: 'Combined 5+ years of high-stakes academic coaching with bilingual (Bengali native, English fluent) stakeholder empathy and team mentorship.',
connectedIds: ['talent-acquisition', 'team-leadership', 'cross-border', 'business-analysis'],
},
];

interface ConstellationSceneProps {
selectedNodeId: string;
onSelectNode: (node: SkillConstellationNode) => void;
filterCategory: 'all' | 'commercial' | 'delivery' | 'strategy';
}

interface ConstellationSceneProps {
  selectedNodeId: string;
  onSelectNode: (node: SkillConstellationNode) => void;
  filterCategory: 'all' | 'commercial' | 'delivery' | 'strategy';
  htmlPortalRef: React.RefObject<HTMLDivElement | null>;
  isDraggingRef: React.MutableRefObject<boolean>;
  focusRequestTick: number;
  onTriggerFocus: () => void;
}

const ConstellationScene: React.FC<ConstellationSceneProps> = ({
  selectedNodeId,
  onSelectNode,
  filterCategory,
  htmlPortalRef,
  isDraggingRef,
  focusRequestTick,
  onTriggerFocus,
}) => {
const groupRef = useRef<THREE.Group>(null);
const pulseDotRefs = useRef<Array<THREE.Mesh | null>>([]);
const pulseTimeRef = useRef<number>(0);
const pointerDownRef = useRef<{ x: number; y: number; nodeId: string } | null>(null);
const needsFocusRef = useRef<boolean>(selectedNodeId !== SKILL_NODES[0].id);
const targetQuatRef = useRef<THREE.Quaternion | null>(null);
const pauseDriftUntilRef = useRef<number>(0);
const isFirstSelectionEffectRef = useRef<boolean>(true);

const mathScratch = useMemo(
  () => ({
    cameraDir: new THREE.Vector3(),
    nodeLocalDir: new THREE.Vector3(),
    nodeWorldDir: new THREE.Vector3(),
    deltaQuat: new THREE.Quaternion(),
    targetQuat: new THREE.Quaternion(),
    driftQuat: new THREE.Quaternion(),
    fallbackAxis: new THREE.Vector3(),
    worldUp: new THREE.Vector3(0, 1, 0),
  }),
  []
);

useEffect(() => {
  if (isFirstSelectionEffectRef.current) {
    isFirstSelectionEffectRef.current = false;
    return;
  }
  needsFocusRef.current = true;
}, [selectedNodeId, focusRequestTick]);

const selectedNode = useMemo(
() => SKILL_NODES.find((n) => n.id === selectedNodeId) || SKILL_NODES[0],
[selectedNodeId]
);

  const isCompactViewport = useThree((state) => state.size.width < 640);

  const palette = {
    activeNode: '#F6F5F0',
    connectedNode: '#C8B89A',
    dimNode: '#4A4A52',
    activeEdge: '#C8B89A',
    idleEdge: '#323238',
    pulseColor: '#E2D7C1',
  };

  const { allEdges, activeEdges } = useMemo(() => {
    const pairs: Array<{
      id: string;
      from: SkillConstellationNode;
      to: SkillConstellationNode;
      isActive: boolean;
    }> = [];
    const seen = new Set<string>();

    SKILL_NODES.forEach((node) => {
      node.connectedIds.forEach((targetId) => {
        const key = [node.id, targetId].sort().join('--');
        if (seen.has(key)) return;
        seen.add(key);
        const target = SKILL_NODES.find((n) => n.id === targetId);
        if (!target) return;
        const isActive = node.id === selectedNode.id || target.id === selectedNode.id;
        pairs.push({
          id: key,
          from: node,
          to: target,
          isActive,
        });
      });
    });

    return {
      allEdges: pairs,
      activeEdges: pairs.filter((p) => p.isActive),
    };
  }, [selectedNode]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    pulseTimeRef.current = (pulseTimeRef.current + dt * 0.35) % 1;

    if (groupRef.current) {
      if (needsFocusRef.current) {
        needsFocusRef.current = false;
        isDraggingRef.current = false;

        mathScratch.cameraDir.copy(state.camera.position).normalize();
        mathScratch.nodeLocalDir.set(...selectedNode.position);

        if (mathScratch.nodeLocalDir.lengthSq() > 1e-6) {
          mathScratch.nodeLocalDir.normalize();
          mathScratch.nodeWorldDir
            .copy(mathScratch.nodeLocalDir)
            .applyQuaternion(groupRef.current.quaternion)
            .normalize();

          const dot = mathScratch.nodeWorldDir.dot(mathScratch.cameraDir);
          if (dot < -0.999) {
            mathScratch.fallbackAxis
              .set(0, 1, 0)
              .applyQuaternion(state.camera.quaternion)
              .normalize();
            mathScratch.deltaQuat.setFromAxisAngle(mathScratch.fallbackAxis, Math.PI);
          } else {
            mathScratch.deltaQuat.setFromUnitVectors(
              mathScratch.nodeWorldDir,
              mathScratch.cameraDir
            );
          }

          mathScratch.targetQuat
            .copy(mathScratch.deltaQuat)
            .multiply(groupRef.current.quaternion)
            .normalize();
          targetQuatRef.current = mathScratch.targetQuat.clone();
          pauseDriftUntilRef.current = state.clock.elapsedTime + 2.8;
        }
      }

      if (isDraggingRef.current) {
        targetQuatRef.current = null;
      } else if (targetQuatRef.current) {
        const alpha = 1 - Math.exp(-dt * 5.5);
        groupRef.current.quaternion.slerp(targetQuatRef.current, alpha);
        if (groupRef.current.quaternion.angleTo(targetQuatRef.current) < 0.004) {
          groupRef.current.quaternion.copy(targetQuatRef.current);
          targetQuatRef.current = null;
        }
      } else if (state.clock.elapsedTime >= pauseDriftUntilRef.current) {
        mathScratch.driftQuat.setFromAxisAngle(mathScratch.worldUp, dt * 0.035);
        groupRef.current.quaternion.premultiply(mathScratch.driftQuat).normalize();
      }
    }

    // Animate golden pulse particles along active synaptic threads
    activeEdges.forEach((edge, idx) => {
      const dot = pulseDotRefs.current[idx];
      if (!dot) return;
      const start = edge.from.id === selectedNode.id ? edge.from.position : edge.to.position;
      const end = edge.from.id === selectedNode.id ? edge.to.position : edge.from.position;
      const t = (pulseTimeRef.current + idx * 0.18) % 1;
      dot.position.set(
        THREE.MathUtils.lerp(start[0], end[0], t),
        THREE.MathUtils.lerp(start[1], end[1], t),
        THREE.MathUtils.lerp(start[2], end[2], t)
      );
    });
  });

  return (
    <group ref={groupRef}>
      {/* 3D Threaded Synaptic Edges (Luminous & Structural) */}
      {allEdges.map((edge) => {
        const inCategory =
          filterCategory === 'all' ||
          edge.from.category === filterCategory ||
          edge.to.category === filterCategory;

        return (
          <Line
            key={edge.id}
            points={[edge.from.position, edge.to.position]}
            color={edge.isActive ? palette.activeEdge : palette.idleEdge}
            lineWidth={edge.isActive ? 1.8 : 0.8}
            transparent
            opacity={edge.isActive ? 0.92 : inCategory ? 0.32 : 0.12}
          />
        );
      })}

      {/* Traveling Golden Pulse Particles Along Active Synaptic Threads */}
      {activeEdges.map((edge, idx) => (
        <mesh
          key={`pulse-${edge.id}`}
          ref={(el) => {
            pulseDotRefs.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color={palette.pulseColor} />
        </mesh>
      ))}

      {/* 3D Shaded Celestial Spheres & Smaller Crisp Spatial Labels */}
      {SKILL_NODES.map((node) => {
        const isSelected = node.id === selectedNode.id;
        const isNeighbor =
          !isSelected &&
          (selectedNode.connectedIds.includes(node.id) ||
            node.connectedIds.includes(selectedNode.id));
        const matchesCategory = filterCategory === 'all' || node.category === filterCategory;

        const radius = isSelected ? 0.14 : isNeighbor ? 0.11 : 0.085;
        const hitRadius = Math.max(radius * 2.5, 0.25);
        const nodeColor = isSelected
          ? palette.activeNode
          : isNeighbor || matchesCategory
          ? palette.connectedNode
          : palette.dimNode;

        return (
          <group key={node.id} position={node.position}>
            {/* Invisible generous hit-target sphere for effortless mouse & touch selection without blocking orbit drags */}
            <mesh
              onPointerDown={(e) => {
                pointerDownRef.current = { x: e.clientX, y: e.clientY, nodeId: node.id };
              }}
              onPointerUp={(e) => {
                const down = pointerDownRef.current;
                pointerDownRef.current = null;
                if (!down || down.nodeId !== node.id) return;
                const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
                if (moved <= 8) {
                  e.stopPropagation();
                  sounds.playPrismSnap();
                  onTriggerFocus();
                  onSelectNode(node);
                }
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[hitRadius, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Shaded 3D Interactive Celestial Sphere */}
            <mesh>
              <sphereGeometry args={[radius, 20, 20]} />
              <meshStandardMaterial
                color={nodeColor}
                roughness={0.25}
                metalness={0.35}
                transparent
                opacity={matchesCategory || isSelected || isNeighbor ? 1 : 0.35}
              />
            </mesh>

            {/* Glowing Golden Ring ONLY for the Active Selected Node */}
            {isSelected && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius + 0.035, radius + 0.06, 32]} />
                <meshBasicMaterial
                  color={palette.activeEdge}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            )}

            {/* Floating Spatial Label: Uniform 3D depth sorting across all nodes (front occludes back) */}
            <Html
              position={[0, radius + 0.16, 0]}
              center
              distanceFactor={isCompactViewport ? 6.8 : 9.4}
              zIndexRange={UNIFORM_HTML_Z_INDEX_RANGE}
              portal={htmlPortalRef as React.RefObject<HTMLElement>}
            >
              <button
                type="button"
                data-cursor=""
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playPrismSnap();
                  onTriggerFocus();
                  onSelectNode(node);
                }}
                className={`pointer-events-auto touch-manipulation whitespace-nowrap rounded border px-2 py-0.5 sm:px-2.5 font-mono text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sand bg-sand text-obsidian font-semibold shadow-[0_0_14px_rgba(200,184,154,0.5)] scale-105'
                    : isNeighbor
                    ? 'border-sand/60 bg-void/95 text-sand-light hover:border-sand hover:text-sand shadow-[0_0_10px_rgba(200,184,154,0.18)] backdrop-blur-md'
                    : matchesCategory
                    ? 'border-alabaster/25 bg-void/90 text-alabaster hover:border-sand hover:text-sand backdrop-blur-md'
                    : 'border-alabaster/10 bg-void/60 text-ink-subtle opacity-40 blur-[0.4px]'
                }`}
              >
                {node.index} · {node.shortLabel}
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

const CameraFovSync: React.FC<{ fov: number }> = ({ fov }) => {
  const { camera, size } = useThree();
  useEffect(() => {
    const isCompact = size.width < 640;
    const aspect = size.width / Math.max(size.height, 1);
    const refAspect = isCompact ? 1.16 : 1;
    const targetFov =
      aspect < refAspect
        ? THREE.MathUtils.clamp(
            THREE.MathUtils.radToDeg(
              2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (refAspect / Math.max(aspect, 0.68)))
            ),
            fov,
            76
          )
        : fov;

    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov, size.width, size.height]);
  return null;
};

interface CompetencyConstellation3DProps {
  selectedNode: SkillConstellationNode;
  onSelectNode: (node: SkillConstellationNode) => void;
  filterCategory: 'all' | 'commercial' | 'delivery' | 'strategy';
}

export const CompetencyConstellation3D: React.FC<CompetencyConstellation3DProps> = ({
  selectedNode,
  onSelectNode,
  filterCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const htmlPortalRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [focusRequestTick, setFocusRequestTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  const handleTriggerFocus = () => {
    setFocusRequestTick((tick) => tick + 1);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      ref={containerRef}
      data-cursor="ORBIT"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="relative h-[380px] sm:h-[560px] lg:h-[720px] w-full overflow-hidden select-none bg-transparent"
    >
      {/* Dedicated empty portal root so Drei <Html> never mutates React-managed Canvas divs */}
      <div
        ref={htmlPortalRef}
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      />

      {mounted && (
        <Canvas
          key="constellation-trackball-v1"
          camera={{ position: [0, 0.2, 5.8], fov: 56 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'default', antialias: true, alpha: true }}
          className="bg-transparent"
          onDragStart={(e) => e.preventDefault()}
        >
          <CameraFovSync fov={56} />
          <ambientLight intensity={1.1} />
          <pointLight position={[6, 6, 6]} intensity={1.2} />
          <pointLight position={[-6, -4, -4]} intensity={0.5} />
          <ConstellationScene
            selectedNodeId={selectedNode.id}
            onSelectNode={onSelectNode}
            filterCategory={filterCategory}
            htmlPortalRef={htmlPortalRef}
            isDraggingRef={isDraggingRef}
            focusRequestTick={focusRequestTick}
            onTriggerFocus={handleTriggerFocus}
          />
          <TrackballControls
            noZoom
            noPan
            rotateSpeed={1.8}
            dynamicDampingFactor={0.08}
            onStart={() => {
              isDraggingRef.current = true;
            }}
            onEnd={() => {
              isDraggingRef.current = false;
            }}
          />
        </Canvas>
      )}

      {/* Subtle Corner Status Overlays (Properly Padded from Edges) */}
      <div className="pointer-events-none absolute left-3 top-2 z-20 font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-ink-subtle/75">
        <span className="sm:hidden">Drag to Orbit · Tap Node to Thread</span>
        <span className="hidden sm:inline">3D Constellation · Drag to Orbit · Click to Pulse</span>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 z-20 font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-sand-light">
        <span>Active Node: {selectedNode.index} · {selectedNode.shortLabel}</span>
      </div>
    </div>
  );
};