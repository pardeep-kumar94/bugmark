'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';
import { site } from '@/lib/site';
import { IconCheck, IconPuzzle } from './icons';

const reasons = [
  { id: 'not_needed', label: 'I only needed it once' },
  { id: 'missing_feature', label: 'A feature I need is missing' },
  { id: 'bug', label: 'Something didn’t work' },
  { id: 'hard_to_use', label: 'It was hard to use' },
  { id: 'install_hassle', label: 'Installing/updating from a zip is a hassle' },
  { id: 'switched', label: 'I switched to another tool' },
  { id: 'privacy', label: 'Privacy or permission concerns' },
  { id: 'other', label: 'Something else' },
];

/** Opened by Chrome when Bugmark is removed (CONFIG.uninstallUrl in the extension). */
export function UninstallSurvey() {
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    const v = new URLSearchParams(location.search).get('v') || '';
    track('extension_uninstalled', { version: v });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = new URLSearchParams(location.search).get('v') || '';
    for (const r of picked.length ? picked : ['no_reason']) track('uninstall_reason', { reason: r, version: v });
    // Free text goes to email, not analytics — analytics must not collect personal data.
    setSent(true);
  }

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="card w-full max-w-xl p-7 sm:p-9">
      {sent ? (
        <div>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent"><IconCheck size={20} /></span>
          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.04em]">Thank you — that really helps.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-dim">
            {note.trim() ? 'Thanks for the detail — it helps us make Bugmark better.' : 'If you change your mind, Bugmark is one click away.'}
          </p>
          <a href={site.installUrl} className="btn-secondary mt-6"><IconPuzzle size={17} />Reinstall Bugmark</a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="kicker">uninstalled</p>
          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.045em]">Sorry to see you go.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-dim">Bugmark has been removed. What made you uninstall it? It takes five seconds and shapes what we build next.</p>
          <fieldset className="mt-6 grid gap-2">
            <legend className="sr-only">Reasons</legend>
            {reasons.map((r) => (
              <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[14.5px] transition ${picked.includes(r.id) ? 'border-accent/50 bg-accent/[.07] text-ink' : 'border-line bg-canvas text-ink-2 hover:border-line-2'}`}>
                <input type="checkbox" className="accent-[#4ade80]" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} />{r.label}
              </label>
            ))}
          </fieldset>
          <label className="mt-5 block">
            <span className="text-[12.5px] text-dim">Anything else? (optional — we’ll only see it if you email it)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-line bg-canvas p-3 text-[14.5px] text-ink outline-none focus:border-accent/50" />
          </label>
          <button type="submit" className="btn-primary mt-5 w-full">Send feedback</button>
        </form>
      )}
    </div>
  );
}
