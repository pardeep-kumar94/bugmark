// GitHub integration — create issues from captured feedback.
// Auth: GitHub device flow (if CONFIG.github.clientId is set) or a personal access token.
// Screenshots are committed to a dedicated orphan branch and embedded in the issue body.
import { CONFIG } from './config.js';
import { getMedia } from './db.js';
import { buildHar, prettyBody, queryParams } from './har.js';

const API = (CONFIG.github?.apiBase || 'https://api.github.com').replace(/\/$/, '');
const WEB = (CONFIG.github?.webBase || 'https://github.com').replace(/\/$/, '');

export const GITHUB_DEFAULTS = {
  token: '',
  tokenType: '',          // 'pat' | 'oauth'
  login: '',
  avatar: '',
  defaultRepo: '',        // "owner/repo"
  repoByHost: {},         // last repo used per website
  uploadScreenshots: true,
  branch: 'bugmark-assets',
  addLabels: true,        // type + priority labels
  extraLabels: '',        // comma separated, e.g. "from-bugmark"
  panelOn: true,          // "Create GitHub issue" toggle in the capture panel
};

export async function getGithub() {
  const { github } = await chrome.storage.local.get('github');
  return { ...GITHUB_DEFAULTS, ...(github || {}) };
}
export async function setGithub(patch) {
  const next = { ...(await getGithub()), ...patch };
  await chrome.storage.local.set({ github: next });
  return next;
}
export async function disconnectGithub() {
  const cur = await getGithub();
  await chrome.storage.local.set({ github: { ...cur, token: '', tokenType: '', login: '', avatar: '' } });
}

export const isValidRepo = (s) => /^[\w.-]+\/[\w.-]+$/.test(String(s || '').trim());

// ---------------------------------------------------------------- REST
export class GithubError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function gh(token, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new GithubError('Couldn’t reach GitHub. Check your connection and try again.', 0);
  }
  let data = null;
  try { data = res.status === 204 ? null : await res.json(); } catch {}
  if (!res.ok) throw new GithubError(explain(res, data, path), res.status);
  return data;
}

function explain(res, data, path) {
  const m = data?.message || '';
  if (res.status === 401) return 'GitHub rejected the token — it may be expired or revoked. Reconnect in Settings → GitHub.';
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') return 'GitHub rate limit reached. Try again in a few minutes.';
  if (res.status === 403 || (res.status === 404 && /\/(issues|contents|git)\b/.test(path))) {
    return /\/contents|\/git/.test(path)
      ? 'The token can’t write to this repository’s contents (needed for screenshots).'
      : 'Repository not found, or the token can’t create issues there.';
  }
  if (res.status === 404) return 'Repository not found, or the token has no access to it.';
  if (res.status === 410) return 'Issues are disabled for this repository.';
  if (res.status === 409) return m || 'GitHub reported a conflict.';
  if (res.status === 422) return m ? `GitHub: ${m}${data?.errors?.[0]?.message ? ` — ${data.errors[0].message}` : ''}` : 'GitHub couldn’t process the request.';
  return m ? `GitHub: ${m}` : `GitHub error ${res.status}`;
}

export async function fetchUser(token) {
  const u = await gh(token, '/user');
  return { login: u.login, avatar: u.avatar_url || '' };
}

/** Repositories the token can reach, most recently pushed first. */
export async function listRepos(token) {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const list = await gh(token, `/user/repos?per_page=100&sort=pushed&page=${page}`);
    out.push(...list.map((r) => ({ full: r.full_name, private: r.private, issues: r.has_issues !== false, push: !!r.permissions?.push })));
    if (list.length < 100) break;
  }
  return out;
}

// ---------------------------------------------------------------- device flow (optional)
async function form(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  return res.json();
}
export const deviceFlowAvailable = () => !!CONFIG.github?.clientId;

export async function startDeviceFlow() {
  const d = await form(`${WEB}/login/device/code`, { client_id: CONFIG.github.clientId, scope: CONFIG.github.scope || 'repo' });
  if (!d.device_code) throw new GithubError(d.error_description || 'Couldn’t start GitHub sign-in.', 0);
  return d; // { device_code, user_code, verification_uri, interval, expires_in }
}

