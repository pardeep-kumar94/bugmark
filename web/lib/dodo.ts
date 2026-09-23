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

export type WebhookFailure =
  | 'missing_headers'
  | 'bad_secret_format'
  | 'signature_mismatch'
  | 'bad_json';

export type WebhookResult =
  | { ok: true; event: DodoWebhookEvent }
  | { ok: false; reason: WebhookFailure; detail?: string };

/**
 * Verify a Standard Webhooks signature over the RAW request body.
 *
 * Header names: the spec uses `webhook-*`; senders built on svix emit `svix-*`.
 * Dodo has used both, so accept either.
 *
 * Secret: `whsec_` + base64 per the spec. Some dashboards hand out a raw
 * (non-base64) secret, which decodes to garbage and silently mismatches — so
 * we try the decoded bytes first and fall back to the literal string.
 */
export function verifyWebhook(rawBody: string, headers: Headers): WebhookResult {
  if (!WEBHOOK_SECRET) throw new Error('DODO_WEBHOOK_SECRET is not set.');

  const h = (name: string) => headers.get(`webhook-${name}`) || headers.get(`svix-${name}`);
  const id = h('id');
  const timestamp = h('timestamp');
  const signatureHeader = h('signature');
  if (!id || !timestamp || !signatureHeader) {
    const present = [...headers.keys()].filter((k) => /^(webhook|svix)-/.test(k));
    return { ok: false, reason: 'missing_headers', detail: `saw: [${present.join(', ')}]` };
  }

  const stripped = WEBHOOK_SECRET.replace(/^whsec_/, '');
  const candidates: Buffer[] = [];
  const decoded = Buffer.from(stripped, 'base64');
  if (decoded.length > 0) candidates.push(decoded);
  candidates.push(Buffer.from(stripped, 'utf8'));
  if (candidates.length === 0) return { ok: false, reason: 'bad_secret_format' };

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expectations = candidates.map((secretBytes) =>
    crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64'),
  );

  // Header is a space-separated list of "v1,<base64sig>" entries.
  const provided = signatureHeader
    .split(' ')
    .map((p) => (p.includes(',') ? p.split(',')[1] : p))
    .filter(Boolean);

  const ok = provided.some((sig) =>
    expectations.some((expected) => {
      try {
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    }),
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'signature_mismatch',
      detail: `bodyBytes=${Buffer.byteLength(rawBody)} sigs=${provided.length} secretLen=${stripped.length}`,
    };
  }

  try {
    return { ok: true, event: JSON.parse(rawBody) as DodoWebhookEvent };
  } catch {
    return { ok: false, reason: 'bad_json' };
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
  // NOTE: verify this field name against a real Dodo activate response in TEST MODE before production —
  // a wrong field yields a null instanceId, which prevents releasing the (single) activation slot later.
  const instanceId =
    data.id || data.license_key_instance_id || data.instance_id || data.instance?.id || data.instance?.instance_id || null;
  if (!instanceId) console.warn('Dodo activate: could not parse an activation instance id from response:', data);
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
