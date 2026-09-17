import { getAll, getItem, updateItem, deleteItems, putItems, getMedia, putMedia } from '../shared/db.js';
import { buildHar, failedRequests, consoleProblems, fmtDuration, queryParams, prettyBody, hasDetails, toCurl } from '../shared/har.js';
import { getSettings, setSettings } from '../shared/settings.js';
import { buildReportHtml, buildMarkdown, buildCsv, TYPE_META, PRIO_META, esc, firstLine } from './export.js';
import { track, bucket } from '../shared/analytics.js';
import { getGithub, defaultTitle, defaultLabels, isValidRepo } from '../shared/github.js';

const $ = (id) => document.getElementById(id);
const state = { items: [], host: '', q: '', status: 'all', type: 'all', sort: 'newest', exScope: 'filtered', format: 'html' };

const ICON = {
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
  ext: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  issue: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  warn: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
};

// ---------------------------------------------------------------- data
async function load() {
  state.items = await getAll();
  const params = new URLSearchParams(location.hash.slice(1));
  const h = params.get('host');
  if (h !== null) state.host = h;
  if (state.host && !state.items.some((i) => i.host === state.host)) state.host = '';
  render();
}

function scoped() { return state.host ? state.items.filter((i) => i.host === state.host) : state.items; }

function filtered() {
  const q = state.q.toLowerCase();
  let list = scoped().filter((i) =>
    (state.status === 'all' || (state.status === 'resolved' ? i.status === 'resolved' : i.status !== 'resolved')) &&
    (state.type === 'all' || i.type === state.type) &&
    (!q || [i.title, i.comment, i.url, i.pageTitle, `#${i.seq}`].some((s) => String(s || '').toLowerCase().includes(q))));
  if (state.sort === 'oldest') list = [...list].sort((a, b) => a.createdAt - b.createdAt);
  if (state.sort === 'priority') list = [...list].sort((a, b) => (PRIO_META[a.priority]?.rank ?? 9) - (PRIO_META[b.priority]?.rank ?? 9) || b.createdAt - a.createdAt);
  return list;
}

// ---------------------------------------------------------------- render
function render() {
  renderSites();
  const all = scoped();
  const open = all.filter((i) => i.status !== 'resolved');
  $('title').textContent = state.host || 'All feedback';
  document.title = `${state.host || 'All feedback'} · Bugmark`;
  const urgent = open.filter((i) => ['critical', 'high'].includes(i.priority)).length;
  $('summary').innerHTML = all.length
    ? `<span><b>${all.length}</b> items</span><span><b>${open.length}</b> open</span>${urgent ? `<span><i class="dot" style="background:var(--critical)"></i><b>${urgent}</b> high priority</span>` : ''}<span><b>${new Set(all.map((i) => i.url)).size}</b> pages</span>`
    : '<span>Nothing captured yet</span>';

  const list = filtered();
  $('list').innerHTML = list.map(cardHtml).join('');
  const none = !list.length;
  $('empty').hidden = !none;
  if (none) {
    const hasAny = all.length > 0;
    $('emptyTitle').textContent = hasAny ? 'No matches' : 'No feedback yet';
    $('emptyText').innerHTML = hasAny
      ? 'Try a different search or filter.'
      : 'Open any website, click the Bugmark button (or press <kbd>⌥⇧S</kbd>), mark up the page and press <kbd>↵</kbd> to capture.';
  }
  $('exportBtn').disabled = !all.length;
  $('copyMd').disabled = none;
}

function renderSites() {
  const groups = new Map();
  state.items.forEach((i) => groups.set(i.host, (groups.get(i.host) || 0) + 1));
  const entries = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const li = (host, label, n, initial) => `<li><button data-host="${esc(host)}" class="${state.host === host ? 'active' : ''}">
      <span class="fav">${initial}</span><span class="lbl">${esc(label)}</span><span class="num">${n}</span></button></li>`;
  $('sites').innerHTML =
    li('', 'All feedback', state.items.length, '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>') +
    entries.map(([h, n]) => li(h, h, n, esc(h.replace(/^www\./, '').charAt(0).toUpperCase() || '·'))).join('');
}

