import { getAll, countByHost } from '../shared/db.js';
import { track, bucket } from '../shared/analytics.js';
import { getCached, validate, openUpgrade } from '../shared/license.js';

const $ = (id) => document.getElementById(id);
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

let host = '';
let restricted = true;
try {
  const u = new URL(tab.url);
  host = u.host;
  restricted = !/^(https?|file):$/.test(u.protocol)
    || u.host === 'chromewebstore.google.com'
    || (u.host === 'chrome.google.com' && u.pathname.startsWith('/webstore'));
} catch {}

$('host').textContent = restricted ? 'Not available here' : host || tab.url;
if (restricted) $('siteChip').querySelector('.sdot').style.background = 'var(--text-3)';
$('annotate').disabled = restricted;
$('record').disabled = restricted;
$('restricted').hidden = !restricted;

// ── Recording state ─────────────────────────────────────────
const recStatus = await chrome.runtime.sendMessage({ type: 'bugmark:recStatus', tabId: tab.id }).catch(() => null);
const recording = recStatus?.recording || recStatus?.elsewhere;
if (recording) { $('recordLabel').textContent = 'Stop recording'; $('record').classList.add('rec-on'); }

// Recording is available on the free plan (subject to the saved-report limit).
let recordLocked = false;
function paintRecordLock() {
  $('recordLock').hidden = !recordLocked;
  $('recordKbd').hidden = recordLocked || recording;
}
paintRecordLock();

$('record').addEventListener('click', async () => {
  if (recording) { await chrome.runtime.sendMessage({ type: 'bugmark:recStop' }); window.close(); return; }
  if (recordLocked) { track('pro_upsell_clicked', { feature: 'recording' }); await openUpgrade(); window.close(); return; }
  chrome.runtime.sendMessage({ type: 'bugmark:recStart', tabId: tab.id, source: 'popup' });
  setTimeout(() => window.close(), 150);
});

$('annotate').addEventListener('click', async () => {
  track('annotate_opened', { open_source: 'popup' });
  await chrome.runtime.sendMessage({ type: 'bugmark:toggleTab', tabId: tab.id });
  window.close();
});

const openReport = (h) => async () => { await chrome.runtime.sendMessage({ type: 'bugmark:openReport', host: h }); window.close(); };
$('openReport').addEventListener('click', openReport(host));
$('viewAll').addEventListener('click', openReport(host));
$('openSettings').addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); });

// ── Recent captures on this site ────────────────────────────
function relTime(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24; if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(ts).toLocaleDateString();
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const chevron = '<span class="go"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>';

async function renderRecent() {
  const counts = await countByHost(host);
  if (counts.site > 0) { $('recentCount').textContent = counts.site; $('recentCount').hidden = false; }
  if (restricted || counts.site === 0) { $('recentEmpty').hidden = restricted; return; }

  const items = (await getAll()).filter((i) => i.host === host).slice(0, 3);
  const rows = items.map((it) => {
    const src = it.thumb || it.image || (it.after && (it.after.thumb || it.after.image));
    const thumb = src
      ? `<span class="thumb"><img src="${esc(src)}" alt=""></span>`
      : `<span class="thumb skel"><span class="plines"><i></i><i></i><i></i></span></span>`;
    const resolved = it.status === 'resolved';
    const st = resolved
      ? '<span class="st resolved"><b></b>Resolved</span>'
      : '<span class="st open"><b></b>Open</span>';
    const title = esc(it.title || `Capture #${it.seq}`);
    return `<button class="cap-row" data-id="${esc(it.id)}">${thumb}
      <span class="m"><span class="ti2">${title}</span><span class="mt"><span>${relTime(it.createdAt)}</span>·${st}</span></span>
      ${chevron}</button>`;
  }).join('');
  $('recentList').innerHTML = rows;
  $('recentList').querySelectorAll('.cap-row').forEach((el) => el.addEventListener('click', openReport(host)));
}
renderRecent();

// ── Account / Pro licensing ─────────────────────────────────
{
  $('account').hidden = false;
  const render = ({ pro }) => {
    $('acctTitle').textContent = pro ? 'Bugmark Pro' : 'Free plan';
    $('acctDesc').textContent = pro ? 'Unlimited reports' : '2 saved reports';
    const chip = $('planChip');
    chip.textContent = pro ? 'Pro' : 'Free';
    chip.classList.toggle('pro', pro);
    chip.classList.toggle('free', !pro);
    $('acctActions').hidden = pro;
  };
  render(await getCached());
  validate().then(render).catch(() => {});
  $('getPro').addEventListener('click', async () => { track('pro_upsell_clicked', { feature: 'popup' }); await openUpgrade(); window.close(); });
  $('enterKey').addEventListener('click', async () => { await chrome.runtime.openOptionsPage(); window.close(); });
}

track('popup_opened', { restricted_page: restricted, total_items: bucket((await countByHost(host)).total) });
