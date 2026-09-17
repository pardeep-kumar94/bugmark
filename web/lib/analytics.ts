'use client';

// Website analytics — Firebase Analytics (Google Analytics 4 under the hood).
// Configure with the NEXT_PUBLIC_FIREBASE_* variables (Firebase console → Project settings → Your apps → Web app → SDK config).
// With no config every call is a no-op, so local development and forks send nothing.
//
// Consent: NEXT_PUBLIC_ANALYTICS_CONSENT = 'opt-out' (default — analytics on, banner lets people decline)
//                                         'opt-in'  (nothing is stored until the visitor accepts; use for EU/UK traffic)
import type { Analytics } from 'firebase/analytics';

type Params = Record<string, string | number | boolean | undefined>;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const analyticsEnabled = !!(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.measurementId);
export const consentMode: 'opt-in' | 'opt-out' = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT === 'opt-in' ? 'opt-in' : 'opt-out';
const debug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

export const CONSENT_KEY = 'bugmark:analytics-consent'; // 'granted' | 'denied'
export type Consent = 'granted' | 'denied' | null;

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

let instance: Promise<Analytics | null> | null = null;
let sdk: typeof import('firebase/analytics') | null = null;
let ready: Analytics | null = null;
let failed = false;
const queue: { name: string; params?: Params }[] = [];

function effectiveConsent(): 'granted' | 'denied' {
  const c = readConsent();
  if (c) return c;
  return consentMode === 'opt-in' ? 'denied' : 'granted';
}

/** Loads Firebase lazily (after the page is interactive) so analytics never slows down rendering. */
export function initAnalytics(): Promise<Analytics | null> {
  if (!analyticsEnabled || typeof window === 'undefined') return Promise.resolve(null);
  if (instance) return instance;
  instance = (async () => {
    try {
      const [{ initializeApp, getApps }, analytics] = await Promise.all([import('firebase/app'), import('firebase/analytics')]);
      if (!(await analytics.isSupported())) { failed = true; queue.length = 0; return null; }
      sdk = analytics;
      const granted = effectiveConsent() === 'granted';
      analytics.setConsent({
        analytics_storage: granted ? 'granted' : 'denied',
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
        functionality_storage: 'granted', security_storage: 'granted', personalization_storage: 'denied',
      } as Parameters<typeof analytics.setConsent>[0]);
      const app = getApps()[0] || initializeApp(firebaseConfig);
      const a = analytics.initializeAnalytics(app, {
        config: { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ...(debug ? { debug_mode: true } : {}) },
      });
      analytics.setAnalyticsCollectionEnabled(a, granted);
      ready = a;
      for (const e of queue.splice(0)) analytics.logEvent(a, e.name, e.params);
      return a;
    } catch (err) {
      if (debug) console.warn('[analytics] init failed', err);
      failed = true; queue.length = 0;
      return null;
    }
  })();
  return instance;
}

/** Log a GA4 event. Safe to call anywhere on the client; queued until Firebase has loaded. */
export function track(name: string, params?: Params) {
  if (!analyticsEnabled || typeof window === 'undefined') return;
  const clean = params && Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, typeof v === 'boolean' ? String(v) : v]));
  if (debug) console.info('[analytics]', name, clean);
  if (ready && sdk) { sdk.logEvent(ready, name, clean); return; }
  if (failed) return;
  queue.push({ name, params: clean });
  void initAnalytics();
}

export function setConsent(value: 'granted' | 'denied') {
  try { localStorage.setItem(CONSENT_KEY, value); } catch {}
  window.dispatchEvent(new CustomEvent('bugmark:consent', { detail: value }));
  if (!analyticsEnabled) return;
  initAnalytics().then((a) => {
    if (!a || !sdk) return;
    sdk.setConsent({ analytics_storage: value });
    sdk.setAnalyticsCollectionEnabled(a, value === 'granted');
    if (value === 'granted') track('consent_granted');
  });
}
