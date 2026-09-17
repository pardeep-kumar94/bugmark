import type { ContentPage, PageKind } from './types';
import { toolPages } from './tools';
import { alternativePages } from './alternatives';
import { guidePages } from './guides';

export type { ContentPage, PageKind } from './types';
export { toolPages, alternativePages, guidePages };

export const allPages: ContentPage[] = [...toolPages, ...alternativePages, ...guidePages];

export function hrefOf(p: Pick<ContentPage, 'kind' | 'slug'>) {
  return p.kind === 'tool' ? `/${p.slug}` : p.kind === 'alternative' ? `/alternatives/${p.slug}` : `/guides/${p.slug}`;
}

export function pageByHref(href: string) {
  const clean = href.split('#')[0].replace(/\/$/, '');
  return allPages.find((p) => hrefOf(p) === clean);
}

export function findPage(kind: PageKind, slug: string) {
  return allPages.find((p) => p.kind === kind && p.slug === slug);
}

export const kindLabel: Record<PageKind, string> = { tool: 'Tools', alternative: 'Alternatives', guide: 'Guides' };
export const kindIndex: Record<PageKind, string> = { tool: '/tools', alternative: '/alternatives', guide: '/guides' };
