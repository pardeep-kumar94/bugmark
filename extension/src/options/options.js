import { CONFIG } from '../shared/config.js';
import { getSettings, setSettings } from '../shared/settings.js';
import { track, analyticsConfigured } from '../shared/analytics.js';
import { getGithub, setGithub, disconnectGithub, connectWithToken, listRepos, isValidRepo, deviceFlowAvailable, startDeviceFlow, pollDeviceFlow } from '../shared/github.js';
import { activate, release, validate, getCached, openUpgrade } from '../shared/license.js';

const $ = (id) => document.getElementById(id);

$('siteLink').href = CONFIG.websiteUrl;
$('supportLink').href = `mailto:${CONFIG.supportEmail}`;
$('version').textContent = `Version ${chrome.runtime.getManifest().version}${!('update_url' in chrome.runtime.getManifest()) ? ' · developer build' : ''}`;
$('shortcutsLink').addEventListener('click', (e) => { e.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); });

// ---- Pro
async function renderPro() {
  const { pro } = await getCached();
  $('proEntry').hidden = pro;
  $('proActive').hidden = !pro;
  $('proStatus').textContent = pro ? 'Pro · unlimited reports.' : 'Free plan · 2 saved reports.';
}

function proMsg(text, kind = 'err') {
  $('proMsg').textContent = text || ''; $('proMsg').className = `msg ${kind}`; $('proMsg').hidden = !text;
}

$('activateKey').addEventListener('click', async () => {
  proMsg('Activating…', 'ok');
  const r = await activate($('licenseKey').value);
  if (r.pro) { proMsg('Pro unlocked on this device.', 'ok'); $('licenseKey').value = ''; }
  else proMsg(r.error || 'Could not activate.', 'err');
  await renderPro();
});

$('releaseKey').addEventListener('click', async () => {
  await release();
  proMsg('Device released.', 'ok');
  await renderPro();
});

$('getProLink').addEventListener('click', (e) => { e.preventDefault(); openUpgrade(); });

renderPro();
validate().then(renderPro);

// ---- Branding
const settings = await getSettings();
const brand = { ...settings.brand };
const saveBrand = debounce(() => setSettings({ brand }), 300);

function renderBrand() {
  $('bCompany').value = brand.company;
  $('bWebsite').value = brand.website;
  $('bAccent').value = brand.accent;
  $('bAccentText').value = brand.accent;
  $('logoPreview').hidden = !brand.logo;
  $('logoHint').hidden = !!brand.logo;
  if (brand.logo) $('logoPreview').src = brand.logo;
}
renderBrand();

$('bCompany').addEventListener('input', (e) => { brand.company = e.target.value.trim(); saveBrand(); });
$('bWebsite').addEventListener('input', (e) => { brand.website = e.target.value.trim(); saveBrand(); });
$('bAccent').addEventListener('input', (e) => { brand.accent = e.target.value; $('bAccentText').value = e.target.value; saveBrand(); });
$('bAccentText').addEventListener('input', (e) => {
  if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { brand.accent = e.target.value; $('bAccent').value = e.target.value; saveBrand(); }
});
$('logoPick').addEventListener('click', () => $('logoFile').click());
$('logoDrop').addEventListener('click', () => $('logoFile').click());
$('logoRemove').addEventListener('click', () => { brand.logo = ''; renderBrand(); saveBrand(); });
$('logoFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 300 * 1024) { toast('Logo must be under 300 KB'); return; }
  brand.logo = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
  renderBrand(); saveBrand();
});

// ---- General
$('showLauncher').checked = settings.showLauncher;
$('recordSteps').checked = settings.recordSteps !== false;
$('recordMic').checked = settings.recordMic !== false;
$('recordBodies').checked = settings.recordBodies !== false;
$('recordBodies').addEventListener('change', (e) => { setSettings({ recordBodies: e.target.checked }); track('setting_changed', { setting: 'record_bodies', enabled: e.target.checked }); });
$('recordSteps').addEventListener('change', (e) => { setSettings({ recordSteps: e.target.checked }); track('setting_changed', { setting: 'record_steps', enabled: e.target.checked }); });
$('recordMic').addEventListener('change', (e) => { setSettings({ recordMic: e.target.checked }); track('setting_changed', { setting: 'record_mic', enabled: e.target.checked }); });
$('micLink').addEventListener('click', (e) => { e.preventDefault(); chrome.tabs.create({ url: chrome.runtime.getURL('src/permissions/mic.html') }); });
$('reviewer').value = settings.reviewer;
$('showLauncher').addEventListener('change', (e) => { setSettings({ showLauncher: e.target.checked }); track('setting_changed', { setting: 'floating_button', enabled: e.target.checked }); });
$('reviewer').addEventListener('input', debounce((e) => setSettings({ reviewer: e.target.value.trim() }), 300));

// ---- GitHub
let gh = await getGithub();
let ghPending = {};
const flushGh = debounce(() => { const p = ghPending; ghPending = {}; setGithub(p).then((g) => (gh = g)); }, 350);
const saveGh = (patch) => { ghPending = { ...ghPending, ...patch }; flushGh(); };

