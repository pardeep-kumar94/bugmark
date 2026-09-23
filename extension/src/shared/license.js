// ─────────────────────────────────────────────────────────────
// Pro licensing — license key activated against the website API.
// The key is bought on the website (Google sign-in there). Here we only activate/validate
// it. Dodo binds each key to one device (Activation Limit 1); we cache the result so the
// popup renders instantly and re-validate on a schedule so refunds/releases drop Pro.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';

const { apiBase, upgradeUrl, pollIntervalMs } = CONFIG.licensing;
const CACHE_KEY = 'bugmark:license';
const DEVICE_KEY = 'bugmark:device';

/** Stable per-install device name so Dodo activations are recognisable. */
async function deviceName() {
  const { [DEVICE_KEY]: v } = await chrome.storage.local.get(DEVICE_KEY);
  if (v) return v;
  const name = `Chrome ${crypto.randomUUID().slice(0, 8)}`;
  await chrome.storage.local.set({ [DEVICE_KEY]: name });
  return name;
}

export async function getCached() {
  const { [CACHE_KEY]: v } = await chrome.storage.local.get(CACHE_KEY);
  return v || { pro: false, key: null, instanceId: null, checkedAt: '' };
}

async function setCached(patch) {
  const next = { ...(await getCached()), ...patch };
  await chrome.storage.local.set({ [CACHE_KEY]: next });
  return next;
}

export async function isPro() {
  return (await getCached()).pro === true;
}

/** Activate a pasted key on this device. Returns { pro, error? }. */
export async function activate(key) {
  const trimmed = String(key || '').trim();
  if (!trimmed) return { pro: false, error: 'Enter your license key.' };
  let res;
  try {
    res = await fetch(`${apiBase}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: trimmed, device: await deviceName() }),
    });
  } catch {
    return { pro: false, error: 'Network error — check your connection and try again.' };
  }
  if (res.ok) {
    const data = await res.json();
    await setCached({ pro: true, key: trimmed, instanceId: data.instanceId || null, checkedAt: new Date().toISOString() });
    return { pro: true };
  }
  const body = await res.json().catch(() => ({}));
  const msg =
    body.error === 'limit_reached' ? 'This key is already active on another device. Release it there first.'
    : body.error === 'invalid_key' ? "That license key isn't valid."
    : 'Could not activate the key. Try again.';
  return { pro: false, error: msg };
}

/** Re-check the cached key; downgrades to Free if Dodo says it's no longer valid. */
export async function validate() {
  const { key, instanceId } = await getCached();
  if (!key) return { pro: false };
  let res;
  try {
    res = await fetch(`${apiBase}/api/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, instanceId }),
    });
  } catch {
    return { pro: (await getCached()).pro }; // keep last-known on transient errors
  }
  if (!res.ok) return { pro: (await getCached()).pro };
  const data = await res.json();
  await setCached({ pro: !!data.pro, checkedAt: new Date().toISOString() });
  return { pro: !!data.pro };
}

/** Release this device's activation and clear the local key. */
export async function release() {
  const { key, instanceId } = await getCached();
  if (key && instanceId) {
    try {
      await fetch(`${apiBase}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, instanceId }),
      });
    } catch { /* best effort */ }
  }
  await chrome.storage.local.set({ [CACHE_KEY]: { pro: false, key: null, instanceId: null, checkedAt: '' } });
}

/** Open the website upgrade/profile page (sign in → buy → copy key). */
export async function openUpgrade() {
  await chrome.tabs.create({ url: upgradeUrl });
}

/** Periodic re-validation via chrome.alarms; call once from the service worker. */
export function startPolling() {
  const minutes = Math.max(1, Math.round(pollIntervalMs / 60000));
  chrome.alarms.create('bugmark:license-poll', { periodInMinutes: minutes });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'bugmark:license-poll') validate().catch(() => {});
  });
}
