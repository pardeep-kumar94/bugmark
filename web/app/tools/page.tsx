import type { Metadata } from 'next';
import { Hub } from '@/components/content/Hub';
import { toolPages } from '@/lib/content';

const title = 'Free developer tools for bug reporting & debugging';
const lead = 'Bugmark bundles the web developer tools you reach for when something breaks — screenshots, screen recording, console and network logs, steps to reproduce — into one free Chrome extension.';

export const metadata: Metadata = {
  title: 'Free Developer Tools for Bug Reporting & Debugging',
  description: 'Free web developer tools in one Chrome extension: bug reporting, debugging context, network request logging, screen recording and website feedback.',
  alternates: { canonical: '/tools' },
  openGraph: { url: '/tools', type: 'website', title: 'Free Developer Tools for Bug Reporting & Debugging', description: 'Free web developer tools in one Chrome extension: bug reporting, debugging context, network request logging, screen recording and website feedback.' },
};

export default function ToolsPage() {
  return <Hub path="/tools" kicker="tools" title={title} lead={lead} pages={toolPages} more={[{ href: '/guides', label: 'Guides' }, { href: '/alternatives', label: 'Compare alternatives' }]} />;
}
