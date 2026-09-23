import { Frame } from './Frame';
import { IconArrowRight, IconCheck, IconPuzzle } from './icons';
import { InstallLink } from './InstallLink';
import { screens } from '@/lib/screens';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-28 sm:pt-32">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_50%_at_30%_0%,#000_35%,transparent_100%)]" />
      <div className="absolute left-[10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-brand opacity-[.08] blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* Left: message */}
        <div className="max-w-xl">
          <p className="kicker animate-rise">Bug reporting for Chrome, Edge, Brave &amp; Arc</p>

          <h1 className="animate-rise mt-5 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink text-balance sm:text-[54px] lg:text-[58px]" style={{ animationDelay: '.05s' }}>
            Bug reports developers can actually fix.
          </h1>

          <p className="animate-rise mt-6 text-[17px] leading-relaxed text-dim text-pretty sm:text-[18.5px]" style={{ animationDelay: '.12s' }}>
            Annotate a screenshot or record your screen. Bugmark attaches the steps to reproduce, console logs and every network
            request, with payloads and responses. File it to GitHub or share a clean report in one click.
          </p>

          <div className="animate-rise mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '.18s' }}>
            <InstallLink className="btn-primary w-full sm:w-auto">
              <IconPuzzle size={18} />
              Add to Chrome
            </InstallLink>
            <a href="#product" className="group inline-flex items-center gap-1.5 px-1 text-[15px] font-semibold text-accent-ink hover:underline">
              See it in action
              <IconArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
          </div>

          <ul className="animate-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-dim" style={{ animationDelay: '.24s' }}>
            {['Free to try · $15 to own', 'No account needed', 'Data stays on your device'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><IconCheck size={14} className="text-accent" />{t}</li>
            ))}
          </ul>
        </div>

        {/* Right: the real thing, at first glance */}
        <div className="animate-rise lg:-mr-6 xl:-mr-16" style={{ animationDelay: '.3s' }}>
          <Frame shot={screens.heroCapture} url="staging.lumen-stays.test/checkout" priority sizes="(min-width: 1024px) 620px, 100vw" />
          <p className="mt-3 text-center text-[12px] text-mute lg:text-left">A real Bugmark capture: annotated error, steps, logs and network — ready to file.</p>
        </div>
      </div>
    </section>
  );
}
