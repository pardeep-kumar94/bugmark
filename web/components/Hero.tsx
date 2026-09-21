import { Frame } from './Frame';
import { IconArrowRight, IconCheck, IconPuzzle } from './icons';
import { InstallLink } from './InstallLink';
import { screens } from '@/lib/screens';

function BugStage() {
  return (
    <div className="bug-stage right-0 top-2 hidden h-[240px] w-[600px] max-w-[52vw] lg:block" aria-hidden>
      {/* the bug */}
      <div className="bug-crawl">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
          <path d="M9 5 7.5 3M15 5l1.5-2M4.5 10H2M4.5 15H2M22 10h-2.5M22 15h-2.5M6 20l-2 2M18 20l2 2" />
          <ellipse cx="12" cy="7" rx="2.4" ry="2" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="14" rx="4.3" ry="5.4" fill="currentColor" stroke="none" />
        </svg>
      </div>
      {/* capture reticle centred on the bug's path end */}
      <div className="reticle">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <span className="scan" /><span className="flash" />
      </div>
      <div className="captag">Captured · Report #482</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 sm:pt-40">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_50%_at_30%_0%,#000_35%,transparent_100%)]" />
      <div className="absolute left-[10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-brand opacity-[.08] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <BugStage />

        <div className="max-w-3xl">
          <p className="kicker animate-rise">Free bug reporting &amp; debugging tool for Chrome</p>

          <h1 className="animate-rise mt-5 text-[44px] font-extrabold leading-[1.0] tracking-[-0.04em] text-ink text-balance sm:text-[68px] lg:text-[80px]" style={{ animationDelay: '.05s' }}>
            Bug reports developers can{' '}
            <span className="text-dim">actually fix.</span>
          </h1>

          <p className="animate-rise mt-7 max-w-2xl text-[17px] leading-relaxed text-dim text-pretty sm:text-[19px]" style={{ animationDelay: '.12s' }}>
            Annotate a screenshot or record your screen. Bugmark attaches the steps to reproduce, console logs and every network
            request, with payloads and responses. File it to GitHub or share a clean report in one click.
          </p>

          <div className="animate-rise mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '.18s' }}>
            <InstallLink className="btn-primary w-full sm:w-auto">
              <IconPuzzle size={18} />
              Add to Chrome — free
            </InstallLink>
            <a href="#product" className="group inline-flex items-center gap-1.5 px-1 text-[15px] font-semibold text-accent-ink hover:underline">
              See it in action
              <IconArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
          </div>

          <ul className="animate-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-dim" style={{ animationDelay: '.24s' }}>
            {['100% free, every feature', 'No account needed', 'Data stays on your device'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><IconCheck size={14} className="text-accent" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-[1180px] px-3 sm:mt-24 sm:px-8">
        <div className="animate-rise" style={{ animationDelay: '.3s' }}>
          <Frame shot={screens.heroCapture} url="staging.lumen-stays.test/checkout" priority sizes="(min-width: 1200px) 1120px, 100vw" />
        </div>
        <p className="mt-4 text-center text-[12px] text-mute">Real screenshot · Bugmark 1.6 on a demo booking site</p>
      </div>
    </section>
  );
}
