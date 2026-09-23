/* Bugmark — runs in the page's MAIN world.
   Observes JS errors, console output, fetch/XHR requests (with headers and text bodies, secrets masked)
   and SPA navigation, and relays them to Bugmark's content script. It never changes what the page does:
   responses are read from clones, and request bodies are only inspected, never consumed. */
(() => {
  if (window.__bugmarkHook) return;
  window.__bugmarkHook = true;

  const emit = (name, data) => {
    try { document.dispatchEvent(new CustomEvent(name, { detail: JSON.stringify(data) })); } catch {}
  };
  const relay = (kind, message, source) => emit('__bugmark_err', { kind, message: String(message).slice(0, 500), source: source || '' });
  const log = (data) => emit('__bugmark_log', { t: Date.now(), ...data });

  // ---- errors
  window.addEventListener('error', (ev) => {
    if (ev.target && ev.target !== window) return; // resource errors handled by the content script
    relay('error', ev.message || 'Script error', ev.filename ? `${ev.filename}:${ev.lineno}:${ev.colno}` : '');
    log({ kind: 'console', level: 'error', text: `Uncaught ${ev.message || 'error'}`, source: ev.filename ? `${ev.filename}:${ev.lineno}` : '' });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    const msg = 'Unhandled rejection: ' + (r && r.message ? r.message : String(r));
    relay('promise', msg);
    log({ kind: 'console', level: 'error', text: msg });
  });

  // ---- console
  const fmt = (a) => {
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    if (typeof a === 'string') return a;
    if (a instanceof Element) return `<${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}>`;
    if (typeof a === 'object' && a !== null) { try { return JSON.stringify(a).slice(0, 300); } catch { return Object.prototype.toString.call(a); } }
    return String(a);
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const orig = console[level];
    if (typeof orig !== 'function') continue;
    console[level] = function (...args) {
      try {
        const text = args.map(fmt).join(' ').slice(0, 600);
        log({ kind: 'console', level, text });
        if (level === 'error') relay('console', 'console.error: ' + text);
      } catch {}
      // Call the real console from a microtask instead of from this wrapper. Otherwise the page's own
      // console.error/warn calls are attributed to Bugmark (they show up under the extension's "Errors" in
      // chrome://extensions). DevTools still links the message to the page's code through the async stack.
      queueMicrotask(Function.prototype.apply.bind(orig, this, args));
    };
  }

  // ---- network (fetch + XMLHttpRequest): method, URL, status, timing, headers and bodies.
  // Secrets are masked here, before anything leaves the page: Authorization/Cookie-style headers,
  // password/token-like JSON keys and form fields. Bodies are text only and capped in size.
  const cfg = { bodies: true };
  document.addEventListener('__bugmark_cfg', (ev) => { try { Object.assign(cfg, JSON.parse(ev.detail)); } catch {} });
  const REQ_MAX = 16 * 1024, RES_MAX = 32 * 1024;
  const SECRET_KEY = /pass(word|wd|phrase)?$|^pwd$|secret|token|api[-_]?key|apikey|^auth$|authorization|cookie|session[-_]?id|^sid$|credit[-_]?card|card[-_]?number|^cc[-_]?num|cvv|cvc|ssn|^otp$|^pin$|private[-_]?key|client[-_]?secret|signature|^sig$|refresh/i;
  const SECRET_HEADER = /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|x-amz-security-token)$/i;
  const MASK = '[redacted]';
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return String(u); } };
  const textLike = (mime) => !mime || /json|text\/|xml|javascript|x-www-form-urlencoded|graphql|csv|yaml|ndjson/i.test(mime);
  const clip = (t, max) => (t.length > max ? { text: t.slice(0, max), truncated: true, size: t.length } : { text: t, truncated: false, size: t.length });

  function redactJson(v, depth = 0) {
    if (depth > 12 || v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map((x) => redactJson(x, depth + 1));
    const o = {};
    for (const k of Object.keys(v)) o[k] = SECRET_KEY.test(k) && v[k] !== null && typeof v[k] !== 'object' ? MASK : redactJson(v[k], depth + 1);
    return o;
  }
  function redactForm(str) {
    try {
      const sp = new URLSearchParams(str);
      for (const k of [...new Set(sp.keys())]) if (SECRET_KEY.test(k)) sp.set(k, MASK);
      return sp.toString();
    } catch { return str; }
  }
  function redactText(text, mime) {
    const t = String(text);
    if (/json|graphql/i.test(mime) || /^\s*[\[{]/.test(t)) {
      try { return JSON.stringify(redactJson(JSON.parse(t))); } catch {}
    }
    if (/x-www-form-urlencoded/i.test(mime) || (/^[\w.%\-[\]]+=[^\s]*(&[\w.%\-[\]]+=[^\s]*)*$/.test(t) && t.length < 8000)) return redactForm(t);
    return t;
  }
  function headersOf(h) {
    const out = [];
    try {
      if (!h) return out;
      if (typeof h.forEach === 'function' && !Array.isArray(h)) h.forEach((value, name) => out.push({ name, value }));
      else if (Array.isArray(h)) h.forEach(([name, value]) => out.push({ name, value: String(value) }));
      else Object.keys(h).forEach((name) => out.push({ name, value: String(h[name]) }));
    } catch {}
    return out.slice(0, 60).map(({ name, value }) => ({ name, value: SECRET_HEADER.test(name) ? MASK : String(value).slice(0, 500) }));
  }
  function parseRawHeaders(raw) {
    return headersOf(String(raw || '').trim().split(/[\r\n]+/).filter(Boolean).map((l) => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  }
  // Describe a request body (string, URLSearchParams, FormData, Blob, ArrayBuffer…) without consuming it.
  function describeBody(body, contentType) {
    if (body == null) return null;
    try {
      if (typeof body === 'string') return { mime: contentType || '', ...clip(redactText(body, contentType), REQ_MAX) };
      if (body instanceof URLSearchParams) return { mime: 'application/x-www-form-urlencoded', ...clip(redactForm(body.toString()), REQ_MAX) };
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        const fields = [];
        body.forEach((v, k) => fields.push({ name: k, value: typeof v === 'string' ? (SECRET_KEY.test(k) ? MASK : v.slice(0, 2000)) : `[file: ${v.name || 'blob'} · ${v.type || 'unknown'} · ${v.size} bytes]` }));
        return { mime: 'multipart/form-data', fields: fields.slice(0, 100), text: '', truncated: false, size: 0 };
      }
      if (typeof Blob !== 'undefined' && body instanceof Blob) return { mime: body.type || contentType || '', text: `[binary body · ${body.size} bytes]`, binary: true, truncated: false, size: body.size };
      if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return { mime: contentType || '', text: `[binary body · ${body.byteLength} bytes]`, binary: true, truncated: false, size: body.byteLength };
    } catch {}
    return { mime: contentType || '', text: '[unreadable body]', truncated: false, size: 0 };
  }
  // Read up to RES_MAX characters from a cloned response, then stop (never waits on endless streams).
  async function readResponse(res, copy, mime) {
    if (!cfg.bodies) return null;
    if (/event-stream/i.test(mime)) return { mime, text: '[event stream — not recorded]', truncated: false, size: 0 };
    if (!textLike(mime)) {
      const len = +res.headers.get('content-length') || 0;
      return { mime, text: `[binary response${len ? ` · ${len} bytes` : ''}]`, binary: true, truncated: false, size: len };
    }
    if (!copy || !copy.body) return null;
    const reader = copy.body.getReader();
    const dec = new TextDecoder();
    let text = '', truncated = false;
    const deadline = Date.now() + 10000;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        if (text.length > RES_MAX * 4 || Date.now() > deadline) { truncated = true; break; }
      }
      if (!truncated) text += dec.decode();
    } catch { truncated = true; }
    finally { if (truncated) reader.cancel().catch(() => {}); }
    const red = redactText(text, mime);
    const c = clip(red, RES_MAX);
    return { mime, ...c, truncated: c.truncated || truncated };
  }

  if (typeof window.fetch === 'function') {
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const start = Date.now();
      let method = 'GET', url = '', reqHeaders = [], reqBody = null;
      try {
        const isReq = typeof Request !== 'undefined' && input instanceof Request;
        method = String((init && init.method) || (isReq && input.method) || 'GET').toUpperCase();
        url = abs(typeof input === 'string' || input instanceof URL ? input : input && input.url);
        if (cfg.bodies) {
          const h = new Headers((isReq && input.headers) || undefined);
          if (init && init.headers) new Headers(init.headers).forEach((v, k) => h.set(k, v));
          reqHeaders = headersOf(h);
          const ct = h.get('content-type') || '';
          if (init && init.body != null) reqBody = describeBody(init.body, ct);
          else if (isReq && input.body && !input.bodyUsed && !/^(GET|HEAD)$/.test(method)) {
            reqBody = { pending: input.clone().text().then((t) => ({ mime: ct, ...clip(redactText(t, ct), REQ_MAX) })).catch(() => null) };
          }
        }
      } catch {}
      const p = origFetch.apply(this, arguments);
      // Observe on a detached chain with a terminal catch, so instrumenting the page's fetch can never
      // create — or be blamed for — an unhandled rejection. The page still receives the original `p`.
      p.then(async (res) => {
        const mime = res.headers.get('content-type') || '';
        // Clone right away, before the page reads the body.
        let copy = null;
        try { if (cfg.bodies && textLike(mime) && !/event-stream/i.test(mime) && !res.bodyUsed) copy = res.clone(); } catch {}
        const entry = { kind: 'net', type: 'fetch', method, url, status: res.status, statusText: res.statusText, start, duration: Date.now() - start, mime, redirected: res.redirected || undefined };
        if (cfg.bodies) {
          entry.requestHeaders = reqHeaders;
          entry.responseHeaders = headersOf(res.headers);
          try { entry.requestBody = reqBody && reqBody.pending ? await reqBody.pending : reqBody; } catch {}
          try { entry.responseBody = await readResponse(res, copy, mime); } catch {}
          entry.duration = Math.max(entry.duration, 0);
        }
        log(entry);
      }, async (err) => {
        let requestBody = null; try { requestBody = reqBody && reqBody.pending ? await reqBody.pending : reqBody; } catch {}
        log({ kind: 'net', type: 'fetch', method, url, status: 0, error: String(err && err.message || err), start, duration: Date.now() - start, requestHeaders: cfg.bodies ? reqHeaders : undefined, requestBody: cfg.bodies ? requestBody : undefined });
      }).catch(() => {});
      // Swallow rejection on the original promise too: instrumenting it attaches our frame to the async
      // stack, so a page request the site itself never catches would otherwise be blamed on the extension.
      // The page keeps its own handlers on `p`; this extra one only prevents the mis-attributed report.
      p.catch(() => {});
      return p;
    };
  }
  const XHR = window.XMLHttpRequest;
  if (XHR) {
    const open = XHR.prototype.open, sendX = XHR.prototype.send, setHeader = XHR.prototype.setRequestHeader;
    XHR.prototype.open = function (method, url) {
      try { this.__bm = { method: String(method || 'GET').toUpperCase(), url: abs(url), headers: [] }; } catch {}
      return open.apply(this, arguments);
    };
    XHR.prototype.setRequestHeader = function (name, value) {
      try { if (this.__bm) this.__bm.headers.push([name, value]); } catch {}
      return setHeader.apply(this, arguments);
    };
    XHR.prototype.send = function (body) {
      const info = this.__bm;
      if (info) {
        const start = Date.now();
        let requestBody = null;
        if (cfg.bodies) {
          const ct = (info.headers.find(([n]) => /^content-type$/i.test(n)) || [])[1] || '';
          requestBody = describeBody(body, ct);
        }
        this.addEventListener('loadend', () => {
          let mime = '';
          try { mime = this.getResponseHeader('content-type') || ''; } catch {}
          const entry = { kind: 'net', type: 'xhr', method: info.method, url: info.url, status: this.status, statusText: this.statusText, start, duration: Date.now() - start, mime,
            error: this.status === 0 ? 'Network error or request aborted' : undefined };
          if (cfg.bodies) {
            entry.requestHeaders = headersOf(info.headers);
            entry.requestBody = requestBody;
            try { entry.responseHeaders = parseRawHeaders(this.getAllResponseHeaders()); } catch {}
            try {
              const rt = this.responseType;
              let text = null;
              if (!textLike(mime)) text = null;
              else if (rt === '' || rt === 'text') text = this.responseText;
              else if (rt === 'json') text = JSON.stringify(this.response);
              else if (rt === 'document' && this.response) text = this.response.documentElement ? this.response.documentElement.outerHTML : null;
              entry.responseBody = text != null
                ? { mime, ...clip(redactText(text, mime), RES_MAX) }
                : (this.status ? { mime, text: `[${rt || 'binary'} response — not recorded]`, binary: true, truncated: false, size: 0 } : null);
            } catch {}
          }
          log(entry);
        }, { once: true });
      }
      return sendX.apply(this, arguments);
    };
  }

  // ---- Hydration: tell the content script once a React/Vue/Preact app has attached, so Bugmark can
  // wait before adding its own element to the page (an extra node during hydration breaks some apps).
  const candidates = () => [document, document.documentElement, document.body,
    ...['root', 'app', '__next', '___gatsby', '__nuxt', 'svelte'].map((id) => document.getElementById(id)),
    document.body && document.body.firstElementChild].filter(Boolean);
  const attached = (el) => {
    if (el._reactRootContainer || el.__vue_app__ || el.__vue__ || el._vnode || el.__k || el.__preactattr_) return true;
    for (const k in el) if (k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$')) return true;
    return false;
  };
  let hydrationPolls = 0;
  const pollHydration = () => {
    try {
      if (candidates().some(attached)) { emit('__bugmark_ready', { framework: true }); return; }
    } catch {}
    if (++hydrationPolls < 60) setTimeout(pollHydration, 250); // up to ~15s
    else emit('__bugmark_ready', { framework: false });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', pollHydration, { once: true }) : pollHydration();

  // ---- SPA navigation
  const nav = (how) => log({ kind: 'nav', how, url: location.href });
  for (const m of ['pushState', 'replaceState']) {
    const orig = history[m];
    history[m] = function () {
      const before = location.href;
      const r = orig.apply(this, arguments);
      if (location.href !== before) nav(m);
      return r;
    };
  }
  window.addEventListener('popstate', () => nav('popstate'));
})();
