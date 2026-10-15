'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsEnabled, readConsent, track } from '@/lib/analytics';
import { detectExtension } from '@/lib/extension';
import { isInstallHref } from '@/lib/site';
import { EXIT_REASONS, NOTE_MAX, sendFeedback } from '@/lib/feedback';
import {
  DESKTOP_MIN_MS, EXIT_SURVEY_KEY, INSTALL_FLAG_KEY, MOBILE_MIN_MS, canShow, isBlockedPath, isExitIntent, parseLastShown,
} from '@/lib/exitSurvey';
import { IconCheck, IconX } from './icons';

type Trigger = 'exit_intent' | 'timer';

function storageGet(store: 'local' | 'session', key: string): string | null {
  try { return (store === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; }
}
function storageSet(store: 'local' | 'session', key: string, value: string) {
  try { (store === 'local' ? localStorage : sessionStorage).setItem(key, value); } catch {}
}

function isInstallLink(el: Element | null): boolean {
  const a = el?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return false;
  return isInstallHref(a.getAttribute('href') || '', location.href);
}

/** "Before you go" card: exit intent on desktop, a timed prompt on touch devices. See lib/exitSurvey.ts for the rules. */
export function ExitSurvey() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const pathRef = useRef(pathname);
  const shownThisPage = useRef(false);
  const installClicked = useRef(false);
  const extensionInstalled = useRef(false);
  const mountedAt = useRef(0);
  const utm = useRef('');
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const submitted = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When client-side navigation lands on a blocked path while the card is open, close it silently.
  useEffect(() => {
    pathRef.current = pathname;
    if (open && isBlockedPath(pathname)) {
      if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; }
      setOpen(false);
    }
  }, [pathname, open]);

  /** Returns whether the card actually opened, so callers only stop retrying once it did. */
  const show = useCallback((trigger: Trigger): boolean => {
    const now = Date.now();
    const ok = canShow({
      path: pathRef.current,
      lastShown: parseLastShown(storageGet('local', EXIT_SURVEY_KEY)),
      now,
      installClicked: installClicked.current || storageGet('session', INSTALL_FLAG_KEY) === '1',
      extensionInstalled: extensionInstalled.current,
      consentPending: analyticsEnabled && readConsent() === null,
      shownThisPage: shownThisPage.current,
    });
    if (!ok) return false;
    shownThisPage.current = true;
    submitted.current = false;
    storageSet('local', EXIT_SURVEY_KEY, String(now));
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    track('exit_survey_shown', { trigger, page_path: pathRef.current });
    return true;
  }, []);

  const close = useCallback((reason: 'dismiss' | 'sent') => {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpen(false);
    // Already submitted (during the "thanks" state): Esc/close is just dismissing the confirmation, not the survey.
    if (reason === 'dismiss' && !submitted.current) track('exit_survey_dismissed', { page_path: pathRef.current });
    returnFocus.current?.focus?.();
  }, []);

  // Clear the pending "sent" close timer on unmount so it never fires (and calls setState) afterwards.
  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }, []);

  // Setup: timers, listeners, extension check.
  useEffect(() => {
    mountedAt.current = Date.now();
    utm.current = new URLSearchParams(location.search).get('utm_source') || '';
    detectExtension().then((s) => { extensionInstalled.current = s.installed; });

    const onClick = (e: MouseEvent) => {
      if (isInstallLink(e.target as Element)) {
        installClicked.current = true;
        storageSet('session', INSTALL_FLAG_KEY, '1');
      }
    };
    document.addEventListener('click', onClick, true);

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let cleanupTrigger: () => void;

    if (finePointer) {
      const onOut = (e: MouseEvent) => {
        if (Date.now() - mountedAt.current < DESKTOP_MIN_MS) return;
        if (isExitIntent({ clientY: e.clientY, relatedTarget: e.relatedTarget })) show('exit_intent');
      };
      document.addEventListener('mouseout', onOut);
      cleanupTrigger = () => document.removeEventListener('mouseout', onOut);
    } else {
      let visibleMs = 0;
      let scrolled = false;
      const onScroll = () => { scrolled = true; };
      window.addEventListener('scroll', onScroll, { passive: true, once: true });
      const tick = setInterval(() => {
        if (document.visibilityState === 'visible') visibleMs += 1000;
        if (visibleMs >= MOBILE_MIN_MS && scrolled && show('timer')) clearInterval(tick);
      }, 1000);
      cleanupTrigger = () => { clearInterval(tick); window.removeEventListener('scroll', onScroll); };
    }

    return () => { document.removeEventListener('click', onClick, true); cleanupTrigger(); };
  }, [show]);

  // While open: Esc closes, focus moves into the card.
  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close('dismiss'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted.current) return;
    submitted.current = true;
    for (const reason of picked) track('exit_reason', { reason, page_path: pathRef.current });
    void sendFeedback({
      kind: 'exit', reasons: picked, note: note.trim(), page: pathRef.current,
      ref: document.referrer, utm: utm.current, website: honeypot,
    });
    setSent(true);
    closeTimer.current = setTimeout(() => close('sent'), 2500);
  }

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const canSend = (picked.length > 0 || note.trim().length > 0) && !submitted.current;

  if (!open) return null;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-labelledby="exit-survey-title"
      tabIndex={-1}
      className="fixed inset-x-3 bottom-3 z-[70] max-h-[85dvh] overflow-y-auto rounded-[18px] border border-line-2 bg-surface p-5 shadow-[0_30px_80px_-24px_rgba(0,0,0,.35)] outline-none sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
    >
      <button type="button" onClick={() => close('dismiss')} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-surface-2 hover:text-ink">
        <IconX size={16} />
      </button>

      {sent ? (
        <div className="flex items-center gap-3 py-2 pr-8">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><IconCheck size={18} /></span>
          <p id="exit-survey-title" className="text-[15px] font-semibold text-ink">Thanks — that really helps.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <h2 id="exit-survey-title" className="pr-8 text-[16.5px] font-semibold tracking-[-0.02em] text-ink">Before you go — what held you back?</h2>
          <fieldset className="mt-4 flex flex-wrap gap-2">
            <legend className="sr-only">Reasons</legend>
            {EXIT_REASONS.map((r) => {
              const on = picked.includes(r.id);
              return (
                <label key={r.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${on ? 'border-accent bg-accent/[.08] text-accent-ink' : 'border-line-2 text-ink-2 hover:border-mute'}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(r.id)} />
                  {r.label}
                </label>
              );
            })}
          </fieldset>
          <label className="mt-4 block">
            <span className="text-[12.5px] text-dim">
              Anything we could do better? (optional · stored anonymously —{' '}
              <a href="/privacy#feedback" className="underline decoration-dim/40 underline-offset-2 hover:text-ink-2">Privacy</a>)
            </span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} rows={2} className="mt-1.5 w-full resize-none rounded-lg border border-line-2 bg-canvas p-2.5 text-[14px] text-ink outline-none focus:border-accent" />
          </label>
          <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
          <button type="submit" disabled={!canSend} className="btn-primary mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">Send</button>
        </form>
      )}
    </div>
  );
}
