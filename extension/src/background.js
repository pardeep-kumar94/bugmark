import { addItem, countByHost, getItem, updateItem, deleteMedia } from './shared/db.js';
import { getGithub, setGithub, createIssue, listRepos } from './shared/github.js';
import { DEFAULT_SETTINGS } from './shared/settings.js';
import { CONFIG } from './shared/config.js';
import { track, bucket } from './shared/analytics.js';
import { startPolling, licensingEnabled, isPro, openCheckout } from './shared/license.js';

// Periodically refresh the Pro license so a purchase made on the website unlocks
// the extension without the user re-opening the popup. No-op when licensing is off.
startPolling();

const REPORT_URL = chrome.runtime.getURL('src/report/report.html');
const OPTIONS_URL = chrome.runtime.getURL('src/options/options.html');

chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  if (reason === 'install' && CONFIG.welcomeUrl) chrome.tabs.create({ url: CONFIG.welcomeUrl });
  if (reason === 'install') track('extension_installed');
  if (reason === 'update' && previousVersion !== chrome.runtime.getManifest().version) track('extension_updated', { previous_version: previousVersion || '' });
});
setUninstallUrl();
chrome.runtime.onStartup.addListener(() => { setUninstallUrl(); track('browser_started'); });

// Opens the website's "sorry to see you go" page when Bugmark is removed (counts uninstalls, asks why).
function setUninstallUrl() {
  if (!/^https:\/\//.test(CONFIG.uninstallUrl || '')) return;
  const url = `${CONFIG.uninstallUrl}?v=${encodeURIComponent(chrome.runtime.getManifest().version)}`;
  chrome.runtime.setUninstallURL(url).catch?.(() => {});
}

// Messages from the Bugmark website (only origins listed in manifest "externally_connectable").
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'bugmark:ping') {
      return { ok: true, version: chrome.runtime.getManifest().version };
    }
    return { ok: false, error: 'Unknown request' };
  })().then(sendResponse);
  return true;
});

// Keyboard shortcuts → toggle annotation / recording on the active tab.
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  track('shortcut_used', { shortcut: command });
  if (command === 'toggle-annotate') await toggleOnTab(tab.id);
  if (command === 'start-recording') {
    const rec = await getRecording();
    if (rec) await stopRecording();
    else await startRecording(tab.id).catch((e) => tellTab(tab.id, { type: 'bugmark:recError', error: e.message }));
  }
});

