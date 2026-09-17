import type { Metadata } from 'next';
import { Hub } from '@/components/content/Hub';
import { alternativePages } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Bugmark vs Jam, Marker.io, BugHerd & Loom',
  description: 'Compare Bugmark, the free bug reporting Chrome extension, with Jam, Marker.io, BugHerd and Loom: pricing, data storage, console and network logs, integrations.',
  alternates: { canonical: '/alternatives' },
  openGraph: { url: '/alternatives', type: 'website', title: 'Bugmark vs Jam, Marker.io, BugHerd & Loom', description: 'Compare Bugmark, the free bug reporting Chrome extension, with Jam, Marker.io, BugHerd and Loom: pricing, data storage, console and network logs, integrations.' },
};

export default function AlternativesPage() {
  return (
    <Hub path="/alternatives" kicker="compare" title="Bugmark vs other bug reporting tools"
      lead="Honest side-by-side comparisons with popular bug reporting and feedback tools, so you can pick the right one for your team."
      pages={alternativePages} more={[{ href: '/tools', label: 'Developer tools' }, { href: '/guides', label: 'Guides' }]} />
  );
}
