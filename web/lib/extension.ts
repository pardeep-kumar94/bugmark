'use client';

import { site } from './site';

type ChromeRuntime = {
  sendMessage: (id: string, msg: unknown, cb: (res: unknown) => void) => void;
  lastError?: { message?: string };
};

export type ExtensionStatus = { installed: boolean; version?: string };

function runtime(): ChromeRuntime | null {
  const w = window as unknown as { chrome?: { runtime?: ChromeRuntime } };
  return w.chrome?.runtime?.sendMessage ? w.chrome.runtime : null;
}

/** Extension ID parsed from the Chrome Web Store listing URL (the last path segment). */
function storeId(): string {
  const m = site.chromeStoreUrl.match(/\/([a-z]{32})(?:[/?#]|$)/i);
  return m ? m[1] : '';
}

/** Every extension ID worth pinging: the pinned downloadable-build ID plus the Chrome Web Store ID. */
function knownIds(): string[] {
  return [...new Set([site.extensionId, storeId()].filter(Boolean))];
}

/** Sends a message to the Bugmark extension. Resolves null if it isn't installed/reachable. */
export function sendToExtension<T = unknown>(msg: unknown, timeoutMs = 4000, id: string = site.extensionId): Promise<T | null> {
  const rt = runtime();
  if (!rt || !id) return Promise.resolve(null);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    try {
      rt.sendMessage(id, msg, (res) => {
        clearTimeout(t);
        if (rt.lastError) resolve(null);
        else resolve((res as T) ?? null);
      });
    } catch {
      clearTimeout(t);
      resolve(null);
    }
  });
}

export async function detectExtension(): Promise<ExtensionStatus> {
  const ids = knownIds();
  const results = await Promise.all(
    ids.map((id) => sendToExtension<{ ok?: boolean; version?: string }>({ type: 'bugmark:ping' }, 1500, id)),
  );
  const hit = results.find((res) => res?.ok);
  return hit ? { installed: true, version: hit.version } : { installed: false };
}
