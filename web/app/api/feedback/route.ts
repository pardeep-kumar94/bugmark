// POST /api/feedback — anonymous answers from the exit survey and the uninstall page.
//
// Stores reasons + optional note in Firestore `feedback`. Never stores IP, email or the raw
// User-Agent (only its browser family and device type). Same-origin only, enforced below via
// isAllowedOrigin() (Sec-Fetch-Site / Origin), so no CORS headers are needed. Non-browser clients
// (no Sec-Fetch-Site or Origin header) are rate-limited at the edge with a Vercel Firewall rule,
// not here.
import { NextResponse } from 'next/server';
import { adminEnabled, saveFeedback } from '@/lib/firebaseAdmin';
import { isAllowedOrigin, parseFeedback } from '@/lib/feedback';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 16_384;

export async function POST(req: Request) {
  const siteOrigin = (() => {
    try { return new URL(site.url).origin; } catch { return site.url; }
  })();
  if (!isAllowedOrigin(req.headers.get('origin'), req.headers.get('sec-fetch-site'), siteOrigin, process.env.NODE_ENV !== 'production')) {
    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 });
  }

  if (Number(req.headers.get('content-length') || 0) > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const parsed = parseFeedback(body, req.headers.get('user-agent') || '');
  if (parsed.status === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (parsed.status === 'spam') return NextResponse.json({ ok: true });

  if (!adminEnabled) return NextResponse.json({ error: 'feedback_not_configured' }, { status: 503 });

  try {
    await saveFeedback(parsed.doc);
  } catch {
    return NextResponse.json({ error: 'save_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
