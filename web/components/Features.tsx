import { Reveal } from './Reveal';
import {
  IconArchive, IconCode, IconFullPage, IconInspect, IconKey, IconKeyboard, IconPalette, IconShield, IconTimer, IconUserOff,
} from './icons';

const features: { icon: React.ReactNode; title: string; text: string }[] = [
  { icon: <IconFullPage />, title: 'Full-page capture', text: 'Scroll-and-stitch whole pages, including apps that scroll inside a panel.' },
  { icon: <IconTimer />, title: 'Delayed capture', text: 'A 3-second timer for hover states, menus and tooltips.' },
  { icon: <IconInspect />, title: 'Element inspector', text: 'Attach the CSS selector, size and computed styles of any element.' },
  { icon: <IconShield />, title: 'Redaction', text: 'Pixelate personal data on screenshots before they’re saved.' },
  { icon: <IconKey />, title: 'Secret masking', text: 'Tokens, passwords and card numbers are masked in network logs.' },
  { icon: <IconCode />, title: 'Copy as cURL & HAR', text: 'Replay a failing request in your terminal or open it in DevTools.' },
  { icon: <IconPalette />, title: 'White-label reports', text: 'Your logo, colours and company name. No Bugmark footer.' },
  { icon: <IconKeyboard />, title: 'Keyboard first', text: '⌥⇧S to annotate, ⌥⇧R to record, Enter to capture, ⌘↵ to save.' },
  { icon: <IconArchive />, title: 'Backup & restore', text: 'Move everything to another computer, recordings included.' },
  { icon: <IconUserOff />, title: 'Free, no account', text: 'Install and go. Every feature is free, with no sign-up and no limits.' },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-y border-line bg-surface/40 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="kicker">everything-else</p>
            <h2 className="section-title mt-3">The details that make it fast.</h2>
          </div>
          <p className="max-w-sm text-[16px] leading-relaxed text-dim">Small things you’ll use on every review, all built into one lightweight extension.</p>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 5) * 50} className="bg-surface p-6 transition hover:bg-surface-2">
              <span className="text-accent [&_svg]:h-5 [&_svg]:w-5">{f.icon}</span>
              <h3 className="mt-4 text-[14.5px] font-semibold tracking-[-0.01em]">{f.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
