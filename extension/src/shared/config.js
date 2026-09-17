// ─────────────────────────────────────────────────────────────
// Product configuration — edit these before publishing.
// ─────────────────────────────────────────────────────────────
const WEBSITE = 'https://your-domain.com'; // TODO: your marketing site (no trailing slash)

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
