'use client';

import { useCallback, useEffect, useState } from 'react';
import { signInWithGoogle, signOut, watchAuth, currentIdToken, authEnabled, type User } from '@/lib/firebaseClient';
import { site } from '@/lib/site';

type LicenseState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'ready'; pro: boolean; email: string | null; key: string | null; activations: { used: number | null; limit: number | null } | null }
  | { status: 'error'; message: string };

export function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [license, setLicense] = useState<LicenseState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Surface the ?paid=success return from Dodo.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'success') {
      setNotice('Payment received — refreshing your license…');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => watchAuth((u) => { setUser(u); setAuthReady(true); }), []);

  const refreshLicense = useCallback(async () => {
    const token = await currentIdToken();
    if (!token) { setLicense({ status: 'anonymous' }); return; }
    setLicense({ status: 'loading' });
    try {
      const res = await fetch('/api/license', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLicense({ status: 'error', message: body.error || `Request failed (${res.status})` });
        return;
      }
      const data = (await res.json()) as { pro: boolean; email: string | null; key: string | null; activations: { used: number | null; limit: number | null } | null };
      setLicense({ status: 'ready', pro: data.pro, email: data.email, key: data.key, activations: data.activations });
    } catch (err) {
      setLicense({ status: 'error', message: err instanceof Error ? err.message : 'Network error' });
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (user) refreshLicense();
    else setLicense({ status: 'anonymous' });
  }, [authReady, user, refreshLicense]);

  const handleSignIn = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try { await signOut(); } finally { setBusy(false); }
  };

  const handleUpgrade = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const token = await currentIdToken();
      if (!token) throw new Error('Please sign in first.');
      const res = await fetch('/api/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || data.error || 'Could not start checkout.');
      window.location.href = data.url as string;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Checkout failed.');
      setBusy(false);
    }
  };

  if (!authEnabled) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold text-ink">Account</h1>
        <p className="mt-3 text-[15px] text-dim">
          Sign-in isn’t configured yet. Set the <code className="text-ink">NEXT_PUBLIC_FIREBASE_*</code> variables to enable Google sign-in.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-ink">Your {site.name} account</h1>

      {notice && (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[14px] text-dim">{notice}</p>
      )}

      {!user ? (
        <>
          <p className="mt-3 text-[15px] text-dim">
            Sign in with Google to manage your Pro license. Use the same Google account you sign in with inside the extension.
          </p>
          <button onClick={handleSignIn} disabled={busy} className="btn-primary mt-6 !h-11 !rounded-lg !px-5 disabled:opacity-60">
            {busy ? 'Opening…' : 'Sign in with Google'}
          </button>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-mute">Signed in as</p>
              <p className="text-[15px] font-medium text-ink">{user.email}</p>
            </div>
            <button onClick={handleSignOut} disabled={busy} className="text-[14px] font-medium text-dim hover:text-ink">
              Sign out
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-line bg-surface-2 p-5">
            {license.status === 'loading' && <p className="text-[15px] text-dim">Checking your license…</p>}

            {license.status === 'error' && (
              <p className="text-[15px] text-red-400">Couldn’t load your license: {license.message}</p>
            )}

            {license.status === 'ready' && (
              license.pro ? (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-pro)_16%,transparent)] px-3 py-1 text-[13px] font-semibold text-pro">
                      Pro — active
                    </span>
                    {license.activations && (
                      <span className="text-[13px] text-mute">
                        Activated on {license.activations.used ?? 0}
                        {license.activations.limit ? `/${license.activations.limit}` : ''} device
                        {(license.activations.used ?? 0) === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[15px] text-dim">
                    You’re all set. Pro features are unlocked in the extension — sign in there with this same Google account.
                  </p>
                  {license.key && (
                    <>
                      <label className="mt-5 block text-[13px] text-mute">Your license key</label>
                      <div className="mt-2 flex gap-2">
                        <code className="flex-1 select-all break-all rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink">
                          {license.key}
                        </code>
                        <button
                          onClick={() => copyKey(license.key!)}
                          className="shrink-0 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-dim hover:text-ink"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="mt-3 text-[13.5px] text-dim">
                        Paste this key into the {site.name} extension → Settings → Bugmark Pro to unlock Pro on this device. Need to move to a new
                        machine? You can release a device from the extension’s Settings.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-dim">
                    Free plan
                  </span>
                  <p className="mt-3 text-[15px] text-dim">
                    Upgrade once to unlock Pro forever — a one-time payment, no subscription.
                  </p>
                  <button onClick={handleUpgrade} disabled={busy} className="btn-primary mt-4 !h-11 !rounded-lg !px-5 disabled:opacity-60">
                    {busy ? 'Starting checkout…' : 'Upgrade to Pro'}
                  </button>
                </div>
              )
            )}
          </div>

          <button onClick={refreshLicense} disabled={busy} className="mt-4 text-[14px] font-medium text-dim hover:text-ink">
            Refresh status
          </button>
        </>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-line-2 bg-surface p-8 shadow-[var(--sh-lg)]">
      {children}
    </div>
  );
}