/** Polls until the user authorizes. Pass an AbortSignal to cancel. */
export async function pollDeviceFlow(d, signal) {
  let interval = (d.interval || 5) * 1000;
  const until = Date.now() + (d.expires_in || 900) * 1000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, interval));
    if (signal?.aborted) throw new GithubError('Sign-in cancelled.', 0);
    const r = await form(`${WEB}/login/oauth/access_token`, {
      client_id: CONFIG.github.clientId, device_code: d.device_code, grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });
    if (r.access_token) return r.access_token;
    if (r.error === 'slow_down') interval += 5000;
    else if (r.error !== 'authorization_pending') throw new GithubError(r.error === 'access_denied' ? 'Sign-in was cancelled on GitHub.' : (r.error_description || 'GitHub sign-in failed.'), 0);
  }
  throw new GithubError('The sign-in code expired. Try again.', 0);
}

export async function connectWithToken(token, tokenType = 'pat') {
  const t = String(token || '').trim();
  if (!t) throw new GithubError('Paste a GitHub token first.', 0);
  const user = await fetchUser(t);
  return setGithub({ token: t, tokenType, ...user });
}

// ---------------------------------------------------------------- screenshots
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

async function ensureBranch(token, repo, branch) {
  try {
    await gh(token, `/repos/${repo}/git/ref/heads/${enc(branch)}`);
    return;
  } catch (e) { if (e.status !== 404) throw e; }
  // Orphan branch so screenshots never touch the project's real history.
  const tree = await gh(token, `/repos/${repo}/git/trees`, { method: 'POST', body: { tree: [{ path: 'README.md', mode: '100644', type: 'blob',
    content: '# Bugmark screenshots\n\nImages attached to GitHub issues created with Bugmark. Safe to keep; deleting files breaks images in those issues.\n' }] } });
  const commit = await gh(token, `/repos/${repo}/git/commits`, { method: 'POST', body: { message: 'Bugmark: screenshot storage', tree: tree.sha, parents: [] } });
  try {
    await gh(token, `/repos/${repo}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
  } catch (e) { if (e.status !== 422) throw e; } // created concurrently
}

async function uploadImage(token, repo, branch, path, dataUrl) {
  const base64 = typeof dataUrl === 'object' ? dataUrl.base64 : String(dataUrl).split(',')[1];
  if (!base64) throw new GithubError('Screenshot missing.', 0);
  await gh(token, `/repos/${repo}/contents/${enc(path)}`, { method: 'PUT', body: { message: `Bugmark: add ${path.split('/').pop()}`, content: base64, branch } });
  return `${WEB}/${repo}/blob/${enc(branch)}/${enc(path)}?raw=true`;
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// ---------------------------------------------------------------- issue content
const TYPE_LABEL = { bug: 'bug', design: 'design', content: 'content', idea: 'enhancement' };
const TYPE_NAME = { bug: 'Bug', design: 'Design', content: 'Content', idea: 'Idea' };
const PRIO_NAME = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export function defaultTitle(it) {
  const l = String(it.title || '').trim() || String(it.comment || '').split('\n')[0].trim();
  return (l.length > 120 ? l.slice(0, 118) + '…' : l) || `Feedback #${it.seq}`;
}

export function defaultLabels(it, settings) {
  const labels = [];
  if (settings.addLabels) {
    if (TYPE_LABEL[it.type]) labels.push(TYPE_LABEL[it.type]);
    if (PRIO_NAME[it.priority]) labels.push(`priority: ${it.priority}`);
  }
  String(settings.extraLabels || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((l) => labels.push(l));
  return [...new Set(labels)];
}

const fmtDur = (ms) => { const x = Math.round((ms || 0) / 1000); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const fence = (s) => { const t = String(s); const n = Math.max(3, ...(t.match(/`+/g) || []).map((m) => m.length + 1)); return '`'.repeat(n); };

export function buildIssueBody(it, { imageUrl = '', includeContext = true, note = '', afterUrl = '', videoUrl = '', harUrl = '' } = {}) {
  const out = [];
  if (it.comment) out.push(it.comment.trim(), '');
  const steps = String(it.steps || '').split('\n').map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
  if (steps.length) out.push('### Steps to reproduce', '', ...steps.map((l, i) => `${i + 1}. ${l}`), '');
  if (videoUrl) out.push(`🎥 **[Watch the screen recording](${videoUrl})** (${fmtDur(it.video.duration)}${it.video.mic ? ', with narration' : ''} · WebM)`, '');
  if (imageUrl && afterUrl) out.push('| Before | After |', '|---|---|', `| ![Before](${imageUrl}) | ![After](${afterUrl}) |`, '');
  else if (imageUrl) out.push(`![${it.video ? 'Recording poster' : 'Screenshot'} — feedback #${it.seq}](${imageUrl})`, '');
  else if (note) out.push(`> ${note}`, '');

  if (includeContext) {
    const date = new Date(it.createdAt || Date.now()).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    out.push('| Context | |', '|---|---|');
    out.push(`| **Page** | [${cell(it.pageTitle || it.url)}](${it.url}) |`);
    out.push(`| **Type · Priority** | ${TYPE_NAME[it.type] || it.type} · ${PRIO_NAME[it.priority] || it.priority} |`);
    if (it.viewport) out.push(`| **Viewport** | ${it.viewport.w} × ${it.viewport.h}${it.dpr ? ` @${it.dpr}x` : ''} |`);
    out.push(`| **Environment** | ${cell(it.browser || '—')} · ${cell(it.os || '—')} |`);
    if (it.breakpoints?.length) out.push(`| **Breakpoints** | ${it.breakpoints.map((b) => `${b.label} ${b.w}×${b.h}`).join(' · ')} |`);
    if (it.after) out.push(`| **After shot** | ${new Date(it.after.createdAt || Date.now()).toISOString().slice(0, 10)}${it.after.url ? ` · ${cell(it.after.url)}` : ''} |`);
    if (it.fullPage) out.push(`| **Capture** | Full page · ${it.imageW}×${it.imageH}px |`);
    else if (it.scroll) out.push(`| **Scroll position** | ${it.scroll.y}px from top |`);
    out.push(`| **Reported** | ${date}${it.reviewer ? ` by ${cell(it.reviewer)}` : ''} |`, '');

    if (it.elements?.length) {
      out.push(`<details><summary>Inspected elements (${it.elements.length})</summary>`, '');
      for (const el of it.elements) {
        const styles = Object.entries(el.styles || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
        const block = `${el.selector}\n<${el.tag}> · ${el.size}${el.text ? ` · "${el.text}"` : ''}${styles ? `\n\n${styles}` : ''}`;
        out.push(`**E${el.n}**`, fence(block) + 'text', block, fence(block), '');
      }
      out.push('</details>', '');
    }
    const net = it.logs?.network || [], con = it.logs?.console || [];
    if (net.length) {
      const failed = net.filter((n) => n.status >= 400 || n.status === 0);
      const rows = (failed.length ? failed : net.slice(-15)).slice(0, 25);
      out.push(`<details${failed.length ? ' open' : ''}><summary>Network — ${net.length} request${net.length === 1 ? '' : 's'}${failed.length ? `, ${failed.length} failed` : ''}</summary>`, '');
      if (!failed.length) out.push('_Most recent requests:_', '');
      out.push('| Status | Method | URL | Time |', '|---|---|---|---|',
        ...rows.map((n) => `| ${n.status || 'failed'} | ${n.method} | ${cell(n.url).slice(0, 180)} | ${n.duration} ms |`), '');
      if (harUrl) out.push(`[Download full HAR](${harUrl}) — open in Chrome DevTools → Network`, '');
      out.push('</details>', '');
      // Payload + response for failed requests (the ones a developer will want to replay)
      const detailed = failed.filter((n) => n.requestBody || n.responseBody || queryParams(n.url).length).slice(-5);
      for (const n of detailed) {
        const cut = (t, max = 2500) => (t.length > max ? t.slice(0, max) + '\n… (truncated)' : t);
        const lang = (b) => (/json/i.test(b?.mime || '') ? 'json' : 'text');
        out.push(`<details><summary><code>${n.status || 'failed'} ${n.method} ${cell(n.url).replace(/</g, '&lt;').slice(0, 120)}</code></summary>`, '');
        const params = queryParams(n.url);
        if (params.length) out.push('**Query params**', '', '| Name | Value |', '|---|---|', ...params.map((p) => `| ${cell(p.name)} | ${cell(p.value).slice(0, 200)} |`), '');
        if (n.requestBody) { const b = cut(prettyBody(n.requestBody)); out.push('**Request payload**', '', fence(b) + lang(n.requestBody), b, fence(b), ''); }
        if (n.responseBody) { const b = cut(prettyBody(n.responseBody)); out.push(`**Response**${n.responseBody.truncated ? ' _(truncated)_' : ''}`, '', fence(b) + lang(n.responseBody), b, fence(b), ''); }
        out.push('</details>', '');
      }
    }
    const probs = con.filter((c) => c.level === 'error' || c.level === 'warn');
    if (probs.length) {
      const block = probs.slice(-20).map((c) => `[${c.level}] ${c.text}`).join('\n');
      out.push(`<details><summary>Console — ${probs.length} warning${probs.length === 1 ? '' : 's'}/error${probs.length === 1 ? '' : 's'}</summary>`, '', fence(block) + 'text', block, fence(block), '', '</details>', '');
    }
    if (it.errors?.length && !net.length && !con.length) {
      const block = it.errors.map((e) => e.message + (e.source ? `\n    at ${e.source}` : '')).join('\n');
      out.push(`<details><summary>${it.errors.length} page error${it.errors.length > 1 ? 's' : ''} at capture time</summary>`, '', fence(block) + 'text', block, fence(block), '', '</details>', '');
    }
  }
  out.push(`<sub>Captured with [Bugmark](${CONFIG.websiteUrl}) · feedback #${it.seq}</sub>`);
  return out.join('\n');
}

// ---------------------------------------------------------------- create issue
let queue = Promise.resolve(); // serialize commits to the screenshot branch

/**
 * Creates an issue for a feedback item.
 * opts: { repo, title, labels, screenshot, context }
 * Returns { number, url, repo, warning }
 */
export async function createIssue(item, opts = {}) {
  const s = await getGithub();
  if (!s.token) throw new GithubError('Connect GitHub in Settings → GitHub first.', 0);
  const repo = String(opts.repo || s.defaultRepo || '').trim();
  if (!isValidRepo(repo)) throw new GithubError('Choose a repository (owner/name).', 0);

  const info = await gh(s.token, `/repos/${repo}`); // fail fast on typos / no access
  if (info.has_issues === false) throw new GithubError(`Issues are turned off for ${repo}.`, 410);

  let imageUrl = '', afterUrl = '', videoUrl = '', harUrl = '', warning = '', note = '';
  const wantShot = (opts.screenshot ?? s.uploadScreenshots) && item.image;
  if (wantShot) {
    const run = queue.then(async () => {
      const branch = (s.branch || GITHUB_DEFAULTS.branch).trim();
      await ensureBranch(s.token, repo, branch);
      const d = new Date(item.createdAt || Date.now());
      const base = `screenshots/${d.toISOString().slice(0, 7)}/bugmark-${item.seq}-${String(item.id).slice(0, 8)}-${Date.now().toString(36)}`;
      const ext = (u) => (/^data:image\/png/.test(u) ? 'png' : 'jpg');
      const r = { image: await uploadImage(s.token, repo, branch, `${base}.${ext(item.image)}`, item.image) };
      if (item.after?.image) r.after = await uploadImage(s.token, repo, branch, `${base}-after.${ext(item.after.image)}`, item.after.image).catch(() => '');
      if (item.logs?.network?.length) {
        const har = btoa(unescape(encodeURIComponent(JSON.stringify(buildHar(item)))));
        r.har = await uploadImage(s.token, repo, branch, `${base}.har`, { base64: har }).catch(() => '');
        if (r.har) r.har = r.har.replace('?raw=true', '');
      }
      if (item.video?.mediaId) {
        const blob = await getMedia(item.video.mediaId).catch(() => null);
        if (blob && blob.size <= 40 * 1024 * 1024) {
          const b64 = await blobToBase64(blob);
          r.video = await uploadImage(s.token, repo, branch, `${base}.webm`, { base64: b64 }).catch(() => '');
        } else if (blob) r.videoTooBig = true;
      }
      return r;
    });
    queue = run.catch(() => {});
    try {
      const r = await run;
      imageUrl = r.image; afterUrl = r.after || ''; harUrl = r.har || ''; videoUrl = r.video || '';
      if (item.video && !videoUrl) warning = r.videoTooBig ? 'Recording is over 40 MB, so it wasn’t attached.' : 'The recording couldn’t be attached.';
    }
    catch (e) {
      warning = `Issue created without the screenshot: ${e.message}`;
      note = 'Screenshot couldn’t be attached — it’s available in the Bugmark report.';
    }
  }

  const title = String(opts.title || '').trim() || defaultTitle(item);
  const labels = Array.isArray(opts.labels) ? opts.labels : defaultLabels(item, s);
  const body = buildIssueBody(item, { imageUrl, afterUrl, videoUrl, harUrl, includeContext: opts.context !== false, note });

  let issue;
  try {
    issue = await gh(s.token, `/repos/${repo}/issues`, { method: 'POST', body: { title, body, ...(labels.length ? { labels } : {}) } });
  } catch (e) {
    if (e.status !== 422 || !labels.length) throw e;
    issue = await gh(s.token, `/repos/${repo}/issues`, { method: 'POST', body: { title, body } }); // retry without labels
    warning = warning || 'Labels couldn’t be applied.';
  }
  return { number: issue.number, url: issue.html_url, repo, warning };
}
