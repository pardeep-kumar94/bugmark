/* Bugmark — in-page annotation UI (content script, isolated world) */
(() => {
  if (window.__bugmark) return;
  window.__bugmark = true;
  if (window.top !== window) return;

  // ------------------------------------------------------------------
  // Page context collection (runs from document_start)
  // ------------------------------------------------------------------
  const pageErrors = [];
  const pushErr = (e) => {
    const url = (e.kind === 'network' || e.kind === 'resource') ? e.message.split(' ').pop() : '';
    if (url && (/\/favicon\.ico(\?|$)/.test(url) || pageErrors.some((p) => p.message.endsWith(' ' + url)))) return; // de-dupe & ignore noise
    pageErrors.push({ ...e, at: Date.now() });
    if (pageErrors.length > 30) pageErrors.shift();
  };
  window.addEventListener('error', (ev) => {
    const t = ev.target;
    if (t && t !== window && t.tagName) {
      const src = t.currentSrc || t.src || t.href;
      if (src) pushErr({ kind: 'resource', message: `Failed to load <${t.tagName.toLowerCase()}> ${src}` });
    }
  }, true);
  // JS errors / console.error relayed from page-hook.js (MAIN world)
  document.addEventListener('__bugmark_err', (ev) => {
    try { const d = JSON.parse(ev.detail); pushErr({ kind: d.kind, message: d.message, source: d.source }); } catch {}
  });
  // ---- Network & console log (last 150 of each), fed by page-hook.js + Resource Timing
  const NET_MAX = 150, CON_MAX = 150;
  const netLog = [], conLog = [];
  const SECRET_PARAM = /(token|key|secret|pass(word)?|pwd|auth|session|sig(nature)?|code|credential|jwt)/i;
  const scrubUrl = (u) => {
    try {
      const url = new URL(u, location.href);
      for (const k of [...url.searchParams.keys()]) if (SECRET_PARAM.test(k)) url.searchParams.set(k, '[redacted]');
      if (url.username || url.password) { url.username = ''; url.password = ''; }
      return url.href;
    } catch { return String(u).slice(0, 2000); }
  };
  const BODY_KEEP = 60; // keep headers/bodies for the most recent 60 requests only (memory)
  const pushNet = (e) => {
    netLog.push(e);
    if (netLog.length > NET_MAX) netLog.shift();
    let withBodies = 0;
    for (let i = netLog.length - 1; i >= 0; i--) {
      const n = netLog[i];
      if (!(n.requestBody || n.responseBody || n.requestHeaders)) continue;
      if (++withBodies > BODY_KEEP) { delete n.requestBody; delete n.responseBody; delete n.requestHeaders; delete n.responseHeaders; }
    }
  };
  const sendHookCfg = () => { try { document.dispatchEvent(new CustomEvent('__bugmark_cfg', { detail: JSON.stringify({ bodies: state.settings.recordBodies !== false }) })); } catch {} };
  const pushCon = (e) => { conLog.push(e); if (conLog.length > CON_MAX) conLog.shift(); };
  document.addEventListener('__bugmark_log', (ev) => {
    let d; try { d = JSON.parse(ev.detail); } catch { return; }
    if (d.kind === 'console') pushCon({ t: d.t, level: d.level, text: String(d.text || '').slice(0, 600).replace(/https?:\/\/[^\s"'<>)]+/g, (u) => scrubUrl(u)), source: d.source || '' });
    else if (d.kind === 'net') {
      const e = { t: d.start || d.t, type: d.type, method: d.method, url: scrubUrl(d.url), status: d.status | 0, statusText: d.statusText || '', duration: d.duration | 0, mime: d.mime || '', error: d.error || '' };
      if (state.settings.recordBodies !== false) {
        for (const k of ['requestHeaders', 'responseHeaders', 'requestBody', 'responseBody']) if (d[k]) e[k] = d[k];
      }
      pushNet(e);
      if (d.status >= 400 || d.status === 0) pushErr({ kind: 'network', message: `HTTP ${d.status || 'failed'} ${d.method} ${scrubUrl(d.url)}` });
    } else if (d.kind === 'nav') recordNav(d.url);
  });
  // Other resources (documents, scripts, styles, images…) and HTTP 4xx/5xx via Resource Timing.
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const fetchLike = e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest';
        if (e.responseStatus >= 400 && !fetchLike) pushErr({ kind: 'network', message: `HTTP ${e.responseStatus} ${e.initiatorType?.toUpperCase() || ''} ${scrubUrl(e.name)}` });
        if (fetchLike || e.entryType !== 'resource') continue;
        pushNet({ t: Math.round(performance.timeOrigin + e.startTime), type: e.initiatorType || 'other', method: 'GET', url: scrubUrl(e.name),
          status: e.responseStatus || 0, statusText: '', duration: Math.round(e.duration), size: e.transferSize || 0, mime: '', error: '', cached: e.transferSize === 0 && e.decodedBodySize > 0 });
      }
    }).observe({ type: 'resource', buffered: true });
  } catch {}
  try {
    const n = performance.getEntriesByType('navigation')[0];
    if (n) pushNet({ t: Math.round(performance.timeOrigin), type: 'document', method: 'GET', url: scrubUrl(location.href), status: n.responseStatus || 200, statusText: '', duration: Math.round(n.duration || 0), size: n.transferSize || 0, mime: 'text/html', error: '' });
  } catch {}

  function snapshotLogs() {
    return { network: [...netLog].sort((a, b) => a.t - b.t), console: [...conLog], pageStart: Math.round(performance.timeOrigin) };
  }

  // ---- Steps to reproduce: short descriptions of clicks, typing, selects and navigation.
  // Never stores what was typed; password fields are only ever called "password field".
  let stepsOn = true;
  let lastTyped = null;
  const clip = (t, n = 40) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  function labelOf(el) {
    if (!el || el.nodeType !== 1) return '';
    const aria = el.getAttribute('aria-label') || '';
    if (aria) return clip(aria);
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' '); if (t.trim()) return clip(t); }
    if (el.labels && el.labels[0]) return clip(el.labels[0].textContent);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
      const wrap = el.closest('label'); if (wrap && clip(wrap.textContent)) return clip(wrap.textContent);
      return clip(el.getAttribute('placeholder') || el.getAttribute('name') || el.id || el.getAttribute('title') || '');
    }
    if (el.tagName === 'IMG') return clip(el.getAttribute('alt') || '');
    const text = el.innerText || el.textContent || '';
    if (clip(text)) return clip(text);
    const img = el.querySelector?.('img[alt]'); if (img) return clip(img.getAttribute('alt'));
    return clip(el.getAttribute('title') || el.getAttribute('name') || el.value || '');
  }
  function kindOf(el) {
    const role = el.getAttribute('role');
    if (role) return { button: 'button', link: 'link', tab: 'tab', menuitem: 'menu item', checkbox: 'checkbox', switch: 'switch', option: 'option', radio: 'radio button' }[role] || '';
    const tag = el.tagName;
    if (tag === 'A') return 'link';
    if (tag === 'BUTTON' || (tag === 'INPUT' && /^(button|submit|reset)$/.test(el.type))) return 'button';
    if (tag === 'SUMMARY') return 'section toggle';
    if (tag === 'IMG') return 'image';
    return '';
  }
  const INTERACTIVE = 'a,button,input,select,textarea,summary,label,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=switch],[role=option],[role=radio],[onclick],[tabindex]';
  function fromUs(ev) { try { return host && ev.composedPath().includes(host); } catch { return false; } }
  function addStep(text) {
    if (!stepsOn || !text) return;
    try { chrome.runtime.sendMessage({ type: 'bugmark:step', step: { t: Date.now(), text, url: location.href } }).catch(() => {}); } catch {}
  }
  function recordNavOpen() {
    let path = location.href; try { path = location.pathname + location.search + location.hash; } catch {}
    const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    addStep(`${reload ? 'Reload' : 'Open'} ${clip(path, 80)}`);
  }
  function recordNav(url) {
    let path = url; try { const u = new URL(url); path = u.pathname + u.search + u.hash; } catch {}
    addStep(`Navigate to ${clip(path, 80)}`);
  }
  document.addEventListener('click', (ev) => {
    if (!ev.isTrusted || fromUs(ev) || !(ev.target instanceof Element)) return;
    const hit = ev.target.closest(INTERACTIVE);
    let el = hit || ev.target;
    if (!hit) {
      // Clicks on non-interactive areas: only record them when they point at something small and specific
      // (a card title, an icon, a short text), never at big containers like headers or sections.
      const own = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      const r = el.getBoundingClientRect();
      const big = r.width * r.height > innerWidth * innerHeight * 0.12 || el.children.length > 3;
      if (big || own.length > 60 || /^(HTML|BODY|MAIN|HEADER|FOOTER|NAV|SECTION|ASIDE|ARTICLE|FORM)$/.test(el.tagName)) return;
      if (!own && !el.getAttribute('aria-label') && !el.getAttribute('alt') && !el.getAttribute('title')) return;
    }
    if (el.tagName === 'INPUT' && /^(checkbox|radio|file|text|email|search|password|number|tel|url|date)$/.test(el.type)) return; // handled by change / input
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.tagName === 'OPTION') return;
    if (el.tagName === 'LABEL' && el.control) return; // the control's change event describes it
    const name = labelOf(el), kind = kindOf(el);
    addStep(name ? `Click “${name}”${kind ? ' ' + kind : ''}` : `Click ${kind || `<${el.tagName.toLowerCase()}>`}`);
  }, true);
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (!ev.isTrusted || fromUs(ev) || !(el instanceof Element)) return;
    const name = labelOf(el);
    if (el.tagName === 'SELECT') {
      addStep(`Select “${clip(el.selectedOptions?.[0]?.textContent || '')}”${name ? ` in “${name}”` : ''}`);
    } else if (el.type === 'checkbox') addStep(`${el.checked ? 'Check' : 'Uncheck'} “${name || 'checkbox'}”`);
    else if (el.type === 'radio') addStep(`Choose “${name || 'option'}”`);
    else if (el.type === 'file') addStep(`Upload a file${name ? ` in “${name}”` : ''}`);
  }, true);
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!ev.isTrusted || fromUs(ev) || !(el instanceof Element)) return;
    const editable = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(checkbox|radio|file|range|color|submit|button)$/.test(el.type)) || el.isContentEditable;
    if (!editable || lastTyped === el) return;
    lastTyped = el;
    const name = el.type === 'password' ? 'password' : labelOf(el);
    addStep(el.type === 'password' ? 'Type in password field' : `Type in “${name || 'text'}” field`);
  }, true);
  document.addEventListener('focusin', (ev) => { if (ev.target !== lastTyped) lastTyped = null; }, true);
  document.addEventListener('keydown', (ev) => {
    if (!ev.isTrusted || ev.key !== 'Enter' || fromUs(ev) || !(ev.target instanceof Element)) return;
    const el = ev.target;
    if (el.tagName === 'INPUT') addStep(`Press Enter in “${el.type === 'password' ? 'password' : labelOf(el) || 'text'}” field`);
  }, true);
  document.addEventListener('submit', (ev) => { if (ev.isTrusted && !fromUs(ev)) addStep(`Submit form${labelOf(ev.target.querySelector?.('[type=submit]')) ? ` (“${labelOf(ev.target.querySelector('[type=submit]'))}”)` : ''}`); }, true);
  window.addEventListener('hashchange', () => recordNav(location.href));

  // ------------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------------
  const FONT = '"Bugmark Sans", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const MONO = '"Bugmark Mono", ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace';
  const COLORS = ['#F43F5E', '#F59E0B', '#FACC15', '#4ADE80', '#22D3EE', '#3B82F6', '#0B0F14', '#FFFFFF'];
  const SIZES = { s: { stroke: 2, text: 13 }, m: { stroke: 4, text: 15 }, l: { stroke: 7, text: 20 } };
  const TYPES = [['bug', 'Bug'], ['design', 'Design'], ['content', 'Content'], ['idea', 'Idea']];
  const PRIORITIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']];
  const TOOL_KEYS = { v: 'browse', p: 'pen', h: 'marker', a: 'arrow', r: 'rect', o: 'ellipse', t: 'text', n: 'pin', b: 'redact', e: 'inspect' };
  const INSPECT_COLOR = '#22D3EE';

  const I = (d, extra = '') => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICONS = {
    logo: `<svg viewBox="4 4 32 32" width="26" height="26" fill="none"><path d="M8.5 14V10.5a2 2 0 0 1 2-2H14M26 8.5h3.5a2 2 0 0 1 2 2V14M31.5 26v3.5a2 2 0 0 1-2 2H26M14 31.5h-3.5a2 2 0 0 1-2-2V26" stroke="#03140A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M15.2 18.6 12.6 17M14.8 22.4h-2.6M15.4 26 13 27.6M24.8 18.6l2.6-1.6M25.2 22.4h2.6M24.6 26l2.4 1.6M18.6 13.2 17 11.2M21.4 13.2l1.6-2" stroke="#03140A" stroke-width="1.6" stroke-linecap="round" fill="none"/><ellipse cx="20" cy="14.9" rx="2.9" ry="2.6" fill="#03140A"/><ellipse cx="20" cy="22.4" rx="5.2" ry="6.2" fill="#03140A"/><path d="M20 17.6v9.8" stroke="var(--logo-check,#EA4A3A)" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    browse: I('<path d="M5 3.5 18.5 10l-6 1.6L9.8 17.5 5 3.5Z"/>'),
    pen: I('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
    marker: I('<path d="m9 11-5 5v4h4l5-5"/><path d="m21 10-6.2 6.2a1.8 1.8 0 0 1-2.5 0l-4.5-4.5a1.8 1.8 0 0 1 0-2.5L14 3"/>'),
    arrow: I('<path d="M5 19 19 5"/><path d="M9.5 5H19v9.5"/>'),
    rect: I('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/>'),
    ellipse: I('<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>'),
    text: I('<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>'),
    pin: I('<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9.5 12.5 8v8"/>'),
    redact: I('<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 3.5v17M14.5 3.5v17"/>'),
    inspect: I('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="m9.5 9.5 6 2.2-2.6 1.1-1.1 2.6-2.3-5.9Z"/>'),
    undo: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    redo: I('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    trash: I('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    grip: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`,
    back: I('<path d="M15 18 9 12l6-6"/>'),
    chevron: I('<path d="m6 9 6 6 6-6"/>', 'width="12" height="12"'),
    alert: I('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>', 'width="14" height="14"'),
    viewport: I('<rect x="3" y="5" width="18" height="14" rx="2"/>', 'width="16" height="16"'),
    fullpage: I('<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>', 'width="16" height="16"'),
    timer: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2.5h4"/>', 'width="16" height="16"'),
    devices: I('<rect x="2.5" y="5" width="13" height="10" rx="1.5"/><path d="M6 19h6M9 15v4"/><rect x="17.5" y="8" width="4.5" height="11" rx="1"/>', 'width="16" height="16"'),
    record: I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>', 'width="16" height="16"'),
    mic: I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', 'width="14" height="14"'),
    micOff: I('<path d="m3 3 18 18"/><path d="M9 9v2a3 3 0 0 0 5.1 2.1M15 10V6a3 3 0 0 0-5.7-1.3"/><path d="M5.5 11a6.5 6.5 0 0 0 10.7 5M18.5 11a6.5 6.5 0 0 1-.4 2.2M12 17.5V21"/>', 'width="14" height="14"'),
    play: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  };
  const TOOL_LABELS = { browse: 'Interact with page', pen: 'Pen', marker: 'Highlighter', arrow: 'Arrow', rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', pin: 'Numbered pin', redact: 'Redact (pixelate)', inspect: 'Inspect element' };
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const MOD = isMac ? '⌘' : 'Ctrl';

  // ------------------------------------------------------------------
  // State (all shape coordinates are DOCUMENT coordinates)
  // ------------------------------------------------------------------
  const state = {
    mode: 'idle', // idle | draw | panel
    tool: 'pen', color: COLORS[0], size: 'm',
    shapes: [], redo: [], drawing: null,
    textEl: null, shot: null, meta: null,
    type: 'bug', priority: 'medium',
    settings: { showLauncher: true, hiddenHosts: [], reviewer: '', launcherPos: null },
    counts: { site: 0, total: 0 },
    capturing: false, busyScroll: false,
  };

  let host, shadow, $root, canvas, ctx, toolbar, launcher, panel, scrim, hintEl, toastsEl, paletteEl, menuEl, inspectBox;
  const $ = (sel) => shadow.querySelector(sel);

  const send = async (msg) => {
    try { return await chrome.runtime.sendMessage(msg); }
    catch (e) { return { ok: false, error: /context invalidated/i.test(e?.message) ? 'Bugmark was updated. Reload this page to continue.' : String(e?.message || e) }; }
  };

  // ------------------------------------------------------------------
  // Styles
  // ------------------------------------------------------------------
  const STYLES = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  [hidden] { display: none !important; }
  .root {
    --ink:#0E1217; --ink-2:#151A21; --ink-3:#1F2630; --on-ink:#E6EDF3; --on-ink-2:#9BA6B2;
    --surface:#0E1217; --field:#090B0F; --text:#E6EDF3; --text-2:#9BA6B2; --text-3:#6B7684; --border:#1E252E; --border-2:#2B3440; --soft:#151A21;
    --accent:#4ADE80; --accent-2:#22D3EE; --brand-text:#4ADE80; --on-accent:#03140A;
    --grad: linear-gradient(135deg,#4ADE80 0%,#2DD4BF 55%,#22D3EE 100%);
    --grad-btn: #4ADE80;
    --glass: linear-gradient(180deg,#161C24 0%,#0E1217 100%);
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 8px 24px -4px rgba(0,0,0,.45), 0 24px 48px -12px rgba(0,0,0,.45);
    font: 13px/1.45 ${FONT}; color: var(--text); -webkit-font-smoothing: antialiased; letter-spacing: -0.005em;
  }
  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; }
  kbd { font: 500 11px/1 ${MONO}; padding: 3px 5px; border-radius: 5px; background: rgba(255,255,255,.08); color: inherit; opacity: .7; }

  .canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: auto; cursor: crosshair; touch-action: none; }
  .canvas.browse { pointer-events: none; }
  .canvas.text { cursor: text; }
  .canvas.inspect { cursor: default; }
  .frame { position: fixed; inset: 0; pointer-events: none; border: 2px solid transparent; border-image: var(--grad) 1; opacity: .95; }
  .inspect-box { position: fixed; pointer-events: none; border: 1.5px solid #22D3EE; background: rgba(34,211,238,.08); border-radius: 2px; transition: all .06s linear; }
  .inspect-box span { position: absolute; left: -1.5px; bottom: 100%; margin-bottom: 4px; white-space: nowrap; max-width: 420px; overflow: hidden; text-overflow: ellipsis;
    background: #22D3EE; color: #03140A; font: 600 11px/1 ${MONO}; padding: 5px 7px; border-radius: 5px; }
  .inspect-box.below span { bottom: auto; top: 100%; margin: 4px 0 0; }

  /* Launcher */
  .launcher {
    position: fixed; right: 20px; bottom: 20px; width: 44px; height: 44px; border-radius: 14px;
    display: grid; place-items: center; background: var(--grad); color: var(--on-accent); pointer-events: auto;
    box-shadow: 0 0 0 1px rgba(255,255,255,.3) inset, 0 6px 18px -4px rgba(74,222,128,.5), var(--shadow); --logo-check: #4ADE80;
    transition: transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s; user-select: none; touch-action: none;
  }
  .launcher:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,255,255,.3) inset, 0 10px 24px -4px rgba(74,222,128,.6), var(--shadow); }
  .launcher:active { transform: scale(.96); }
  .launcher .badge {
    position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
    background: #0E1217; color: #4ADE80; font: 700 11px/18px ${MONO}; text-align: center; box-shadow: 0 0 0 1px rgba(74,222,128,.45), 0 2px 6px rgba(0,0,0,.3);
  }
  .launcher .tip { right: 54px; top: 50%; transform: translateY(-50%); }
  .launcher:hover .tip { opacity: 1; }

  .tip {
    position: absolute; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .12s;
    background: var(--ink); color: var(--on-ink); font: 500 11.5px/1 ${MONO}; padding: 7px 9px; border-radius: 7px;
    box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 4px 16px rgba(0,0,0,.35); display: flex; align-items: center; gap: 6px;
  }
  .tip kbd { background: rgba(255,255,255,.12); opacity: 1; color: var(--on-ink-2); }

  /* Toolbar */
  .toolbar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); pointer-events: auto;
    display: flex; align-items: center; gap: 2px; padding: 6px; border-radius: 14px;
    background: var(--glass); color: var(--on-ink); box-shadow: 0 0 0 1px rgba(255,255,255,.08) inset, 0 1px 0 rgba(255,255,255,.06) inset, var(--shadow);
    animation: drop .22s cubic-bezier(.2,.8,.2,1);
  }
  @keyframes drop { from { opacity: 0; transform: translate(-50%, -8px); } }
  .toolbar.moved { transform: none; animation: none; }
  .grip { width: 18px; height: 34px; display: grid; place-items: center; color: #4B5563; cursor: grab; }
  .grip:active { cursor: grabbing; }
  .sep { width: 1px; height: 20px; background: rgba(255,255,255,.1); margin: 0 5px; }
  .tb { position: relative; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; color: var(--on-ink-2); transition: background .12s, color .12s; }
  .tb:hover { background: var(--ink-3); color: var(--on-ink); }
  .tb.active { background: var(--accent); color: var(--on-accent); box-shadow: 0 2px 10px -2px rgba(74,222,128,.6); }
  .tb:disabled { opacity: .35; pointer-events: none; }
  .tb .tip, .color-btn .tip { top: 44px; left: 50%; transform: translateX(-50%); }
  .tb:hover .tip, .color-btn:hover .tip { opacity: 1; transition-delay: .35s; }
  .color-wrap, .cap-wrap { position: relative; }
  .color-btn { position: relative; height: 34px; padding: 0 6px 0 9px; border-radius: 9px; display: flex; align-items: center; gap: 4px; color: var(--on-ink-2); }
  .color-btn:hover { background: var(--ink-3); }
  .dot { width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 2px var(--ink), 0 0 0 3.5px rgba(255,255,255,.28); }
  .popover {
    position: absolute; top: 46px; padding: 10px; border-radius: 12px;
    background: var(--glass); box-shadow: 0 0 0 1px rgba(255,255,255,.07) inset, var(--shadow);
  }
  .palette { left: 50%; transform: translateX(-50%); display: grid; gap: 10px; width: 188px; }
  .swatches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .swatch { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; }
  .swatch:hover { background: var(--ink-3); }
  .swatch span { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255,255,255,.15); }
  .swatch.active { background: var(--ink-3); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.5); }
  .sizes { display: flex; gap: 4px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.08); }
  .size { flex: 1; height: 30px; border-radius: 8px; display: grid; place-items: center; color: var(--on-ink-2); }
  .size:hover { background: var(--ink-3); }
  .size.active { background: var(--accent); color: var(--on-accent); }
  .size i { display: block; border-radius: 99px; background: currentColor; width: 16px; }

  .cap { display: flex; margin-left: 4px; border-radius: 9px; background: var(--accent); color: var(--on-accent); overflow: hidden; font-family: ${MONO}; box-shadow: 0 0 0 1px rgba(255,255,255,.25) inset, 0 4px 14px -4px rgba(74,222,128,.7); }
  .cap button { height: 34px; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: background .12s; }
  .cap button:hover { background: rgba(255,255,255,.2); }
  .cap .main { padding: 0 10px 0 14px; }
  .cap .more { width: 26px; justify-content: center; border-left: 1px solid rgba(0,0,0,.15); }
  .cap kbd { background: rgba(0,0,0,.14); opacity: 1; }
  .menu { right: 0; width: 264px; padding: 6px; display: grid; gap: 2px; }
  .menu-sep { height: 1px; margin: 4px 6px; background: rgba(255,255,255,.08); }
  .menu [data-act="record"] svg { color: #FF5C7A; }

  /* Recording pill */
  .rec { position: fixed; left: 50%; top: 14px; transform: translateX(-50%); pointer-events: auto; display: flex; align-items: center; gap: 4px;
    padding: 5px 5px 5px 12px; border-radius: 12px; background: var(--glass); color: var(--on-ink); font: 600 12.5px/1 ${MONO};
    box-shadow: 0 0 0 1px rgba(255,92,122,.35), var(--shadow); animation: rise2 .22s cubic-bezier(.2,.8,.2,1); user-select: none; }
  .rec .dot { width: 9px; height: 9px; border-radius: 50%; background: #FF5C7A; margin-right: 6px; animation: pulse 1.2s ease-in-out infinite; }
  .rec.pending .dot { background: #FBBF24; animation: none; }
  @keyframes pulse { 50% { opacity: .35; } }
  .rec .time { font-variant-numeric: tabular-nums; min-width: 42px; }
  .rec .mic { display: grid; place-items: center; width: 26px; height: 26px; color: var(--on-ink-2); }
  .rec .mic.on { color: #4ADE80; }
  .rec button { height: 28px; padding: 0 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; }
  .rec .stop { background: #FF5C7A; color: #fff; }
  .rec .stop:hover { background: #FF7A93; }
  .rec .stop i { width: 9px; height: 9px; border-radius: 2px; background: #fff; }
  .rec .cancel { color: var(--on-ink-2); padding: 0 6px; }
  .rec .cancel:hover { background: var(--ink-3); color: var(--on-ink); }
  .rec .hint2 { color: var(--on-ink-2); font-weight: 500; padding-right: 8px; }
  .menu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 8px; color: var(--on-ink); text-align: left; font-weight: 500; }
  .menu button:hover { background: var(--ink-3); }
  .menu button svg { color: var(--on-ink-2); flex: none; }
  .menu .grow { flex: 1; }
  .menu kbd { background: rgba(255,255,255,.1); color: var(--on-ink-2); opacity: 1; }

  .hint {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); pointer-events: none;
    background: var(--ink); color: var(--on-ink); padding: 9px 14px; border-radius: 10px; font-weight: 500;
    box-shadow: 0 0 0 1px rgba(255,255,255,.08), var(--shadow); animation: rise .2s ease-out; white-space: nowrap;
  }
  .hint kbd { background: rgba(255,255,255,.12); color: var(--on-ink); opacity: 1; margin: 0 2px; }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 6px); } }
  .countdown { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); pointer-events: none; display: flex; align-items: center; gap: 10px;
    background: var(--ink); color: var(--on-ink); padding: 8px 14px 8px 8px; border-radius: 12px; box-shadow: 0 0 0 1px rgba(255,255,255,.08), var(--shadow); font-weight: 500; }
  .countdown b { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: var(--on-accent); font-family: ${MONO}; display: grid; place-items: center; font-size: 15px; }

  .text-input {
    position: fixed; pointer-events: auto; margin: 0; border: 0; outline: 0; resize: none; overflow: hidden;
    padding: 5px 8px; border-radius: 6px; font-weight: 600; line-height: 1.3; font-family: ${FONT};
    field-sizing: content; min-width: 120px; max-width: 420px; box-shadow: 0 0 0 2px rgba(255,255,255,.9), 0 4px 14px rgba(0,0,0,.2);
  }
  .text-input::placeholder { color: inherit; opacity: .6; }

  /* Scrim + panel */
  .scrim { position: fixed; inset: 0; background: rgba(3,6,10,.45); pointer-events: auto; animation: fade .2s; }
  @keyframes fade { from { opacity: 0; } }
  .panel {
    position: fixed; top: 12px; right: 12px; bottom: 12px; width: 404px; max-width: calc(100vw - 24px); pointer-events: auto;
    background: var(--surface); border-radius: 14px; box-shadow: 0 0 0 1px var(--border-2), var(--shadow);
    display: flex; flex-direction: column; overflow: hidden; animation: slide .26s cubic-bezier(.2,.8,.2,1);
  }
  @keyframes slide { from { opacity: 0; transform: translateX(16px); } }
  .panel::before { content: ""; height: 2px; background: var(--grad); flex: none; }
  .p-head { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px 18px; border-bottom: 1px solid var(--border); }
  .p-head .t { font: 600 13.5px/1.3 ${MONO}; letter-spacing: -.02em; }
  .p-head .s { color: var(--text-3); font: 11.5px/1.4 ${MONO}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-head .grow { flex: 1; min-width: 0; }
  .icon-btn { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; color: var(--text-2); }
  .icon-btn:hover { background: var(--soft); color: var(--text); }
  .p-body { flex: 1; min-height: 0; overflow: auto; padding: 16px 18px 8px; display: grid; grid-auto-rows: max-content; gap: 16px; align-content: start; }
  .p-body > * { min-height: max-content; }
  .shot { position: relative; margin: 0; flex: none; min-height: 60px; border-radius: 10px; overflow: hidden; background: var(--soft); box-shadow: 0 0 0 1px var(--border); }
  .shot img { display: block; width: 100%; height: auto; max-height: 260px; object-fit: contain; }
  .shot.full { max-height: 300px; overflow-y: auto; }
  .shot.full img { max-height: none; }
  .f-steps { min-height: 88px; font: 12.5px/1.55 ${MONO}; }
  .shot .play { position: absolute; inset: 0; margin: auto; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(9,11,15,.72); color: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.2); pointer-events: none; }
  .shot .play svg { width: 18px; height: 18px; margin-left: 3px; }
  .shot .tag { position: absolute; left: 8px; bottom: 8px; background: rgba(9,11,15,.85); color: #E6EDF3; font: 500 11px/1.2 ${MONO}; padding: 4px 7px; border-radius: 6px; }
  .field { display: grid; gap: 6px; }
  .label { font: 500 11.5px/1.3 ${MONO}; color: var(--text-2); display: flex; justify-content: space-between; }
  .label em { font-style: normal; color: var(--text-3); font-weight: 400; }
  .input, .textarea {
    width: 100%; font: 14px/1.45 ${FONT}; color: var(--text); background: var(--field); border: 1px solid var(--border-2);
    border-radius: 9px; padding: 9px 11px; outline: none; transition: border-color .12s, box-shadow .12s;
  }
  .textarea { resize: vertical; min-height: 104px; }
  .input::placeholder, .textarea::placeholder { color: var(--text-3); }
  .input:focus, .textarea:focus { border-color: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,.16); }
  .seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; background: var(--field); border: 1px solid var(--border); border-radius: 10px; }
  .seg button { height: 30px; border-radius: 7px; font-weight: 500; color: var(--text-2); display: flex; align-items: center; justify-content: center; gap: 6px; }
  .seg button:hover { color: var(--text); }
  .seg button.active { background: var(--ink-3); color: var(--text); box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06); }
  .seg i { width: 7px; height: 7px; border-radius: 50%; }
  .ctx { border: 1px solid var(--border); border-radius: 10px; }
  .ctx summary { list-style: none; cursor: pointer; padding: 10px 12px; font: 500 11.5px/1.3 ${MONO}; color: var(--text-2); display: flex; align-items: center; gap: 8px; }
  .ctx summary::-webkit-details-marker { display: none; }
  .ctx summary .grow { flex: 1; }
  .ctx summary svg { transition: transform .15s; }
  .ctx[open] summary svg { transform: rotate(180deg); }
  .ctx .warn { color: #FBBF24; display: inline-flex; align-items: center; gap: 4px; font-weight: 500; }
  .ctx dl { margin: 0; padding: 0 12px 12px; display: grid; grid-template-columns: 84px 1fr; gap: 6px 10px; font-size: 12px; }
  .ctx dt { color: var(--text-3); }
  .ctx dd { margin: 0; color: var(--text); word-break: break-all; }
  .ctx code { font: 11px/1.5 ${MONO}; background: var(--soft); padding: 1px 4px; border-radius: 4px; }
  .ctx .errs { grid-column: 1 / -1; margin: 4px 0 0; padding: 8px 10px; background: rgba(255,92,122,.08); color: #FF8FA3; border: 1px solid rgba(255,92,122,.2); border-radius: 8px; font: 11px/1.5 ${MONO}; max-height: 120px; overflow: auto; white-space: pre-wrap; }
  .gh-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; }
  .gh-row:hover { border-color: var(--border-2); }
  .gh-row .gh-ico { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; background: var(--soft); color: var(--text-2); flex: none; }
  .gh-row .grow { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .gh-row b { font: 500 12.5px/1.2 ${MONO}; color: var(--text); display: flex; align-items: center; gap: 6px; }
  .gh-row small { font: 11px/1.3 ${MONO}; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gh-row.on { border-color: rgba(74,222,128,.35); background: rgba(74,222,128,.05); }
  .gh-row.on .gh-ico { background: rgba(74,222,128,.14); color: #4ADE80; }
  .sw { position: relative; width: 32px; height: 20px; flex: none; }
  .sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .sw span { position: absolute; inset: 0; border-radius: 10px; background: var(--border-2); transition: background .15s; pointer-events: none; }
  .sw span::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #C9D1D9; transition: transform .18s cubic-bezier(.2,.8,.2,1); }
  .sw input:checked + span { background: var(--accent); }
  .sw input:checked + span::after { transform: translateX(12px); background: var(--on-accent); }
  .p-foot { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--border); background: #0B0E13; }
  .p-foot .grow { flex: 1; }
  .btn { height: 36px; padding: 0 14px; border-radius: 8px; font: 500 12.5px/1 ${MONO}; display: inline-flex; align-items: center; gap: 8px; transition: background .12s; white-space: nowrap; }
  .btn.ghost { color: var(--text-2); padding: 0 10px 0 6px; gap: 2px; }
  .btn.ghost:hover { background: var(--soft); color: var(--text); }
  .btn.secondary { background: var(--soft); box-shadow: inset 0 0 0 1px var(--border-2); }
  .btn.secondary:hover { background: var(--ink-3); }
  .btn.primary { background: var(--accent); color: var(--on-accent); font-weight: 600; box-shadow: 0 0 0 1px rgba(255,255,255,.22) inset, 0 4px 14px -4px rgba(74,222,128,.6); }
  .btn.primary:hover { background: #6EE79A; }
  .btn.primary kbd { background: rgba(0,0,0,.14); color: var(--on-accent); opacity: 1; }
  .btn:disabled { opacity: .5; pointer-events: none; }

  .toasts { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: grid; gap: 8px; pointer-events: none; }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 14px; border-radius: 12px;
    background: var(--glass); color: var(--on-ink); box-shadow: 0 0 0 1px rgba(255,255,255,.07) inset, var(--shadow); animation: rise2 .22s cubic-bezier(.2,.8,.2,1); font-weight: 500; white-space: nowrap;
  }
  @keyframes rise2 { from { opacity: 0; transform: translateY(8px); } }
  .toast .ok { width: 18px; height: 18px; border-radius: 50%; background: #4ADE80; display: grid; place-items: center; color: #03140A; flex: none; }
  .toast .err { background: #FF5C7A; color: #fff; }
  .toast button { height: 28px; padding: 0 10px; border-radius: 7px; background: rgba(255,255,255,.1); font-weight: 600; }
  .toast button:hover { background: rgba(255,255,255,.18); }
  `;

  // ------------------------------------------------------------------
  // DOM construction
  // ------------------------------------------------------------------
  // Bundled Geist fonts, registered under private family names so they never affect the host page.
  let fontsRequested = false;
  function loadFonts() {
    if (fontsRequested) return;
    fontsRequested = true;
    try {
      for (const [family, file] of [['Bugmark Sans', 'Geist-Variable.woff2'], ['Bugmark Mono', 'GeistMono-Variable.woff2']]) {
        const face = new FontFace(family, `url("${chrome.runtime.getURL(`fonts/${file}`)}") format("woff2")`, { weight: '100 900', display: 'swap' });
        document.fonts.add(face);
        face.load().catch(() => document.fonts.delete(face)); // blocked by page CSP → system font fallback
      }
    } catch { /* ignore */ }
  }

  function build() {
    loadFonts();
    host = document.createElement('bugmark-ui');
    ['all:initial', 'position:fixed', 'inset:0', 'z-index:2147483647', 'pointer-events:none', 'display:block'].forEach((d) => {
      const [k, v] = d.split(':'); host.style.setProperty(k, v, 'important');
    });
    shadow = host.attachShadow({ mode: 'closed' });
    const keyOf = (t) => Object.keys(TOOL_KEYS).find((k) => TOOL_KEYS[k] === t).toUpperCase();
    const toolBtn = (t) => `<button class="tb" data-tool="${t}" aria-label="${TOOL_LABELS[t]}">${ICONS[t]}<span class="tip">${TOOL_LABELS[t]}<kbd>${keyOf(t)}</kbd></span></button>`;
    shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="root">
        <canvas class="canvas" hidden></canvas>
        <div class="frame" hidden></div>
        <div class="inspect-box" hidden><span></span></div>
        <div class="scrim" hidden></div>

        <button class="launcher" hidden aria-label="Annotate this page">${ICONS.logo}<span class="badge" hidden></span><span class="tip">Add feedback<kbd>⌥⇧S</kbd></span></button>

        <div class="toolbar" role="toolbar" aria-label="Bugmark annotation tools" hidden>
          <div class="grip" title="Drag to move">${ICONS.grip}</div>
          ${toolBtn('browse')}
          <span class="sep"></span>
          ${['pen', 'marker', 'arrow', 'rect', 'ellipse', 'text', 'pin', 'redact'].map(toolBtn).join('')}
          <span class="sep"></span>
          ${toolBtn('inspect')}
          <div class="color-wrap">
            <button class="color-btn" aria-label="Color and size"><span class="dot"></span>${ICONS.chevron}<span class="tip">Color &amp; size</span></button>
            <div class="popover palette" hidden>
              <div class="swatches">${COLORS.map((c) => `<button class="swatch" data-color="${c}" aria-label="${c}"><span style="background:${c}"></span></button>`).join('')}</div>
              <div class="sizes">${Object.entries(SIZES).map(([k, v]) => `<button class="size" data-size="${k}" aria-label="Size ${k}"><i style="height:${v.stroke}px"></i></button>`).join('')}</div>
            </div>
          </div>
          <span class="sep"></span>
          <button class="tb" data-act="undo" aria-label="Undo">${ICONS.undo}<span class="tip">Undo<kbd>${MOD} Z</kbd></span></button>
          <button class="tb" data-act="redo" aria-label="Redo">${ICONS.redo}<span class="tip">Redo<kbd>${MOD} ⇧ Z</kbd></span></button>
          <button class="tb" data-act="clear" aria-label="Clear all">${ICONS.trash}<span class="tip">Clear all</span></button>
          <span class="sep"></span>
          <button class="tb" data-act="cancel" aria-label="Exit">${ICONS.x}<span class="tip">Exit<kbd>Esc</kbd></span></button>
          <div class="cap-wrap">
            <div class="cap">
              <button class="main" data-act="capture" data-mode="visible">Capture <kbd>↵</kbd></button>
              <button class="more" data-act="capmenu" aria-label="More capture options">${ICONS.chevron}</button>
            </div>
            <div class="popover menu" hidden>
              <button data-act="capture" data-mode="visible">${ICONS.viewport}<span class="grow">Visible area</span><kbd>↵</kbd></button>
              <button data-act="capture" data-mode="full">${ICONS.fullpage}<span class="grow">Full page</span><kbd>⇧↵</kbd></button>
              <button data-act="capture" data-mode="delay">${ICONS.timer}<span class="grow">In 3 seconds</span></button>
              <button data-act="capture" data-mode="breakpoints">${ICONS.devices}<span class="grow">Mobile · tablet · desktop</span></button>
              <span class="menu-sep"></span>
              <button data-act="record">${ICONS.record}<span class="grow">Record video</span><kbd>⌥⇧R</kbd></button>
            </div>
          </div>
        </div>

        <div class="hint" hidden></div>
        <div class="countdown" hidden><b>3</b><span>Hover what you want to capture…</span></div>

        <aside class="panel" role="dialog" aria-label="New feedback" hidden>
          <div class="p-head">
            <div class="grow"><div class="t">New feedback</div><div class="s p-sub"></div></div>
            <button class="icon-btn" data-act="discard" aria-label="Discard">${ICONS.x}</button>
          </div>
          <div class="p-body">
            <figure class="shot"><img alt="Annotated screenshot"><span class="play" hidden>${ICONS.play}</span><span class="tag" hidden></span></figure>
            <label class="field"><span class="label">Title <em>optional</em></span>
              <input class="input f-title" maxlength="140" placeholder="e.g. Hero CTA overlaps image on tablet"></label>
            <label class="field"><span class="label">Comment</span>
              <textarea class="textarea f-comment" placeholder="What’s wrong, and what should happen instead?"></textarea></label>
            <div class="field"><span class="label">Type</span>
              <div class="seg f-type">${TYPES.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div></div>
            <div class="field"><span class="label">Priority</span>
              <div class="seg f-prio">${PRIORITIES.map(([v, l]) => `<button data-v="${v}"><i style="background:${prioColor(v)}"></i>${l}</button>`).join('')}</div></div>
            <label class="field f-steps-wrap"><span class="label">Steps to reproduce <em class="steps-note">auto-recorded · edit freely</em></span>
              <textarea class="textarea f-steps" rows="4" placeholder="1. Open the page&#10;2. Click …&#10;3. See the problem"></textarea></label>
            <label class="gh-row" hidden>
              <span class="gh-ico"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg></span>
              <span class="grow"><b>Create GitHub issue</b><small class="gh-repo"></small></span>
              <span class="sw"><input type="checkbox" class="f-gh"><span></span></span>
            </label>
            <details class="ctx"><summary><span class="grow">Captured context</span><span class="ctx-flag"></span>${ICONS.chevron}</summary><dl class="ctx-dl"></dl></details>
          </div>
          <div class="p-foot">
            <button class="btn ghost" data-act="back">${ICONS.back}Edit</button>
            <span class="grow"></span>
            <button class="btn secondary" data-act="save-next">Save &amp; add another</button>
            <button class="btn primary" data-act="save">Save <kbd>${MOD}↵</kbd></button>
          </div>
        </aside>

        <div class="rec" hidden role="status">
          <span class="dot"></span><span class="time">0:00</span><span class="hint2" hidden></span>
          <span class="mic" title="Microphone"></span>
          <button class="stop" data-act="rec-stop"><i></i>Stop</button>
        </div>

        <div class="toasts" aria-live="polite"></div>
      </div>`;
    document.documentElement.appendChild(host);

    $root = $('.root'); canvas = $('.canvas'); ctx = canvas.getContext('2d');
    toolbar = $('.toolbar'); launcher = $('.launcher'); panel = $('.panel'); scrim = $('.scrim');
    hintEl = $('.hint'); toastsEl = $('.toasts'); paletteEl = $('.palette'); menuEl = $('.menu'); inspectBox = $('.inspect-box');

    bindToolbar(); bindCanvas(); bindPanel(); bindLauncher(); bindRecPill();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', () => { if (state.mode !== 'idle') { sizeCanvas(); redraw(); } });
    window.addEventListener('scroll', () => {
      if (state.mode === 'idle' || state.busyScroll) return;
      if (state.textEl) commitText(true);
      inspectBox.hidden = true;
      requestRedraw();
    }, { passive: true });

    new MutationObserver(() => { if (!host.isConnected) document.documentElement.appendChild(host); })
      .observe(document.documentElement, { childList: true });
  }

  function prioColor(v) { return { low: '#A1A1AA', medium: '#3B82F6', high: '#F97316', critical: '#EF4444' }[v]; }

  // Anonymous usage event (no URLs or page content) — see src/shared/analytics.js.
  const track = (name, params = {}) => { send({ type: 'bugmark:track', name, params }); };

  // ------------------------------------------------------------------
  // Launcher
  // ------------------------------------------------------------------
  function bindLauncher() {
    let start = null, moved = false;
    launcher.addEventListener('pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY, r: parseFloat(launcher.style.right) || 20, b: parseFloat(launcher.style.bottom) || 20 };
      moved = false; launcher.setPointerCapture(e.pointerId);
    });
    launcher.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      launcher.style.right = clamp(start.r - dx, 8, innerWidth - 52) + 'px';
      launcher.style.bottom = clamp(start.b - dy, 8, innerHeight - 52) + 'px';
    });
    launcher.addEventListener('pointerup', () => {
      if (!start) return;
      start = null;
      if (moved) {
        state.settings.launcherPos = { right: parseFloat(launcher.style.right), bottom: parseFloat(launcher.style.bottom) };
        chrome.storage.local.get('settings').then(({ settings }) => chrome.storage.local.set({ settings: { ...(settings || {}), launcherPos: state.settings.launcherPos } }));
      } else startAnnotate();
    });
  }

  function updateLauncher() {
    if (!launcher) return;
    const s = state.settings;
    launcher.hidden = !(state.mode === 'idle' && !state.recording && s.showLauncher && !(s.hiddenHosts || []).includes(location.host));
    if (s.launcherPos) {
      launcher.style.right = clamp(s.launcherPos.right, 8, innerWidth - 52) + 'px';
      launcher.style.bottom = clamp(s.launcherPos.bottom, 8, innerHeight - 52) + 'px';
    }
    const badge = launcher.querySelector('.badge');
    badge.hidden = !state.counts.site;
    badge.textContent = state.counts.site > 99 ? '99+' : state.counts.site;
  }

  async function refreshCounts() {
    const res = await send({ type: 'bugmark:count', host: location.host });
    if (res?.ok) { state.counts = res.counts; updateLauncher(); }
    return res;
  }

  // ------------------------------------------------------------------
  // Mode transitions
  // ------------------------------------------------------------------
  async function startAnnotate() {
    if (!host) build();
    if (state.mode !== 'idle' || state.starting) return;
    state.starting = true;
    const res = await refreshCounts();
    state.starting = false;
    if (res && !res.ok && res.error) { toast(res.error, { error: true }); return; }
    state.mode = 'draw';
    try { document.activeElement?.blur?.(); } catch {}
    sizeCanvas();
    canvas.hidden = false; toolbar.hidden = false; launcher.hidden = true;
    if (state.tool === 'browse') state.tool = 'pen';
    track('annotate_started');
    syncToolbar(); redraw();
    showHint('Mark up the page, then press <kbd>↵</kbd> to capture', 3200);
  }

  function discardPanel() {
    if (state.video?.mediaId) send({ type: 'bugmark:deleteMedia', mediaId: state.video.mediaId });
    state.video = null;
    exitAnnotate();
  }

  function exitAnnotate() {
    commitText(false);
    state.mode = 'idle'; state.shapes = []; state.redo = []; state.drawing = null; state.shot = null; state.video = null;
    canvas.hidden = true; toolbar.hidden = true; panel.hidden = true; scrim.hidden = true;
    closePopovers(); $('.frame').hidden = true; hintEl.hidden = true; inspectBox.hidden = true;
    updateLauncher();
  }

  function toggle() { state.mode === 'idle' ? startAnnotate() : exitAnnotate(); }

  // ------------------------------------------------------------------
  // Toolbar
  // ------------------------------------------------------------------
  function closePopovers() { paletteEl.hidden = true; menuEl.hidden = true; }

  function bindToolbar() {
    toolbar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tool) setTool(b.dataset.tool);
      else if (b.classList.contains('color-btn')) { menuEl.hidden = true; paletteEl.hidden = !paletteEl.hidden; }
      else if (b.dataset.color) { state.color = b.dataset.color; paletteEl.hidden = true; syncToolbar(); }
      else if (b.dataset.size) { state.size = b.dataset.size; syncToolbar(); }
      else if (b.dataset.act === 'undo') undo();
      else if (b.dataset.act === 'redo') redo();
      else if (b.dataset.act === 'clear') { if (state.shapes.length) { state.redo = [...state.shapes].reverse(); state.shapes = []; redraw(); syncToolbar(); } }
      else if (b.dataset.act === 'cancel') exitAnnotate();
      else if (b.dataset.act === 'capmenu') { paletteEl.hidden = true; menuEl.hidden = !menuEl.hidden; }
      else if (b.dataset.act === 'capture') { closePopovers(); capture(b.dataset.mode); }
      else if (b.dataset.act === 'record') { closePopovers(); exitAnnotate(); startRecording(); }
    });

    const grip = $('.grip');
    let d = null;
    grip.addEventListener('pointerdown', (e) => {
      const r = toolbar.getBoundingClientRect();
      d = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener('pointermove', (e) => {
      if (!d) return;
      toolbar.classList.add('moved');
      toolbar.style.left = clamp(e.clientX - d.dx, 4, innerWidth - toolbar.offsetWidth - 4) + 'px';
      toolbar.style.top = clamp(e.clientY - d.dy, 4, innerHeight - toolbar.offsetHeight - 4) + 'px';
    });
    grip.addEventListener('pointerup', () => { d = null; });
  }

  function setTool(t) {
    if (t !== state.tool) track('tool_selected', { tool: t });
    commitText(true);
    state.tool = t; closePopovers(); inspectBox.hidden = true;
    syncToolbar();
    if (t === 'browse') showHint('Interact with the page — pick a tool to keep drawing', 2400);
    if (t === 'inspect') showHint('Click any element to attach its selector &amp; styles', 2600);
  }

  function syncToolbar() {
    toolbar.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === state.tool));
    toolbar.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('active', b.dataset.color === state.color));
    toolbar.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
    $('.dot').style.background = state.color;
    toolbar.querySelector('[data-act="undo"]').disabled = !state.shapes.length;
    toolbar.querySelector('[data-act="redo"]').disabled = !state.redo.length;
    toolbar.querySelector('[data-act="clear"]').disabled = !state.shapes.length;
    canvas.classList.toggle('browse', state.tool === 'browse');
    canvas.classList.toggle('text', state.tool === 'text');
    canvas.classList.toggle('inspect', state.tool === 'inspect');
    $('.frame').hidden = state.tool !== 'browse' || state.mode !== 'draw';
  }

  function undo() { commitText(true); if (state.shapes.length) { state.redo.push(state.shapes.pop()); redraw(); syncToolbar(); } }
  function redo() { if (state.redo.length) { state.shapes.push(state.redo.pop()); redraw(); syncToolbar(); } }
  function pushShape(s) { state.shapes.push(s); state.redo = []; redraw(); syncToolbar(); }

  // ------------------------------------------------------------------
  // Canvas drawing
  // ------------------------------------------------------------------
  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  }

  let rafPending = false;
  function requestRedraw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; redraw(); });
  }

  function bindCanvas() {
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || state.mode !== 'draw') return;
      closePopovers();
      if (state.textEl) { commitText(true); return; }
      const x = e.clientX + scrollX, y = e.clientY + scrollY, t = state.tool, sz = SIZES[state.size];
      if (t === 'inspect') { pickElement(e.clientX, e.clientY); return; }
      if (t === 'text') { e.preventDefault(); startText(e.clientX, e.clientY); return; }
      if (t === 'pin') { pushShape({ type: 'pin', x, y, n: state.shapes.filter((s) => s.type === 'pin').length + 1, color: state.color }); return; }
      canvas.setPointerCapture(e.pointerId);
      state.drawing = t === 'pen' || t === 'marker'
        ? { type: t, color: state.color, size: t === 'marker' ? sz.stroke * 3 + 10 : sz.stroke, points: [[x, y]] }
        : { type: t, color: state.color, size: sz.stroke, x1: x, y1: y, x2: x, y2: y };
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (state.tool === 'inspect' && !state.drawing) { hoverElement(e.clientX, e.clientY); return; }
      const s = state.drawing;
      if (!s) return;
      if (s.points) {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs) s.points.push([ev.clientX + scrollX, ev.clientY + scrollY]);
      } else {
        let x = e.clientX + scrollX, y = e.clientY + scrollY;
        if (e.shiftKey) {
          const dx = x - s.x1, dy = y - s.y1;
          if (s.type === 'arrow') {
            const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(dx, dy);
            x = s.x1 + Math.cos(a) * len; y = s.y1 + Math.sin(a) * len;
          } else {
            const m = Math.max(Math.abs(dx), Math.abs(dy));
            x = s.x1 + Math.sign(dx || 1) * m; y = s.y1 + Math.sign(dy || 1) * m;
          }
        }
        s.x2 = x; s.y2 = y;
      }
      redraw();
    });
    const end = () => {
      const s = state.drawing;
      if (!s) return;
      state.drawing = null;
      const tiny = s.points ? false : Math.hypot(s.x2 - s.x1, s.y2 - s.y1) < 4;
      if (!tiny) pushShape(s); else redraw();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', () => { inspectBox.hidden = true; });
  }

  function redraw(forCapture = false) {
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.translate(-scrollX, -scrollY);
    const all = state.drawing ? [...state.shapes, state.drawing] : state.shapes;
    for (const s of all) drawShape(s, forCapture);
  }

  function drawShape(s, forCapture) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.size;
    if (!['marker', 'redact', 'element'].includes(s.type)) { ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; }
    const nx = Math.min(s.x1, s.x2), ny = Math.min(s.y1, s.y2), w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
    switch (s.type) {
      case 'pen': strokePoints(s.points); break;
      case 'marker': ctx.globalAlpha = 0.38; ctx.lineCap = 'square'; strokePoints(s.points); break;
      case 'rect': ctx.beginPath(); ctx.roundRect(nx, ny, w, h, 4); ctx.stroke(); break;
      case 'ellipse': ctx.beginPath(); ctx.ellipse(nx + w / 2, ny + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke(); break;
      case 'arrow': drawArrow(s); break;
      case 'text': drawText(s); break;
      case 'pin': drawPin(s); break;
      case 'element': drawElement(s); break;
      case 'redact':
        if (forCapture) break;
        ctx.fillStyle = 'rgba(24,24,27,.5)'; ctx.fillRect(nx, ny, w, h);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(nx + .75, ny + .75, w - 1.5, h - 1.5);
        if (w > 70 && h > 22) { ctx.fillStyle = '#fff'; ctx.font = `600 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('REDACTED', nx + w / 2, ny + h / 2); }
        break;
    }
    ctx.restore();
  }

  function strokePoints(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length < 3) {
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0] + 0.01, last[1] + 0.01);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]);
    }
    ctx.stroke();
  }

  function drawArrow(s) {
    const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const head = 11 + s.size * 2.4;
    const back = Math.min(head * 0.75, Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2 - Math.cos(ang) * back, s.y2 - Math.sin(ang) * back); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x2, s.y2);
    ctx.lineTo(s.x2 - head * Math.cos(ang - Math.PI / 7), s.y2 - head * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(s.x2 - head * Math.cos(ang + Math.PI / 7), s.y2 - head * Math.sin(ang + Math.PI / 7));
    ctx.closePath(); ctx.fill();
  }

  function drawText(s) {
    const fs = s.fontSize;
    ctx.font = `600 ${fs}px ${FONT}`;
    const lines = s.text.split('\n'), lh = fs * 1.3, px = 8, py = 5;
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + px * 2;
    const h = lines.length * lh + py * 2;
    ctx.beginPath(); ctx.roundRect(s.x, s.y, w, h, 6); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = readableOn(s.color); ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, s.x + px, s.y + py + i * lh + lh / 2));
  }

  function drawPin(s) {
    const r = 13;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = readableOn(s.color); ctx.font = `700 ${s.n > 9 ? 11 : 13}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(s.n), s.x, s.y + 0.5);
  }

  function drawElement(s) {
    ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeStyle = INSPECT_COLOR;
    ctx.fillStyle = 'rgba(234,88,12,.07)';
    ctx.fillRect(s.x, s.y, s.w, s.h); ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
    const label = `E${s.n}  ${s.info.selector.split(' > ').pop()}`.slice(0, 48);
    ctx.font = `600 11px ${FONT}`;
    const lw = ctx.measureText(label).width + 12, lh = 20;
    const ly = s.y - lh - 3 < scrollY ? s.y + 3 : s.y - lh - 3;
    ctx.fillStyle = INSPECT_COLOR; ctx.beginPath(); ctx.roundRect(s.x, ly, lw, lh, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(label, s.x + 6, ly + lh / 2 + 0.5);
  }

  function readableOn(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#0B0B0C' : '#FFFFFF';
  }

  // Text tool (input positioned in viewport coords, stored in document coords)
  function startText(cx, cy) {
    const fs = SIZES[state.size].text;
    const el = document.createElement('textarea');
    el.className = 'text-input'; el.rows = 1; el.placeholder = 'Type…';
    Object.assign(el.style, { left: cx + 'px', top: cy + 'px', fontSize: fs + 'px', background: state.color, color: readableOn(state.color) });
    Object.assign(el.dataset, { x: cx + scrollX, y: cy + scrollY, fs, color: state.color });
    $root.appendChild(el);
    state.textEl = el;
    requestAnimationFrame(() => el.focus());
    el.addEventListener('blur', () => setTimeout(() => commitText(true), 0));
  }

  function commitText(keep) {
    const el = state.textEl;
    if (!el) return;
    state.textEl = null;
    const text = el.value.replace(/\s+$/, '');
    if (keep && text) pushShape({ type: 'text', x: +el.dataset.x, y: +el.dataset.y, text, fontSize: +el.dataset.fs, color: el.dataset.color });
    el.remove();
  }

  // ------------------------------------------------------------------
  // Element inspector
  // ------------------------------------------------------------------
  function elementAt(cx, cy) {
    return document.elementsFromPoint(cx, cy).find((el) => el !== host && el !== document.documentElement && el !== document.body) || null;
  }

  function hoverElement(cx, cy) {
    const el = elementAt(cx, cy);
    if (!el) { inspectBox.hidden = true; return; }
    const r = el.getBoundingClientRect();
    Object.assign(inspectBox.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    inspectBox.classList.toggle('below', r.top < 26);
    inspectBox.firstChild.textContent = `${shortName(el)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
    inspectBox.hidden = false;
  }

  function pickElement(cx, cy) {
    const el = elementAt(cx, cy);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const n = state.shapes.filter((s) => s.type === 'element').length + 1;
    pushShape({ type: 'element', n, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, info: describe(el) });
    inspectBox.hidden = true;
  }

  function shortName(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = [...el.classList].slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    return s.length > 60 ? s.slice(0, 58) + '…' : s;
  }

  function cssPath(el) {
    const ok = (id) => /^[A-Za-z][\w-]*$/.test(id);
    if (el.id && ok(el.id) && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement && el !== document.body && parts.length < 6) {
      if (el.id && ok(el.id)) { parts.unshift('#' + CSS.escape(el.id)); break; }
      let part = el.tagName.toLowerCase();
      const cls = [...el.classList].filter((c) => !/^(css-|sc-|jsx-|emotion-)|\d{4,}|[:[\]/]/.test(c)).slice(0, 2);
      if (cls.length) part += '.' + cls.map((c) => CSS.escape(c)).join('.');
      const parent = el.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === el.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(el) + 1})`;
      }
      parts.unshift(part);
      el = parent;
    }
    return parts.join(' > ');
  }

  function describe(el) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || el.alt || '').trim().replace(/\s+/g, ' ');
    return {
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      text: text.length > 120 ? text.slice(0, 118) + '…' : text,
      size: `${Math.round(r.width)}×${Math.round(r.height)}`,
      styles: {
        font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0].replace(/["']/g, '')}`,
        color: cs.color, background: cs.backgroundColor, padding: cs.padding, margin: cs.margin,
        border: cs.borderWidth !== '0px' ? `${cs.borderWidth} ${cs.borderStyle} ${cs.borderColor}` : 'none',
        radius: cs.borderRadius, display: cs.display,
      },
    };
  }

  // ------------------------------------------------------------------
  // Capture
  // ------------------------------------------------------------------
  const toViewport = (r) => ({ x1: r.x1 - scrollX, y1: r.y1 - scrollY, x2: r.x2 - scrollX, y2: r.y2 - scrollY });

  async function capture(mode = 'visible') {
    if (state.mode !== 'draw' || state.capturing) return;
    commitText(true);
    state.capturing = true;
    toolbar.hidden = true; closePopovers(); hintEl.hidden = true; inspectBox.hidden = true; $('.frame').hidden = true;
    toastsEl.innerHTML = '';

    if (mode === 'delay') {
      canvas.classList.add('browse'); // let the user hover the page
      const cd = $('.countdown');
      cd.hidden = false;
      for (let i = 3; i > 0; i--) { cd.firstChild.textContent = i; await sleep(1000); }
      cd.hidden = true;
    }

    let res, fullPage = false, fullNote = '';
    const se = document.scrollingElement || document.documentElement;
    const scroller = mode === 'full' ? (se.scrollHeight > innerHeight + 4 ? null : findScroller()) : null;
    if (mode === 'breakpoints') {
      // Annotations are tied to this layout, so they aren't drawn on the other screen sizes.
      canvas.hidden = true;
      showHint('Rendering mobile, tablet and desktop…', 6000);
      await frames(2);
      hintEl.hidden = true;
      host.style.setProperty('visibility', 'hidden', 'important');
      res = await send({ type: 'bugmark:breakpoints' });
      host.style.removeProperty('visibility');
      canvas.hidden = false;
      if (res?.ok && state.shapes.some((sh) => sh.type !== 'element')) fullNote = 'Annotations aren’t added to breakpoint captures';
    } else if (mode === 'full' && (se.scrollHeight > innerHeight + 4 || scroller)) {
      res = scroller ? await captureScroller(scroller) : await captureFullPage();
      fullPage = true;
    } else {
      if (mode === 'full') fullNote = 'This page doesn’t scroll — captured the visible area';
      redraw(true);
      await frames(2); await sleep(40);
      res = await send({
        type: 'bugmark:capture',
        viewport: { w: innerWidth, h: innerHeight },
        redactions: state.shapes.filter((s) => s.type === 'redact').map(toViewport),
      });
    }
    const meta = collectMeta();
    meta.fullPage = fullPage;
    if (mode === 'breakpoints' && res?.ok) { meta.breakpoints = res.breakpoints; delete res.breakpoints; }
    meta.steps = await fetchSteps();
    redraw(false);
    state.capturing = false;
    if (!res?.ok) {
      toolbar.hidden = false; syncToolbar();
      toast(res?.error || 'Could not capture this page', { error: true });
      track('capture_failed', { capture_mode: mode });
      return;
    }
    state.shot = res; state.meta = meta;
    openPanel();
    if (fullNote) toast(fullNote, {});
  }

  async function captureFullPage() {
    const se = document.scrollingElement || document.documentElement;
    const vw = innerWidth, vh = innerHeight, dpr = window.devicePixelRatio || 1;
    const outRatio = Math.min(vw * dpr, 1920) / vw;           // output px per CSS px
    const total = Math.min(se.scrollHeight, Math.floor(16000 / outRatio));
    const ox = scrollX, oy = scrollY;
    const root = document.documentElement;
    const prevSB = root.style.getPropertyValue('scroll-behavior');
    root.style.setProperty('scroll-behavior', 'auto', 'important');
    state.busyScroll = true;

    const ys = [];
    for (let y = 0; y < total; y += vh) ys.push(Math.min(y, Math.max(0, total - vh)));
    const positions = [...new Set(ys)];
    const session = Math.random().toString(36).slice(2);
    let hidden = [], last = 0, error = null;

    try {
      for (let i = 0; i < positions.length; i++) {
        window.scrollTo(0, positions[i]);
        await frames(2); await sleep(i === 0 ? 150 : 300);  // let lazy content settle
        if (i === 1) { hidden = hideFixed(); await frames(1); }
        redraw(true);
        await frames(1);
        const wait = 560 - (Date.now() - last);              // captureVisibleTab rate limit
        if (wait > 0) await sleep(wait);
        last = Date.now();
        const r = await send({ type: 'bugmark:segment', session, y: scrollY });
        if (!r?.ok) throw Object.assign(new Error(r?.error || 'Capture failed'), { code: r?.code });
      }
    } catch (e) { error = e; }
    finally {
      hidden.forEach(([el, v, p]) => (v ? el.style.setProperty('visibility', v, p) : el.style.removeProperty('visibility')));
      prevSB ? root.style.setProperty('scroll-behavior', prevSB) : root.style.removeProperty('scroll-behavior');
      window.scrollTo(ox, oy);
      await frames(2);
      state.busyScroll = false;
    }
    if (error) { send({ type: 'bugmark:stitch', session, abort: true }); return { ok: false, error: error.message, code: error.code }; }
    return send({
      type: 'bugmark:stitch', session, viewport: { w: vw, h: vh }, totalH: total,
      redactions: state.shapes.filter((s) => s.type === 'redact'),
    });
  }

  // Apps often scroll an inner container (overflow:auto) instead of the window.
  // Pick the biggest visible one so full-page capture still works there.
  function findScroller() {
    let best = null, bestArea = 0;
    const els = document.body ? [document.body, ...document.body.getElementsByTagName('*')] : [];
    for (const el of els) {
      if (el === host || el.clientHeight < 150 || el.scrollHeight <= el.clientHeight + 20) continue;
      const oy = getComputedStyle(el).overflowY;
      if (!/(auto|scroll|overlay)/.test(oy)) continue;
      const r = el.getBoundingClientRect();
      const w = Math.min(r.right, innerWidth) - Math.max(r.left, 0);
      const h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (w <= 0 || h <= 0) continue;
      if (w * h > bestArea) { bestArea = w * h; best = el; }
    }
    return bestArea >= innerWidth * innerHeight * 0.15 ? best : null;
  }

  function clearOverlay() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  // Full-page capture for an inner scroll container: the container is scrolled and each view of it is
  // stacked; everything around it (sidebars, headers, footers) comes from the frame the user was looking at.
  async function captureScroller(el) {
    const vw = innerWidth, vh = innerHeight, dpr = window.devicePixelRatio || 1;
    const outRatio = Math.min(vw * dpr, 1920) / vw;
    const r0 = el.getBoundingClientRect();
    const rect = {
      x: Math.max(0, Math.round(r0.left)), y: Math.max(0, Math.round(r0.top)),
      r: Math.min(vw, Math.round(r0.right)), b: Math.min(vh, Math.round(r0.bottom)),
    };
    rect.w = rect.r - rect.x; rect.h = rect.b - rect.y;
    const clientH = el.clientHeight;
    const maxExtra = Math.max(0, Math.floor(16000 / outRatio) - vh);
    const extra = Math.min(el.scrollHeight - clientH, maxExtra);          // added height in the output
    const s0 = el.scrollTop;
    const prevSB = el.style.getPropertyValue('scroll-behavior');
    el.style.setProperty('scroll-behavior', 'auto', 'important');
    state.busyScroll = true;

    const step = Math.max(100, rect.h - 40);
    const set = new Set([s0]);
    for (let t = 0; t < extra + rect.h; t += step) set.add(Math.min(t, extra));
    const positions = [...set].filter((t) => t !== s0).sort((a, b) => a - b).concat([s0]); // user's view last
    const session = Math.random().toString(36).slice(2);
    const floating = [...el.getElementsByTagName('*'), ...document.body.getElementsByTagName('*')]
      .filter((n) => n !== host && /^(fixed|sticky)$/.test(getComputedStyle(n).position));
    const saved = floating.map((n) => [n, n.style.getPropertyValue('visibility'), n.style.getPropertyPriority('visibility')]);
    const hideFloating = (on) => floating.forEach((n) => (on ? n.style.setProperty('visibility', 'hidden', 'important') : null));
    const restoreFloating = () => saved.forEach(([n, v, p]) => (v ? n.style.setProperty('visibility', v, p) : n.style.removeProperty('visibility')));
    let last = 0, error = null;

    try {
      for (let i = 0; i < positions.length; i++) {
        const t = positions[i], mine = t === s0 && i === positions.length - 1;
        el.scrollTop = t;
        await frames(2); await sleep(i === 0 ? 150 : 300);
        if (mine) { restoreFloating(); redraw(true); } else { hideFloating(true); clearOverlay(); }
        await frames(1);
        const wait = 560 - (Date.now() - last);
        if (wait > 0) await sleep(wait);
        last = Date.now();
        const res = await send({ type: 'bugmark:segment', session, y: el.scrollTop, main: mine });
        if (!res?.ok) throw Object.assign(new Error(res?.error || 'Capture failed'), { code: res?.code });
      }
    } catch (e) { error = e; }
    finally {
      restoreFloating();
      el.scrollTop = s0;
      prevSB ? el.style.setProperty('scroll-behavior', prevSB) : el.style.removeProperty('scroll-behavior');
      await frames(2);
      state.busyScroll = false;
    }
    if (error) { send({ type: 'bugmark:stitch', session, abort: true }); return { ok: false, error: error.message, code: error.code }; }

    // Redactions: viewport coords → output coords
    const redactions = state.shapes.filter((sh) => sh.type === 'redact').map(toViewport).map((q) => {
      const cx = (q.x1 + q.x2) / 2, cy = (q.y1 + q.y2) / 2;
      const inside = cx >= rect.x && cx <= rect.r && cy >= rect.y && cy <= rect.b;
      const dy = inside ? s0 : (Math.min(q.y1, q.y2) >= rect.b ? extra : 0);
      return { x1: q.x1, x2: q.x2, y1: q.y1 + dy, y2: q.y2 + dy };
    });
    return send({ type: 'bugmark:stitch', session, mode: 'element', rect, extra, s0, viewport: { w: vw, h: vh }, totalH: vh + extra, redactions });
  }

  function hideFixed() {
    const out = [];
    const all = document.body ? document.body.getElementsByTagName('*') : [];
    for (const el of all) {
      const p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'sticky') {
        out.push([el, el.style.getPropertyValue('visibility'), el.style.getPropertyPriority('visibility')]);
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    }
    return out;
  }

  function collectMeta() {
    const ua = navigator.userAgent;
    const { browser, os } = parseUA(ua);
    const marks = {};
    state.shapes.forEach((s) => { marks[s.type] = (marks[s.type] || 0) + 1; });
    return {
      url: location.href, host: location.host, pageTitle: document.title,
      viewport: { w: innerWidth, h: innerHeight }, dpr: window.devicePixelRatio || 1,
      screen: { w: screen.width, h: screen.height }, scroll: { x: Math.round(scrollX), y: Math.round(scrollY) },
      browser, os, language: navigator.language, userAgent: ua,
      errors: pageErrors.slice(-12), marks, logs: snapshotLogs(),
      elements: state.shapes.filter((s) => s.type === 'element').map((s) => ({ n: s.n, ...s.info })),
    };
  }

  function parseUA(ua) {
    let m, browser = 'Unknown', os = 'Unknown';
    if ((m = ua.match(/Edg\/(\d+)/))) browser = `Edge ${m[1]}`;
    else if ((m = ua.match(/OPR\/(\d+)/))) browser = `Opera ${m[1]}`;
    else if ((m = ua.match(/Chrome\/(\d+)/))) browser = `Chrome ${m[1]}`;
    else if ((m = ua.match(/Firefox\/(\d+)/))) browser = `Firefox ${m[1]}`;
    if (navigator.brave) browser = browser.replace('Chrome', 'Brave');
    if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    return { browser, os };
  }

  // ------------------------------------------------------------------
  // Feedback panel
  // ------------------------------------------------------------------
  function bindPanel() {
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.closest('.f-type')) { state.type = b.dataset.v; syncSeg(); }
      else if (b.closest('.f-prio')) { state.priority = b.dataset.v; syncSeg(); }
      else if (b.dataset.act === 'back') backToDraw();
      else if (b.dataset.act === 'discard') discardPanel();
      else if (b.dataset.act === 'save') save(false);
      else if (b.dataset.act === 'save-next') save(true);
    });
    scrim.addEventListener('pointerdown', () => $('.f-comment').focus());
    $('.f-gh').addEventListener('change', (e) => {
      const gh = state.github;
      if (e.target.checked && gh && !gh.connected) {
        e.target.checked = false;
        toast('Connect GitHub to create issues', { action: 'Connect', onAction: () => send({ type: 'bugmark:openGithubSettings' }) });
        return;
      }
      $('.gh-row').classList.toggle('on', e.target.checked);
      chrome.storage.local.get('github').then(({ github }) => chrome.storage.local.set({ github: { ...(github || {}), panelOn: e.target.checked } })).catch(() => {});
    });
  }

  async function syncGithubRow() {
    const row = $('.gh-row');
    const res = await send({ type: 'bugmark:githubStatus', host: location.host });
    if (!res?.ok) { row.hidden = true; return; }
    state.github = res;
    const ready = res.connected && !!res.repo;
    row.hidden = false;
    $('.gh-repo').textContent = !res.connected ? 'Connect GitHub in Settings'
      : res.repo ? `${res.repo}${res.login ? ` · @${res.login}` : ''}` : 'Choose a repository in Settings';
    const on = ready && res.panelOn !== false;
    $('.f-gh').checked = on;
    row.classList.toggle('on', on);
    if (res.connected && !res.repo) state.github.connected = false; // no repo yet → send to settings
  }

  function syncSeg() {
    panel.querySelectorAll('.f-type button').forEach((b) => b.classList.toggle('active', b.dataset.v === state.type));
    panel.querySelectorAll('.f-prio button').forEach((b) => b.classList.toggle('active', b.dataset.v === state.priority));
  }

  function openPanel() {
    state.mode = 'panel';
    const m = state.meta;
    const img = $('.shot img');
    img.src = m.fullPage ? state.shot.image : state.shot.thumb; // full page: scroll through the whole image
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'top';
    $('.shot').classList.toggle('full', !!m.fullPage);
    $('.shot').scrollTop = 0;
    const tag = $('.shot .tag');
    const v = state.video;
    tag.hidden = !(m.fullPage || v || m.breakpoints);
    tag.textContent = v ? `Recording · ${fmtDur(v.duration)}${v.mic ? ' · voice' : ''}`
      : m.breakpoints ? m.breakpoints.map((b) => b.label).join(' · ')
      : m.fullPage ? `Full page · ${state.shot.width}×${state.shot.height}px` : '';
    $('.shot .play').hidden = !v;
    panel.querySelector('[data-act="back"]').hidden = !!v;
    panel.querySelector('[data-act="save-next"]').hidden = !!v;
    panel.setAttribute('aria-label', v ? 'New recording' : 'New feedback');
    panel.querySelector('.p-head .t').textContent = v ? 'New recording' : 'New feedback';
    $('.f-steps').value = formatSteps(m.steps);
    $('.steps-note').textContent = m.steps?.length ? 'auto-recorded · edit freely' : 'optional';
    $('.p-sub').textContent = `${m.host} · ${m.viewport.w}×${m.viewport.h}`;
    const errs = m.errors.length;
    $('.ctx-flag').innerHTML = errs ? `<span class="warn">${ICONS.alert}${errs} issue${errs > 1 ? 's' : ''}</span>` : '';
    const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
    $('.ctx-dl').innerHTML =
      row('Page', esc(m.url)) + row('Viewport', `${m.viewport.w} × ${m.viewport.h} @${m.dpr}x`) +
      row('Browser', esc(`${m.browser} · ${m.os}`)) + row('Scroll', `${m.scroll.y}px from top`) +
      m.elements.map((el) => row(`Element E${el.n}`, `<code>${esc(el.selector)}</code><br>${esc(el.size)} · ${esc(el.styles.font)}`)).join('') +
      logsRow(m.logs) +
      (errs ? `<pre class="errs">${m.errors.map((e) => esc(e.message + (e.source ? `\n   at ${e.source}` : ''))).join('\n')}</pre>` : '');
    syncSeg();
    syncGithubRow();
    scrim.hidden = false; panel.hidden = false;
    setTimeout(() => { $('.p-body').scrollTop = 0; $('.f-comment').focus({ preventScroll: true }); }, 60);
  }

  function logsRow(logs) {
    if (!logs) return '';
    const net = logs.network || [], con = logs.console || [];
    const failed = net.filter((n) => n.status >= 400 || n.status === 0).length;
    const warns = con.filter((c) => c.level === 'error' || c.level === 'warn').length;
    return `<dt>Network</dt><dd>${net.length} request${net.length === 1 ? '' : 's'}${failed ? ` · <span class="warn">${failed} failed</span>` : ''}</dd>` +
      `<dt>Console</dt><dd>${con.length} message${con.length === 1 ? '' : 's'}${warns ? ` · <span class="warn">${warns} warning/error${warns === 1 ? '' : 's'}</span>` : ''}</dd>`;
  }

  function formatSteps(steps) {
    if (!steps?.length) return '';
    // Drop noise: consecutive duplicates.
    const out = [];
    for (const st of steps) if (!out.length || out[out.length - 1] !== st.text) out.push(st.text);
    return out.map((t, i) => `${i + 1}. ${t}`).join('\n');
  }
  async function fetchSteps() {
    const r = await send({ type: 'bugmark:getSteps' });
    return r?.ok ? r.steps : [];
  }
  const fmtDur = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  function backToDraw() {
    panel.hidden = true; scrim.hidden = true;
    state.mode = 'draw'; toolbar.hidden = false; syncToolbar();
  }

  async function save(another) {
    const title = $('.f-title').value.trim();
    const comment = $('.f-comment').value.trim();
    if (!title && !comment) {
      const c = $('.f-comment'); c.focus(); c.style.borderColor = '#EF4444';
      setTimeout(() => (c.style.borderColor = ''), 1200);
      return;
    }
    panel.querySelectorAll('.p-foot button').forEach((b) => (b.disabled = true));
    const item = {
      ...state.meta, title, comment, type: state.type, priority: state.priority, status: 'open',
      image: state.shot.image, thumb: state.shot.thumb, imageW: state.shot.width, imageH: state.shot.height,
      reviewer: state.settings.reviewer || '', steps: $('.f-steps').value.trim(),
      ...(state.video ? { video: state.video } : {}),
    };
    const res = await send({ type: 'bugmark:save', item });
    panel.querySelectorAll('.p-foot button').forEach((b) => (b.disabled = false));
    if (!res?.ok) {
      toast(res?.error || 'Could not save feedback', { error: true });
      return;
    }

    const pushGithub = $('.f-gh').checked && !$('.gh-row').hidden && state.github?.repo;
    if (pushGithub) createGithubIssue(res.item, state.github.repo);
    send({ type: 'bugmark:clearSteps' }); // next report starts a fresh trail
    state.counts = res.counts;
    $('.f-title').value = ''; $('.f-comment').value = ''; $('.f-steps').value = '';
    state.shapes = []; state.redo = []; state.shot = null; state.video = null;
    if (another) {
      backToDraw(); redraw();
      toast(`Saved #${res.item.seq}`, {});
    } else {
      exitAnnotate();
      toast(`Feedback #${res.item.seq} saved`, { action: 'View report', onAction: () => send({ type: 'bugmark:openReport', host: location.host }) });
    }
  }

  async function createGithubIssue(item, repo) {
    toast(`Creating GitHub issue for #${item.seq}…`, {});
    const r = await send({ type: 'bugmark:githubIssue', id: item.id, opts: { repo } });
    if (!r?.ok) {
      toast(`GitHub: ${r?.error || 'issue not created'}`, { error: true, action: 'Open report', onAction: () => send({ type: 'bugmark:openReport', host: location.host }) });
      return;
    }
    toast(`Issue #${r.issue.number} created${r.issue.warning ? ` · ${r.issue.warning.slice(0, 60)}` : ''}`, { action: 'Open issue', onAction: () => send({ type: 'bugmark:openUrl', url: r.issue.url }) });
  }

  // ------------------------------------------------------------------
  // Keyboard
  // ------------------------------------------------------------------
  function onKey(e) {
    if (state.mode === 'idle' || !shadow || state.capturing) return;
    const ae = shadow.activeElement;
    const inField = ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName);
    const mod = e.metaKey || e.ctrlKey;

    if (state.mode === 'panel') {
      if (e.key === 'Escape') { e.preventDefault(); state.video ? null : backToDraw(); }
      else if (mod && e.key === 'Enter') { e.preventDefault(); save(e.shiftKey); }
      e.stopImmediatePropagation();
      return;
    }
    if (inField) {
      if (e.key === 'Escape') { e.preventDefault(); commitText(false); }
      else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(true); }
      e.stopImmediatePropagation();
      return;
    }
    const k = e.key.toLowerCase();
    if (mod && k === 'z') e.shiftKey ? redo() : undo();
    else if (mod && k === 'y') redo();
    else if (mod) return;
    else if (e.key === 'Escape') { if (!paletteEl.hidden || !menuEl.hidden) closePopovers(); else exitAnnotate(); }
    else if (e.key === 'Enter') capture(e.shiftKey ? 'full' : 'visible');
    else if (TOOL_KEYS[k] && !e.altKey) setTool(TOOL_KEYS[k]);
    else if (k === 'backspace' || k === 'delete') undo();
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }

  // ------------------------------------------------------------------
  // Hints & toasts
  // ------------------------------------------------------------------
  let hintTimer;
  function showHint(html, ms) {
    hintEl.innerHTML = html; hintEl.hidden = false;
    hintEl.style.animation = 'none'; void hintEl.offsetWidth; hintEl.style.animation = '';
    clearTimeout(hintTimer); hintTimer = setTimeout(() => (hintEl.hidden = true), ms);
  }

  const CHECK = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function toast(text, { action, onAction, error } = {}) {
    if (!host) build();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ok ${error ? 'err' : ''}">${error ? CROSS : CHECK}</span><span></span>`;
    el.children[1].textContent = text;
    if (action) {
      const b = document.createElement('button');
      b.textContent = action;
      b.onclick = () => { onAction?.(); el.remove(); };
      el.appendChild(b);
    }
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), action ? 6500 : 3000);
  }

  // ------------------------------------------------------------------
  // Utils & boot
  // ------------------------------------------------------------------
  const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ------------------------------------------------------------------
  // Screen recording (the recorder itself runs in the extension's offscreen document)
  // ------------------------------------------------------------------
  let recTimer = null;
  async function startRecording() {
    if (!host) build();
    if (state.recording) return;
    showRecPill({ pending: true });
    const r = await send({ type: 'bugmark:recStart' });
    if (!r?.ok) {
      hideRecPill();
      if (!/cancelled/i.test(r?.error || '')) toast(r?.error || 'Could not start recording', { error: true });
    }
  }
  function showRecPill({ pending = false, startedAt = Date.now(), mic = false, picker = false } = {}) {
    const pill = $('.rec');
    pill.hidden = false;
    pill.classList.toggle('pending', pending);
    const hint = pill.querySelector('.hint2');
    hint.hidden = !pending;
    hint.textContent = picker ? 'Choose this tab in Chrome’s share dialog' : 'Starting…';
    pill.querySelector('.stop').hidden = pending;
    pill.querySelector('.time').hidden = pending;
    const micEl = pill.querySelector('.mic');
    micEl.hidden = pending;
    micEl.innerHTML = mic ? ICONS.mic : ICONS.micOff;
    micEl.classList.toggle('on', mic);
    micEl.title = mic ? 'Recording your microphone' : 'No narration';
    clearInterval(recTimer);
    if (!pending) {
      const tick = () => { pill.querySelector('.time').textContent = fmtDur(Date.now() - startedAt); };
      tick(); recTimer = setInterval(tick, 500);
    }
    launcher && (launcher.hidden = true);
  }
  function hideRecPill() {
    clearInterval(recTimer);
    state.recording = false;
    if ($('.rec')) $('.rec').hidden = true;
    updateLauncher();
  }
  function bindRecPill() {
    $('.rec').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b?.dataset.act === 'rec-stop') { b.disabled = true; b.lastChild.textContent = 'Saving…'; send({ type: 'bugmark:recStop' }); }
    });
  }
  async function onRecorded({ video, poster }) {
    hideRecPill();
    if (!host) build();
    if (state.mode !== 'idle') exitAnnotate();
    const pill = $('.rec .stop'); pill.disabled = false; pill.lastChild.textContent = 'Stop';
    state.video = video;
    state.shot = { image: poster.image, thumb: poster.thumb, width: poster.width, height: poster.height };
    state.meta = collectMeta();
    state.meta.steps = await fetchSteps();
    launcher.hidden = true;
    openPanel();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'bugmark:ping') { sendResponse({ ok: true }); return; }
    if (msg?.type === 'bugmark:hideUi') { if (host) msg.hidden ? host.style.setProperty('visibility', 'hidden', 'important') : host.style.removeProperty('visibility'); sendResponse({ ok: true }); return; }
    if (msg?.type === 'bugmark:recPending') { if (!host) build(); showRecPill({ pending: true, picker: msg.picker }); sendResponse({ ok: true }); return; }
    if (msg?.type === 'bugmark:recState') {
      if (!host) build();
      if (msg.recording) {
        state.recording = true;
        if (state.mode !== 'idle') exitAnnotate();
        showRecPill({ startedAt: msg.startedAt, mic: msg.mic });
        if (msg.micError === 'permission') toast('Recording without narration — microphone not enabled', { action: 'Enable', onAction: () => send({ type: 'bugmark:openMicPermission' }) });
      } else hideRecPill();
      sendResponse({ ok: true }); return;
    }
    if (msg?.type === 'bugmark:recorded') { onRecorded(msg); sendResponse({ ok: true }); return; }
    if (msg?.type === 'bugmark:recError') { hideRecPill(); if (!/cancelled/i.test(msg.error)) toast(msg.error, { error: true }); sendResponse({ ok: true }); return; }
    if (msg?.type === 'bugmark:toggle') {
      const go = () => { toggle(); sendResponse({ ok: true, mode: state.mode }); };
      host || document.readyState !== 'loading' ? go() : document.addEventListener('DOMContentLoaded', go, { once: true });
      return true;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) { state.settings = { ...state.settings, ...changes.settings.newValue }; stepsOn = state.settings.recordSteps !== false; sendHookCfg(); updateLauncher(); }
  });

  async function boot() {
    if (!(document.documentElement instanceof HTMLElement)) return;
    try {
      const { settings } = await chrome.storage.local.get('settings');
      state.settings = { ...state.settings, ...(settings || {}) };
      stepsOn = state.settings.recordSteps !== false;
      sendHookCfg();
    } catch { return; }
    recordNavOpen();
    refreshCounts();
    const rs = await send({ type: 'bugmark:recStatus' }); // recording continues across page loads
    if (rs?.ok && rs.recording) { state.recording = true; if (!host) build(); showRecPill({ startedAt: rs.recording.startedAt, mic: rs.recording.mic }); }
    // Don't add anything to the page until its framework has finished hydrating. React/Vue/Svelte apps that
    // hydrate the whole document can fail if an extra element appears in <html> first. Opening Bugmark
    // (button in the popup, shortcut, recording) still builds the UI immediately.
    await pageSettled();
    if (!host) build();
    updateLauncher();
  }

  // Server-rendered framework apps (Next.js, Remix / React Router, TanStack Start, Gatsby, Nuxt, SvelteKit, Astro…)
  function looksServerRendered() {
    if (document.querySelector('script#__NEXT_DATA__, #__next, #___gatsby, #__nuxt, [data-reactroot], [data-server-rendered], astro-island, [data-sveltekit-hydrate], [data-sveltekit-preload-data]')) return true;
    for (const sc of document.scripts) {
      if (sc.src) continue;
      const t = sc.textContent.slice(0, 4000);
      if (/__next_f|__remixContext|__reactRouterContext|\$_TSR|__NUXT__|__sveltekit_|__staticRouterHydrationData|hydrateRoot|__INITIAL_STATE__|__APOLLO_STATE__/.test(t)) return true;
    }
    const it = document.createNodeIterator(document.body || document.documentElement, NodeFilter.SHOW_COMMENT);
    for (let n, i = 0; (n = it.nextNode()) && i < 400; i++) if (/^\$[!?]?$|^\/\$$|^\[$|^\]$/.test(n.data)) return true; // React Suspense / Vue fragment markers
    return false;
  }
  let frameworkReady = false;
  const frameworkWaiters = [];
  document.addEventListener('__bugmark_ready', (ev) => {
    let d = {}; try { d = JSON.parse(ev.detail); } catch {}
    frameworkReady = d.framework ? 'yes' : 'no';
    frameworkWaiters.splice(0).forEach((fn) => fn());
  });
  const whenFrameworkReported = () => new Promise((r) => (frameworkReady ? r() : frameworkWaiters.push(r)));

  // Resolves once the page has loaded and hydrated: for server-rendered apps, after the framework has attached
  // (reported by page-hook.js); otherwise once the DOM has been quiet for a moment. 16s at most.
  function pageSettled() {
    return new Promise((resolve) => {
      const hardStop = setTimeout(resolve, 16000);
      const afterLoad = async () => {
        if (looksServerRendered()) {
          await whenFrameworkReported();
          await sleep(frameworkReady === 'yes' ? 800 : 0); // let the hydration render commit
        }
        let quiet;
        const done = () => { mo.disconnect(); clearTimeout(quiet); clearTimeout(cap); clearTimeout(hardStop); idle(resolve); };
        const mo = new MutationObserver((list) => {
          if (list.every((m) => m.target === host || (host && host.contains?.(m.target)))) return;
          clearTimeout(quiet); quiet = setTimeout(done, 700);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
        quiet = setTimeout(done, 700);
        const cap = setTimeout(done, 5000);
      };
      document.readyState === 'complete' ? afterLoad() : window.addEventListener('load', afterLoad, { once: true });
    });
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(() => fn(), { timeout: 1500 }) : setTimeout(fn, 200));

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, { once: true }) : boot();
})();
