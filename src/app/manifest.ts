import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Md. Abrar Hossain — Business Relationship Manager & Project Leader',
    short_name: 'Abrar Hossain',
    description:
      'Executive portfolio of Md. Abrar Hossain — Business Relationship Manager & Project Leader at CompileQ (London E1 ↔ Chattogram). Driving +50% B2B client retention, +50% agile delivery efficiency, and Automation360° UK hospitality ecosystems.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090B',
    theme_color: '#09090B',
    icons: [
      {
        src: '/icon',
        sizes: '64x64',
        type: 'image/png',
      },
    ],
  };
}