function renderGithub() {
  const connected = !!gh.token;
  $('ghConnect').hidden = connected;
  $('ghConnected').hidden = !connected;
  $('ghState').hidden = !connected;
  $('ghState').textContent = connected ? 'Connected' : '';
  $('ghDevice').hidden = !deviceFlowAvailable();
  if (!connected) return;
  $('ghLogin').textContent = `@${gh.login}`;
  $('ghAvatar').src = gh.avatar || '../../icons/icon48.png';
  $('ghTokenType').textContent = gh.tokenType === 'oauth' ? 'Signed in with GitHub' : 'Personal access token';
  $('ghRepo').value = gh.defaultRepo;
  $('ghShots').checked = gh.uploadScreenshots;
  $('ghBranch').value = gh.branch;
  $('ghBranchName').textContent = gh.branch || 'bugmark-assets';
  $('ghBranchRow').hidden = !gh.uploadScreenshots;
  $('ghLabels').checked = gh.addLabels;
  $('ghExtra').value = gh.extraLabels;
}

function ghMsg(text, kind = 'err') {
  $('ghMsg').textContent = text; $('ghMsg').className = `msg ${kind}`; $('ghMsg').hidden = !text;
}

async function loadRepos(quiet) {
  $('ghReload').disabled = true; $('ghReload').textContent = 'Loading…';
  try {
    const repos = await listRepos(gh.token);
    $('ghRepoList').innerHTML = repos.filter((r) => r.issues).map((r) => `<option value="${r.full}">${r.private ? 'Private' : 'Public'}</option>`).join('');
    if (!gh.defaultRepo && repos[0]) { gh = await setGithub({ defaultRepo: repos[0].full }); $('ghRepo').value = gh.defaultRepo; }
    if (!quiet) toast(`${repos.length} repositor${repos.length === 1 ? 'y' : 'ies'} available`);
  } catch (err) { if (!quiet) toast(err.message); }
  finally { $('ghReload').disabled = false; $('ghReload').textContent = 'Load repos'; }
}

$('ghTokenForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('ghConnectBtn').disabled = true; $('ghConnectBtn').textContent = 'Connecting…'; ghMsg('');
  try {
    gh = await connectWithToken($('ghToken').value, 'pat');
    $('ghToken').value = '';
    renderGithub();
    toast(`Connected to GitHub as @${gh.login}`);
    track('github_connected', { method: 'token' });
    loadRepos(true);
  } catch (err) { ghMsg(err.message); }
  finally { $('ghConnectBtn').disabled = false; $('ghConnectBtn').textContent = 'Connect'; }
});

let deviceAbort;
$('ghSignIn').addEventListener('click', async () => {
  ghMsg('');
  try {
    const d = await startDeviceFlow();
    $('ghCode').textContent = d.user_code;
    $('ghCodeBox').hidden = false; $('ghSignIn').hidden = true;
    $('ghCopyCode').onclick = async () => { await navigator.clipboard.writeText(d.user_code).catch(() => {}); chrome.tabs.create({ url: d.verification_uri }); };
    deviceAbort = new AbortController();
    const token = await pollDeviceFlow(d, deviceAbort.signal);
    gh = await connectWithToken(token, 'oauth');
    track('github_connected', { method: 'oauth' });
    renderGithub();
    toast(`Connected to GitHub as @${gh.login}`);
    loadRepos(true);
  } catch (err) { ghMsg(err.message); }
  finally { $('ghCodeBox').hidden = true; $('ghSignIn').hidden = false; }
});
$('ghCancel').addEventListener('click', () => deviceAbort?.abort());

$('ghDisconnect').addEventListener('click', async () => {
  if (!confirm('Disconnect GitHub from Bugmark on this browser?')) return;
  await disconnectGithub();
  gh = await getGithub();
  renderGithub();
  toast('GitHub disconnected');
});
$('ghReload').addEventListener('click', () => loadRepos(false));
$('ghRepo').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  e.target.style.borderColor = v && !isValidRepo(v) ? 'var(--err)' : '';
  if (!v || isValidRepo(v)) saveGh({ defaultRepo: v });
});
$('ghShots').addEventListener('change', (e) => { $('ghBranchRow').hidden = !e.target.checked; saveGh({ uploadScreenshots: e.target.checked }); });
$('ghBranch').addEventListener('input', (e) => { const v = e.target.value.trim(); $('ghBranchName').textContent = v || 'bugmark-assets'; saveGh({ branch: v || 'bugmark-assets' }); });
$('ghLabels').addEventListener('change', (e) => saveGh({ addLabels: e.target.checked }));
$('ghExtra').addEventListener('input', (e) => saveGh({ extraLabels: e.target.value }));
renderGithub();
if (gh.token) loadRepos(true);

// ---- Privacy
$('analytics').checked = settings.analytics !== false;
$('analytics').closest('.setting').hidden = !analyticsConfigured();
$('analytics').addEventListener('change', async (e) => {
  if (!e.target.checked) await track('analytics_opt_out', {}, { force: true }); // last event before switching off
  await setSettings({ analytics: e.target.checked });
  if (e.target.checked) track('analytics_opt_in');
});

track('page_view', { page_title: 'Settings', page_location: 'bugmark://settings' });
if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ block: 'start' });

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
let tt;
function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2400); }
