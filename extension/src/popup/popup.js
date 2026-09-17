import { countByHost } from '../shared/db.js';
import { getSettings, setSettings } from '../shared/settings.js';
import { track, bucket } from '../shared/analytics.js';

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

$('host').textContent = restricted ? 'Not available on this page' : host || tab.url;
$('annotate').disabled = restricted;
$('record').disabled = restricted;
const recStatus = await chrome.runtime.sendMessage({ type: 'bugmark:recStatus', tabId: tab.id }).catch(() => null);
const recording = recStatus?.recording || recStatus?.elsewhere;
if (recording) { $('recordLabel').textContent = 'Stop recording'; $('record').classList.add('on'); }
$('record').addEventListener('click', async () => {
  if (recording) { await chrome.runtime.sendMessage({ type: 'bugmark:recStop' }); window.close(); return; }
  // Started from the toolbar popup, Chrome lets Bugmark record this tab directly (no share dialog).
  chrome.runtime.sendMessage({ type: 'bugmark:recStart', tabId: tab.id, source: 'popup' });
  setTimeout(() => window.close(), 150);
});
$('restricted').hidden = !restricted;
$('siteRow').hidden = restricted;

const counts = await countByHost(host);
$('siteCount').textContent = counts.site;
$('totalCount').textContent = counts.total;

const settings = await getSettings();
$('showLauncher').checked = settings.showLauncher;
$('hideHere').checked = settings.hiddenHosts.includes(host);
$('reviewer').value = settings.reviewer;
$('siteRowDesc').textContent = `Don’t show the button on ${host}`;

$('annotate').addEventListener('click', async () => {
  track('annotate_opened', { open_source: 'popup' });
  await chrome.runtime.sendMessage({ type: 'bugmark:toggleTab', tabId: tab.id });
  window.close();
});

const openReport = (h) => async () => { await chrome.runtime.sendMessage({ type: 'bugmark:openReport', host: h }); window.close(); };
$('openReport').addEventListener('click', openReport(counts.site ? host : ''));
$('openSettings').addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); });

track('popup_opened', { restricted_page: restricted, total_items: bucket(counts.total) });
$('siteStat').addEventListener('click', openReport(host));
$('totalStat').addEventListener('click', openReport(''));

$('showLauncher').addEventListener('change', (e) => setSettings({ showLauncher: e.target.checked }));
$('hideHere').addEventListener('change', async (e) => {
  const cur = await getSettings();
  const set = new Set(cur.hiddenHosts);
  e.target.checked ? set.add(host) : set.delete(host);
  setSettings({ hiddenHosts: [...set] });
});
let t;
$('reviewer').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => setSettings({ reviewer: e.target.value.trim() }), 250); });
