// POST /api/license/activate — activate a license key for one device (proxies Dodo).
import { NextResponse } from 'next/server';
import { activateKey, DodoLicenseError, dodoEnabled } from '@/lib/dodo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  if (!dodoEnabled) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: CORS });
  }
  const { key, device } = await req.json().catch(() => ({} as { key?: string; device?: string }));
  if (!key) return NextResponse.json({ error: 'missing_key' }, { status: 400, headers: CORS });

  try {
    const { instanceId } = await activateKey(String(key).trim(), String(device || 'Bugmark device'));
    return NextResponse.json({ pro: true, instanceId }, { headers: CORS });
  } catch (err) {
    if (err instanceof DodoLicenseError) {
      const status = err.code === 'limit_reached' ? 409 : err.code === 'invalid_key' ? 404 : 502;
      return NextResponse.json({ error: err.code, message: err.message }, { status, headers: CORS });
    }
    return NextResponse.json({ error: 'activate_failed' }, { status: 502, headers: CORS });
  }
}
