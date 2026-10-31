export type PersonaType = 'all' | 'brm' | 'pm';

export interface CaseStudy {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  client: string;
  location: string;
  year: string;
  persona: 'brm' | 'pm' | 'both';
  headlineMetric: string;
  headlineMetricLabel: string;
  secondaryMetrics: { value: string; label: string }[];
  accentColor: string;
  challenge: string;
  strategy: string;
  architectureFlow: string[];
  outcomes: string[];
  stack: string[];
}

export interface CorridorAccount {
  id: string;
  name: string;
  location: string;
  sector: string;
  commercialModel: string;
  ecosystem: string[];
  summary: string;
}

export interface CareerMilestone {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  persona: 'brm' | 'pm' | 'both';
  highlightMetric: string;
  summary: string;
  achievements: string[];
  tags: string[];
}

export const IMPACT_METRICS = [
  {
    id: 'retention',
    value: 50,
    suffix: '%',
    prefix: '+',
    label: 'Client Satisfaction & Retention',
    sublabel: 'CompileQ UK B2B Portfolio',
    persona: 'brm' as const,
  },
  {
    id: 'velocity',
    value: 50,
    suffix: '%',
    prefix: '+',
    label: 'Project Delivery Efficiency',
    sublabel: 'Agile & Risk Mitigation Systems',
    persona: 'pm' as const,
  },
  {
    id: 'hr',
    value: 25,
    suffix: '%',
    prefix: '+',
    label: 'HR & Team Retention Uplift',
    sublabel: 'Cross-Functional Alignment',
    persona: 'brm' as const,
  },
  {
    id: 'ops',
    value: 30,
    suffix: '%',
    prefix: '+',
    label: 'Streamlined Communication',
    sublabel: 'Qamla Ltd (+25% Smoother Admin)',
    persona: 'pm' as const,
  },
];

