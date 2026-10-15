// Feedback answers from the on-site exit survey and the uninstall page.
// Shared by /api/feedback (validation) and the survey components (reason lists, sendFeedback).
// No imports, so `node --test` can load it directly.

export type FeedbackKind = 'exit' | 'uninstall';

export const EXIT_REASONS = [
  { id: 'unclear', label: 'I’m not sure what it does' },
  { id: 'not_now', label: 'I don’t need it right now' },
  { id: 'no_chrome', label: 'I don’t use Chrome' },
  { id: 'price', label: 'Too expensive' },
  { id: 'privacy', label: 'Privacy or permissions worry me' },
  { id: 'other_tool', label: 'I use another tool' },
  { id: 'browsing', label: 'Just browsing' },
  { id: 'other', label: 'Something else' },
] as const;

export const UNINSTALL_REASONS = [
  { id: 'not_needed', label: 'I only needed it once' },
  { id: 'missing_feature', label: 'A feature I need is missing' },
  { id: 'bug', label: 'Something didn’t work' },
  { id: 'hard_to_use', label: 'It was hard to use' },
  { id: 'install_hassle', label: 'Installing or updating was a hassle' },
  { id: 'switched', label: 'I switched to another tool' },
  { id: 'privacy', label: 'Privacy or permission concerns' },
  { id: 'other', label: 'Something else' },
] as const;

export const NOTE_MAX = 1000;
const MAX_REASONS = 8;

const ALLOWED: Record<FeedbackKind, ReadonlySet<string>> = {
  exit: new Set(EXIT_REASONS.map((r) => r.id)),
  uninstall: new Set(UNINSTALL_REASONS.map((r) => r.id)),
};

export type Browser = 'chrome' | 'edge' | 'opera' | 'samsung' | 'firefox' | 'safari' | 'other';
export type Device = 'mobile' | 'tablet' | 'desktop';

export type FeedbackDoc = {
  kind: FeedbackKind;
  reasons: string[];
  note: string;
  page: string;
  ref: string;
  utm: string;
  version: string;
  browser: Browser;
  device: Device;
};

export type ParseResult = { status: 'valid'; doc: FeedbackDoc } | { status: 'spam' } | { status: 'invalid'; error: string };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Referrer reduced to a bare hostname ("google.com"); '' if it isn't a URL. */
export function refHost(ref: unknown): string {
  const s = str(ref, 500);
  if (!s || /\s/.test(s)) return '';
  try {
    return new URL(s.includes('://') ? s : `https://${s}`).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Brave and Arc send Chrome's User-Agent, so they are reported as 'chrome'. */
export function browserFamily(ua: string): Browser {
  if (/Edg(?:A|iOS)?\//.test(ua)) return 'edge';
  if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Firefox\/|FxiOS/.test(ua)) return 'firefox';
  if (/Chrome\/|CriOS/.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}

function isLocalOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

/**
 * Same-origin check for POST /api/feedback. `Sec-Fetch-Site` is the strongest signal (sent by all
 * modern browsers on fetch/XHR); `Origin` is the fallback. Requests with neither header present
 * (no browser sends a bare cross-site POST without one) are allowed through — non-browser clients
 * are rate-limited at the edge, not here. In non-production, localhost/127.0.0.1 origins are also
 * allowed so local dev works even without a Sec-Fetch-Site header.
 */
export function isAllowedOrigin(origin: string | null, fetchSite: string | null, siteOrigin: string, dev: boolean): boolean {
  if (fetchSite) return fetchSite === 'same-origin';
  if (origin) {
    if (origin === siteOrigin) return true;
    return dev && isLocalOrigin(origin);
  }
  return true;
}

// Known, accepted: iPadOS sends a Mac User-Agent (no "iPad" token), so iPads are counted as desktop.
export function deviceType(ua: string): Device {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function parseFeedback(body: unknown, userAgent: string): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'invalid', error: 'bad_body' };
  const b = body as Record<string, unknown>;
  if (str(b.website, 200)) return { status: 'spam' };

  const kind = b.kind === 'exit' || b.kind === 'uninstall' ? b.kind : null;
  if (!kind) return { status: 'invalid', error: 'bad_kind' };

  const allowed = ALLOWED[kind];
  const reasons = Array.isArray(b.reasons)
    ? [...new Set(b.reasons.filter((r): r is string => typeof r === 'string' && allowed.has(r)))].slice(0, MAX_REASONS)
    : [];
  const note = str(b.note, NOTE_MAX);
  if (!reasons.length && !note) return { status: 'invalid', error: 'empty' };

  return {
    status: 'valid',
    doc: {
      kind,
      reasons,
      note,
      page: str(b.page, 200),
      ref: refHost(b.ref),
      utm: str(b.utm, 60),
      version: kind === 'uninstall' ? str(b.version, 20) : '',
      browser: browserFamily(userAgent),
      device: deviceType(userAgent),
    },
  };
}

export type FeedbackPayload = {
  kind: FeedbackKind;
  reasons: string[];
  note?: string;
  page?: string;
  ref?: string;
  utm?: string;
  version?: string;
  website?: string;
};

/** Client-side: posts an answer. Never rejects — the visitor sees "thanks" either way. */
export function sendFeedback(payload: FeedbackPayload): Promise<void> {
  return fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).then(
    () => undefined,
    () => undefined,
  );
}
