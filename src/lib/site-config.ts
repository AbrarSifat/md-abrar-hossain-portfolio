export const SITE_CONFIG = {
  name: 'Md. Abrar Hossain',
  alternateNames: ['Abrar Hossain', 'Abrar Sifat', 'Md Abrar Hossain'],
  title: 'Md. Abrar Hossain — Business Relationship Manager & Project Leader',
  description:
    'Executive portfolio of Md. Abrar Hossain — Business Relationship Manager & Project Leader at CompileQ (London E1 ↔ Chattogram). Driving +50% B2B client retention, +50% agile delivery efficiency, and Automation360° UK hospitality ecosystems. B.Engg. in Educational Technology & Engineering (UFTB).',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://md-abrar-hossain.vercel.app'),
  email: 'abrarsifat47@gmail.com',
  phone: '+8801627218950',
  linkedin: 'https://www.linkedin.com/in/abrarsifat47/',
  locale: 'en_GB',
  keywords: [
    'Md. Abrar Hossain',
    'Abrar Hossain',
    'Abrar Sifat',
    'Business Relationship Manager',
    'Technical Project Manager',
    'Project Leader',
    'CompileQ',
    'CompileQ UK',
    'Qamla Ltd',
    'Automation360',
    'UK Hospitality SaaS',
    'B2B Client Retention',
    'Cross-Border Operations',
    'Bangladesh University of Frontier Technology',
    'UFTB',
    'BSMRDU',
    'Educational Technology and Engineering',
    'Chittagong College',
    'UC Davis Cross-Cultural Communication',
    'University of London International Business',
    'Wadhwani Foundation',
    'London E1',
    'Chattogram',
  ],
} as const;
