import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { screens } from '@/lib/screens';
import { type ContentPage, hrefOf } from './index';

export function contentMetadata(page: ContentPage): Metadata {
  const href = hrefOf(page);
  const img = page.hero ? screens[page.hero] : screens.heroCapture;
  return {
    // Keep the <title> within ~60 characters: add " · Bugmark" only when it fits.
    title: (page.title + ` · ${site.name}`).length <= 62 ? page.title : { absolute: page.title },
    description: page.description,
    keywords: [page.primaryKeyword, ...page.keywords],
    alternates: { canonical: href },
    openGraph: {
      type: 'article',
      url: href,
      siteName: site.name,
      title: page.title,
      description: page.description,
      modifiedTime: page.updated,
      images: [{ url: img.src, width: img.w, height: img.h, alt: img.alt }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [img.src] },
  };
}
