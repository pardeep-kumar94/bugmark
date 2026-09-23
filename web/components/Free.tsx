import Link from 'next/link';
import { InstallLink } from './InstallLink';
import { IconCheck, IconPuzzle } from './icons';

const groups: { title: string; items: string[] }[] = [
  {
    title: 'capture',
    items: ['Annotate, pin, label & redact', 'Visible, full-page, delayed & element captures', 'Mobile · tablet · desktop in one shot', 'Screen recording with voice', 'Before / after shots'],
  },
  {
    title: 'debug',
    items: ['Steps to reproduce, recorded for you', 'Console logs & JavaScript errors', 'Network requests with payloads & responses', 'Element inspector with CSS selectors', 'Copy as cURL & HAR export'],
  },
  {
    title: 'share',
    items: ['GitHub issues with screenshots, video & logs', 'HTML, PDF, CSV & Markdown export', 'White-label reports with your logo', 'GitHub issues from a capture', 'Backup & restore'],
  },
];

export function Free() {
  return (
    <section id="free" className="relative scroll-mt-20 py-24 sm:py-32">
      <span id="pricing" className="absolute -top-20" aria-hidden />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(0,113,227,.07),transparent)]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker">pricing</p>
          <h2 className="section-title mt-3">Try it free. <span className="text-brand">Own it for $15.</span></h2>
          <p className="section-lead">Every feature is unlocked from the first install. Free covers a couple of reports so you can try the whole workflow; one $15 payment removes the limit for good — no subscription, no seats.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          {/* Free */}
          <div className="relative flex flex-col rounded-[18px] border border-line bg-surface p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">Free</h3>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-mute">to try</span>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">$0</span>
            </div>
            <p className="mt-3 text-[14.5px] text-dim">Every feature, on up to <strong className="text-ink-2">2 saved reports</strong> at a time. No account, no credit card.</p>
            <InstallLink className="btn-secondary mt-6 w-full justify-center"><IconPuzzle size={18} />Add to Chrome</InstallLink>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-[18px] bg-brand p-px shadow-[0_30px_90px_-30px_rgba(0,113,227,.4)]">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[17px] bg-surface p-7 sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent opacity-[.10] blur-3xl" />
              <div className="relative flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-ink">Pro</h3>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[12px] font-medium text-accent">one-time</span>
              </div>
              <div className="relative mt-5 flex items-baseline gap-2">
                <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">$15</span>
                <span className="text-[14px] text-mute">once · yours forever</span>
              </div>
              <p className="relative mt-3 text-[14.5px] text-dim"><strong className="text-ink-2">Unlimited reports</strong> and every feature, forever. One payment — no subscription, no renewals.</p>
              <Link href="/account" className="btn-primary relative mt-6 w-full justify-center">Get Bugmark Pro</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <p className="text-center text-[13px] font-medium text-mute">Every feature is included in both — Pro just removes the limit</p>
          <div className="mt-6 grid gap-8 rounded-[18px] border border-line bg-surface p-7 sm:grid-cols-3 sm:p-10">
            {groups.map((g) => (
              <div key={g.title}>
                <h3 className="text-[13px] font-semibold text-accent">{g.title}</h3>
                <ul className="mt-4 space-y-3">
                  {g.items.map((f) => (
                    <li key={f} className="flex gap-3 text-[14.5px] text-ink-2">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent/15 text-accent"><IconCheck size={12} /></span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-mute">Chrome · Edge · Brave · Arc · Your captures stay on your device</p>
        </div>
      </div>
    </section>
  );
}