function cardHtml(it) {
  const tm = TYPE_META[it.type] || TYPE_META.bug;
  const resolved = it.status === 'resolved';
  const opt = (meta, cur) => Object.entries(meta).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v.label}</option>`).join('');
  let path = it.url; try { const u = new URL(it.url); path = (state.host ? '' : u.host) + u.pathname; } catch {}
  const errs = it.errors?.length || 0;
  return `
  <article class="card ${resolved ? 'resolved' : ''}" data-id="${it.id}">
    <button class="thumb ${it.after ? 'pair' : ''}" data-act="zoom" aria-label="${it.video ? 'Play recording' : 'View screenshot'}">
      <img src="${it.thumb || it.image}" alt="" loading="lazy">${it.after ? `<img src="${it.after.thumb || it.after.image}" alt="" loading="lazy"><span class="ba b">Before</span><span class="ba a">After</span>` : ''}
      ${it.video ? `<span class="play">${ICON.play}</span><span class="dur">${fmtDuration(it.video.duration)}</span>` : ''}
    </button>
    <div class="card-body">
      <div class="card-top">
        <span class="seq">#${it.seq}</span>
        <select class="pill type" data-field="type" style="--c:${tm.color}" aria-label="Type">${opt(TYPE_META, it.type)}</select>
        <select class="pill type" data-field="priority" style="--c:${(PRIO_META[it.priority] || PRIO_META.medium).color}" aria-label="Priority">${opt(PRIO_META, it.priority)}</select>
        <span class="grow"></span>
        ${it.github?.url
          ? `<a class="btn gh-link" href="${esc(it.github.url)}" target="_blank" rel="noopener" title="${esc(it.github.repo)}#${it.github.number}">${ICON.issue}#${it.github.number}</a>`
          : `<button class="btn gh-btn" data-act="github" title="Create a GitHub issue from this item">${ICON.issue}GitHub issue</button>`}
        <button class="btn resolve ${resolved ? 'on' : ''}" data-act="resolve">${ICON.check}${resolved ? 'Resolved' : 'Mark resolved'}</button>
        <button class="icon-btn del" data-act="delete" title="Delete" aria-label="Delete">${ICON.trash}</button>
      </div>
      <input class="title-input" data-field="title" value="${esc(it.title)}" placeholder="${esc(firstLine(it.comment) || 'Add a title')}" maxlength="140">
      <textarea class="comment-input" data-field="comment" rows="2" placeholder="Add a comment">${esc(it.comment)}</textarea>
      <div class="card-meta">
        <a href="${/^(https?|file):/.test(it.url) ? esc(it.url) : '#'}" target="_blank" rel="noopener" title="${esc(it.url)}">${esc(path)} ${ICON.ext}</a>
        <span>${it.viewport?.w}×${it.viewport?.h}</span>
        <span>${esc(it.browser)} · ${esc(it.os)}</span>
        <span title="${new Date(it.createdAt).toLocaleString()}">${ago(it.createdAt)}${it.reviewer ? ` · ${esc(it.reviewer)}` : ''}</span>
        ${it.fullPage ? '<span class="chip">Full page</span>' : ''}
        ${it.video ? `<span class="chip vid">Video ${fmtDuration(it.video.duration)}${it.video.mic ? ' · voice' : ''}</span>` : ''}
        ${it.breakpoints?.length ? `<span class="chip bp">${it.breakpoints.map((b) => b.label).join(' · ')}</span>` : ''}
        ${it.after ? '<span class="chip after">After shot</span>' : ''}
        ${it.elements?.length ? `<span class="chip el" title="${esc(it.elements.map((e) => e.selector).join('\n'))}">${it.elements.length} element${it.elements.length > 1 ? 's' : ''}</span>` : ''}
        ${errs ? `<span class="warn" title="${esc(it.errors.map((e) => e.message).join('\n'))}">${ICON.warn}${errs} page error${errs > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="card-actions">
        ${it.steps ? `<button class="btn ghost" data-act="details" data-tab="steps">Steps (${it.steps.split('\n').filter(Boolean).length})</button>` : ''}
        ${it.logs ? `<button class="btn ghost" data-act="details" data-tab="network">Network ${it.logs.network?.length || 0}${failedRequests(it).length ? ` · <span class="bad">${failedRequests(it).length} failed</span>` : ''}</button>
        <button class="btn ghost" data-act="details" data-tab="console">Console ${it.logs.console?.length || 0}</button>` : ''}
        <button class="btn ghost" data-act="after">${it.after ? 'Change after shot' : '+ After shot'}</button>
      </div>
    </div>
  </article>`;
}

