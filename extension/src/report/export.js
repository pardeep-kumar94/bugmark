// Builds a single, self-contained HTML feedback report.
import { CONFIG } from '../shared/config.js';
export const TYPE_META = {
  bug: { label: 'Bug', color: '#E5484D' },
  design: { label: 'Design', color: '#0EA5E9' },
  content: { label: 'Content', color: '#E27D12' },
  idea: { label: 'Idea', color: '#16A34A' },
};
export const PRIO_META = {
  critical: { label: 'Critical', color: '#EF4444', rank: 0 },
  high: { label: 'High', color: '#F97316', rank: 1 },
  medium: { label: 'Medium', color: '#3B82F6', rank: 2 },
  low: { label: 'Low', color: '#A1A1AA', rank: 3 },
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (t) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const fmtDay = (t) => new Date(t).toLocaleDateString(undefined, { dateStyle: 'medium' });
const pathOf = (url) => { try { const u = new URL(url); return (u.pathname + u.search) || '/'; } catch { return url; } };
const safeHref = (url) => (/^(https?|file):/i.test(url || '') ? esc(url) : '#');

const dur = (ms) => { const x = Math.round((ms || 0) / 1000); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };
const stepLines = (steps) => String(steps || '').split('\n').map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);

export function buildReportHtml({ title, preparedBy, preparedFor, note, items, brand = null, poweredBy = true, media = {}, print = false }) {
  const accent = brand?.accent && /^#[0-9a-f]{6}$/i.test(brand.accent) ? brand.accent : '#16A34A';
  const accentBar = brand ? accent : 'linear-gradient(90deg,#4ADE80 0%,#2DD4BF 55%,#22D3EE 100%)';
  const brandName = brand?.company || '';
  const now = Date.now();
  const hosts = [...new Set(items.map((i) => i.host))];
  const open = items.filter((i) => i.status !== 'resolved').length;
  const urgent = items.filter((i) => ['critical', 'high'].includes(i.priority) && i.status !== 'resolved').length;
  const pages = new Set(items.map((i) => i.url)).size;
  const range = items.length
    ? [Math.min(...items.map((i) => i.createdAt)), Math.max(...items.map((i) => i.createdAt))]
    : [now, now];
  const byType = Object.keys(TYPE_META).map((k) => [k, items.filter((i) => i.type === k).length]).filter(([, n]) => n);

  const fact = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : '');
  const badge = (meta) => `<span class="badge"><i style="background:${meta.color}"></i>${meta.label}</span>`;

  const rows = items.map((it) => `
      <tr>
        <td class="mono"><a href="#item-${it.seq}">#${it.seq}</a></td>
        <td class="t"><a href="#item-${it.seq}">${esc(it.title || firstLine(it.comment) || 'Untitled')}</a></td>
        <td>${badge(TYPE_META[it.type] || TYPE_META.bug)}</td>
        <td>${badge(PRIO_META[it.priority] || PRIO_META.medium)}</td>
        <td class="path" title="${esc(it.url)}">${esc(hosts.length > 1 ? it.host + pathOf(it.url) : pathOf(it.url))}</td>
        <td><span class="status ${it.status}">${it.status === 'resolved' ? 'Resolved' : 'Open'}</span></td>
      </tr>`).join('');

  const cards = items.map((it) => {
    const errs = it.errors || [];
    return `
    <article class="item ${it.status}" id="item-${it.seq}">
      <header class="item-head">
        <span class="seq">#${it.seq}</span>
        <h3>${esc(it.title || firstLine(it.comment) || 'Untitled')}</h3>
        <div class="badges">${badge(TYPE_META[it.type] || TYPE_META.bug)}${badge(PRIO_META[it.priority] || PRIO_META.medium)}<span class="status ${it.status}">${it.status === 'resolved' ? 'Resolved' : 'Open'}</span></div>
      </header>
      ${it.video && media[it.video.mediaId] && !print
        ? `<figure class="shot video"><video controls preload="metadata" poster="${it.image}" src="${media[it.video.mediaId]}"></video><figcaption>Screen recording · ${dur(it.video.duration)}${it.video.mic ? ' · with narration' : ''}</figcaption></figure>`
        : it.after
          ? `<div class="ba-grid"><figure class="shot"><figcaption>Before</figcaption><button type="button" class="zoom" aria-label="Enlarge"><img src="${it.image}" alt="Before — feedback #${it.seq}" loading="lazy"></button></figure><figure class="shot after"><figcaption>After</figcaption><button type="button" class="zoom" aria-label="Enlarge"><img src="${it.after.image}" alt="After — feedback #${it.seq}" loading="lazy"></button></figure></div>`
          : `<figure class="shot"><button type="button" class="zoom" aria-label="Enlarge screenshot"><img src="${it.image}" alt="Screenshot for feedback #${it.seq}" loading="lazy"></button>${it.video ? `<figcaption>Screen recording · ${dur(it.video.duration)} — video available in Bugmark</figcaption>` : ''}</figure>`}
      <div class="item-grid">
        <div class="comment">${it.comment ? esc(it.comment).replace(/\n/g, '<br>') : '<span class="muted">No comment provided.</span>'}</div>
        <dl class="ctx">
          <div><dt>Page</dt><dd><a href="${safeHref(it.url)}" target="_blank" rel="noopener">${esc(it.pageTitle || it.url)}</a><small>${esc(it.url)}</small></dd></div>
          <div><dt>Viewport</dt><dd>${it.viewport ? `${it.viewport.w} × ${it.viewport.h}` : '—'}${it.dpr ? ` <span class="muted">@${it.dpr}x</span>` : ''}</dd></div>
          <div><dt>Environment</dt><dd>${esc(it.browser || '—')} · ${esc(it.os || '—')}</dd></div>
          <div><dt>Captured</dt><dd>${fmtDate(it.createdAt)}${it.reviewer ? ` · ${esc(it.reviewer)}` : ''}</dd></div>
          ${it.github?.url ? `<div><dt>GitHub issue</dt><dd><a href="${safeHref(it.github.url)}" target="_blank" rel="noopener">${esc(it.github.repo)}#${it.github.number}</a></dd></div>` : ''}
          ${it.fullPage ? `<div><dt>Capture</dt><dd>Full page · ${it.imageW}×${it.imageH}px</dd></div>` : it.scroll ? `<div><dt>Scroll position</dt><dd>${it.scroll.y}px from top</dd></div>` : ''}
        </dl>
      </div>
      ${it.elements?.length ? `<div class="els"><div class="els-h">Inspected elements</div>${it.elements.map((el) => `
        <div class="el"><span class="el-n">E${el.n}</span><div class="el-b"><code>${esc(el.selector)}</code>
          <div class="el-meta">&lt;${esc(el.tag)}&gt; · ${esc(el.size)}${el.text ? ` · “${esc(el.text)}”` : ''}</div>
          <div class="el-styles">${Object.entries(el.styles || {}).map(([k, v]) => `<span><em>${esc(k)}</em> ${esc(v)}</span>`).join('')}</div></div></div>`).join('')}</div>` : ''}
      ${stepLines(it.steps).length ? `<div class="steps"><div class="els-h">Steps to reproduce</div><ol>${stepLines(it.steps).map((l) => `<li>${esc(l)}</li>`).join('')}</ol></div>` : ''}
      ${netSummary(it)}
      ${errs.length && !it.logs ? `<details class="errs"><summary>${errs.length} page error${errs.length > 1 ? 's' : ''} recorded at capture time</summary><pre>${errs.map((e) => esc(e.message + (e.source ? `\n    at ${e.source}` : ''))).join('\n')}</pre></details>` : ''}
    </article>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Bugmark">
<title>${esc(title)}</title>
<style>
  :root { --accent:${accent}; --bg:#FFFFFF; --soft:#F6F8FA; --text:#1F2328; --text-2:#59636E; --text-3:#818B98; --border:#D8DEE4; --font:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif; --mono:ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.55 var(--font); -webkit-font-smoothing: antialiased; letter-spacing: -.005em; }
  a { color: inherit; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 0 32px; }
  .muted { color: var(--text-3); }
  .mono { font-family: var(--mono); font-size: 12px; }

  .cover { padding: 56px 0 36px; border-bottom: 1px solid var(--border); }
  .brandline { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; color: var(--text-3); font-size: 12px; }
  .brandline b { color: var(--text); font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
  .brandline b i { width: 18px; height: 18px; border-radius: 5px; background: ${brand ? 'var(--accent)' : 'linear-gradient(135deg,#4ADE80,#22D3EE)'}; display: inline-block; }
  body::before { content: ''; display: block; height: 4px; background: ${accentBar}; }
  .stat:first-child b { color: var(--accent); }
  .eyebrow { font: 500 12px/1.4 var(--mono); color: var(--text-3); }
  h1 { font-family: var(--mono); font-size: 36px; line-height: 1.12; letter-spacing: -.05em; margin: 10px 0 0; font-weight: 650; max-width: 780px; }
  .note { margin: 16px 0 0; font-size: 16px; color: var(--text-2); max-width: 680px; white-space: pre-wrap; }
  .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin: 36px 0 0; }
  .facts dt { font-size: 12px; color: var(--text-3); }
  .facts dd { margin: 2px 0 0; font-weight: 500; overflow-wrap: anywhere; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--border); border-radius: 14px; margin: 36px 0 0; overflow: hidden; }
  .stat { padding: 18px 20px; border-right: 1px solid var(--border); }
  .stat:last-child { border-right: 0; }
  .stat b { display: block; font-family: var(--mono); font-size: 28px; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .stat span { color: var(--text-3); font-size: 12px; }
  .mix { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin: 18px 0 8px; background: var(--soft); }
  .legend { display: flex; flex-wrap: wrap; gap: 16px; color: var(--text-2); font-size: 12px; }

  section { padding: 40px 0 0; }
  h2 { font: 600 12.5px/1.4 var(--mono); color: var(--text-3); margin: 0 0 14px; }
  h2::before { content: '// '; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-weight: 500; color: var(--text-3); font-size: 12px; padding: 0 12px 10px 0; border-bottom: 1px solid var(--border); }
  td { padding: 11px 12px 11px 0; border-bottom: 1px solid var(--border); vertical-align: middle; }
  td a { text-decoration: none; }
  td.t { font-weight: 500; max-width: 340px; }
  td.t a:hover { text-decoration: underline; }
  td.path { color: var(--text-3); font-family: var(--mono); font-size: 12px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px; font-weight: 500; white-space: nowrap; margin-right: 4px; }
  .badge i, .legend i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .legend i { margin-right: 6px; }
  .status { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 12px; font-weight: 500; background: var(--soft); color: var(--text-2); white-space: nowrap; }
  .status.resolved { background: #DAFBE1; color: #116329; }
  td a:hover, .ctx dd a:hover { color: var(--accent); }
  ::selection { background: rgba(74,222,128,.28); }

  .item { padding: 36px 0; border-top: 1px solid var(--border); break-inside: avoid; page-break-inside: avoid; }
  .item:first-of-type { border-top: 0; padding-top: 8px; }
  .item-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .item-head .seq { font: 600 13px var(--mono); color: var(--text-3); }
  .item-head h3 { flex: 1; min-width: 240px; margin: 0; font-size: 20px; line-height: 1.3; font-weight: 600; letter-spacing: -.02em; }
  .item-head .badges { display: flex; gap: 0; }
  .item.resolved h3 { color: var(--text-3); }
  .shot { margin: 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); background: var(--soft); }
  .zoom { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: zoom-in; }
  .shot img { display: block; width: 100%; height: auto; }
  .item-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 32px; margin-top: 20px; }
  .comment { font-size: 15px; line-height: 1.65; white-space: normal; overflow-wrap: anywhere; }
  .ctx { margin: 0; display: grid; gap: 10px; font-size: 13px; padding-left: 24px; border-left: 1px solid var(--border); }
  .ctx dt { font-size: 12px; color: var(--text-3); }
  .ctx dd { margin: 1px 0 0; overflow-wrap: anywhere; }
  .ctx dd a { font-weight: 500; text-decoration: none; }
  .ctx dd a:hover { text-decoration: underline; }
  .ctx small { display: block; color: var(--text-3); font-family: var(--mono); font-size: 11px; }
  .errs { margin-top: 18px; border: 1px solid #FFCECB; background: #FFEBE9; border-radius: 10px; color: #A40E26; }
  .errs summary { cursor: pointer; padding: 10px 14px; font-size: 13px; font-weight: 500; }
  .shot figcaption { padding: 8px 12px; font: 500 12px/1.4 var(--mono); color: var(--text-2); border-top: 1px solid var(--border); background: #fff; }
  .shot video { display: block; width: 100%; background: #000; max-height: 640px; }
  .ba-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
  .ba-grid figcaption { border-top: 0; border-bottom: 1px solid var(--border); font-weight: 600; }
  .ba-grid .after figcaption { color: #116329; background: #DAFBE1; }
  .steps { margin-top: 18px; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .steps ol { margin: 0; padding: 12px 16px 12px 36px; display: grid; gap: 4px; font: 13px/1.55 var(--mono); }
  .net { margin-top: 18px; border: 1px solid var(--border); border-radius: 10px; }
  .net summary { cursor: pointer; padding: 10px 14px; font-size: 13px; font-weight: 500; }
  .net table { font: 12px/1.45 var(--mono); }
  .net th, .net td { padding: 6px 10px; } .net td.u { word-break: break-all; }
  .net .bad { color: #CF222E; font-weight: 600; }
  .rq { margin-top: 4px; } .rq summary { cursor: pointer; color: #0969DA; font-size: 11.5px; }
  .rq-h { margin: 8px 0 4px; font-weight: 600; color: var(--text-2); }
  .rq pre { margin: 0; padding: 8px 10px; background: var(--soft); border: 1px solid var(--border); border-radius: 8px; white-space: pre-wrap; word-break: break-word; max-height: 360px; overflow: auto; font: 11.5px/1.5 var(--mono); }
  .errs pre { margin: 0; padding: 0 14px 12px; font: 12px/1.6 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }

  .els { margin-top: 18px; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .els-h { padding: 9px 14px; font-size: 12px; font-weight: 600; color: var(--text-2); background: var(--soft); border-bottom: 1px solid var(--border); }
  .el { display: grid; grid-template-columns: 34px 1fr; gap: 10px; padding: 12px 14px; border-top: 1px solid var(--border); }
  .el:nth-child(2) { border-top: 0; }
  .el-n { width: 28px; height: 22px; border-radius: 6px; background: #0891B2; color: #fff; font: 600 11px/22px var(--mono); text-align: center; }
  .el code { font: 12px/1.5 var(--mono); overflow-wrap: anywhere; }
  .el-meta { color: var(--text-3); font-size: 12px; margin-top: 2px; }
  .el-styles { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 6px; font: 11.5px/1.5 var(--mono); color: var(--text-2); }
  .el-styles em { font-style: normal; color: var(--text-3); }
  .brand-logo { height: 26px; width: auto; max-width: 160px; object-fit: contain; }
  footer { margin: 24px 0 0; padding: 24px 0 48px; border-top: 1px solid var(--border); color: var(--text-3); font-size: 12px; display: flex; justify-content: space-between; }

  .lb { position: fixed; inset: 0; background: rgba(9,9,11,.9); display: none; place-items: center; padding: 32px; cursor: zoom-out; z-index: 10; }
  .lb.on { display: grid; }
  .lb img { max-width: 100%; max-height: 100%; border-radius: 8px; }

  @media (max-width: 760px) {
    .wrap { padding: 0 18px; } h1 { font-size: 30px; }
    .facts, .stats { grid-template-columns: repeat(2, 1fr); }
    .stat:nth-child(2) { border-right: 0; } .stat:nth-child(-n+2) { border-bottom: 1px solid var(--border); }
    .item-grid { grid-template-columns: 1fr; gap: 18px; } .ctx { padding-left: 0; border-left: 0; }
    table .path, table th:nth-child(5) { display: none; }
  }
  @media print {
    @page { margin: 12mm 12mm 14mm; }
    html, body { width: auto !important; min-width: 0 !important; overflow: visible !important; }
    body { font-size: 11.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body::before { display: none; }
    *, *::before, *::after { max-width: 100%; }
    .wrap { max-width: none; width: auto; margin: 0; padding: 0; }
    .cover { padding: 0 0 24px; } .brandline { margin-bottom: 28px; }
    h1 { font-size: 24px; overflow-wrap: anywhere; }
    .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin-top: 22px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
    .stat { padding: 12px 14px; } .stat b { font-size: 22px; }
    section { padding-top: 24px; }
    .index { break-after: page; }
    h2 { break-after: avoid; }
    table { table-layout: fixed; }
    th:nth-child(1) { width: 40px; } th:nth-child(3), th:nth-child(4) { width: 84px; } th:nth-child(6) { width: 70px; }
    td.t { max-width: none; overflow-wrap: anywhere; } td.path { max-width: none; }
    .badge { margin-right: 0; }
    .item { padding: 22px 0; border-top: 1px solid var(--border); break-inside: auto; page-break-inside: auto; }
    .items h2 + .item { border-top: 0; padding-top: 4px; }
    .item-head { break-after: avoid; } .item-head h3 { min-width: 0; font-size: 16px; overflow-wrap: anywhere; }
    .shot { break-inside: avoid; }
    .shot img { max-height: 235mm; width: auto; max-width: 100%; margin: 0 auto; object-fit: contain; }
    .item-grid { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 20px; break-inside: avoid; }
    .ctx { padding-left: 16px; }
    .comment, .ctx dd, .el code, pre { overflow-wrap: anywhere; word-break: break-word; }
    .els, .errs, .steps { break-inside: avoid; }
    .net[open] summary ~ *, .net table { display: table; }
    .errs[open] summary ~ *, .errs pre { display: block; }
    .lb, .zoom::after { display: none !important; } .zoom { cursor: default; } a { text-decoration: none; }
    footer { padding-bottom: 0; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header class="cover">
    <div class="brandline"><b>${brand?.logo ? `<img class="brand-logo" src="${esc(brand.logo)}" alt="${esc(brandName)}">` : '<i></i>'}${esc(brandName || 'Website feedback report')}</b><span>${brand?.website ? `${esc(brand.website)} · ` : ''}${fmtDay(now)}</span></div>
    <div class="eyebrow">${esc(hosts.join(' · ') || 'Feedback')}</div>
    <h1>${esc(title)}</h1>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    <dl class="facts">
      ${fact('Prepared by', esc(preparedBy))}
      ${fact('Prepared for', esc(preparedFor))}
      ${fact('Review period', range[0] && fmtDay(range[0]) === fmtDay(range[1]) ? fmtDay(range[0]) : `${fmtDay(range[0])} – ${fmtDay(range[1])}`)}
      ${fact('Pages reviewed', String(pages))}
    </dl>
    <div class="stats">
      <div class="stat"><b>${items.length}</b><span>Total items</span></div>
      <div class="stat"><b>${open}</b><span>Open</span></div>
      <div class="stat"><b>${urgent}</b><span>High &amp; critical open</span></div>
      <div class="stat"><b>${items.length - open}</b><span>Resolved</span></div>
    </div>
    ${byType.length ? `<div class="mix">${byType.map(([k, n]) => `<span style="flex:${n};background:${TYPE_META[k].color}"></span>`).join('')}</div>
    <div class="legend">${byType.map(([k, n]) => `<span><i style="background:${TYPE_META[k].color}"></i>${TYPE_META[k].label} · ${n}</span>`).join('')}</div>` : ''}
  </header>

  <section class="index">
    <h2>Summary</h2>
    <table>
      <thead><tr><th style="width:56px">ID</th><th>Issue</th><th>Type</th><th>Priority</th><th>Page</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>

  <section class="items">
    <h2>Details</h2>
    ${cards}
  </section>

  <footer><span>Generated ${fmtDate(now)}${brandName ? ` by ${esc(brandName)}` : ''}${poweredBy ? ` · Made with <a href="${esc(CONFIG.websiteUrl)}" target="_blank" rel="noopener">Bugmark</a>` : ''}</span><span>${items.length} item${items.length === 1 ? '' : 's'}</span></footer>
</div>
<div class="lb" id="lb"><img alt=""></div>
<script>
  (function () {
    var lb = document.getElementById('lb'), img = lb.querySelector('img');
    document.addEventListener('click', function (e) {
      var z = e.target.closest && e.target.closest('.zoom');
      if (z) { img.src = z.querySelector('img').src; lb.classList.add('on'); }
      else if (e.target.closest && e.target.closest('#lb')) lb.classList.remove('on');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('on'); });
  })();
</script>
</body>
</html>`;
}

function prettyText(b) {
  if (!b) return '';
  if (b.fields) return b.fields.map((f) => `${f.name}: ${f.value}`).join('\n');
  const t = b.text || '';
  if (/json/i.test(b.mime || '') || /^\s*[[{]/.test(t)) { try { return JSON.stringify(JSON.parse(t), null, 2); } catch {} }
  return t;
}
function reqDetail(n) {
  if (!(n.requestBody || n.responseBody)) return '';
  const cut = (t) => (t.length > 4000 ? t.slice(0, 4000) + '\n… (truncated)' : t);
  return `<details class="rq"><summary>Payload &amp; response</summary>
    ${n.requestBody ? `<div class="rq-h">Request payload</div><pre>${esc(cut(prettyText(n.requestBody)))}</pre>` : ''}
    ${n.responseBody ? `<div class="rq-h">Response${n.responseBody.truncated ? ' (truncated)' : ''}</div><pre>${esc(cut(prettyText(n.responseBody)))}</pre>` : ''}
  </details>`;
}
function netSummary(it) {
  const net = it.logs?.network || [], con = it.logs?.console || [];
  if (!net.length && !con.length) return '';
  const failed = net.filter((n) => n.status >= 400 || n.status === 0);
  const probs = con.filter((c) => c.level === 'error' || c.level === 'warn');
  const rows = (failed.length ? failed : net.slice(-12)).slice(0, 25);
  return `<details class="net"${failed.length ? ' open' : ''}><summary>Network: ${net.length} request${net.length === 1 ? '' : 's'}${failed.length ? ` · <span class="bad">${failed.length} failed</span>` : ''} · Console: ${con.length} message${con.length === 1 ? '' : 's'}${probs.length ? ` · ${probs.length} warning/error` : ''}</summary>
    <table><thead><tr><th>Status</th><th>Method</th><th>URL</th><th>Time</th></tr></thead><tbody>${rows.map((n) => `<tr><td class="${n.status >= 400 || n.status === 0 ? 'bad' : ''}">${n.status || 'failed'}</td><td>${esc(n.method)}</td><td class="u">${esc(n.url)}${reqDetail(n)}</td><td>${n.duration} ms</td></tr>`).join('')}</tbody></table>
    ${probs.length ? `<table><thead><tr><th>Level</th><th>Console message</th></tr></thead><tbody>${probs.slice(-15).map((c) => `<tr><td class="${c.level === 'error' ? 'bad' : ''}">${esc(c.level)}</td><td class="u">${esc(c.text)}</td></tr>`).join('')}</tbody></table>` : ''}
  </details>`;
}

export function firstLine(s) {
  const l = String(s || '').split('\n')[0].trim();
  return l.length > 90 ? l.slice(0, 88) + '…' : l;
}

export function buildMarkdown(items, heading) {
  const out = [`# ${heading}`, '', `${items.length} item${items.length === 1 ? '' : 's'} · exported ${fmtDate(Date.now())}`, ''];
  for (const it of items) {
    out.push(`## #${it.seq} ${it.title || firstLine(it.comment) || 'Untitled'}`);
    out.push(`**Type:** ${(TYPE_META[it.type] || {}).label} · **Priority:** ${(PRIO_META[it.priority] || {}).label} · **Status:** ${it.status === 'resolved' ? 'Resolved' : 'Open'}`);
    out.push(`**Page:** ${it.url}`);
    if (it.github?.url) out.push(`**GitHub:** ${it.github.url}`);
    out.push(`**Environment:** ${it.browser} · ${it.os} · ${it.viewport?.w}×${it.viewport?.h}`);
    if (it.comment) out.push('', it.comment);
    const st = stepLines(it.steps);
    if (st.length) out.push('', '**Steps to reproduce**', ...st.map((l, i) => `${i + 1}. ${l}`));
    if (it.video) out.push('', `_Screen recording (${dur(it.video.duration)}) attached in Bugmark_`);
    const failed = (it.logs?.network || []).filter((n) => n.status >= 400 || n.status === 0);
    if (failed.length) out.push('', '**Failed requests**', ...failed.slice(0, 10).map((n) => `- \`${n.status || 'failed'} ${n.method} ${n.url}\``));
    if (it.errors?.length) out.push('', '```', ...it.errors.map((e) => e.message), '```');
    out.push('');
  }
  return out.join('\n');
}

export function buildCsv(items) {
  const cols = ['ID', 'Title', 'Comment', 'Type', 'Priority', 'Status', 'Page URL', 'Page title', 'Viewport', 'Browser', 'OS', 'Reporter', 'Created', 'Full page', 'Elements', 'Page issues', 'GitHub issue', 'Steps to reproduce', 'Failed requests', 'Video', 'After shot'];
  const cell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((it) => [
    it.seq, it.title || firstLine(it.comment), it.comment, (TYPE_META[it.type] || {}).label, (PRIO_META[it.priority] || {}).label,
    it.status === 'resolved' ? 'Resolved' : 'Open', it.url, it.pageTitle, it.viewport ? `${it.viewport.w}x${it.viewport.h}` : '',
    it.browser, it.os, it.reviewer, new Date(it.createdAt).toISOString(), it.fullPage ? 'Yes' : 'No',
    (it.elements || []).map((e) => e.selector).join(' | '), (it.errors || []).length, it.github?.url || '',
    stepLines(it.steps).map((l, i) => `${i + 1}. ${l}`).join('\n'), (it.logs?.network || []).filter((n) => n.status >= 400 || n.status === 0).length,
    it.video ? dur(it.video.duration) : '', it.after ? 'Yes' : '',
  ].map(cell).join(','));
  return '\ufeff' + [cols.join(','), ...rows].join('\r\n');
}
