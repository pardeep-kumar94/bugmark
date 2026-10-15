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
          <p className="kicker animate-rise">Free Chrome extension · works on any website</p>

          <h1 className="animate-rise mt-5 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink text-balance sm:text-[54px] lg:text-[58px]" style={{ animationDelay: '.05s' }}>
            Found a bug? Report it in one click.
          </h1>

          <p className="animate-rise mt-6 text-[17px] leading-relaxed text-dim text-pretty sm:text-[18.5px]" style={{ animationDelay: '.12s' }}>
            Bugmark is a browser extension for anyone who finds bugs — testers, product managers, designers and clients. Snap a
            screenshot or record your screen, and Bugmark adds everything a developer needs to fix it, automatically. No account,
            nothing to set up.
          </p>

          <div className="animate-rise mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '.18s' }}>
            <InstallLink className="btn-primary w-full sm:w-auto">
              <IconPuzzle size={18} />
              Add to Chrome — it’s free
            </InstallLink>
            <a href="#how" className="group inline-flex items-center gap-1.5 px-1 text-[15px] font-semibold text-accent-ink hover:underline">
              Watch the 1-minute tour
              <IconArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
          </div>

          <ol aria-label="Three steps" className="animate-rise mt-6 flex flex-col gap-2 text-[14px] text-ink-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3" style={{ animationDelay: '.21s' }}>
            {['Add to Chrome', 'Click Bugmark on any page', 'Send the report'].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                {i > 0 && <IconArrowRight size={14} className="hidden text-mute sm:block" />}
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[11.5px] font-semibold text-accent-ink">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          <ul className="animate-rise mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-dim" style={{ animationDelay: '.24s' }}>
            {['Free to try · $7.99 to own', 'No account needed', 'Data stays on your device'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><IconCheck size={14} className="text-accent" />{t}</li>
            ))}
          </ul>
        </div>

        {/* Right: the real thing, at first glance */}
        <div className="animate-rise lg:-mr-6 xl:-mr-16" style={{ animationDelay: '.3s' }}>
          <Frame shot={screens.heroCapture} url="staging.lumen-stays.test/checkout" priority sizes="(min-width: 1024px) 620px, 100vw" />
          <p className="mt-3 text-center text-[12px] text-mute lg:text-left">What your developer receives: the screenshot, what you clicked, and the technical details — in one report.</p>
        </div>
      </div>
    </section>
  );
}
