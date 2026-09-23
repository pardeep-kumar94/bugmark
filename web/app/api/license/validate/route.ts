// POST /api/license/validate — check a key/activation is still valid (proxies Dodo).
import { NextResponse } from 'next/server';
import { validateKey, dodoEnabled } from '@/lib/dodo';

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
  if (!dodoEnabled) return NextResponse.json({ pro: false }, { status: 503, headers: CORS });
  const { key, instanceId } = await req.json().catch(() => ({} as { key?: string; instanceId?: string }));
  if (!key) return NextResponse.json({ error: 'missing_key' }, { status: 400, headers: CORS });
  const { valid } = await validateKey(String(key).trim(), instanceId ? String(instanceId) : undefined);
  return NextResponse.json({ pro: valid }, { headers: CORS });
}
