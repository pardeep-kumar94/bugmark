// ─────────────────────────────────────────────────────────────
// Product configuration — edit these before publishing.
// ─────────────────────────────────────────────────────────────
// Live site is the API host for licensing + marketing URLs. For local API work,
// temporarily set this to 'http://localhost:3000' while `npm run dev` is running.
// (The packaged build still overrides this from NEXT_PUBLIC_SITE_URL at build time.)
const WEBSITE = 'https://bugmark.site'; // marketing site + API host (no trailing slash)

export const CONFIG = {
  productName: 'Bugmark',

  websiteUrl: WEBSITE,
  welcomeUrl: '',                           // opened once after install (leave '' to skip)
  uninstallUrl: `${WEBSITE}/uninstalled`,   // opened when someone removes Bugmark (leave '' to skip)
  supportEmail: 'support@your-domain.com',

  // Anonymous usage analytics — Google Analytics 4 via the Measurement Protocol.
  // Use the GA4 property linked to your Firebase project:
  //   Firebase console → Project settings → Integrations → Google Analytics → open the property, then
  //   GA Admin → Data streams → (web stream) → Measurement ID (G-…) and
  //   "Measurement Protocol API secrets" → Create.
  // Leave both empty to send nothing. Users can turn analytics off in Settings.
  // `npm run package:extension` on the website fills these from BUGMARK_GA_MEASUREMENT_ID / BUGMARK_GA_API_SECRET.
  analytics: {
    measurementId: '',
    apiSecret: '',
    debug: false,          // true → validate hits against GA's debug endpoint and log the result
  },

  // Pro licensing — license key (bought on the website) activated here. No Google sign-in.
  licensing: {
    apiBase: WEBSITE,                       // website that hosts /api/license/*
    upgradeUrl: `${WEBSITE}/account`,       // where "Get Pro" sends people (sign in → buy → copy key)
    pollIntervalMs: 6 * 60 * 60 * 1000,     // background re-validation of the key
    freeLimit: 2,                           // saved reports on the free plan; Pro is unlimited
  },

  // GitHub issues. Users can always connect with a personal access token.
  // Optional: create a GitHub OAuth App with "Device flow" enabled and paste its Client ID
  // to show a one-click "Sign in with GitHub" button instead.
  github: {
    clientId: '',          // e.g. 'Ov23li…' — leave '' to use personal access tokens only
    scope: 'repo',         // 'public_repo' if you only want public repositories
    apiBase: '',           // optional override (local mock server); leave '' in production
    webBase: '',
  },
};
