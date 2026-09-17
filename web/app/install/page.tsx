import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { InstallGuide } from '@/components/InstallGuide';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Install Bugmark for Chrome',
  description: `Download ${site.name}, the free bug reporting and debugging extension, and add it to Chrome, Edge, Brave or Arc in under a minute. No account needed.`,
  alternates: { canonical: '/install' },
};

export default function InstallPage() {
  return (
    <>
      <Nav />
      <main>
        <InstallGuide />
      </main>
      <Footer />
    </>
  );
}
