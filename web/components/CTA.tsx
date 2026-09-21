import { site } from '@/lib/site';
import { IconArrowRight, IconPuzzle } from './icons';
import { LogoMark } from './Logo';

export function CTA() {
  return (
    <section className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-line bg-surface px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_50%_70%_at_50%_50%,#000,transparent)]" />
        <div className="absolute left-1/2 top-full -z-10 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand opacity-25 blur-[120px]" />
        <LogoMark size={56} className="mx-auto drop-shadow-[0_12px_30px_rgba(0,113,227,.4)]" />
        <h2 className="mx-auto mt-8 max-w-3xl text-[32px] font-extrabold leading-[1.02] tracking-[-0.04em] text-balance sm:text-[54px]">
          Stop describing bugs. <span className="text-dim">Send the evidence.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-dim">
          Install Bugmark in seconds and file your first reproducible bug report today. Free, with every feature and no account.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={site.installUrl} className="btn-primary w-full sm:w-auto"><IconPuzzle size={18} />Add to Chrome — it’s free</a>
          <a href="/guides/how-to-write-a-bug-report" className="btn-secondary w-full sm:w-auto">
            how to write a bug report <IconArrowRight size={16} />
          </a>
        </div>
        <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-lg border border-line bg-canvas px-3.5 py-2 text-[12.5px] text-dim">
          <span className="text-accent">❯</span> press <span className="kbd">⌥</span><span className="kbd">⇧</span><span className="kbd">S</span> on any page
        </div>
      </div>
    </section>
  );
}
