// ─────────────────────────────────────────────────────────────
// Pro licensing — Google sign-in + license check.
//
// Sign-in uses chrome.identity.getAuthToken (the manifest `oauth2` client_id), which
// yields a Google OAuth access token. We send that token to the website's /api/license,
// which resolves it to a stable Google `sub` and returns whether the user is Pro.
// The result is cached in chrome.storage.local so the popup renders instantly.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';

const { apiBase, oauthClientId, scopes, checkoutUrl, pollIntervalMs } = CONFIG.licensing;

const CACHE_KEY = 'bugmark:license';
export const licensingEnabled = !!oauthClientId;

/** Cached license state: { pro, email, checkedAt } — read synchronously-ish from storage. */
export async function getCached() {
  const { [CACHE_KEY]: v } = await chrome.storage.local.get(CACHE_KEY);
  return v || { pro: false, email: null, checkedAt: 0 };
}

async function setCached(patch) {
  const cur = await getCached();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [CACHE_KEY]: next });
  return next;
}

/** True if the user currently has Pro (from cache — call checkLicense() to refresh). */
export async function isPro() {
  return (await getCached()).pro === true;
}

/** Interactive Google sign-in. Resolves to the OAuth access token. */
export function signIn() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true, scopes }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'Sign-in cancelled'));
        return;
      }
      resolve(token);
    });
  });
}

/** Get a token without prompting; null if not signed in. */
export function getToken({ interactive = false } = {}) {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive, scopes }, (token) => {
      if (chrome.runtime.lastError || !token) { resolve(null); return; }
      resolve(token);
    });
  });
}

/** Forget the current Google token and clear the cached license. */
export async function signOut() {
  const token = await getToken({ interactive: false });
  if (token) {
    await new Promise((resolve) => chrome.identity.removeCachedAuthToken({ token }, resolve));
    // Best-effort revoke so the next sign-in shows the account picker.
    try { await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }); } catch {}
  }
  await chrome.storage.local.set({ [CACHE_KEY]: { pro: false, email: null, checkedAt: 0 } });
}

/**
 * Ask the website whether the signed-in user is Pro, and cache the result.
 * Returns { pro, email, signedIn }. When `interactive`, prompts sign-in if needed.
 */
export async function checkLicense({ interactive = false } = {}) {
  const token = await getToken({ interactive });
  if (!token) return { pro: false, email: null, signedIn: false };

  const res = await fetch(`${apiBase}/api/license`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // Token stale/rejected — drop it so the next attempt re-authenticates.
    await new Promise((resolve) => chrome.identity.removeCachedAuthToken({ token }, resolve));
    return { pro: false, email: null, signedIn: false };
  }
  if (!res.ok) {
    // Keep the last-known state on transient errors.
    const cur = await getCached();
    return { pro: cur.pro, email: cur.email, signedIn: true };
  }

  const data = await res.json();
  const nowIso = new Date().toISOString();
  await setCached({ pro: !!data.pro, email: data.email || null, checkedAt: nowIso });
  return { pro: !!data.pro, email: data.email || null, signedIn: true };
}

/** Open the website upgrade/checkout page in a new tab. */
export async function openCheckout() {
  await chrome.tabs.create({ url: checkoutUrl });
}

/**
 * Background polling — periodically refresh the license so a purchase made on the
 * website unlocks the extension without the user re-opening the popup.
 * Uses chrome.alarms; call once from the service worker.
 */
export function startPolling() {
  if (!licensingEnabled) return;
  const minutes = Math.max(1, Math.round(pollIntervalMs / 60000));
  chrome.alarms.create('bugmark:license-poll', { periodInMinutes: minutes });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'bugmark:license-poll') {
      checkLicense({ interactive: false }).catch(() => {});
    }
  });
}
