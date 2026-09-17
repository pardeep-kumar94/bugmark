import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Free Bug Reporting Tool`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#090b0f',
    theme_color: '#090b0f',
    categories: ['developer', 'productivity', 'utilities'],
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