function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------- events
$('sites').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-host]');
  if (!b) return;
  state.host = b.dataset.host;
  history.replaceState(null, '', state.host ? `#host=${encodeURIComponent(state.host)}` : '#');
  render();
});
$('q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
$('statusSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.status = b.dataset.v;
  $('statusSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  render();
});
$('typeFilter').addEventListener('change', (e) => { state.type = e.target.value; render(); });
$('sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

$('list').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = b.closest('.card').dataset.id;
  const it = state.items.find((i) => i.id === id);
  if (b.dataset.act !== 'delete') track('report_action', { action: b.dataset.act, tab: b.dataset.tab || '' });
  if (b.dataset.act === 'zoom') {
    openLightbox(await getItem(id));
  } else if (b.dataset.act === 'details') {
    openDetails(await getItem(id), b.dataset.tab);
  } else if (b.dataset.act === 'after') {
    openAfter(it);
  } else if (b.dataset.act === 'resolve') {
    await patch(id, { status: it.status === 'resolved' ? 'open' : 'resolved' });
    render();
  } else if (b.dataset.act === 'github') {
    openGithubDialog(it);
  } else if (b.dataset.act === 'delete') {
    if (!confirm(`Delete feedback #${it.seq}? This can’t be undone.`)) return;
    await deleteItems([id]);
    track('feedback_deleted');
    state.items = state.items.filter((i) => i.id !== id);
    render();
    toast(`Deleted #${it.seq}`);
  }
});

$('list').addEventListener('change', async (e) => {
  const f = e.target.dataset.field;
  if (!f) return;
  const id = e.target.closest('.card').dataset.id;
  await patch(id, { [f]: e.target.value.trim() });
  if (f === 'type' || f === 'priority') render();
});
$('list').addEventListener('keydown', (e) => {
  if (e.target.classList.contains('title-input') && e.key === 'Enter') e.target.blur();
});

async function patch(id, p) {
  const next = await updateItem(id, p);
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx > -1 && next) state.items[idx] = next;
}

// ---------------------------------------------------------------- lightbox (image · video · before/after)
let lbUrl = '';
function closeLightbox() {
  $('lightbox').hidden = true;
  $('lbStage').innerHTML = '';
  if (lbUrl) { URL.revokeObjectURL(lbUrl); lbUrl = ''; }
  $('lbDownload').hidden = true;
}
async function openLightbox(full) {
  const stage = $('lbStage');
  stage.innerHTML = '';
  $('lbDownload').hidden = true;
  if (full.video?.mediaId) {
    const blob = await getMedia(full.video.mediaId);
    if (!blob) { toast('Recording file is missing'); return; }
    lbUrl = URL.createObjectURL(blob);
    const v = Object.assign(document.createElement('video'), { src: lbUrl, controls: true, autoplay: true, poster: full.image });
    fixWebmDuration(v);
    v.addEventListener('click', (e) => e.stopPropagation());
    stage.appendChild(v);
    Object.assign($('lbDownload'), { href: lbUrl, download: `bugmark-${full.seq}-recording.webm`, hidden: false });
  } else if (full.after) {
    stage.innerHTML = `<div class="lb-pair"><figure><figcaption>Before</figcaption><img src="${full.image}" alt=""></figure><figure class="after"><figcaption>After</figcaption><img src="${full.after.image}" alt=""></figure></div>`;
  } else {
    stage.innerHTML = `<img src="${full.image}" alt="">`;
  }
  $('lightbox').hidden = false;
}
// MediaRecorder WebM files have no duration header; seeking to the end once makes the seek bar work.
function fixWebmDuration(v) {
  v.addEventListener('loadedmetadata', function once() {
    v.removeEventListener('loadedmetadata', once);
    if (v.duration !== Infinity) return;
    const back = () => { v.removeEventListener('durationchange', back); v.currentTime = 0; v.play().catch(() => {}); };
    v.addEventListener('durationchange', back);
    v.currentTime = 1e9;
  });
}
$('lightbox').addEventListener('click', (e) => { if (!e.target.closest('video, .lb-actions a')) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('lightbox').hidden) closeLightbox(); });

