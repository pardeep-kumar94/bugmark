import Link from 'next/link';
import { Logo } from './Logo';
import { site } from '@/lib/site';

/** Minimal chrome for one-off pages (e.g. the uninstall survey). */
export function SimpleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_30%,transparent_100%)]" />
      <div className="absolute left-1/2 top-[-220px] -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,.12),rgba(0,113,227,.05)_55%,transparent)] blur-2xl" />
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Bugmark home"><Logo /></Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-20 pt-10 sm:pt-16">{children}</main>
      <footer className="pb-8 text-center text-[13px] text-mute">
        {site.name} is a free bug reporting tool for Chrome.
      </footer>
    </div>
  );
}
