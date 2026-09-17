'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { analyticsEnabled, consentMode, initAnalytics, readConsent, setConsent, track } from '@/lib/analytics';
import { site } from '@/lib/site';

/**
 * Site-wide analytics (Firebase / GA4):
 * - page_view on every route change (App Router navigations included)
 * - install_click for every “Add to Chrome” link, with the section it was clicked in
 * - cta_click / outbound_click / nav_click / faq_open from data attributes and link targets
 * - scroll depth (25/50/75/90%), section_view (first time each #section is 40% visible)
 * - web_vitals (LCP, INP, CLS, FCP, TTFB) and uncaught JavaScript errors (exception)
 * Any element can add a custom event with data-track="event_name" and data-track-<param>="value".
 */
export function Analytics() {
  if (!analyticsEnabled) return null;
  return (
    <>
      <Suspense fallback={null}><PageViews /></Suspense>
      <Interactions />
      <Vitals />
      <ConsentBanner />
    </>
  );
}

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef('');
  useEffect(() => {
    const qs = search?.toString();
    const key = `${pathname}?${qs}`;
    if (last.current === key) return;
    last.current = key;
    // Wait a tick so document.title reflects the new page.
    const t = setTimeout(() => {
      track('page_view', {
        page_location: location.href,
        page_path: pathname,
        page_title: document.title,
        page_referrer: document.referrer || undefined,
        page_type: pageType(pathname),
      });
    }, 50);
    return () => clearTimeout(t);
  }, [pathname, search]);
  return null;
}

function pageType(path: string) {
  if (path === '/') return 'home';
  if (path.startsWith('/guides')) return 'guide';
  if (path.startsWith('/alternatives')) return 'alternative';
  if (['/install', '/uninstalled'].includes(path)) return path.slice(1);
  if (['/privacy', '/terms'].includes(path)) return 'legal';
  return 'tool';
}

function sectionOf(el: Element) {
  const s = el.closest('section[id]');
  if (s) return s.id;
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  return 'body';
}

function Interactions() {
  const pathname = usePathname();

  useEffect(() => {
    // Load Firebase once the browser is idle.
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => void initAnalytics());
    else setTimeout(() => void initAnalytics(), 1500);

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('a, button, summary, [data-track]');
      if (!el) return;
      const text = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const section = sectionOf(el);

      const custom = el.closest('[data-track]') as HTMLElement | null;
      if (custom?.dataset.track) {
        const params: Record<string, string> = { section };
        for (const [k, v] of Object.entries(custom.dataset)) if (k.startsWith('track') && k !== 'track' && v) params[k.slice(5).replace(/^./, (c) => c.toLowerCase())] = v;
        track(custom.dataset.track, params);
      }

      if (el.tagName === 'SUMMARY') {
        const details = el.parentElement as HTMLDetailsElement | null;
        if (details && !details.open) track('faq_open', { question: text, section });
        return;
      }
      if (el.tagName !== 'A' || el.hasAttribute('download')) return; // downloads are tracked where they start
      const href = el.getAttribute('href') || '';
      let url: URL | null = null;
      try { url = new URL(href, location.href); } catch {}
      if (!url) return;

      if (url.origin === location.origin && url.pathname === site.installUrl) {
        track('install_click', { section, link_text: text, page_path: location.pathname });
      } else if (href.startsWith('mailto:')) {
        track('contact_click', { section });
      } else if (url.origin !== location.origin) {
        track('outbound_click', { link_url: url.href, link_domain: url.hostname, section });
      } else if (el.closest('nav')) {
        track('nav_click', { link_text: text, link_url: url.pathname + url.hash });
      } else if (url.pathname !== location.pathname) {
        track('internal_link_click', { link_text: text, link_url: url.pathname, section });
      }
    };

    const onError = (e: ErrorEvent) => track('exception', { description: `${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`.slice(0, 150), fatal: false });
    const onRejection = (e: PromiseRejectionEvent) => track('exception', { description: `unhandledrejection: ${String((e.reason as Error)?.message || e.reason)}`.slice(0, 150), fatal: false });

    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Scroll depth + section views, reset per page.
  useEffect(() => {
    const marks = [25, 50, 75, 90];
    const hit = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h <= 0) return;
      const pct = (scrollY / h) * 100;
      for (const m of marks) if (pct >= m && !hit.has(m)) { hit.add(m); track('scroll_depth', { percent: m, page_path: pathname }); }
    };
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const id = (en.target as HTMLElement).id;
        if (en.isIntersecting && !seen.has(id)) { seen.add(id); track('section_view', { section: id, page_path: pathname }); }
      }
    }, { threshold: 0.4 });
    const t = setTimeout(() => document.querySelectorAll('main section[id]').forEach((s) => io.observe(s)), 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [pathname]);

  return null;
}

function Vitals() {
  useReportWebVitals((m) => {
    track('web_vitals', {
      metric_name: m.name,
      metric_value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
      metric_rating: (m as { rating?: string }).rating,
      metric_id: m.id,
      page_path: location.pathname,
    });
  });
  return null;
}

function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(readConsent() === null);
    const on = () => setShow(false);
    window.addEventListener('bugmark:consent', on);
    return () => window.removeEventListener('bugmark:consent', on);
  }, []);
  if (!show) return null;
  return (
    <div role="dialog" aria-label="Analytics preferences" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-xl border border-line-2 bg-surface/95 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,.9)] backdrop-blur sm:bottom-5">
      <p className="text-[13.5px] leading-relaxed text-dim">
        {consentMode === 'opt-in'
          ? 'May we use analytics cookies to count visits and see which pages help? No ads, no selling data.'
          : 'We use privacy-friendly analytics cookies to count visits and improve Bugmark. No ads, no selling data.'}{' '}
        <Link href="/privacy#website-analytics" className="font-medium text-accent underline decoration-accent/30 underline-offset-4">Privacy policy</Link>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setConsent('denied')} className="h-9 rounded-lg border border-line-2 px-3.5 font-mono text-[13px] text-ink-2 hover:bg-surface-2">Decline</button>
        <button type="button" onClick={() => setConsent('granted')} className="h-9 rounded-lg bg-accent px-3.5 font-mono text-[13px] font-semibold text-on-accent hover:bg-[#6ee79a]">{consentMode === 'opt-in' ? 'Accept' : 'OK'}</button>
      </div>
    </div>
  );
}
