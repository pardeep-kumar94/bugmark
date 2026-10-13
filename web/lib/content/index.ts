import type { ContentPage, PageKind } from './types';
import { toolPages } from './tools';
import { alternativePages as baseAlternativePages } from './alternatives';
import { moreAlternativePages } from './alternatives-more';
import { guidePages as baseGuidePages } from './guides';
import { moreGuidePages } from './guides-more';
import { roundupGuidePages } from './guides-roundup';

const alternativePages: ContentPage[] = [...baseAlternativePages, ...moreAlternativePages];
// The roundup leads: the footer links the first guides site-wide.
const guidePages: ContentPage[] = [...roundupGuidePages, ...baseGuidePages, ...moreGuidePages];

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