export const CORRIDOR_ACCOUNTS: CorridorAccount[] = [
  {
    id: 'la-mia-mamma',
    name: 'La Mia Mamma Ltd.',
    location: '247A Kings Road, Chelsea, London SW3',
    sector: 'Flagship Italian Dining Group',
    commercialModel: '£2,802 Upfront Rollout + £117/mo SaaS Retainer',
    ecosystem: ['Automation360°', '15" C-KIOSK', 'Cibo m-POS', 'KDS', 'DOJO Payments', 'StockTake-Online'],
    summary:
      'Architected end-to-end commercial service quoting and multi-device EPOS/KDS automation rollout for Chelsea flagship venue.',
  },
  {
    id: 'primitivo',
    name: 'Primitivo London',
    location: '42 Cranbourn St, Leicester Square, London',
    sector: 'West End Hospitality',
    commercialModel: '£1,395 Onboarding + £97/mo Recurring SLA',
    ecosystem: ['Web & Brand Ecosystem', 'EPOS Integration', 'SLA Support', 'Digital Menus'],
    summary:
      'Delivered commercial scoping, digital presence, and ongoing monthly service-level retention in central West End corridor.',
  },
  {
    id: 'little-italy',
    name: 'Little Italy Soho',
    location: '6-8 Irving St, Soho, London',
    sector: 'Iconic Soho Restaurant',
    commercialModel: '£1,395 Initial + £97/mo Managed Ecosystem',
    ecosystem: ['Hostinger Cloud', 'DNS Architecture', 'WordPress', 'Automation360°'],
    summary:
      'Managed custom domain/DNS infrastructure (littleitalydine.uk), digital dining touchpoints, and recurring B2B relationship.',
  },
  {
    id: 'little-sicily',
    name: 'Little Sicily Westminster',
    location: 'London SW1A 2DD',
    sector: 'Central London Dining',
    commercialModel: '£396 Rapid Deployment + £97/mo Retainer',
    ecosystem: ['Rapid Onboarding', 'Digital Ordering', 'Client Retention SLA'],
    summary:
      'Executed low-friction rapid onboarding model converting initial deployment into sticky monthly recurring SaaS revenue.',
  },
  {
    id: 'qamla',
    name: 'Qamla Ltd (UK)',
    location: 'Unit-B15, 129 Mile End Rd, London E1 4BG',
    sector: 'UK Hospitality & Recruitment Platform',
    commercialModel: 'Internal Operations & Brand Infrastructure',
    ecosystem: ['Process Architecture', 'Corporate Governance', 'Google Workspace', 'Stakeholder Ops'],
    summary:
      'Streamlined cross-border scheduling, documentation, and executive communications by +30% across London & Bangladesh teams.',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'automation-360',
    index: '01',
    title: 'Automation360° UK Hospitality Rollout',
    subtitle: 'B2B Commercial Structuring, EPOS/KDS Deployment & Recurring Retainer Growth',
    client: 'CompileQ · London Hospitality Portfolio',
    location: 'London, UK (SW3 · WC2 · SW1A)',
    year: '2023 — Present',
    persona: 'brm',
    headlineMetric: '+50%',
    headlineMetricLabel: 'Client Satisfaction & Retention',
    secondaryMetrics: [
      { value: '4+', label: 'Central London Venues' },
      { value: '£2.8K+', label: 'Flagship Deal Structuring' },
      { value: '+25%', label: 'Team Retention Uplift' },
    ],
    accentColor: '#E5C77B',
    challenge:
      'High-volume London restaurants faced fragmented point-of-sale hardware, manual stocktaking, DNS/web downtime, and disconnected vendor support across time zones.',
    strategy:
      'Unified hardware, software, web hosting, and recurring SLA support into CompileQ’s "Automation360°" commercial framework—pairing transparent upfront CAPEX quoting with predictable monthly OPEX retainers.',
    architectureFlow: [
      'Discovery & Commercial Quoting (La Mia Mamma, Primitivo, Little Italy, Little Sicily)',
      'Cloud & DNS Provisioning (Hostinger Cloud Professional + Custom UK Domains)',
      'Hardware/SaaS Integration (C-KIOSK, Cibo m-POS, KDS, DOJO T+3, StockTake-Online)',
      'Executive Account Governance & Proactive SLA Retention Reviews',
    ],
    outcomes: [
      'Achieved a 50% increase in customer satisfaction and multi-quarter B2B retention.',
      'Converted one-off web/IT engagements into predictable £97–£117/mo recurring retainers.',
      'Strengthened internal delivery morale, contributing to a 25% improvement in HR retention.',
    ],
    stack: ['Stakeholder Management', 'Commercial Quoting', 'Hostinger Ecosystem', 'WordPress', 'ClickUp', 'Jira'],
  },
  {
    id: 'agile-velocity',
    index: '02',
    title: 'Cross-Border Agile Delivery Engine',
    subtitle: 'Workflow Re-Engineering & Risk Mitigation Across Distributed Engineering/Design Teams',
    client: 'CompileQ Ltd',
    location: 'London E1 ↔ Chattogram',
    year: '2023 — 2024',
    persona: 'pm',
    headlineMetric: '+50%',
    headlineMetricLabel: 'Delivery Efficiency Gain',
    secondaryMetrics: [
      { value: '100%', label: 'On-Budget Execution' },
      { value: 'Zero', label: 'Critical SLA Breaches' },
      { value: 'GMT+6/0', label: 'Async Corridor Sync' },
    ],
    accentColor: '#6E7BF2',
    challenge:
      'Distributed developers, brand identity designers, and UK commercial leads experienced handoff bottlenecks, scope creep, and timezone friction between Bangladesh and London.',
    strategy:
      'Implemented structured sprint governance in Jira and ClickUp with explicit risk registers, clear acceptance criteria, and asynchronous daily checkpoints.',
    architectureFlow: [
      'Scope Decomposition & Risk Register Modeling',
      'Jira / ClickUp Sprint Boards Across Frontend, Backend & Brand Design',
      'Automated QA Checklists & Budget/Resource Tracking',
      'Executive Stakeholder Demos & Retrospectives',
    ],
    outcomes: [
      'Elevated end-to-end project delivery efficiency by 50% while staying strictly within budget.',
      'Eliminated cross-timezone handoff ambiguity between UI/brand designers and engineers.',
      'Earned rapid promotion from Project Manager to Business Relationship Manager within 7 months.',
    ],
    stack: ['Jira', 'ClickUp', 'Risk Management', 'Budgeting & Cost Control', 'Cross-Functional Leadership'],
  },
  {
    id: 'qamla-ops',
    index: '03',
    title: 'Qamla Operational Architecture',
    subtitle: 'Streamlining UK Recruitment & Hospitality Administration Systems',
    client: 'Qamla Ltd (www.qamla.co.uk)',
    location: '129 Mile End Rd, London E1 4BG',
    year: '2022 — 2023',
    persona: 'brm',
    headlineMetric: '+30%',
    headlineMetricLabel: 'Streamlined Communication',
    secondaryMetrics: [
      { value: '+25%', label: 'Smoother Administration' },
      { value: '18 mos', label: 'Foundational Tenure' },
      { value: 'UK B2B', label: 'Hospitality Staffing Ops' },
    ],
    accentColor: '#10B981',
    challenge:
      'Rapidly growing UK hospitality staffing and business operations required standardized documentation, scheduling precision, and faster multi-party communication.',
    strategy:
      'Centralized corporate documentation templates, executive scheduling pipelines, and compliance monitoring across Google Workspace and Microsoft Suite.',
    architectureFlow: [
      'Audit of Administrative & Communication Bottlenecks',
      'Standardized Document Vaults, Proposals & Brand Handover Workflows',
      'Unified Executive Scheduling & Stakeholder Routing',
      'Continuous Process Improvement Loops',
    ],
    outcomes: [
      'Accelerated internal and client-facing communication velocity by 30%.',
      'Delivered 25% smoother day-to-day administrative execution across UK operations.',
      'Built the operational foundation that scaled into CompileQ project and client leadership.',
    ],
    stack: ['Google Workspace', 'Microsoft Suite', 'Documentation & Compliance', 'Schedule & Workflow Mgmt', 'Canva'],
  },
  {
    id: 'edtech-analytics',
    index: '04',
    title: 'Retail Intelligence & EdTech Systems',
    subtitle: 'Interdisciplinary Engineering, Data Visualization & Digital Forensics',
    client: 'BUFT (formerly BSMRDU) · Engineering Research',
    location: 'Bangladesh',
    year: '2019 — 2024',
    persona: 'pm',
    headlineMetric: '3.40',
    headlineMetricLabel: 'B.Engg. CGPA (5.00 HSC)',
    secondaryMetrics: [
      { value: 'Python', label: 'Pandas & Plotly Engine' },
      { value: 'Autopsy', label: 'Digital Forensics' },
      { value: 'ICTE', label: 'Web & Cloud Systems' },
    ],
    accentColor: '#F59E0B',
    challenge:
      'Modern organizations need leaders who understand both human behavioral/educational psychology and raw data, cloud economics, and software engineering.',
    strategy:
      'Combined interdisciplinary B.Engg. coursework in Educational Technology & Engineering with practical retail data visualization (Supermart Analytics), web systems, and forensic tooling.',
    architectureFlow: [
      'Data Ingestion & Cleaning (Python, NumPy, Pandas)',
      'Interactive Multi-Dimensional Visualization (Plotly Express)',
      'Web & Cloud Architecture Labs + Digital Forensic Analysis',
      'Strategic Business & Pedagogical Synthesis',
    ],
    outcomes: [
      'Graduated with a 3.40 CGPA in B.Engg. (following a perfect 5.00 GPA in HSC Science at Chittagong College).',
      'Developed analytical fluency bridging raw code/data and executive decision-making.',
      'Applied instructional clarity from 5+ years tutoring at AB’s Edulab directly to technical team mentorship.',
    ],
    stack: ['Python (Pandas, Plotly)', 'VS Code & Windsurf', 'Digital Forensic Tools', 'Diverse AI Tools', 'SQL'],
  },
];

