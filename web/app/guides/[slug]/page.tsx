import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentArticle } from '@/components/content/ContentArticle';
import { guidePages, findPage } from '@/lib/content';
import { contentMetadata } from '@/lib/content/meta';

export const dynamicParams = false;

export function generateStaticParams() {
  return guidePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = findPage('guide', (await params).slug);
  return page ? contentMetadata(page) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = findPage('guide', (await params).slug);
  if (!page) notFound();
  return <ContentArticle page={page} />;
}
