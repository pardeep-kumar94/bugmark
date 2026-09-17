import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { allPages, hrefOf } from '@/lib/content';
import { screens } from '@/lib/screens';

const SITE_UPDATED = new Date('2026-09-17');

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  const core: MetadataRoute.Sitemap = [
    { url: u('/'), lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 1, images: [u(screens.heroCapture.src), u(screens.dashboard.src), u(screens.networkPayload.src)] },
    { url: u('/install'), lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: u('/tools'), lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: u('/guides'), lastModified: SITE_UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: u('/alternatives'), lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: u('/privacy'), lastModified: SITE_UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: u('/terms'), lastModified: SITE_UPDATED, changeFrequency: 'yearly', priority: 0.2 },
  ];
  const content: MetadataRoute.Sitemap = allPages.map((p) => ({
    url: u(hrefOf(p)),
    lastModified: new Date(p.updated),
    changeFrequency: 'monthly',
    priority: p.kind === 'tool' ? 0.9 : p.kind === 'guide' ? 0.7 : 0.6,
    ...(p.hero ? { images: [u(screens[p.hero].src)] } : {}),
  }));
  return [...core, ...content];
}