export const CAREER_TIMELINE: CareerMilestone[] = [
  {
    id: 'compileq-brm',
    role: 'Business Relationship Manager',
    company: 'CompileQ',
    period: 'Mar 2024 — Present',
    location: 'London, UK (Remote from Chattogram)',
    persona: 'brm',
    highlightMetric: '+50% Client Retention · +25% HR Retention',
    summary:
      'Leading strategic client partnerships, commercial engagement frameworks, and cross-functional delivery alignment across UK technology and hospitality accounts.',
    achievements: [
      'Developed client engagement strategies that forged long-term B2B partnerships and drove a 50% increase in customer satisfaction and retention.',
      'Elevated cross-functional team synergy and people operations, achieving a 25% uplift in HR retention.',
      'Combined strategic business analysis, financial prudence, and brand alignment to turn client vision into measurable velocity.',
    ],
    tags: ['Stakeholder Management', 'Strategic Planning', 'Budgeting & Cost Control', 'B2B Growth'],
  },
  {
    id: 'compileq-pm',
    role: 'Project Manager',
    company: 'CompileQ',
    period: 'Aug 2023 — Feb 2024',
    location: 'London, UK (Remote)',
    persona: 'pm',
    highlightMetric: '+50% Delivery Efficiency',
    summary:
      'Architected agile workflows, sprint schedules, and proactive risk mitigation across web, branding, and Automation360° deployments.',
    achievements: [
      'Implemented project management methodologies in Jira and ClickUp that optimized workflows and delivered +50% improved operational efficiency.',
      'Mitigated technical and schedule risks to deliver cross-functional projects strictly on time and within budget.',
      'Directed diverse developer and designer squads to exceed quality benchmarks.',
    ],
    tags: ['Project Management', 'Risk Management', 'Jira & ClickUp', 'Cross-Functional Collaboration'],
  },
  {
    id: 'qamla-admin',
    role: 'Administrative Assistant',
    company: 'Qamla Ltd',
    period: 'Jan 2022 — Jul 2023',
    location: 'London, UK (Remote)',
    persona: 'brm',
    highlightMetric: '+30% Streamlined Comms · +25% Smoother Admin',
    summary:
      'Orchestrated scheduling, executive documentation, compliance tracking, and stakeholder communications for UK hospitality & recruitment operations.',
    achievements: [
      'Streamlined cross-border communication channels by 30% through structured digital workflows.',
      'Improved administrative smoothness by 25% across scheduling, procurement records, and compliance documentation.',
      'Fostered high-trust collaboration across distributed UK and Bangladesh teams.',
    ],
    tags: ['Documentation & Compliance', 'Schedule & Workflow Mgmt', 'Google Workspace', 'Procurement'],
  },
  {
    id: 'abs-edulab',
    role: 'Tutor (English and Science)',
    company: "AB's Edulab",
    period: 'Jan 2017 — Aug 2022',
    location: 'Chattogram, Bangladesh',
    persona: 'both',
    highlightMetric: '5+ Years Mentorship & Coaching',
    summary:
      'Delivered targeted academic and high-stakes university admission coaching in English and Science, cultivating communication mastery and mentoring leadership.',
    achievements: [
      'Adapted complex scientific and linguistic concepts to diverse student learning profiles.',
      'Guided school, college, and university admission candidates to measurable exam breakthroughs.',
      'Built foundational patience, public speaking, and stakeholder empathy.',
    ],
    tags: ['Mentoring', 'Instructional Design', 'Communication', 'Problem Solving'],
  },
];

