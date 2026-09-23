// POST /api/license/deactivate — release an activation so the key can move devices.
import { NextResponse } from 'next/server';
import { deactivateKey, DodoLicenseError, dodoEnabled } from '@/lib/dodo';

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
  if (!dodoEnabled) return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: CORS });
  const { key, instanceId } = await req.json().catch(() => ({} as { key?: string; instanceId?: string }));
  if (!key || !instanceId) return NextResponse.json({ error: 'missing_params' }, { status: 400, headers: CORS });
  try {
    await deactivateKey(String(key).trim(), String(instanceId));
    return NextResponse.json({ released: true }, { headers: CORS });
  } catch (err) {
    console.error('license deactivate:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'deactivate_failed', message: 'Could not release the device. Please try again.' }, { status: 502, headers: CORS });
  }
}
