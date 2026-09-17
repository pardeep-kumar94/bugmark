import { site } from '@/lib/site';
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
    items: ['GitHub issues with screenshots, video & logs', 'HTML, PDF, CSV & Markdown export', 'White-label reports with your logo', 'Unlimited feedback items', 'Backup & restore'],
  },
];

export function Free() {
  return (
    <section id="free" className="relative scroll-mt-20 py-24 sm:py-32">
      <span id="pricing" className="absolute -top-20" aria-hidden />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(74,222,128,.08),transparent)]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker">pricing</p>
          <h2 className="section-title mt-3">Free. Every feature. <span className="text-brand">No catch.</span></h2>
          <p className="section-lead">No plans, no seats, no trial timer and no sign-up. Install Bugmark and use everything it does, on as many projects as you like.</p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl rounded-[18px] bg-brand p-px shadow-[0_30px_90px_-30px_rgba(74,222,128,.45)]">
          <div className="relative overflow-hidden rounded-[17px] bg-surface p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent opacity-[.10] blur-3xl" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[64px] font-semibold leading-none tracking-[-0.06em]">$0</span>
                  <span className="font-mono text-[14px] text-mute">/ everything included</span>
                </div>
                <p className="mt-3 max-w-md text-[15px] text-dim">No account, no credit card, no item limits and no watermark. Your captures stay on your device.</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-start md:items-end">
                <a href={site.installUrl} className="btn-primary"><IconPuzzle size={18} />Add to Chrome — free</a>
                <span className="text-center font-mono text-[12px] text-mute md:text-right">Chrome · Edge · Brave · Arc</span>
              </div>
            </div>
            <div className="relative mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
              {groups.map((g) => (
                <div key={g.title}>
                  <h3 className="font-mono text-[13px] font-semibold text-accent">{g.title}</h3>
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
          </div>
        </div>
      </div>
    </section>
  );
}