// ---------------------------------------------------------------- details: steps · network · console
const dt = { item: null, tab: 'steps', q: '', only: false, open: -1 };
function openDetails(item, tab = 'steps') {
  dt.item = item; dt.tab = tab; dt.q = ''; dt.only = false; dt.open = -1;
  $('dtFilter').value = ''; $('dtOnly').checked = false;
  $('dtTitle').textContent = `#${item.seq} · ${item.title || firstLine(item.comment) || 'Untitled'}`;
  const n = item.logs?.network?.length || 0, c = item.logs?.console?.length || 0;
  $('dtSub').textContent = `${item.url} · ${n} requests · ${c} console messages`;
  $('dtHar').disabled = !item.logs;
  renderDetails();
  $('detailDialog').showModal();
}
function renderDetails() {
  const it = dt.item, q = dt.q.toLowerCase();
  $('dtTabs').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.v === dt.tab));
  $('dtFilter').hidden = $('dtOnly').parentElement.hidden = dt.tab === 'steps';
  $('dtOnly').closest('label').hidden = dt.tab === 'steps';
  $('dtCopy').hidden = dt.tab !== 'steps';
  const body = $('dtBody');
  if (dt.tab === 'steps') {
    const lines = String(it.steps || '').split('\n').map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
    body.innerHTML = lines.length ? `<ol class="steps-list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : '<div class="dt-empty">No steps were recorded for this item.</div>';
    return;
  }
  if (dt.tab === 'network') {
    const all = it.logs?.network || [];
    let rows = all.map((r, i) => ({ r, i }));
    if (dt.only) rows = rows.filter(({ r }) => r.status >= 400 || r.status === 0);
    if (q) rows = rows.filter(({ r }) => `${r.method} ${r.url} ${r.status} ${r.type} ${r.requestBody?.text || ''} ${r.responseBody?.text || ''}`.toLowerCase().includes(q));
    body.innerHTML = rows.length ? `<table class="log-table net-table"><thead><tr><th style="width:18px"></th><th>Status</th><th>Method</th><th>URL</th><th>Type</th><th style="text-align:right">Time</th></tr></thead><tbody>${rows.map(({ r, i }) => {
      const bad = r.status >= 400 || r.status === 0;
      const can = hasDetails(r);
      const open = dt.open === i;
      return `<tr class="${bad ? 'bad' : ''} ${can ? 'expandable' : ''} ${open ? 'open' : ''}" data-i="${i}"><td class="caret">${can ? (open ? '▾' : '▸') : ''}</td><td class="st">${r.status || 'failed'}</td><td>${esc(r.method)}</td><td class="url" title="${esc(r.error || '')}">${esc(r.url)}${r.error ? `<br><small>${esc(r.error)}</small>` : ''}${r.requestBody || r.responseBody ? '<span class="has-body">body</span>' : ''}</td><td>${esc(r.type)}</td><td class="num">${r.duration} ms</td></tr>
        ${open ? `<tr class="req-detail"><td colspan="6">${requestDetail(r, i)}</td></tr>` : ''}`;
    }).join('')}</tbody></table>` : '<div class="dt-empty">No requests match.</div>';
    return;
  }
  let rows = it.logs?.console || [];
  if (dt.only) rows = rows.filter((r) => r.level === 'error' || r.level === 'warn');
  if (q) rows = rows.filter((r) => `${r.level} ${r.text}`.toLowerCase().includes(q));
  body.innerHTML = rows.length ? `<table class="log-table"><thead><tr><th style="width:90px">Time</th><th style="width:64px">Level</th><th>Message</th></tr></thead><tbody>${rows.map((r) =>
    `<tr class="${r.level === 'error' ? 'bad' : ''}"><td class="num" style="text-align:left">${new Date(r.t).toLocaleTimeString()}</td><td><span class="lvl ${esc(r.level)}">${esc(r.level)}</span></td><td class="msg">${esc(r.text)}${r.source ? `<br><small>${esc(r.source)}</small>` : ''}</td></tr>`).join('')}</tbody></table>`
    : '<div class="dt-empty">No console messages match.</div>';
}
function kvTable(list) {
  return list.length ? `<table class="kv">${list.map((h) => `<tr><th>${esc(h.name)}</th><td class="${h.value === '[redacted]' ? 'masked' : ''}">${esc(h.value)}</td></tr>`).join('')}</table>` : '<p class="none">None</p>';
}
function bodyBlock(b, which) {
  if (!b) return `<p class="none">${which === 'response' ? 'Not recorded (older request, opaque or cross-origin response, or body recording is off)' : 'No body'}</p>`;
  const txt = prettyBody(b);
  return `<div class="body-meta">${esc(b.mime || 'unknown type')}${b.size ? ` · ${b.size.toLocaleString()} chars` : ''}${b.truncated ? ' · <b>truncated</b>' : ''}
      ${txt && !b.binary ? `<button class="btn ghost sm copy" data-copy="${which}">Copy</button>` : ''}</div>
    <pre class="code">${esc(txt || '(empty)')}</pre>`;
}
function requestDetail(r, i) {
  const params = queryParams(r.url);
  const sec = (title, inner, open = true) => `<details class="rd" ${open ? 'open' : ''}><summary>${title}</summary>${inner}</details>`;
  return `<div class="rd-wrap" data-i="${i}">
    <div class="rd-actions"><button class="btn ghost sm" data-copy="url">Copy URL</button><button class="btn ghost sm" data-copy="curl">Copy as cURL</button></div>
    ${params.length ? sec(`Query params (${params.length})`, kvTable(params)) : ''}
    ${r.requestBody || !/^(GET|HEAD)$/.test(r.method) ? sec('Request body / payload', bodyBlock(r.requestBody, 'request')) : ''}
    ${sec('Response', bodyBlock(r.responseBody, 'response'))}
    ${sec(`Request headers (${r.requestHeaders?.length || 0})`, kvTable(r.requestHeaders || []), false)}
    ${sec(`Response headers (${r.responseHeaders?.length || 0})`, kvTable(r.responseHeaders || []), false)}
  </div>`;
}
$('dtBody').addEventListener('click', async (e) => {
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    const r = dt.item.logs.network[+copy.closest('.rd-wrap').dataset.i];
    const what = copy.dataset.copy;
    const text = what === 'url' ? r.url : what === 'curl' ? toCurl(r) : prettyBody(what === 'request' ? r.requestBody : r.responseBody);
    await navigator.clipboard.writeText(text);
    toast(what === 'curl' ? 'cURL command copied' : 'Copied');
    return;
  }
  if (e.target.closest('.req-detail')) return;
  const row = e.target.closest('tr.expandable');
  if (!row || dt.tab !== 'network') return;
  const i = +row.dataset.i;
  const scroll = $('dtBody').scrollTop;
  dt.open = dt.open === i ? -1 : i;
  renderDetails();
  $('dtBody').scrollTop = scroll;
});
$('dtTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { dt.tab = b.dataset.v; renderDetails(); } });
$('dtFilter').addEventListener('input', (e) => { dt.q = e.target.value; renderDetails(); });
$('dtOnly').addEventListener('change', (e) => { dt.only = e.target.checked; renderDetails(); });
$('dtClose').addEventListener('click', () => $('detailDialog').close());
$('dtCopy').addEventListener('click', async () => { await navigator.clipboard.writeText(dt.item.steps || ''); toast('Steps copied'); });
$('dtHar').addEventListener('click', () => {
  const har = buildHar(dt.item);
  download(new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' }), `bugmark-${dt.item.seq}-${dt.item.host || 'page'}.har`);
  toast('HAR downloaded — open it in Chrome DevTools → Network');
  track('har_downloaded');
});

// ---------------------------------------------------------------- after shot
let afItem = null;
function openAfter(it) {
  afItem = it;
  $('afSub').textContent = `#${it.seq} · show the fix next to the original report.`;
  $('afRemove').hidden = !it.after;
  $('afErr').hidden = true;
  $('afterDialog').querySelectorAll('.af-opt').forEach((b) => b.classList.remove('busy'));
  $('afterDialog').showModal();
}
async function saveAfterImage(dataUrl, source) {
  const r = await chrome.runtime.sendMessage({ type: 'bugmark:makeThumb', image: dataUrl });
  if (!r?.ok) throw new Error(r?.error || 'Could not read that image');
  await patch(afItem.id, { after: { image: r.image, thumb: r.thumb, width: r.width, height: r.height, createdAt: Date.now(), source } });
  $('afterDialog').close();
  render();
  toast(`After shot added to #${afItem.seq}`);
}
const fileToDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
function afError(m) { $('afErr').textContent = m; $('afErr').hidden = false; $('afterDialog').querySelectorAll('.af-opt').forEach((b) => b.classList.remove('busy')); }
$('afterDialog').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-af]'); if (!b) return;
  $('afErr').hidden = true;
  if (b.dataset.af === 'upload') { $('afFile').click(); return; }
  b.classList.add('busy');
  if (b.dataset.af === 'paste') {
    try {
      const items = await navigator.clipboard.read();
      const it = items.find((x) => x.types.some((t) => t.startsWith('image/')));
      if (!it) throw new Error('No image on the clipboard — copy a screenshot first');
      const blob = await it.getType(it.types.find((t) => t.startsWith('image/')));
      await saveAfterImage(await fileToDataUrl(blob), 'paste');
    } catch (err) { afError(err.message.includes('denied') ? 'Clipboard access was blocked — press ⌘/Ctrl V instead' : err.message); }
    return;
  }
  b.querySelector('b').textContent = 'Capturing…';
  const r = await chrome.runtime.sendMessage({ type: 'bugmark:captureAfter', id: afItem.id }).catch((err) => ({ ok: false, error: err.message }));
  b.querySelector('b').textContent = 'Capture the page now';
  if (!r?.ok) { afError(r?.error || 'Could not capture the page'); return; }
  $('afterDialog').close();
  await load();
  toast(`After shot added to #${afItem.seq}`);
});
$('afFile').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try { await saveAfterImage(await fileToDataUrl(f), 'upload'); } catch (err) { afError(err.message); }
});
document.addEventListener('paste', async (e) => {
  if (!$('afterDialog').open) return;
  const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
  if (!file) return;
  e.preventDefault();
  try { await saveAfterImage(await fileToDataUrl(file), 'paste'); } catch (err) { afError(err.message); }
});
$('afRemove').addEventListener('click', async () => {
  await patch(afItem.id, { after: null });
  $('afterDialog').close();
  render();
  toast('After shot removed');
});