async function ensureContent(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'bugmark:ping' });
  } catch {
    // Tab was open before install / reload: inject on demand.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/page-hook.js'], world: 'MAIN' }).catch(() => {});
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/content.js'] });
    await new Promise((r) => setTimeout(r, 80));
  }
}
async function toggleOnTab(tabId) {
  await ensureContent(tabId);
  return chrome.tabs.sendMessage(tabId, { type: 'bugmark:toggle' });
}
const tellTab = (tabId, msg) => chrome.tabs.sendMessage(tabId, msg).catch(() => null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

chrome.tabs.onRemoved.addListener((tabId) => { chrome.storage.session.remove(`steps:${tabId}`).catch(() => {}); });

// ---------------------------------------------------------------- steps to reproduce
const STEP_MAX = 30, STEP_AGE = 20 * 60 * 1000;
let stepQueue = Promise.resolve();
async function getSteps(tabId) {
  const key = `steps:${tabId}`;
  const list = (await chrome.storage.session.get(key))[key] || [];
  return list.filter((st) => Date.now() - st.t < STEP_AGE);
}

// ---------------------------------------------------------------- screen recording
const OFFSCREEN_URL = 'src/offscreen/recorder.html';
async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument?.();
  if (!exists) {
    await chrome.offscreen.createDocument({ url: OFFSCREEN_URL, reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'], justification: 'Record the tab with narration for a bug report' });
  }
}
const toOffscreen = (msg) => chrome.runtime.sendMessage({ target: 'offscreen', ...msg });
async function getRecording() { return (await chrome.storage.session.get('recording')).recording || null; }

function trackSaved(it) {
  const logs = it.logs || {};
  track('feedback_saved', {
    feedback_type: it.type || '', priority: it.priority || '',
    capture_mode: it.video ? 'video' : it.breakpoints ? 'breakpoints' : it.fullPage ? 'full_page' : 'visible',
    has_title: !!it.title, has_steps: !!it.steps, marks: bucket((it.marks || []).length),
    console_errors: bucket((it.errors || []).length), network_requests: bucket((logs.network || logs.net || []).length),
  });
}

// Free plan keeps a limited number of saved reports; Pro is unlimited.
// Gating only applies when licensing is configured (packaged/store build).
async function ensureUnderFreeLimit() {
  if (!licensingEnabled) return;
  if (await isPro()) return;
  const limit = CONFIG.licensing.freeLimit;
  if (!limit) return;
  const { total } = await countByHost(null);
  if (total >= limit) {
    const err = new Error(`The free plan keeps ${limit} reports at a time. Upgrade to Bugmark Pro for unlimited reports, or delete a report to make room.`);
    err.code = 'free_limit';
    throw err;
  }
}

async function startRecording(tabId, source = 'shortcut') {
  if (await getRecording()) throw new Error('A recording is already running');
  const settings = { ...DEFAULT_SETTINGS, ...((await chrome.storage.local.get('settings')).settings || {}) };
  await ensureContent(tabId);
  await ensureOffscreen();
  let streamId = null;
  try { streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }); }
  catch { /* not invoked from the toolbar icon / shortcut → fall back to Chrome's share picker */ }
  await tellTab(tabId, { type: 'bugmark:recPending', picker: !streamId });
  const r = await toOffscreen({ type: 'rec:start', streamId, mic: settings.recordMic !== false });
  if (!r?.ok) {
    await tellTab(tabId, { type: 'bugmark:recState', recording: false });
    const cancelled = r?.name === 'NotAllowedError' || /Permission denied|cancel/i.test(r?.error || '');
    throw new Error(cancelled ? 'Recording cancelled' : (r?.error || 'Could not start recording'));
  }
  const rec = { tabId, startedAt: r.startedAt, mic: r.mic, micError: r.micError, source: r.source, maxMs: r.maxMs };
  await chrome.storage.session.set({ recording: rec });
  chrome.action.setBadgeBackgroundColor({ color: '#FF5C7A' });
  chrome.action.setBadgeText({ text: 'REC' });
  await tellTab(tabId, { type: 'bugmark:recState', recording: true, ...rec });
  track('recording_started', { microphone: !!rec.mic, picker: !streamId, start_source: source });
  return rec;
}
async function stopRecording() {
  if (!(await getRecording())) return {};
  await ensureOffscreen();
  await toOffscreen({ type: 'rec:stop' });
  return {};
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return false;
  handler(msg, sender)
    .then((res) => sendResponse({ ok: true, ...res }))
    .catch((err) => sendResponse({ ok: false, error: String(err?.message || err), code: err?.code }));
  return true;
});

const segments = new Map(); // full-page capture sessions

