'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { nav } from '@/lib/site';
import { InstallLink } from './InstallLink';
import { IconPuzzle, IconX } from './icons';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'bg-canvas border-b border-line shadow-sm'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Link href="/" aria-label="Bugmark home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label="Primary">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-[14px] font-medium text-dim transition hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/account" className="btn-secondary hidden !h-10 !rounded-lg !px-4 !text-[14px] sm:inline-flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Sign in
          </Link>
          <InstallLink className="btn-primary !h-10 !rounded-lg !px-4 !text-[14px]">
            <IconPuzzle size={16} />
            <span className="hidden sm:inline">Add to Chrome</span>
            <span className="sm:hidden">Install</span>
          </InstallLink>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-2 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-canvas px-5 pb-5 md:hidden">
          <nav className="grid gap-1 pt-3" aria-label="Mobile">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-surface-2">
                {n.label}
              </a>
            ))}
            <Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-surface-2">
              Sign in / Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
