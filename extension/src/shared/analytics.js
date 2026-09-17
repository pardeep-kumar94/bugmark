// Anonymous usage analytics — Google Analytics 4 (the property linked to the Firebase project) through the
// Measurement Protocol. Chrome extensions can't load remote scripts (gtag / Firebase SDK), so events are sent
// with a plain POST from extension pages and the service worker.
//
// What is sent: an event name (e.g. "feedback_saved"), a few coarse parameters (capture mode, export format,
// true/false flags, rounded counts), the extension version, UI language and a random install ID.
// What is never sent: page URLs or hostnames, titles, comments, screenshots, recordings, console/network logs,
// GitHub repositories or tokens, or anything typed on a page.
//
// Content scripts can't call this directly; they send { type: 'bugmark:track', name, params } to the background.
import { CONFIG } from './config.js';

const ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const NAME = /^[a-z][a-z0-9_]{0,39}$/;

export const analyticsConfigured = () => !!(CONFIG.analytics?.measurementId && CONFIG.analytics?.apiSecret);

async function enabled() {
  const { settings } = await chrome.storage.local.get('settings');
  return settings?.analytics !== false;
}

async function clientId() {
  const { analyticsClientId } = await chrome.storage.local.get('analyticsClientId');
  if (analyticsClientId) return analyticsClientId;
  const id = `${Math.floor(Math.random() * 2 ** 31)}.${Math.floor(Date.now() / 1000)}`; // GA-style client id
  await chrome.storage.local.set({ analyticsClientId: id });
  return id;
}

// GA4 groups events into sessions by session_id; start a new one after 30 minutes of inactivity.
async function sessionId() {
  const store = chrome.storage.session || chrome.storage.local;
  const now = Date.now();
  const { analyticsSession: s } = await store.get('analyticsSession');
  const next = s && now - s.last < SESSION_TIMEOUT ? { id: s.id, last: now } : { id: String(Math.floor(now / 1000)), last: now };
  await store.set({ analyticsSession: next });
  return next.id;
}

// Keep parameters small and anonymous: numbers, short strings and booleans (as "true"/"false") only.
function clean(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (!NAME.test(k) || v == null) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = String(v);
    else if (typeof v === 'string') out[k] = v.slice(0, 100);
  }
  return out;
}

/** Round a count into a coarse bucket, e.g. 0, 1, 2-5, 6-20, 21+. */
export function bucket(n) {
  n = Number(n) || 0;
  if (n <= 1) return String(n);
  if (n <= 5) return '2-5';
  if (n <= 20) return '6-20';
  if (n <= 100) return '21-100';
  return '100+';
}

/**
 * Send one event. Never throws and never blocks the UI for long.
 * @param {string} name   snake_case event name (max 40 chars)
 * @param {object} params coarse, non-identifying parameters
 * @param {{force?: boolean}} opts force: send even if the user turned analytics off (only for the opt-out event itself)
 */
export async function track(name, params = {}, { force = false } = {}) {
  if (!analyticsConfigured() || !NAME.test(name)) return;
  try {
    if (!force && !(await enabled())) return;
    const manifest = chrome.runtime.getManifest();
    const [cid, sid] = await Promise.all([clientId(), sessionId()]);
    const body = {
      client_id: cid,
      user_properties: {
        extension_version: { value: manifest.version },
        install_type: { value: 'update_url' in manifest ? 'store' : 'unpacked' },
      },
      events: [{
        name,
        params: {
          ...clean(params),
          session_id: sid,
          engagement_time_msec: 100,
          extension_version: manifest.version,
          ui_language: chrome.i18n?.getUILanguage?.() || navigator.language || '',
          ...(CONFIG.analytics.debug ? { debug_mode: 1 } : {}),
        },
      }],
    };
    const qs = `?measurement_id=${encodeURIComponent(CONFIG.analytics.measurementId)}&api_secret=${encodeURIComponent(CONFIG.analytics.apiSecret)}`;
    if (CONFIG.analytics.debug) {
      const r = await fetch(DEBUG_ENDPOINT + qs, { method: 'POST', body: JSON.stringify(body) });
      console.info('[Bugmark analytics]', name, body.events[0].params, await r.json().catch(() => r.status));
    } else {
      await fetch(ENDPOINT + qs, { method: 'POST', body: JSON.stringify(body), keepalive: true });
    }
  } catch { /* offline or blocked — analytics must never break the extension */ }
}
