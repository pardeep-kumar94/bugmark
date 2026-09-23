// Dodo Payments — hosted checkout + webhook verification.
//
// Dodo is the merchant of record (handles global tax/VAT). We create a one-time
// payment link, tag it with metadata.sub, and unlock the license when the webhook
// confirms the payment succeeded.
//
// NOTE: Dodo's REST shapes evolve. This targets the /payments one-time-payment API:
//   POST {DODO_API_BASE}/payments  → { payment_link, ... }
// Webhooks use the Standard Webhooks signature scheme (like svix/Stripe):
//   headers: webhook-id, webhook-timestamp, webhook-signature
//   signed content: `${id}.${timestamp}.${rawBody}`, HMAC-SHA256 with the base64 secret.
import crypto from 'crypto';

const API_BASE = (process.env.DODO_API_BASE || 'https://test.dodopayments.com').replace(/\/$/, '');
const API_KEY = process.env.DODO_API_KEY || '';
const PRODUCT_ID = process.env.DODO_PRODUCT_ID || '';
const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || '';

export const dodoEnabled = !!(API_KEY && PRODUCT_ID);

export type CheckoutParams = {
  sub: string;
  email: string | null;
  returnUrl: string;
};

/** Create a one-time hosted checkout and return the URL to redirect the buyer to. */
export async function createCheckout({ sub, email, returnUrl }: CheckoutParams): Promise<string> {
  if (!dodoEnabled) {
    throw new Error('Dodo Payments is not configured (set DODO_API_KEY and DODO_PRODUCT_ID).');
  }
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_link: true,
      product_cart: [{ product_id: PRODUCT_ID, quantity: 1 }],
      return_url: returnUrl,
      metadata: { sub },
      // Dodo requires both `customer` and `billing`. `billing` is a billing
      // *address* (country is the only required field, ISO 3166-1 alpha-2) —
      // the hosted checkout lets the buyer edit it, so we send a placeholder.
      customer: email ? { email, name: email } : { email: `${sub}@users.noreply.bugmark.site` },
      billing: { country: 'US' },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Dodo checkout failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { payment_link?: string; url?: string; checkout_url?: string };
  const url = data.payment_link || data.checkout_url || data.url;
  if (!url) throw new Error('Dodo checkout response had no payment link.');
  return url;
}

export type DodoWebhookEvent = {
  type?: string;
  data?: {
    metadata?: { sub?: string };
    customer_id?: string;
    customer?: { customer_id?: string };
    payment_id?: string;
    status?: string;
  };
};

/**
 * Verify a Standard Webhooks signature over the RAW request body.
 * Returns the parsed event on success, or null if the signature is invalid.
 */
export function verifyWebhook(rawBody: string, headers: Headers): DodoWebhookEvent | null {
  if (!WEBHOOK_SECRET) throw new Error('DODO_WEBHOOK_SECRET is not set.');

  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return null;

  // Secret is prefixed "whsec_" and base64-encoded per Standard Webhooks.
  const secretBytes = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // Header is a space-separated list of "v1,<base64sig>" entries.
  const provided = signatureHeader
    .split(' ')
    .map((p) => p.split(',')[1])
    .filter(Boolean);

  const ok = provided.some((sig) => {
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
  if (!ok) return null;

  try {
    return JSON.parse(rawBody) as DodoWebhookEvent;
  } catch {
    return null;
  }
}

/** Does this event mean a one-time payment succeeded? */
export function isPaymentSuccess(event: DodoWebhookEvent): boolean {
  const t = event.type || '';
  if (t === 'payment.succeeded' || t === 'payment.completed') return true;
  // Fallback for shapes that only carry a status.
  return event.data?.status === 'succeeded';
}

export class DodoLicenseError extends Error {
  code: 'invalid_key' | 'limit_reached' | 'dodo_error';
  constructor(code: 'invalid_key' | 'limit_reached' | 'dodo_error', message: string) {
    super(message);
    this.code = code;
    this.name = 'DodoLicenseError';
  }
}

// Public license endpoints (no API key). Dodo response shapes vary, so parse defensively.
async function licenseCall(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  return { res, data, text };
}

/** Record an activation for a key. Throws DodoLicenseError on invalid/exhausted keys. */
export async function activateKey(key: string, device: string) {
  const { res, data, text } = await licenseCall('/licenses/activate', { license_key: key, name: device });
  if (res.status === 404 || res.status === 400) throw new DodoLicenseError('invalid_key', 'License key is invalid.');
  if (res.status === 409 || (!res.ok && /activation limit|limit reached|exhaust/i.test(text))) {
    throw new DodoLicenseError('limit_reached', 'License key is already active on another device.');
  }
  if (!res.ok) throw new DodoLicenseError('dodo_error', `Dodo activate failed (${res.status}): ${text}`);
  const instanceId = data.id || data.license_key_instance_id || data.instance?.id || null;
  return { instanceId, valid: true };
}

/** Check a key (and optionally a specific activation instance) is still valid. */
export async function validateKey(key: string, instanceId?: string) {
  const body: Record<string, unknown> = { license_key: key };
  if (instanceId) body.license_key_instance_id = instanceId;
  const { res, data } = await licenseCall('/licenses/validate', body);
  if (!res.ok) return { valid: false };
  const valid = data.valid === true || data.status === 'active';
  return { valid };
}

/** Free an activation slot so the key can move to another device. */
export async function deactivateKey(key: string, instanceId: string) {
  const { res, text } = await licenseCall('/licenses/deactivate', { license_key: key, license_key_instance_id: instanceId });
  if (!res.ok) throw new DodoLicenseError('dodo_error', `Dodo deactivate failed (${res.status}): ${text}`);
}

/** Look up the license key issued to a Dodo customer (server-side, uses API key). */
export async function getCustomerLicenseKey(customerId: string) {
  if (!API_KEY) return null;
  const res = await fetch(`${API_BASE}/license_keys?customer_id=${encodeURIComponent(customerId)}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const list: any[] = Array.isArray(data) ? data : data.items || data.data || [];
  const row = list[0];
  if (!row) return null;
  return {
    key: row.key || row.license_key || row.instance_key || '',
    id: row.id || row.license_key_id || '',
    used: row.instances_count ?? row.activations_used ?? null,
    limit: row.activations_limit ?? row.activation_limit ?? null,
  };
}
