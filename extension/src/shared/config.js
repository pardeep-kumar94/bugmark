// ─────────────────────────────────────────────────────────────
// Product configuration — edit these before publishing.
// ─────────────────────────────────────────────────────────────
// NOTE: for local testing while bugmark.site isn't deployed yet, this points at the
// dev server. Switch back to 'https://bugmark.site' once the site is live (the
// packaged build already uses NEXT_PUBLIC_SITE_URL, so prod zips are unaffected).
const WEBSITE = 'http://localhost:3000'; // marketing site + API host (no trailing slash)

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

  // Pro licensing — Google sign-in (chrome.identity) + license check against the website API.
  // The website resolves the Google account to a stable `sub`; the same account signed in on the
  // website (for payment) and here unlocks Pro. Leave oauthClientId '' to disable licensing UI.
  licensing: {
    apiBase: WEBSITE,                       // website that hosts /api/license + /api/checkout
    checkoutUrl: `${WEBSITE}/account`,      // where "Upgrade to Pro" sends people to pay
    // Google Cloud → Credentials → Create OAuth client ID → type "Chrome extension"
    // (tied to the published extension ID). Paste the client ID here.
    oauthClientId: '455219105372-29lrnj28t5mgqfb1pub4td1pgrco8s79.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
    pollIntervalMs: 6 * 60 * 60 * 1000,     // background re-check of license status
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
