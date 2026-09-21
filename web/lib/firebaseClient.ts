'use client';

// Browser-side Firebase — used for "Sign in with Google" on the website.
// Reuses the same NEXT_PUBLIC_FIREBASE_* config as analytics (lib/analytics.ts).
// With no config the auth helpers throw a friendly error instead of crashing render.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const authEnabled = !!(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function ensureAuth(): Auth {
  if (!authEnabled) {
    throw new Error('Firebase auth is not configured (set NEXT_PUBLIC_FIREBASE_* in .env.local).');
  }
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (!auth) auth = getAuth(app);
  return auth;
}

/** Opens the Google sign-in popup and returns the signed-in user. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(ensureAuth(), provider);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(ensureAuth());
}

/** Subscribes to auth state. Returns an unsubscribe function. */
export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!authEnabled) { cb(null); return () => {}; }
  return onAuthStateChanged(ensureAuth(), cb);
}

/** Firebase ID token for the current user (sent to our API routes as a Bearer token). */
export async function currentIdToken(): Promise<string | null> {
  const u = ensureAuth().currentUser;
  return u ? u.getIdToken() : null;
}

export type { User };
