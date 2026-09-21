// POST /api/checkout — start a one-time Pro purchase.
//
// Auth: Bearer token (Firebase ID token or Google access token). Creates a Dodo
// hosted checkout tagged with metadata.sub and returns { url } to redirect to.
import { NextResponse } from 'next/server';
import { resolveUser, bearerFrom, upsertUser, adminEnabled } from '@/lib/firebaseAdmin';
import { createCheckout, dodoEnabled } from '@/lib/dodo';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  if (!adminEnabled || !dodoEnabled) {
    return NextResponse.json({ error: 'checkout_not_configured' }, { status: 503, headers: CORS });
  }

  const token = bearerFrom(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401, headers: CORS });
  }

  const user = await resolveUser(token);
  if (!user) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401, headers: CORS });
  }

  await upsertUser(user.sub, user.email);

  try {
    const returnUrl = `${site.url}/account?paid=success`;
    const url = await createCheckout({ sub: user.sub, email: user.email, returnUrl });
    return NextResponse.json({ url }, { headers: CORS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'checkout_failed';
    return NextResponse.json({ error: 'checkout_failed', message }, { status: 502, headers: CORS });
  }
}
