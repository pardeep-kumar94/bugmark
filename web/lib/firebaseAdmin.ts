// Server-side Firebase — Firebase Admin (Firestore) + user/license helpers.
//
// The canonical user key is the Google `sub` (stable across website + extension).
// resolveUser() accepts EITHER a website Firebase ID token OR an extension Google
// access token and returns { sub, email }, so both sides map to the same user.
//
// Configure with FIREBASE_SERVICE_ACCOUNT_KEY (JSON string of a service-account key)
// or GOOGLE_APPLICATION_CREDENTIALS (path). With neither set, adminEnabled === false
// and the helpers throw a friendly error instead of crashing the route.
import { getApps, getApp, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const hasAppDefault = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

export const adminEnabled = !!(serviceAccountJson || hasAppDefault);

let app: App | null = null;
let dbInstance: Firestore | null = null;

function ensureApp(): App {
  if (!adminEnabled) {
    throw new Error(
      'Firebase Admin is not configured (set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS).'
    );
  }
  if (app) return app;
  if (getApps().length) {
    app = getApp();
    return app;
  }
  if (serviceAccountJson) {
    const sa = JSON.parse(serviceAccountJson);
    app = initializeApp({ credential: cert(sa) });
  } else {
    app = initializeApp({ credential: applicationDefault() });
  }
  return app;
}

export function db(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(ensureApp());
  return dbInstance;
}

export type ResolvedUser = { sub: string; email: string | null };

/**
 * Resolve a request's bearer token to a Google `sub`.
 * Tries the website path first (Firebase ID token), then the extension path
 * (Google OAuth access token → userinfo endpoint).
 */
export async function resolveUser(token: string): Promise<ResolvedUser | null> {
  if (!token) return null;

  // 1. Website: Firebase ID token.
  try {
    const decoded = await getAuth(ensureApp()).verifyIdToken(token);
    const googleSub = decoded.firebase?.identities?.['google.com']?.[0] as string | undefined;
    const sub = googleSub || decoded.uid;
    if (sub) return { sub, email: (decoded.email as string) || null };
  } catch {
    // Not a Firebase ID token — fall through to the extension path.
  }

  // 2. Extension: Google OAuth access token → userinfo → sub.
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const info = (await res.json()) as { sub?: string; email?: string };
      if (info.sub) return { sub: info.sub, email: info.email || null };
    }
  } catch {
    // Not a valid Google access token either.
  }

  return null;
}

/** Read the bearer token from an Authorization header value. */
export function bearerFrom(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return m ? m[1].trim() : null;
}

export async function upsertUser(sub: string, email: string | null): Promise<void> {
  await db()
    .collection('users')
    .doc(sub)
    .set(
      { email: email || null, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
}

export type License = {
  plan: 'free' | 'pro';
  paid: boolean;
  dodoCustomerId?: string;
  dodoPaymentId?: string;
};

export async function getLicense(sub: string): Promise<License> {
  const snap = await db().collection('licenses').doc(sub).get();
  if (!snap.exists) return { plan: 'free', paid: false };
  const data = snap.data() as Partial<License>;
  return { plan: data.paid ? 'pro' : 'free', paid: !!data.paid, dodoCustomerId: data.dodoCustomerId, dodoPaymentId: data.dodoPaymentId };
}

export async function setPaid(
  sub: string,
  info: { dodoCustomerId?: string; dodoPaymentId?: string } = {}
): Promise<void> {
  await db()
    .collection('licenses')
    .doc(sub)
    .set(
      {
        plan: 'pro',
        paid: true,
        ...(info.dodoCustomerId ? { dodoCustomerId: info.dodoCustomerId } : {}),
        ...(info.dodoPaymentId ? { dodoPaymentId: info.dodoPaymentId } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
