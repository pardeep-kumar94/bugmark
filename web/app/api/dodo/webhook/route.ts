// POST /api/dodo/webhook — Dodo Payments webhook.
//
// Verifies the Standard Webhooks signature over the RAW body, then on a successful
// one-time payment reads metadata.sub and flips licenses/{sub}.paid = true.
import { NextResponse } from 'next/server';
import { verifyWebhook, isPaymentSuccess } from '@/lib/dodo';
import { setPaid, setLicenseKey } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rawBody = await req.text();

  let result;
  try {
    result = verifyWebhook(rawBody, req.headers);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'webhook_misconfigured';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!result.ok) {
    // Log the reason — a bare 400 is indistinguishable between "wrong headers"
    // and "wrong signing secret", and Dodo's delivery log only shows the status.
    console.error('Dodo webhook rejected:', result.reason, result.detail || '');
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const event = result.event;

  if (isPaymentSuccess(event)) {
    const sub = event.data?.metadata?.sub;
    if (sub) {
      await setPaid(sub, {
        dodoCustomerId: event.data?.customer_id || event.data?.customer?.customer_id,
        dodoPaymentId: event.data?.payment_id,
      });
      const ev = event.data as any;
      const licenseKey = ev?.license_key || ev?.license?.key || ev?.license_keys?.[0]?.key;
      const licenseKeyId = ev?.license_key_id || ev?.license?.id || ev?.license_keys?.[0]?.id;
      if (licenseKey || licenseKeyId) await setLicenseKey(sub, { licenseKey, licenseKeyId });
    }
  }

  // Always 200 on a verified event so Dodo stops retrying.
  return NextResponse.json({ received: true });
}