export const VERIFIED_CREDENTIALS = [
  {
    id: 'uc-davis',
    title: 'Cross-Cultural Communication and Management',
    issuer: 'University of California, Davis · Coursera',
    date: 'Oct 23, 2026',
    credentialId: 'ID HY13BEC60ZDW',
    skills: 'Global Team Governance · Cross-Cultural Negotiation',
    verifyUrl: 'https://coursera.org/verify/HY13BEC60ZDW',
    badge: 'Verified Credential',
  },
  {
    id: 'u-london',
    title: 'Professional Skills for International Business',
    issuer: 'University of London · Coursera',
    date: 'Nov 8, 2025',
    credentialId: 'ID 9BNL06SKI0UC',
    skills: 'Executive Stakeholder Relations · International B2B Strategy',
    verifyUrl: 'https://coursera.org/verify/9BNL06SKI0UC',
    badge: 'Verified Credential',
  },
  {
    id: 'wadhwani',
    title: 'Employability and Soft Skill Certification',
    issuer: 'Wadhwani Foundation · Ready to Rise!',
    date: 'Oct 2023',
    credentialId: 'JobReady Honors',
    skills: 'Project Management & Leadership · Soft Skills Training · Global Communication',
    verifyUrl: 'https://www.linkedin.com/in/abrarsifat47/details/certifications/',
    badge: 'Verified Credential',
  },
];

