import Link from 'next/link';
import { Logo } from './Logo';
import { Footer } from './Footer';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-[14px] font-medium text-dim hover:text-ink">← Back to home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="kicker">legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{title}</h1>
        <p className="mt-3 text-[14px] text-mute">Last updated {updated}</p>
        <div className="legal mt-10 space-y-5 text-[16px] leading-relaxed text-ink-2 [&_a]:font-medium [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:[&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
          {children}
        </div>
      </main>
      <div className="border-t border-line"><Footer /></div>
    </>
  );
}
