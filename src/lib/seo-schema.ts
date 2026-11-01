import { SITE_CONFIG } from './site-config';
import {
  CASE_STUDIES,
  CAREER_TIMELINE,
  VERIFIED_CREDENTIALS,
  SKILL_CLUSTERS,
} from '@/data/portfolio';

export function getPortfolioJsonLd() {
  const siteUrl = SITE_CONFIG.url;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_CONFIG.title,
        description: SITE_CONFIG.description,
        inLanguage: 'en-GB',
        publisher: { '@id': `${siteUrl}/#person` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${siteUrl}/#profilepage`,
        url: siteUrl,
        name: SITE_CONFIG.title,
        description: SITE_CONFIG.description,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#person` },
        mainEntity: { '@id': `${siteUrl}/#person` },
        dateCreated: '2025-01-01T00:00:00+00:00',
        dateModified: new Date().toISOString(),
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: SITE_CONFIG.name,
        alternateName: [...SITE_CONFIG.alternateNames],
        jobTitle: 'Business Relationship Manager & Project Leader',
        description: SITE_CONFIG.description,
        url: siteUrl,
        image: `${siteUrl}/portrait.png`,
        email: `mailto:${SITE_CONFIG.email}`,
        telephone: SITE_CONFIG.phone,
        sameAs: [SITE_CONFIG.linkedin],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chattogram',
          addressCountry: 'BD',
        },
        worksFor: {
          '@type': 'Organization',
          name: 'CompileQ',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '129 Mile End Rd',
            addressLocality: 'London',
            postalCode: 'E1 4BG',
            addressCountry: 'GB',
          },
        },
        alumniOf: [
          {
            '@type': 'CollegeOrUniversity',
            name: 'Bangladesh University of Frontier Technology (formerly BSMRDU)',
          },
          {
            '@type': 'EducationalOrganization',
            name: 'Chittagong College',
          },
        ],
        knowsAbout: [
          ...SKILL_CLUSTERS.leadership,
          ...SKILL_CLUSTERS.techStack,
          'Agile, Iterative & Waterfall Delivery Methodologies',
          'Cross-Cultural Stakeholder Communication',
          'QA Oversight, Brand Guidance & Ideation Leadership',
          'UK Hospitality EPOS & KDS Automation',
        ],
        hasCredential: VERIFIED_CREDENTIALS.map((cred) => ({
          '@type': 'EducationalOccupationalCredential',
          name: cred.title,
          credentialCategory: 'Certificate',
          recognizedBy: {
            '@type': 'Organization',
            name: cred.issuer,
          },
          identifier: cred.credentialId,
          url: cred.verifyUrl,
        })),
        hasOccupation: CAREER_TIMELINE.map((role) => ({
          '@type': 'Role',
          roleName: role.role,
          description: role.summary,
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${siteUrl}/#selected-works`,
        name: 'Selected Executive & Technical Case Dossiers — Md. Abrar Hossain',
        itemListElement: CASE_STUDIES.map((study, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'CreativeWork',
            name: study.title,
            headline: study.subtitle,
            description: `${study.challenge} ${study.strategy} Key outcome: ${study.headlineMetric} ${study.headlineMetricLabel}.`,
            author: { '@id': `${siteUrl}/#person` },
            keywords: study.stack.join(', '),
          },
        })),
      },
    ],
  };
}
