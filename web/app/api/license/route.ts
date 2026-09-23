// GET /api/license — "is this user Pro?"
//
// Auth: Bearer token = a website Firebase ID token OR an extension Google access token.
// Called by the extension (polling) and the website account page.
import { NextResponse } from 'next/server';
import { resolveUser, bearerFrom, upsertUser, getLicense, adminEnabled, setLicenseKey } from '@/lib/firebaseAdmin';
import { getCustomerLicenseKey } from '@/lib/dodo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  if (!adminEnabled) {
    return NextResponse.json({ error: 'licensing_not_configured' }, { status: 503, headers: CORS });
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
  const license = await getLicense(user.sub);

  let key = license.licenseKey || null;
  let activations: { used: number | null; limit: number | null } | null = null;

  if (license.paid && license.dodoCustomerId) {
    const looked = await getCustomerLicenseKey(license.dodoCustomerId).catch(() => null);
    if (looked) {
      activations = { used: looked.used, limit: looked.limit };
      if (!key && looked.key) {
        key = looked.key;
        await setLicenseKey(user.sub, { licenseKey: looked.key, licenseKeyId: looked.id }).catch(() => {});
      }
    }
  }

  return NextResponse.json(
    { pro: license.paid, plan: license.plan, email: user.email, key, activations },
    { headers: CORS }
  );
}
