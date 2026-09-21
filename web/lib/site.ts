// ─────────────────────────────────────────────────────────────
// Site configuration — update these before launch.
// ─────────────────────────────────────────────────────────────
import release from './release.json';

export { release };

export const site = {
  name: 'Bugmark',
  domain: (process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com').replace(/\/$/, ''), // set NEXT_PUBLIC_SITE_URL
  tagline: 'Free bug reporting tool developers can actually use.',
  description:
    'Bugmark is a free bug reporting and debugging tool for Chrome: annotate screenshots or record your screen, and every report includes steps to reproduce, console logs and network requests with payloads and responses. Send it to GitHub or share a clean report.',

  // "Add to Chrome" buttons open the install page, which downloads the packaged extension
  // (public/downloads, built with `npm run package:extension`). Once Bugmark is on the Chrome Web Store,
  // set chromeStoreUrl and point installUrl at it.
  installUrl: '/install',
  chromeStoreUrl: 'https://chromewebstore.google.com/detail/pmddndflbglmpliiinfhhecmfkmfffkj',
  // Extension ID — lets the website detect that Bugmark is installed. Defaults to the pinned ID of the downloadable build.
  extensionId: process.env.NEXT_PUBLIC_EXTENSION_ID || release.extensionId || '',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@your-domain.com',
  // Public profiles, used for Organization structured data (sameAs). Add GitHub, X, LinkedIn, Product Hunt…
  sameAs: [] as string[],
} as const;

// Where "Add to Chrome" buttons point: the Chrome Web Store listing once published,
// otherwise the manual download/install page. Buttons should use this, not installUrl.
export const ctaHref: string = site.chromeStoreUrl || site.installUrl;
// True when the CTA leaves our origin (opens the store in a new tab).
export const ctaExternal = ctaHref.startsWith('http');

export const nav = [
  { href: '/#product', label: 'Product' },
  { href: '/#developers', label: 'For developers' },
  { href: '/#workflow', label: 'Workflow' },
  { href: '/guides', label: 'Guides' },
  { href: '/#faq', label: 'FAQ' },
];