// Copy markdown
$('copyMd').addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildMarkdown(filtered(), `${state.host || 'Website'} feedback`));
  toast('Markdown copied to clipboard');
});

// ---------------------------------------------------------------- export report
function exportItems() {
  const base = state.exScope === 'filtered' ? filtered() : state.exScope === 'open' ? scoped().filter((i) => i.status !== 'resolved') : scoped();
  return [...base].sort((a, b) => a.seq - b.seq);
}
function updateExCount() {
  const n = exportItems().length;
  $('exCount').textContent = `${n} item${n === 1 ? '' : 's'} will be included`;
  $('exGo').disabled = !n;
}
$('exFormat').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.format = b.dataset.v;
  $('exFormat').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  $('exGo').textContent = { html: 'Download report', pdf: 'Open print dialog', csv: 'Download CSV' }[state.format];
});

$('exScope').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.exScope = b.dataset.v;
  $('exScope').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  updateExCount();
});

$('exportBtn').addEventListener('click', async () => {
  const s = await getSettings();
  const hosts = [...new Set(scoped().map((i) => i.host))];
  $('exTitle').value = `${state.host || (hosts.length === 1 ? hosts[0] : 'Website')} — Feedback review`;
  $('exBy').value = s.reviewer || '';
  $('exBrand').textContent = s.brand.company || s.brand.logo ? `Branded as ${s.brand.company || 'your logo'}` : '';
  updateExCount();
  $('exportDialog').showModal();
});

