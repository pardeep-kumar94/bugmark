import Image from 'next/image';
import { Reveal } from './Reveal';
import { Frame } from './Frame';
import { IconCheck, IconDevices, IconPen, IconSplit, IconVideo } from './icons';
import { screens, type Screen } from '@/lib/screens';

type Row = {
  id: string; icon: React.ReactNode; kicker: string; title: string; text: string; points: string[];
  shot: Screen; url?: string; inset?: { shot: Screen; className: string }; badge?: string;
};

const rows: Row[] = [
  {
    id: 'annotate', icon: <IconPen />, kicker: 'capture', title: 'Point at the problem, right on the page.',
    text: 'Press ⌥⇧S on any site, including localhost, staging or pages behind a login. Draw, drop numbered pins, add labels and press Enter.',
    points: ['Pen, highlighter, arrows, shapes, text and pins', 'Visible area, full page or a 3-second delay for hover states', 'Pixelate emails and secrets before anything is saved', 'Element inspector attaches the CSS selector and styles'],
    shot: screens.annotate, url: 'staging.lumen-stays.test/checkout',
    inset: { shot: screens.captureMenu, className: '-bottom-10 -right-4 w-[46%] xl:-right-10' },
  },
  {
    id: 'record', icon: <IconVideo />, kicker: 'record', title: 'Some bugs need to be seen moving.',
    text: 'Record the tab with your voice when a screenshot isn’t enough: flickers, animations or a flow that breaks on step four.',
    points: ['One click from the toolbar, popup or ⌥⇧R', 'Narrate with your microphone as you go', 'Keeps recording across page loads, up to 5 minutes', 'Plays back in the report, and attaches to GitHub issues'],
    shot: screens.videoPlayer,
    inset: { shot: screens.recordingBar, className: '-bottom-8 -left-4 w-[34%] xl:-left-8' },
  },
  {
    id: 'breakpoints', icon: <IconDevices />, kicker: 'responsive', title: 'Mobile, tablet and desktop in one capture.',
    text: 'Bugmark re-renders the page at 390, 768 and 1440px using Chrome’s device emulation, so layout bugs show up next to the version that works.',
    points: ['No resizing windows or DevTools device mode', 'Real layout at each width, not a scaled screenshot', 'Saved as one side-by-side image'],
    shot: screens.breakpoints,
  },
  {
    id: 'before-after', icon: <IconSplit />, kicker: 'verify', title: 'Close the loop with a before and after.',
    text: 'When a fix ships, add an “after” shot. Bugmark reopens the page at the same scroll position and captures it, or you can upload or paste one.',
    points: ['Side by side in the dashboard, report and PDF', 'Included as a Before | After table in GitHub issues', 'Perfect for client sign-off'],
    shot: screens.beforeAfter,
  },
];

export function Showcase() {
  return (
    <section id="product" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">product</p>
          <h2 className="section-title mt-3">Capture the bug the way you found it.</h2>
          <p className="section-lead">A screenshot, a recording or three screen sizes. Whatever shows the problem best, in a couple of seconds.</p>
        </Reveal>

        <div className="mt-20 space-y-28 sm:space-y-36">
          {rows.map((r, i) => (
            <div key={r.id} id={r.id} className={`grid scroll-mt-24 items-center gap-12 lg:gap-16 ${i % 2 ? 'lg:grid-cols-[1.25fr_.75fr]' : 'lg:grid-cols-[.75fr_1.25fr]'}`}>
              <Reveal className={i % 2 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent [&_svg]:h-[18px] [&_svg]:w-[18px]">{r.icon}</span>
                  <span className="kicker">{r.kicker}</span>
                </div>
                <h3 className="mt-5 font-mono text-[26px] font-semibold leading-[1.15] tracking-[-0.04em] text-balance sm:text-[32px]">{r.title}</h3>
                <p className="mt-4 text-[16.5px] leading-relaxed text-dim text-pretty">{r.text}</p>
                <ul className="mt-6 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] text-ink-2">
                      <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] bg-accent/15 text-accent"><IconCheck size={11} /></span>{p}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={80} className={`relative ${i % 2 ? 'lg:order-1' : ''} ${r.inset ? 'pb-10 sm:pb-14' : ''}`}>
                <Frame shot={r.shot} url={r.url} chrome={!!r.url} sizes="(min-width: 1024px) 680px, 100vw" />
                {r.inset && (
                  <div className={`absolute hidden sm:block ${r.inset.className}`}>
                    <div className="overflow-hidden rounded-xl border border-white/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,.9)]">
                      <Image src={r.inset.shot.src} width={r.inset.shot.w} height={r.inset.shot.h} alt={r.inset.shot.alt} sizes="400px" className="block h-auto w-full" />
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