const handlers = {
  async 'bugmark:capture'(msg, sender) {
    const raw = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
    const bmp = await toBitmap(raw);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    canvas.getContext('2d').drawImage(bmp, 0, 0);
    track('screenshot_captured', { capture_mode: msg.delay ? 'delayed' : 'visible' });
    return finalize(canvas, msg.redactions || [], bmp.width / (msg.viewport?.w || bmp.width));
  },

  // Full page: content script scrolls, we grab each viewport, then stitch.
  async 'bugmark:segment'(msg, sender) {
    const raw = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
    const list = segments.get(msg.session) || [];
    list.push({ y: msg.y, raw, main: !!msg.main });
    segments.set(msg.session, list);
    return {};
  },
  async 'bugmark:stitch'(msg) {
    const list = segments.get(msg.session) || [];
    segments.delete(msg.session);
    if (msg.abort || !list.length) return {};
    track('screenshot_captured', { capture_mode: msg.mode === 'element' ? 'element' : 'full_page', segments: list.length });
    if (msg.mode === 'element') return stitchElement(list, msg);
    return stitch(list, msg.viewport, msg.totalH, msg.redactions || []);
  },

  // ---- steps to reproduce
  async 'bugmark:step'(msg, sender) {
    const tabId = sender.tab?.id;
    if (tabId == null) return {};
    const { settings } = await chrome.storage.local.get('settings');
    if (settings && settings.recordSteps === false) return {};
    stepQueue = stepQueue.then(async () => {
      const list = await getSteps(tabId);
      const last = list[list.length - 1];
      if (last && last.text === msg.step.text && msg.step.t - last.t < 1500) return; // double events
      list.push({ t: msg.step.t, text: String(msg.step.text).slice(0, 160), url: String(msg.step.url).slice(0, 500) });
      await chrome.storage.session.set({ [`steps:${tabId}`]: list.slice(-STEP_MAX) });
    }).catch(() => {});
    await stepQueue;
    return {};
  },
  async 'bugmark:getSteps'(msg, sender) {
    return { steps: await getSteps(msg.tabId ?? sender.tab?.id) };
  },
  async 'bugmark:clearSteps'(msg, sender) {
    await chrome.storage.session.remove(`steps:${msg.tabId ?? sender.tab?.id}`);
    return {};
  },

  // ---- breakpoints: render the page at phone / tablet / desktop widths via device emulation
  async 'bugmark:breakpoints'(msg, sender) {
    const tabId = sender.tab.id;
    const target = { tabId };
    const sizes = msg.sizes || [
      { label: 'Mobile', w: 390, h: 844, mobile: true },
      { label: 'Tablet', w: 768, h: 1024, mobile: true },
      { label: 'Desktop', w: 1440, h: 900, mobile: false },
    ];
    try { await chrome.debugger.attach(target, '1.3'); }
    catch (e) { throw new Error(/already attached/i.test(e.message) ? 'Close DevTools device mode on this tab and try again' : `Couldn’t render breakpoints: ${e.message}`); }
    const shots = [];
    try {
      for (const sz of sizes) {
        await chrome.debugger.sendCommand(target, 'Emulation.setDeviceMetricsOverride', { width: sz.w, height: sz.h, deviceScaleFactor: 1, mobile: sz.mobile, screenWidth: sz.w, screenHeight: sz.h });
        await chrome.debugger.sendCommand(target, 'Emulation.setTouchEmulationEnabled', { enabled: sz.mobile, maxTouchPoints: sz.mobile ? 5 : 0 }).catch(() => {});
        await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
          expression: 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 650))))', awaitPromise: true,
        }).catch(() => sleep(700));
        const shot = await chrome.debugger.sendCommand(target, 'Page.captureScreenshot', { format: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: sz.w, height: sz.h, scale: 1 }, captureBeyondViewport: false })
          .catch(() => chrome.debugger.sendCommand(target, 'Page.captureScreenshot', { format: 'jpeg', quality: 86 }));
        shots.push({ label: sz.label, w: sz.w, h: sz.h, image: `data:image/jpeg;base64,${shot.data}` });
      }
    } finally {
      await chrome.debugger.sendCommand(target, 'Emulation.setTouchEmulationEnabled', { enabled: false }).catch(() => {});
      await chrome.debugger.sendCommand(target, 'Emulation.clearDeviceMetricsOverride').catch(() => {});
      await chrome.debugger.detach(target).catch(() => {});
    }
    track('screenshot_captured', { capture_mode: 'breakpoints' });
    const composite = await composeBreakpoints(shots);
    return { ...composite, breakpoints: shots };
  },

  // ---- screen recording
  async 'bugmark:recStart'(msg, sender) {
    return { recording: await startRecording(msg.tabId ?? sender.tab.id, msg.source || 'panel') };
  },
  async 'bugmark:recStop'() { return stopRecording(); },
  async 'bugmark:recStatus'(msg, sender) {
    const rec = await getRecording();
    const tabId = msg.tabId ?? sender.tab?.id;
    return { recording: rec && rec.tabId === tabId ? rec : null, elsewhere: !!rec && rec.tabId !== tabId };
  },
  async 'bugmark:recDone'(msg) {
    const rec = await getRecording();
    await chrome.storage.session.remove('recording');
    chrome.action.setBadgeText({ text: '' });
    if (!rec) return {};
    if (msg.error) { track('recording_failed'); await tellTab(rec.tabId, { type: 'bugmark:recError', error: msg.error }); return {}; }
    track('recording_finished', { duration_sec: Math.round((msg.video?.duration || 0) / 1000), size_mb: Math.round((msg.video?.size || 0) / 1e6), microphone: !!msg.video?.mic, stop_reason: String(msg.reason || 'user') });
    const delivered = await tellTab(rec.tabId, { type: 'bugmark:recorded', video: msg.video, poster: msg.poster, reason: msg.reason });
    if (!delivered) {
      // Tab closed or navigated to a page we can't run on: keep the recording as an item.
      const tab = await chrome.tabs.get(rec.tabId).catch(() => null);
      let host = ''; try { host = new URL(tab?.url || '').host; } catch {}
      await addItem({ title: 'Screen recording', comment: '', type: 'bug', priority: 'medium', status: 'open', url: tab?.url || '', host, pageTitle: tab?.title || '',
        image: msg.poster.image, thumb: msg.poster.thumb, imageW: msg.poster.width, imageH: msg.poster.height, video: msg.video, errors: [] });
      chrome.runtime.sendMessage({ type: 'bugmark:changed' }).catch(() => {});
    }
    return {};
  },
  async 'bugmark:deleteMedia'(msg) { if (msg.mediaId) await deleteMedia(msg.mediaId); return {}; },
  async 'bugmark:openMicPermission'() {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/permissions/mic.html') });
    return {};
  },

  // ---- before / after: capture the item's page as it looks now
  async 'bugmark:captureAfter'(msg, sender) {
    track('after_screenshot_captured');
    const item = await getItem(msg.id);
    if (!item?.url || !/^(https?|file):/.test(item.url)) throw new Error('This item has no page to capture');
    const strip = (u) => u.split('#')[0];
    const tabs = await chrome.tabs.query({});
    let tab = tabs.find((t) => t.url && strip(t.url) === strip(item.url));
    let created = false;
    if (tab) {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      if (msg.reload !== false) await chrome.tabs.reload(tab.id);
    } else {
      const win = sender.tab ? { windowId: sender.tab.windowId } : {};
      tab = await chrome.tabs.create({ url: item.url, active: true, ...win });
      created = true;
    }
    await waitForTab(tab.id);
    await sleep(900);
    const y = item.scroll?.y || 0;
    if (y) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (top) => window.scrollTo(0, top), args: [y] }).catch(() => {});
      await sleep(500);
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'bugmark:hideUi', hidden: true }).catch(() => {});
    await sleep(80);
    const fresh = await chrome.tabs.get(tab.id);
    let raw;
    try { raw = await chrome.tabs.captureVisibleTab(fresh.windowId, { format: 'png' }); }
    finally { await chrome.tabs.sendMessage(tab.id, { type: 'bugmark:hideUi', hidden: false }).catch(() => {}); }
    const bmp = await toBitmap(raw);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    canvas.getContext('2d').drawImage(bmp, 0, 0);
    const shot = await finalize(canvas, [], 1);
    const after = { image: shot.image, thumb: shot.thumb, width: shot.width, height: shot.height, url: fresh.url, createdAt: Date.now(), source: 'capture' };
    await updateItem(item.id, { after });
    if (created) await chrome.tabs.remove(tab.id).catch(() => {});
    if (sender.tab) {
      await chrome.tabs.update(sender.tab.id, { active: true }).catch(() => {});
      await chrome.windows.update(sender.tab.windowId, { focused: true }).catch(() => {});
    }
    chrome.runtime.sendMessage({ type: 'bugmark:changed' }).catch(() => {});
    return { after: { thumb: after.thumb } };
  },
  async 'bugmark:makeThumb'(msg) {
    const bmp = await toBitmap(msg.image);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    canvas.getContext('2d').drawImage(bmp, 0, 0);
    return finalize(canvas, [], 1);
  },

  async 'bugmark:save'(msg) {
    await ensureUnderFreeLimit();
    const item = await addItem(msg.item);
    trackSaved(msg.item);
    const counts = await countByHost(item.host);
    chrome.runtime.sendMessage({ type: 'bugmark:changed' }).catch(() => {});
    return { item: { id: item.id, seq: item.seq }, counts };
  },
  async 'bugmark:checkout'() { await openCheckout(); return {}; },
  async 'bugmark:count'(msg) {
    return { counts: await countByHost(msg.host) };
  },
  async 'bugmark:openReport'(msg) {
    const url = REPORT_URL + (msg.host ? `#host=${encodeURIComponent(msg.host)}` : '');
    const existing = await chrome.tabs.query({ url: REPORT_URL + '*' });
    if (existing[0]) {
      await chrome.tabs.update(existing[0].id, { active: true, url });
      await chrome.windows.update(existing[0].windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
    return {};
  },
  async 'bugmark:openOptions'() {
    await chrome.tabs.create({ url: OPTIONS_URL });
    return {};
  },

  // ---- GitHub
  async 'bugmark:githubStatus'(msg) {
    const g = await getGithub();
    return {
      connected: !!g.token, login: g.login,
      repo: (msg.host && g.repoByHost[msg.host]) || g.defaultRepo, panelOn: g.panelOn,
    };
  },
  async 'bugmark:githubRepos'() {
    const g = await getGithub();
    if (!g.token) throw new Error('Connect GitHub first');
    return { repos: await listRepos(g.token) };
  },
  async 'bugmark:githubIssue'(msg) {
    const item = await getItem(msg.id);
    if (!item) throw new Error('Feedback item not found');
    let issue;
    try { issue = await createIssue(item, msg.opts || {}); }
    catch (err) { track('github_issue_failed'); throw err; }
    track('github_issue_created', { with_screenshot: !!msg.opts?.screenshot, with_context: !!msg.opts?.context, has_video: !!item.video });
    await updateItem(item.id, { github: { repo: issue.repo, number: issue.number, url: issue.url, createdAt: Date.now() } });
    const g = await getGithub();
    await setGithub({ repoByHost: { ...g.repoByHost, [item.host]: issue.repo }, ...(g.defaultRepo ? {} : { defaultRepo: issue.repo }) });
    chrome.runtime.sendMessage({ type: 'bugmark:changed' }).catch(() => {});
    return { issue };
  },
  async 'bugmark:openUrl'(msg) {
    if (/^https:\/\//.test(msg.url || '')) await chrome.tabs.create({ url: msg.url });
    return {};
  },
  async 'bugmark:openGithubSettings'() {
    await chrome.tabs.create({ url: OPTIONS_URL + '#github' });
    return {};
  },
  // Events from content scripts (they can't reach the analytics endpoint themselves).
  async 'bugmark:track'(msg) {
    await track(String(msg.name || ''), msg.params || {});
    return {};
  },
  async 'bugmark:toggleTab'(msg) {
    return (await toggleOnTab(msg.tabId)) || {};
  },
};

function waitForTab(tabId, timeout = 20000) {
  return new Promise((resolve) => {
    const done = () => { clearTimeout(t); chrome.tabs.onUpdated.removeListener(on); resolve(); };
    const on = (id, info) => { if (id === tabId && info.status === 'complete') done(); };
    const t = setTimeout(done, timeout);
    chrome.tabs.onUpdated.addListener(on);
    chrome.tabs.get(tabId).then((tb) => { if (tb.status === 'complete') done(); }).catch(done);
  });
}

// ---- Image processing --------------------------------------------------
async function composeBreakpoints(shots) {
  const bmps = await Promise.all(shots.map((s) => toBitmap(s.image)));
  const gap = 32, pad = 32, label = 44;
  const maxH = Math.max(...shots.map((s) => s.h));
  const W = pad * 2 + shots.reduce((a, s) => a + s.w, 0) + gap * (shots.length - 1);
  const H = pad * 2 + label + maxH;
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#EEF1F4'; ctx.fillRect(0, 0, W, H);
  let x = pad;
  shots.forEach((s, i) => {
    ctx.fillStyle = '#1F2328';
    ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.label, x, pad + label / 2 - 6);
    ctx.fillStyle = '#6B7684';
    ctx.font = '500 16px ui-monospace, Menlo, Consolas, monospace';
    const lw = ctx.measureText(s.label).width;
    ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace';
    const lw2 = ctx.measureText(s.label).width || lw;
    ctx.font = '500 16px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(`${s.w}×${s.h}`, x + lw2 + 12, pad + label / 2 - 5);
    const y = pad + label;
    ctx.fillStyle = 'rgba(15,23,42,.12)'; ctx.fillRect(x - 1, y - 1, s.w + 2, s.h + 2);
    ctx.drawImage(bmps[i], x, y, s.w, s.h);
    x += s.w + gap;
  });
  // Scale very wide composites down to keep files reasonable.
  const scale = Math.min(1, 2600 / W);
  let out = canvas;
  if (scale < 1) {
    out = new OffscreenCanvas(Math.round(W * scale), Math.round(H * scale));
    const o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
    o.drawImage(canvas, 0, 0, out.width, out.height);
  }
  return finalize(out, [], 1);
}

async function toBitmap(dataUrl) {
  return createImageBitmap(await (await fetch(dataUrl)).blob());
}

async function stitch(list, viewport, totalH, redactions) {
  const bmps = [];
  for (const s of list) bmps.push({ y: s.y, bmp: await toBitmap(s.raw) });
  const W = bmps[0].bmp.width;
  const capScale = W / viewport.w;                  // CSS px → captured px
  const out = Math.min(1, 1920 / W);                // keep huge pages manageable
  const scale = capScale * out;
  const cw = Math.round(W * out);
  const ch = Math.min(16384, Math.round(totalH * scale));
  const canvas = new OffscreenCanvas(cw, ch);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  for (const { y, bmp } of bmps) ctx.drawImage(bmp, 0, Math.round(y * scale), cw, Math.round(bmp.height * out));
  return finalize(canvas, redactions, scale);
}

// Inner scroll container: expand the container vertically inside the user's view of the page.
async function stitchElement(list, { viewport, rect, extra, s0, totalH, redactions }) {
  const bmps = [];
  for (const s of list) bmps.push({ y: s.y, main: s.main, bmp: await toBitmap(s.raw) });
  const main = bmps.find((b) => b.main) || bmps[bmps.length - 1];
  const W = main.bmp.width;
  const capScale = W / viewport.w;
  const out = Math.min(1, 1920 / W);
  const k = capScale * out;                        // CSS px → output px
  const cw = Math.round(W * out);
  const ch = Math.min(16384, Math.round(totalH * k));
  const canvas = new OffscreenCanvas(cw, ch);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const src = (bmp, x, y, w, h, dx, dy, dw = w, dh = h) => {
    if (w <= 0 || h <= 0 || dw <= 0 || dh <= 0) return;
    ctx.drawImage(bmp, x * capScale, y * capScale, w * capScale, h * capScale, dx * k, dy * k, dw * k, dh * k);
  };
  const m = main.bmp, vw = viewport.w, vh = viewport.h;
  // 1. Everything above the container, and the column strips beside it (stretched from their last row).
  src(m, 0, 0, vw, rect.b, 0, 0);
  src(m, 0, rect.b - 1, rect.x, 1, 0, rect.b, rect.x, extra);
  src(m, rect.r, rect.b - 1, vw - rect.r, 1, rect.r, rect.b, vw - rect.r, extra);
  // 2. Everything below the container, shifted down.
  src(m, 0, rect.b, vw, vh - rect.b, 0, rect.b + extra);
  // 3. The container's content, top to bottom; the user's own view (with annotations) painted last.
  const order = bmps.filter((b) => b !== main).concat([main]);
  for (const b of order) src(b.bmp, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y + b.y);
  return finalize(canvas, redactions, k);
}

async function finalize(canvas, redactions, scale) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  for (const r of redactions) {
    const x = Math.max(0, Math.round(Math.min(r.x1, r.x2) * scale));
    const y = Math.max(0, Math.round(Math.min(r.y1, r.y2) * scale));
    const w = Math.min(W - x, Math.round(Math.abs(r.x2 - r.x1) * scale));
    const h = Math.min(H - y, Math.round(Math.abs(r.y2 - r.y1) * scale));
    if (w < 2 || h < 2) continue;
    const block = Math.max(6, Math.round(14 * scale));
    const sw = Math.max(1, Math.ceil(w / block)), sh = Math.max(1, Math.ceil(h / block));
    const small = new OffscreenCanvas(sw, sh);
    small.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, sw, sh, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = 'rgba(113,113,122,.28)'; // tint so readers can tell the area was redacted
    ctx.fillRect(x, y, w, h);
  }

  const image = await blobToDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 }));
  // Thumbnail: 720px wide, cropped to the top of tall (full-page) images.
  const tw = Math.min(720, W);
  const srcH = Math.min(H, Math.round(W * 0.75));
  const th = Math.round((srcH / W) * tw);
  const tcan = new OffscreenCanvas(tw, th);
  const tctx = tcan.getContext('2d');
  tctx.imageSmoothingQuality = 'high';
  tctx.drawImage(canvas, 0, 0, W, srcH, 0, 0, tw, th);
  const thumb = await blobToDataUrl(await tcan.convertToBlob({ type: 'image/jpeg', quality: 0.82 }));
  return { image, thumb, width: W, height: H };
}

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  return `data:${blob.type};base64,${btoa(bin)}`;
}
