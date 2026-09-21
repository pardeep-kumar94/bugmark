'use client';

import { useState } from 'react';
import Image from 'next/image';
import { screens } from '@/lib/screens';
import { IconCheck, IconConsole, IconList, IconNetwork, IconShield } from './icons';

const tabs = [
  { id: 'payload', label: 'Request payload', icon: <IconNetwork />, shot: screens.networkPayload,
    note: 'Query params, headers and the JSON body of every fetch and XHR call. Card numbers and CVCs are masked automatically.' },
  { id: 'response', label: 'Response', icon: <IconNetwork />, shot: screens.networkResponse,
    note: 'The exact response the page received: status, headers and body. No more “works on my machine”.' },
  { id: 'console', label: 'Console', icon: <IconConsole />, shot: screens.console,
    note: 'Logs, warnings and errors from the page, with timestamps, captured alongside the report.' },
  { id: 'steps', label: 'Steps to reproduce', icon: <IconList />, shot: screens.steps,
    note: 'Clicks, fields and page changes are written up for you. Bugmark never stores what was typed.' },
] as const;

export function DevContext() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('payload');
  const tab = tabs.find((t) => t.id === active)!;
  return (
    <section id="developers" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-surface/40 py-24 sm:py-32">
      <div className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_60%_55%_at_70%_45%,#000,transparent)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="kicker">for-developers</p>
          <h2 className="section-title mt-3">DevTools-level detail, without asking for it.</h2>
          <p className="section-lead">
            Every capture keeps the last 150 requests and console messages from the page. Open any request to see exactly what was
            sent and what came back, then copy it as cURL or download a HAR file.
          </p>

          <div role="tablist" aria-label="Captured context" className="mt-8 grid gap-2">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => setActive(t.id)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${active === t.id ? 'border-accent/40 bg-accent/[.06]' : 'border-line bg-canvas/60 hover:border-line-2'}`}>
                <span className={`mt-0.5 [&_svg]:h-[18px] [&_svg]:w-[18px] ${active === t.id ? 'text-accent' : 'text-mute'}`}>{t.icon}</span>
                <span>
                  <span className="block text-[14px] font-semibold tracking-[-0.01em] text-ink">{t.label}</span>
                  {active === t.id && <span className="mt-1 block text-[14px] leading-relaxed text-dim">{t.note}</span>}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3 text-[13.5px] leading-relaxed text-dim">
            <IconShield size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>Passwords, tokens, API keys, card numbers and auth headers are replaced with <code className="rounded bg-surface-3 px-1 text-[12px] text-warn">[redacted]</code> before anything is saved.</span>
          </div>
        </div>

        <div role="tabpanel" aria-label={tab.label} className="relative">
          <div className="absolute inset-8 -z-10 rounded-[40px] bg-accent opacity-[.08] blur-[90px]" />
          <div className="overflow-hidden rounded-2xl border border-line-2 shadow-[var(--sh-lg)]">
            {tabs.map((t) => (
              <Image key={t.id} src={t.shot.src} width={t.shot.w} height={t.shot.h} alt={t.shot.alt} sizes="(min-width: 1024px) 680px, 100vw"
                loading="eager" className={`h-auto w-full ${active === t.id ? 'block' : 'hidden'}`} />
            ))}
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12.5px] text-mute">
            {['Copy as cURL', 'Download HAR', 'Filter to failed requests', '16 KB / 32 KB body limits'].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><IconCheck size={13} className="text-accent" />{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
