'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { release, site } from '@/lib/site';
import { screens } from '@/lib/screens';
import { detectExtension } from '@/lib/extension';
import { track } from '@/lib/analytics';
import { IconCheck, IconDownload, IconKeyboard, IconPuzzle } from './icons';

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;
const TRIGGERED = 'bugmark:download-started';

export function InstallGuide() {
  const [started, setStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState<{ version?: string } | null>(null);
  const [browser, setBrowser] = useState<'chrome' | 'edge' | 'brave' | 'other'>('chrome');
  const auto = useRef(false);

  function download(trigger: 'auto' | 'button' = 'button') {
    track('extension_download', { trigger, version: release.version, file_size_kb: Math.round(release.bytes / 1024) });
    const a = document.createElement('a');
    a.href = release.file;
    a.download = release.file.split('/').pop() || 'bugmark.zip';
    document.body.appendChild(a); a.click(); a.remove();
    setStarted(true);
    try { sessionStorage.setItem(TRIGGERED, '1'); } catch {}
  }

  useEffect(() => {
    const ua = navigator.userAgent;
    const brave = (navigator as unknown as { brave?: unknown }).brave;
    setBrowser(/Edg\//.test(ua) ? 'edge' : brave ? 'brave' : /Chrome\//.test(ua) ? 'chrome' : 'other');

    // Start the download automatically once per visit (not on reloads).
    const params = new URLSearchParams(location.search);
    let already = false;
    try { already = sessionStorage.getItem(TRIGGERED) === '1'; } catch {}
    if (!auto.current && !already && !params.has('nodownload') && release.bytes > 0) {
      auto.current = true;
      const t = setTimeout(() => download('auto'), 500);
      return () => clearTimeout(t);
    }
    if (already) setStarted(true);
  }, []);

  // Detect the extension once it's loaded (needs the pinned extension ID).
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const s = await detectExtension();
      if (stop) return;
      if (s.installed) { setInstalled({ version: s.version }); track('extension_detected', { version: s.version || '' }); }
      else setTimeout(tick, 2500);
    };
    tick();
    return () => { stop = true; };
  }, []);

  const extUrl = browser === 'edge' ? 'edge://extensions' : browser === 'brave' ? 'brave://extensions' : 'chrome://extensions';

  async function copyUrl() {
    track('install_step', { step: 'copy_extensions_url', browser });
    try { await navigator.clipboard.writeText(extUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <section className="relative isolate overflow-hidden pb-24 pt-28 sm:pt-36">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_30%,transparent_100%)]" />
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center">
          {installed ? (
            <span className="eyebrow !border-accent/40 !text-accent"><IconCheck size={14} />Bugmark {installed.version} is installed</span>
          ) : (
            <span className="eyebrow"><IconDownload size={14} className="text-accent" />{started ? 'Your download has started' : 'Preparing your download…'}</span>
          )}
          <h1 className="mx-auto mt-6 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-0.05em] text-balance sm:text-[50px]">
            {installed ? <>You’re all set. <span className="text-brand">Go find some bugs.</span></> : <>Add Bugmark to Chrome <span className="text-brand">in under a minute.</span></>}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-dim">
            {installed
              ? <>Open any website and press <span className="kbd">⌥⇧S</span> (<span className="kbd">Alt+Shift+S</span> on Windows) to capture your first bug, or <span className="kbd">⌥⇧R</span> to record.</>
              : 'Bugmark isn’t on the Chrome Web Store yet, so you install it from the download. It’s the same extension, and it updates the same way: download, replace the folder, reload.'}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => download('button')} className="btn-primary w-full sm:w-auto">
              <IconDownload size={18} />{started ? 'Download again' : 'Download Bugmark'}
            </button>
            <span className="text-[12.5px] text-mute">v{release.version} · {kb(release.bytes)} · .zip</span>
          </div>
        </div>

        <ol className="mt-16 space-y-4">
          <Step n={1} title="Unzip the download">
            Open <code className="code">{release.file.split('/').pop()}</code> from your Downloads. On a Mac, double-click it; on Windows, right-click → <b>Extract All</b>.
            You’ll get a folder called <code className="code">bugmark</code>. <b>Move it somewhere permanent</b>, like Documents. Chrome runs the extension from this folder, so don’t delete it.
          </Step>
          <Step n={2} title="Open the extensions page">
            Type <code className="code">{extUrl}</code> in the address bar and press Enter.
            <button onClick={copyUrl} className="ml-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-line-2 bg-surface-2 px-2.5 text-[12px] text-ink-2 hover:border-accent/40">
              {copied ? <><IconCheck size={12} className="text-accent" />Copied</> : 'Copy'}
            </button>
            <span className="mt-1 block text-[13.5px] text-mute">Browsers don’t allow websites to link to this page directly.</span>
          </Step>
          <Step n={3} title="Turn on Developer mode, then click “Load unpacked”">
            The switch is in the top-right corner{browser === 'edge' ? ' (in Edge, it’s in the left sidebar)' : ''}. Click <b>Load unpacked</b> and choose the <code className="code">bugmark</code> folder — the one that contains <code className="code">manifest.json</code>.
            <div className="mt-5 overflow-hidden rounded-xl border border-line-2 bg-surface shadow-[var(--sh-lg)]">
              <Image src={screens.installPage.src} width={screens.installPage.w} height={screens.installPage.h} alt={screens.installPage.alt} sizes="(min-width: 768px) 760px, 100vw" className="block h-auto w-full" />
            </div>
          </Step>
          <Step n={4} title="Pin it and start capturing">
            Click the puzzle-piece icon <IconPuzzle size={15} className="inline -translate-y-px text-accent" /> in the toolbar and pin Bugmark. Then open any site and press
            {' '}<span className="kbd">⌥⇧S</span> to mark up a screenshot or <span className="kbd">⌥⇧R</span> to record.
            {installed && <span className="mt-2 flex items-center gap-2 font-medium text-accent"><IconCheck size={15} />Detected Bugmark {installed.version} in this browser.</span>}
          </Step>
        </ol>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Note title="Updating">
            Download the new version, replace the contents of your <code className="code">bugmark</code> folder, then click the reload ↻ icon on the Bugmark card. Your captures and settings stay.
          </Note>
          <Note title="Other browsers">
            Works in Edge (<code className="code">edge://extensions</code>), Brave, Arc, Opera and other Chromium browsers{release.minimumChromeVersion ? ` based on Chrome ${release.minimumChromeVersion} or newer` : ''}.
          </Note>
          <Note title="“Disable developer mode extensions?”">
            Chrome may show this reminder for extensions installed from a folder. Choose <b>Keep</b> or close it. Bugmark keeps working.
          </Note>
        </div>

        <details className="group mt-10 rounded-2xl border border-line bg-surface/60 p-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold">
            <IconKeyboard size={17} className="text-accent" />Troubleshooting &amp; file details
          </summary>
          <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-dim">
            <li><b className="text-ink-2">“Manifest file is missing or unreadable”</b> — you selected the zip or a parent folder. Unzip first and pick the folder that directly contains <code className="code">manifest.json</code>.</li>
            <li><b className="text-ink-2">The button doesn’t appear on a page</b> — refresh tabs that were open before installing. Browser pages like the Chrome Web Store or <code className="code">chrome://</code> pages can’t be annotated.</li>
            <li><b className="text-ink-2">Recording has no voice</b> — the first time, allow the microphone on the page Bugmark opens (Settings → General → allow microphone).</li>
            <li className="break-all text-[12px] text-mute">SHA-256 {release.sha256} · extension ID {release.extensionId}</li>
          </ul>
          <p className="mt-4 text-[14px] text-dim">Still stuck? Email <a className="font-medium text-accent underline decoration-accent/30 underline-offset-4" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p>
        </details>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="card grid grid-cols-[auto_1fr] gap-4 p-5 sm:gap-5 sm:p-6">
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-[14px] font-semibold text-accent">{n}</span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        <div className="mt-1.5 text-[15px] leading-relaxed text-dim [&_b]:font-semibold [&_b]:text-ink-2">{children}</div>
      </div>
    </li>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-5">
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-dim [&_b]:text-ink-2">{children}</p>
    </div>
  );
}