$('exportForm').addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'go') return;
  const ids = exportItems().map((i) => i.id);
  const items = (await Promise.all(ids.map(getItem))).sort((a, b) => a.seq - b.seq); // full-resolution images
  const s = await getSettings();
  if ($('exBy').value.trim()) setSettings({ reviewer: $('exBy').value.trim() });
  const slug = ($('exTitle').value || 'feedback').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 10);
  const format = state.format;
  track('report_exported', { export_format: format, items: bucket(items.length), scope: state.exScope, has_video: items.some((i) => i.video) });

  if (format === 'csv') {
    download(new Blob([buildCsv(items)], { type: 'text/csv;charset=utf-8' }), `${slug}-${stamp}.csv`);
    toast(`CSV exported · ${items.length} rows`);
    return;
  }
  const hasBrand = !!(s.brand.company || s.brand.logo || !['#0B0B0C', '#E11D48', '#16A34A'].includes(s.brand.accent));
  const media = {};
  if (format === 'html') {
    let budget = 60 * 1024 * 1024; // embed recordings up to ~60 MB in total
    for (const it of items) {
      if (!it.video?.mediaId) continue;
      const blob = await getMedia(it.video.mediaId);
      if (blob && blob.size <= budget) { media[it.video.mediaId] = await fileToDataUrl(blob); budget -= blob.size; }
    }
  }
  const html = buildReportHtml({
    media, print: format === 'pdf',
    title: $('exTitle').value.trim() || 'Website feedback',
    preparedBy: $('exBy').value.trim(),
    preparedFor: $('exFor').value.trim(),
    note: $('exNote').value.trim(),
    items,
    brand: hasBrand ? s.brand : null,
    poweredBy: !hasBrand,
  });
  if (format === 'pdf') { printHtml(html); return; }
  download(new Blob([html], { type: 'text/html' }), `${slug}-${stamp}.html`);
  toast(`Report exported · ${items.length} item${items.length === 1 ? '' : 's'}`);
});

