// ─────────────────────────────────────────────────────────────
// Searchable repo dropdown — wraps a text <input> with a filterable,
// always-available results list. Fixes the old <datalist>, which only
// surfaced suggestions when the field was empty and wouldn't reliably let
// you pick. Used by the Settings default-repo field and the per-issue
// "Create GitHub issue" dialog, so both can pick/route to any repo.
//
// Usage:
//   const combo = attachRepoCombo(inputEl);
//   combo.setRepos([{ full: 'owner/name', private: true }, ...]);
// Selecting an item sets input.value and fires an 'input' event, so the
// input's existing save/validation listeners keep working unchanged.
// ─────────────────────────────────────────────────────────────

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const css = `
    .repo-combo { position: relative; flex: 1 1 auto; min-width: 0; }
    .repo-combo > input { width: 100%; }
    .repo-combo-list {
      position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 50;
      margin: 0; padding: 4px; list-style: none; max-height: 240px; overflow-y: auto;
      background: var(--surface, #fff); color: var(--ink, #111);
      border: 1px solid var(--border, #d0d0d0); border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,.16);
    }
    .repo-combo-list[hidden] { display: none; }
    .repo-combo-item {
      padding: 7px 9px; border-radius: 6px; cursor: pointer;
      font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .repo-combo-item:hover, .repo-combo-item.active { background: var(--surface-2, #eef); }
    .repo-combo-item .rc-tag { font-size: 11px; opacity: .6; flex: none; }
    .repo-combo-empty { padding: 8px 9px; font-size: 12.5px; opacity: .6; }
  `;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}

export function attachRepoCombo(input) {
  injectStyles();

  // Wrap the input in a positioned container and add the results list.
  const wrap = document.createElement('div');
  wrap.className = 'repo-combo';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  input.setAttribute('autocomplete', 'off');
  input.removeAttribute('list'); // stop the native datalist from interfering

  const list = document.createElement('ul');
  list.className = 'repo-combo-list';
  list.hidden = true;
  wrap.appendChild(list);

  let repos = [];
  let active = -1; // index into the currently rendered items

  const items = () => Array.from(list.querySelectorAll('.repo-combo-item'));

  function filtered() {
    const q = input.value.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) => r.full.toLowerCase().includes(q));
  }

  function render() {
    const rows = filtered();
    active = -1;
    if (!repos.length) {
      list.innerHTML = '<li class="repo-combo-empty">No repositories loaded yet.</li>';
      return;
    }
    if (!rows.length) {
      list.innerHTML = '<li class="repo-combo-empty">No matches — type an owner/repo manually.</li>';
      return;
    }
    list.innerHTML = '';
    for (const r of rows) {
      const li = document.createElement('li');
      li.className = 'repo-combo-item';
      li.dataset.full = r.full;
      const name = document.createElement('span');
      name.textContent = r.full;
      li.appendChild(name);
      if (r.private) {
        const tag = document.createElement('span');
        tag.className = 'rc-tag';
        tag.textContent = 'private';
        li.appendChild(tag);
      }
      // mousedown (not click) so it fires before the input's blur closes the list.
      li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(r.full); });
      list.appendChild(li);
    }
  }

  function open() { render(); list.hidden = false; }
  function close() { list.hidden = true; active = -1; }

  function pick(full) {
    input.value = full;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close();
    input.focus();
  }

  function setActive(next) {
    const els = items();
    if (!els.length) return;
    active = (next + els.length) % els.length;
    els.forEach((el, i) => el.classList.toggle('active', i === active));
    els[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', open);
  input.addEventListener('input', () => { if (list.hidden) open(); else render(); });
  input.addEventListener('keydown', (e) => {
    if (list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { open(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      const els = items();
      if (active >= 0 && els[active]) { e.preventDefault(); pick(els[active].dataset.full); }
    } else if (e.key === 'Escape') { if (!list.hidden) { e.stopPropagation(); close(); } }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));

  return {
    setRepos(next) {
      repos = Array.isArray(next) ? next : [];
      if (!list.hidden) render();
    },
  };
}