export const EDUCATION_RECORDS = [
  {
    degree: 'B. Engg. in Educational Technology and Engineering',
    institution: 'Bangladesh University of Frontier Technology (formerly BSMRDU)',
    score: 'CGPA 3.40 / 4.00',
    detail:
      'Interdisciplinary engineering degree integrating Software & Web Systems, Business Strategy, Data Analytics, Cloud Computing, and Psychological/Educational Methodologies for the 4th Industrial Revolution.',
  },
  {
    degree: 'Higher Secondary Certificate (HSC) — Science',
    institution: 'Chittagong College · Chattogram Board',
    score: 'GPA 5.00 / 5.00',
    detail: 'Graduated with highest distinction (Golden 5.00) in Science from one of Bangladesh’s premier institutions.',
  },
  {
    degree: 'Executive & Cloud Continuous Learning (2022 — 2026)',
    institution: 'Coursera · Wadhwani · AWS · Apollo · edX',
    score: 'Multi-Domain',
    detail:
      'Specialized professional training across Leadership, Negotiation, Design, Marketing, AI, Cloud Technologies, Project Management, and International Business.',
  },
];

export const SKILL_CLUSTERS = {
  leadership: [
    'Stakeholder & Client Relationship Mgmt',
    'Project Management',
    'Strategic Planning',
    'Risk Management',
    'Budgeting, Cost Control & Resource Allocation',
    'Competitive & Business Analysis',
    'Purchasing & Procurement',
    'Team Leadership',
    'Cross-Functional Collaboration',
    'Schedule & Workflow Management',
    'Advanced Problem Solving',
    'Documentation & Compliance Monitoring',
  ],
  techStack: [
    'ClickUp',
    'Jira',
    'Canva',
    'Diverse AI Tools',
    'Digital Forensic Tools',
    'VS Code & Windsurf',
    'WordPress',
    'Hostinger Ecosystem',
    'Google Workspace',
    'Microsoft Suite',
    'Python (Pandas & Plotly)',
  ],
};

export const AI_BRIEF_PROMPTS = [
  {
    q: 'Why hire Abrar as a Business Relationship Manager or Technical PM?',
    a: 'Abrar is a rare Executive-Technical Hybrid: he combines an Engineering degree (B.Engg. in Educational Technology & Engineering, CGPA 3.40) with proven UK B2B commercial leadership at CompileQ—where he boosted client satisfaction & retention by +50%, project delivery efficiency by +50%, and HR retention by +25%.',
  },
  {
    q: 'What is Abrar’s real-world UK client & operations experience?',
    a: 'Operating across the Chattogram ↔ London E1 corridor (CompileQ & Qamla Ltd at 129 Mile End Rd), Abrar has scoped commercial quotes, managed Hostinger/DNS & WordPress infrastructure, and led Automation360° EPOS/KDS rollouts for London hospitality brands including La Mia Mamma (Chelsea), Primitivo (Leicester Sq), Little Italy (Soho), and Little Sicily.',
  },
  {
    q: 'What tools and technical stack does Abrar command daily?',
    a: 'His daily command stack spans Jira & ClickUp for agile delivery, Hostinger Ecosystem & WordPress for web/DNS ops, VS Code & Windsurf + Python (Pandas/Plotly) for technical/data workflows, Digital Forensic & AI tools, Canva for executive decks, and Google Workspace / Microsoft Suite for governance.',
  },
  {
    q: 'Are his international business certifications verifiable?',
    a: 'Yes—his UC Davis ("Cross-Cultural Communication and Management", ID: HY13BEC60ZDW), University of London ("Professional Skills for International Business", ID: 9BNL06SKI0UC), and Wadhwani Foundation ("Employability and Soft Skill Certification — Ready to Rise!", Oct 2023) credentials are all directly linked in the Credentials ledger.',
  },
];
