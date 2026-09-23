import type { Metadata } from 'next';
import Link from 'next/link';
import { SimpleShell } from '@/components/SimpleShell';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for doesn’t exist.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SimpleShell>
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-accent">404</p>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.04em] sm:text-[40px]">
          This page wandered off.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-dim">
          The link may be broken or the page may have moved. Here are some good places to pick things back up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/guides" className="btn-secondary">Browse guides</Link>
          <Link href="/tools" className="btn-secondary">All tools</Link>
        </div>
      </div>
    </SimpleShell>
  );
}