// ---------------------------------------------------------------- GitHub issue
let ghItem = null;
let reposLoaded = false;
async function openGithubDialog(it) {
  const g = await getGithub();
  if (!g.token) {
    toast('Connect GitHub in Settings first');
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html#github') });
    return;
  }
  ghItem = it;
  $('ghSub').textContent = `Feedback #${it.seq} → a new issue${g.login ? ` as @${g.login}` : ''}.`;
  $('ghRepo').value = g.repoByHost[it.host] || g.defaultRepo || '';
  $('ghTitle').value = defaultTitle(it);
  $('ghLabels').value = defaultLabels(it, g).join(', ');
  $('ghShot').checked = g.uploadScreenshots;
  $('ghCtx').checked = true;
  $('ghErr').hidden = true;
  $('ghGo').disabled = false; $('ghGo').textContent = 'Create issue';
  $('ghDialog').showModal();
  if (!reposLoaded) {
    reposLoaded = true;
    chrome.runtime.sendMessage({ type: 'bugmark:githubRepos' }).then((r) => {
      if (r?.ok) $('ghRepoList').innerHTML = r.repos.filter((x) => x.issues).map((x) => `<option value="${esc(x.full)}">${x.private ? 'Private' : 'Public'}</option>`).join('');
      else reposLoaded = false;
    }).catch(() => { reposLoaded = false; });
  }
}

