import { Frame } from './Frame';
import { IconArrowRight, IconCheck, IconPuzzle } from './icons';
import { site } from '@/lib/site';
import { screens } from '@/lib/screens';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-28 sm:pt-36">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_35%,transparent_100%)]" />
      <div className="absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,222,128,.14),rgba(34,211,238,.06)_55%,transparent)] blur-2xl" />

      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <a href="#developers" className="eyebrow animate-rise hover:border-line-2 hover:text-ink">
          <span className="rounded bg-accent/15 px-1.5 py-px text-[11px] font-semibold text-accent">New</span>
          network payloads, screen recording &amp; GitHub issues
          <IconArrowRight size={14} className="text-mute" />
        </a>

        <h1 className="animate-rise mx-auto mt-7 max-w-4xl font-mono text-[38px] font-semibold leading-[1.05] tracking-[-0.055em] text-ink text-balance sm:text-[58px] lg:text-[68px]" style={{ animationDelay: '.05s' }}>
          <span className="mb-4 block font-mono text-[14px] font-medium tracking-normal text-accent sm:text-[16px]">Free bug reporting &amp; debugging tool for Chrome</span>
          Bug reports developers can <span className="text-brand">actually fix.</span>
        </h1>

        <p className="animate-rise mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-dim text-pretty sm:text-[19px]" style={{ animationDelay: '.12s' }}>
          Annotate a screenshot or record your screen. Bugmark attaches the steps to reproduce, console logs and every network
          request, with payloads and responses. File it to GitHub or share a clean report in one click.
        </p>

        <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '.18s' }}>
          <a href={site.installUrl} className="btn-primary w-full sm:w-auto">
            <IconPuzzle size={18} />
            Add to Chrome — free
          </a>
          <a href="#product" className="btn-secondary w-full sm:w-auto">
            See it in action
            <IconArrowRight size={16} />
          </a>
        </div>

        <ul className="animate-rise mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-mute" style={{ animationDelay: '.24s' }}>
          {['100% free, every feature', 'No account needed', 'Unlimited reports', 'Data stays on your device'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><IconCheck size={14} className="text-accent" />{t}</li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-14 max-w-[1180px] px-3 sm:mt-20 sm:px-8">
        <div className="absolute inset-x-16 top-16 -z-10 h-[70%] rounded-[40px] bg-brand opacity-[.12] blur-[110px]" />
        <div className="animate-rise" style={{ animationDelay: '.3s' }}>
          <Frame shot={screens.heroCapture} url="staging.lumen-stays.test/checkout" priority sizes="(min-width: 1200px) 1120px, 100vw" />
        </div>
        <p className="mt-4 text-center font-mono text-[12px] text-mute">Real screenshot · Bugmark 1.6 on a demo booking site</p>
      </div>
    </section>
  );
}
