import type { Metadata } from 'next';
import { Hub } from '@/components/content/Hub';
import { guidePages } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Bug Reporting & Debugging Guides',
  description: 'Practical guides for developers and QA: write bug reports, capture HAR files and console logs, copy requests as cURL, screen record in Chrome and compare tools.',
  alternates: { canonical: '/guides' },
  openGraph: { url: '/guides', type: 'website', title: 'Bug Reporting & Debugging Guides', description: 'Practical guides for developers and QA: write bug reports, capture HAR files and console logs, copy requests as cURL, screen record in Chrome and compare tools.' },
};

export default function GuidesPage() {
  return (
    <Hub path="/guides" kicker="guides" title="Bug reporting & debugging guides"
      lead="Step-by-step guides for writing bug reports developers can act on — with Chrome’s built-in tools, and the faster way with Bugmark."
      pages={guidePages} more={[{ href: '/tools', label: 'Developer tools' }, { href: '/alternatives', label: 'Compare alternatives' }]} />
  );
}
