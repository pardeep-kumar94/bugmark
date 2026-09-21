// POST /api/dodo/webhook — Dodo Payments webhook.
//
// Verifies the Standard Webhooks signature over the RAW body, then on a successful
// one-time payment reads metadata.sub and flips licenses/{sub}.paid = true.
import { NextResponse } from 'next/server';
import { verifyWebhook, isPaymentSuccess } from '@/lib/dodo';
import { setPaid } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rawBody = await req.text();

  let event;
  try {
    event = verifyWebhook(rawBody, req.headers);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'webhook_misconfigured';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (isPaymentSuccess(event)) {
    const sub = event.data?.metadata?.sub;
    if (sub) {
      await setPaid(sub, {
        dodoCustomerId: event.data?.customer_id || event.data?.customer?.customer_id,
        dodoPaymentId: event.data?.payment_id,
      });
    }
  }

  // Always 200 on a verified event so Dodo stops retrying.
  return NextResponse.json({ received: true });
}