$('ghForm').addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'go') return;
  e.preventDefault();
  const repo = $('ghRepo').value.trim();
  if (!isValidRepo(repo)) { $('ghErr').textContent = 'Use the owner/repository format, e.g. acme/website.'; $('ghErr').hidden = false; return; }
  $('ghGo').disabled = true; $('ghGo').textContent = $('ghShot').checked ? 'Uploading…' : 'Creating…';
  $('ghErr').hidden = true;
  const res = await chrome.runtime.sendMessage({
    type: 'bugmark:githubIssue', id: ghItem.id,
    opts: {
      repo, title: $('ghTitle').value.trim(), screenshot: $('ghShot').checked, context: $('ghCtx').checked,
      labels: $('ghLabels').value.split(',').map((l) => l.trim()).filter(Boolean),
    },
  }).catch((err) => ({ ok: false, error: err.message }));
  $('ghGo').disabled = false; $('ghGo').textContent = 'Create issue';
  if (!res?.ok) { $('ghErr').textContent = res?.error || 'Could not create the issue'; $('ghErr').hidden = false; return; }
  $('ghDialog').close();
  await load();
  toastLink(`Issue #${res.issue.number} created in ${res.issue.repo}${res.issue.warning ? ` · ${res.issue.warning}` : ''}`, res.issue.url, 'Open');
});

// ---------------------------------------------------------------- backup
$('backupBtn').addEventListener('click', async () => {
  const items = await getAll();
  const media = {};
  for (const it of items) {
    if (!it.video?.mediaId) continue;
    const blob = await getMedia(it.video.mediaId);
    if (blob) media[it.video.mediaId] = await fileToDataUrl(blob);
  }
  download(new Blob([JSON.stringify({ app: 'bugmark', version: 2, exportedAt: Date.now(), items, media })], { type: 'application/json' }),
    `bugmark-backup-${new Date().toISOString().slice(0, 10)}.json`);
  track('backup_exported', { items: bucket(items.length) });
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'bugmark' || !Array.isArray(data.items)) throw new Error('Not a Bugmark backup');
    await putItems(data.items);
    for (const [id, url] of Object.entries(data.media || {})) await putMedia(id, await (await fetch(url)).blob());
    await load();
    toast(`Imported ${data.items.length} items`);
    track('backup_imported', { items: bucket(data.items.length) });
  } catch (err) { toast(err.message); }
  e.target.value = '';
});

// Print from a real tab (not a hidden 0×0 iframe): Chrome lays the page out at the paper width,
// so nothing gets cropped at the sides.
function printHtml(html) {
  const win = window.open('', '_blank');
  if (!win) { toast('Allow pop-ups for Bugmark to create the PDF'); return; }
  const doc = win.document;
  doc.open();
  doc.write(html.replace(/<img([^>]*?) loading="lazy"/g, '<img$1').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<details class="(errs|net|rq)"( open)?>/g, '<details class="$1" open>'));
  doc.close();
  const go = async () => {
    await Promise.all([...doc.images].map((img) => img.complete ? 0 : new Promise((r) => { img.onload = img.onerror = r; })));
    await doc.fonts?.ready;
    win.focus();
    win.print();
  };
  let started = false;
  const once = () => { if (!started) { started = true; go(); } };
  if (doc.readyState === 'complete') once(); else { win.addEventListener('load', once, { once: true }); setTimeout(once, 1500); }
  toast('Choose “Save as PDF” as the destination in the print dialog', 4000);
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

let toastTimer;
function toast(msg, ms = 2400) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), ms);
}
function toastLink(msg, url, label) {
  toast(msg, 6000);
  const a = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener', textContent: label });
  $('toast').appendChild(a);
}

chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === 'bugmark:changed') load(); });
chrome.storage.onChanged.addListener((c, area) => { if (area === 'local' && c.github) reposLoaded = false; });
window.addEventListener('hashchange', load);
load().then(() => track('report_opened', { items: bucket(state.items.length), sites: bucket(new Set(state.items.map((i) => i.host)).size) }));
