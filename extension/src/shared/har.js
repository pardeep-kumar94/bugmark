// Builds a HAR 1.2 file from Bugmark's network log (no headers or bodies are ever recorded).
export function buildHar(item) {
  const logs = item.logs || {};
  const version = chrome.runtime.getManifest().version;
  const entries = (logs.network || []).map((n) => {
    let queryString = [];
    try { queryString = [...new URL(n.url).searchParams].map(([name, value]) => ({ name, value })); } catch {}
    return {
      startedDateTime: new Date(n.t || item.createdAt).toISOString(),
      time: n.duration || 0,
      request: {
        method: n.method || 'GET', url: n.url, httpVersion: '', cookies: [], headers: n.requestHeaders || [], queryString, headersSize: -1,
        bodySize: n.requestBody?.size ?? -1,
        ...(n.requestBody ? { postData: n.requestBody.fields
          ? { mimeType: n.requestBody.mime || 'multipart/form-data', params: n.requestBody.fields.map((f) => ({ name: f.name, value: f.value })), text: '' }
          : { mimeType: n.requestBody.mime || '', text: n.requestBody.text || '' } } : {}),
      },
      response: {
        status: n.status || 0, statusText: n.statusText || (n.error ? n.error : ''), httpVersion: '', cookies: [], headers: n.responseHeaders || [],
        content: { size: n.responseBody?.size || n.size || 0, mimeType: n.mime || '', ...(n.responseBody && !n.responseBody.binary ? { text: n.responseBody.text || '' } : {}),
          ...(n.responseBody?.truncated ? { comment: 'Truncated by Bugmark' } : {}) },
        redirectURL: '', headersSize: -1, bodySize: n.responseBody?.size || n.size || -1,
        ...(n.error ? { _error: n.error } : {}),
      },
      cache: {},
      timings: { send: 0, wait: n.duration || 0, receive: 0 },
      _resourceType: n.type,
    };
  });
  return {
    log: {
      version: '1.2',
      creator: { name: 'Bugmark', version },
      browser: { name: item.browser || 'Chrome', version: '' },
      pages: [{ startedDateTime: new Date(logs.pageStart || item.createdAt).toISOString(), id: 'page_1', title: item.pageTitle || item.url, pageTimings: {} }],
      entries: entries.map((e) => ({ pageref: 'page_1', ...e })),
      comment: `Bugmark feedback #${item.seq} — ${item.url}. Text bodies are capped (16 KB request / 32 KB response); passwords, tokens, cookies and auth headers are masked.`,
      _console: (logs.console || []).map((c) => ({ time: new Date(c.t).toISOString(), level: c.level, text: c.text, source: c.source || undefined })),
    },
  };
}

export const failedRequests = (item) => (item.logs?.network || []).filter((n) => n.status >= 400 || n.status === 0);
export const consoleProblems = (item) => (item.logs?.console || []).filter((c) => c.level === 'error' || c.level === 'warn');
export const fmtDuration = (ms) => { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const shortUrl = (u) => { try { const x = new URL(u); return x.host + x.pathname + (x.search.length > 40 ? x.search.slice(0, 40) + '…' : x.search); } catch { return u; } };

// ---- helpers for showing request details
export function queryParams(url) {
  try { return [...new URL(url).searchParams].map(([name, value]) => ({ name, value })); } catch { return []; }
}
export function prettyBody(body) {
  if (!body) return '';
  if (body.fields) return body.fields.map((f) => `${f.name}: ${f.value}`).join('\n');
  const t = body.text || '';
  if (/json|graphql/i.test(body.mime || '') || /^\s*[[{]/.test(t)) { try { return JSON.stringify(JSON.parse(t), null, 2); } catch {} }
  if (/x-www-form-urlencoded/i.test(body.mime || '')) { try { return [...new URLSearchParams(t)].map(([k, v]) => `${k}: ${v}`).join('\n'); } catch {} }
  return t;
}
export function hasDetails(n) { return !!(n.requestHeaders || n.responseHeaders || n.requestBody || n.responseBody || queryParams(n.url).length); }
export function toCurl(n) {
  const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
  const parts = [`curl ${q(n.url)}`];
  if (n.method && n.method !== 'GET') parts.push(`-X ${n.method}`);
  for (const h of n.requestHeaders || []) parts.push(`-H ${q(`${h.name}: ${h.value}`)}`);
  if (n.requestBody?.fields) n.requestBody.fields.forEach((f) => parts.push(`-F ${q(`${f.name}=${f.value}`)}`));
  else if (n.requestBody?.text && !n.requestBody.binary) parts.push(`--data-raw ${q(n.requestBody.text)}`);
  return parts.join(' \\\n  ');
}
