'use client';

import { site } from './site';

type ChromeRuntime = {
  sendMessage: (id: string, msg: unknown, cb: (res: unknown) => void) => void;
  lastError?: { message?: string };
};

export type ExtensionStatus = { installed: boolean; version?: string };

function runtime(): ChromeRuntime | null {
  const w = window as unknown as { chrome?: { runtime?: ChromeRuntime } };
  return site.extensionId && w.chrome?.runtime?.sendMessage ? w.chrome.runtime : null;
}

/** Sends a message to the Bugmark extension. Resolves null if it isn't installed/reachable. */
export function sendToExtension<T = unknown>(msg: unknown, timeoutMs = 4000): Promise<T | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    try {
      rt.sendMessage(site.extensionId, msg, (res) => {
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
  const res = await sendToExtension<{ ok?: boolean; version?: string }>({ type: 'bugmark:ping' }, 1500);
  return res?.ok ? { installed: true, version: res.version } : { installed: false };
}
