# Bugmark — Marketing website (free bug reporting & debugging tool)

Next.js 16 (App Router) + Tailwind CSS v4 landing page for the Bugmark Chrome extension.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Page structure & screenshots
`app/page.tsx`: Hero → Included (what every report has) → HowItWorks → Showcase (capture, record, breakpoints, before/after)
→ DevContext (network payload / response / console / steps tabs) → Workflow (dashboard, GitHub, report, exports) → Features → UseCases → Privacy → Free → FAQ → Explore → CTA.

All product images are **real screenshots of the Bugmark extension (v1.6)** captured on a fictional demo booking site
("Lumen Stays"). They live in `public/screens/*.webp` and are listed with sizes and alt text in `lib/screens.ts`,
rendered through `next/image` (AVIF/WebP, quality 90 — see `next.config.ts`). To refresh a screenshot, replace the file
with the same name and update its width/height in `lib/screens.ts`.

## Extension download (“Add to Chrome”)
Every “Add to Chrome” button opens **/install**, which starts downloading `public/downloads/bugmark-chrome-extension.zip`
and walks the visitor through unzip → chrome://extensions → Developer mode → Load unpacked. When Bugmark is installed,
the page detects it and shows “Bugmark x.y.z is installed”.

Build a new zip whenever the extension changes:
```bash
npm run package:extension                                   # packages ../extension
```
The script copies the extension (skips `Claude outputs`, dotfiles), **fills in the website URL, support email and analytics IDs** from `.env.local`,
adds a public `key` to manifest.json so every install gets the same extension ID, zips it and writes `lib/release.json`
(version, size, SHA-256, extension ID) — the install page reads that file. Commit the zip and release.json, then deploy.

- `scripts/extension-key.pub` defines the extension ID (`lib/release.json → extensionId`). Keep it; changing it changes the ID
  and users would lose saved data on update. The matching private key is in `scripts/.private/` (git-ignored, back it up).
- `site.extensionId` defaults to that ID, so install detection works without setting `NEXT_PUBLIC_EXTENSION_ID`.
- Don’t put the `key` field in the version you upload to the Chrome Web Store. Once listed, set `site.chromeStoreUrl`
  and point `site.installUrl` to it.

## Bugmark Pro
Bugmark's core capture flow is free. Pro is a one-time purchase (Dodo Payments hosted checkout) that unlocks unlimited
saved reports; the license key is activated from the extension's Settings page and validated against the website API.

### License keys (Dodo)
The website talks to Dodo's REST API (`web/lib/dodo.ts`) for checkout, webhooks and license activation, but the
license-key *entitlement* itself has to be created once, by hand, in the Dodo dashboard — there's no API for it:

1. **Dodo dashboard → Products → Bugmark Pro** (the one-time product referenced by `DODO_PRODUCT_ID`).
2. Add a **License Key** entitlement to that product:
   - **Activation Limit**: `1` — a key unlocks exactly one device at a time; releasing it in Settings frees the slot
     for another device (`web/lib/dodo.ts` → `activateKey` / `deactivateKey`).
   - **Duration**: leave blank — the license is bought once and doesn't expire.
   - **Activation instructions**: point to the extension, e.g. "Install Bugmark, open Settings → Bugmark Pro, paste
     this key and click Activate."
3. Save — new purchases of that product now issue a license key automatically, delivered on the post-checkout/profile
   page (`getCustomerLicenseKey` in `web/lib/dodo.ts` looks it up by `customer_id`).

Env vars this depends on (see `.env.example`):
- `DODO_API_KEY` — dashboard → Developer → API keys (test key locally, live key in production).
- `DODO_PRODUCT_ID` — the Bugmark Pro product id carrying the license-key entitlement above.
- `DODO_WEBHOOK_SECRET` — dashboard → Webhooks; verifies `payment.succeeded` events (Standard Webhooks signature).
- `DODO_API_BASE` — `https://test.dodopayments.com` (test mode) or `https://live.dodopayments.com` (live).

To verify end to end in test mode: set `DODO_API_BASE` to the test URL, buy Pro on the website with a Dodo test card,
copy the key from the profile page, and paste it into the extension's Settings → Bugmark Pro → Activate. Activating
the same key on a second device should show "already active on another device" until the first device releases it.

## Environment variables
Copy `.env.example` to `.env.local` (and add the same values in Vercel → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production URL, e.g. `https://bugmark.dev` — canonical URLs, sitemap, structured data, and baked into the extension zip |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support inbox |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (Analytics) |
| `NEXT_PUBLIC_ANALYTICS_CONSENT` | `opt-out` (default) or `opt-in` (EU/UK-style: nothing stored until visitors accept) |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | `true` to log events in the console and see them in GA4 DebugView |
| `BUGMARK_GA_MEASUREMENT_ID`, `BUGMARK_GA_API_SECRET` | Extension analytics, injected by `npm run package:extension` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Search Console / Bing Webmaster verification tokens |
| `NEXT_PUBLIC_EXTENSION_ID` | Optional; defaults to the pinned ID in `lib/release.json` |

## Analytics — Firebase (Google Analytics 4)
### Setup (10 minutes)
1. [Firebase console](https://console.firebase.google.com) → **Add project** → keep **Google Analytics enabled** (pick or create a GA4 account).
2. **Project settings → General → Your apps → Web (</>)** → register the app → copy the config values into the `NEXT_PUBLIC_FIREBASE_*` variables.
3. Extension events: open the linked GA4 property (Project settings → Integrations → Google Analytics) →
   **Admin → Data streams →** the web stream → copy the **Measurement ID** into `BUGMARK_GA_MEASUREMENT_ID`, then
   **Measurement Protocol API secrets → Create** → `BUGMARK_GA_API_SECRET`. Re-run `npm run package:extension`.
4. GA4 **Admin → Custom definitions → Create custom dimension** (event scope) for the parameters you want in reports:
   `section`, `link_text`, `page_type`, `capture_mode`, `export_format`, `feedback_type`, `tool`, `reason`, `version`, `metric_name`, `metric_rating`
   (and a custom metric for `metric_value`).
5. GA4 **Admin → Events → Mark as key event**: `install_click`, `extension_download`, `extension_installed`, `feedback_saved`, `github_issue_created`.
6. **Admin → Product links → Search Console** — link your verified site so search queries show up in GA4.
7. Useful explorations: a *Funnel* page_view → install_click → extension_download → extension_installed → feedback_saved;
   uninstall_reason by version; landing page by session source for the SEO pages.

Everything is a no-op when the Firebase variables are empty (local dev, forks). Firebase loads lazily after the page is idle,
so it doesn't affect Core Web Vitals.

### Website events (`components/Analytics.tsx`, `lib/analytics.ts`)
| Event | When | Parameters |
|---|---|---|
| `page_view` | every route change | `page_path`, `page_title`, `page_type` (home/tool/guide/alternative/install…) |
| `install_click` | any “Add to Chrome” link | `section`, `link_text`, `page_path` |
| `extension_download` | zip download starts on /install | `trigger` (auto/button), `version`, `file_size_kb` |
| `extension_detected` | /install sees the extension running | `version` |
| `install_step` | “Copy” extensions URL | `step`, `browser` |
| `nav_click`, `internal_link_click`, `outbound_click`, `contact_click` | link clicks | `link_text`, `link_url`, `section` |
| `faq_open` | an FAQ is expanded | `question`, `section` |
| `section_view`, `scroll_depth` | engagement | `section` / `percent` |
| `web_vitals` | LCP, INP, CLS, FCP, TTFB | `metric_name`, `metric_value`, `metric_rating` |
| `exception` | uncaught JS errors | `description` |
| `extension_uninstalled`, `uninstall_reason` | /uninstalled (opened by Chrome after removal) | `version`, `reason` |
| `consent_granted` | visitor accepts the banner | |

Add your own with `data-track="event_name" data-track-foo="bar"` on any element. GA4 enhanced measurement
(campaigns/UTMs, sessions, engagement time, geography, devices) works automatically.
Extension events are documented in the extension README (anonymous, no URLs or content, users can opt out).

## SEO
### What's built in
- **Keyword landing pages** (`lib/content/tools.ts` → `/[slug]`): `/bug-reporting-tool`, `/web-developer-tools`, `/debugging-tool`,
  `/website-feedback-tool`, `/screen-recorder-for-bug-reports`, `/screenshot-annotation-tool`, `/network-request-logger`, `/qa-testing-tool`.
- **Comparison pages** (`lib/content/alternatives.ts` → `/alternatives/[slug]`): Jam, Marker.io, BugHerd, Loom. Competitor details were
  checked against their public websites in September 2026 — re-check their plans every few months.
- **Guides** (`lib/content/guides.ts` → `/guides/[slug]`): how to write a bug report, capture a HAR file, capture console logs,
  steps-to-reproduce template, full page screenshots in Chrome.
- Hubs `/tools`, `/guides`, `/alternatives`; an **Explore** section on the home page and footer links, so every page is 1–2 clicks from home.
- Structured data (JSON-LD): Organization, WebSite, SoftwareApplication (free offer), FAQPage (home + every content page),
  BreadcrumbList, TechArticle, HowTo, CollectionPage.
- Per-page titles (≤60 chars), meta descriptions (140–160), canonical URLs, Open Graph/Twitter cards with product screenshots,
  `sitemap.xml` (with images), `robots.txt`, web app manifest, `/llms.txt` for AI answer engines, `noindex` on /uninstalled,
  Search Console/Bing verification tags, and fully prerendered static pages.

Add a page: append an object to the matching file in `lib/content/` (the `ContentPage` type documents every field). The route,
sitemap, hubs, footer/explore links and structured data update automatically.

### Target keywords
| Cluster | Head terms (very competitive) | Long-tail terms (realistic first wins) |
|---|---|---|
| Bug reporting | bug reporting tool, reporting tool | free bug reporting tool, bug report chrome extension, visual bug reporting tool, bug report with screenshot and console logs |
| Developer tools | developer tools, web developer tools | chrome extension for web developers, developer tools for bug reports, front-end debugging extension |
| Debugging | debugging tool, web debugging tool | capture network requests chrome extension, record console logs chrome, HAR file capture tool |
| QA / feedback | QA testing tool, website feedback tool | manual testing bug report tool, website annotation tool for clients, visual feedback tool for agencies |
| Recording | screen recorder | screen recorder for bug reports, bug report video with console logs |
| Comparisons | — | Jam alternative, free Jam alternative, Marker.io alternative, BugHerd alternative, Loom alternative for bug reports |
| How-to | — | how to write a bug report, bug report template, how to capture HAR file in Chrome, steps to reproduce template, full page screenshot chrome |

No one can guarantee position 1 for head terms like “developer tools” (Chrome DevTools docs and MDN own those results).
The plan: win long-tail and comparison terms first, build authority and backlinks, then climb for the head terms.

### Launch checklist (what moves rankings most)
1. Set `NEXT_PUBLIC_SITE_URL` to the real domain, deploy, verify in **Google Search Console** and **Bing Webmaster Tools**, submit `/sitemap.xml`,
   and request indexing for the home page and the 8 tool pages.
2. **Publish on the Chrome Web Store** — store listings rank on Google for “… chrome extension” searches and bring most installs.
   Suggested listing: name *Bugmark — Free Bug Reporting & Debugging Tool*; summary *Free bug reporting tool for web developers & QA:
   annotated screenshots, screen recording, console & network logs, GitHub issues.* Link the website from the listing, then set `site.chromeStoreUrl`.
3. **Backlinks**: Product Hunt, Hacker News (Show HN), Reddit (r/webdev, r/QualityAssurance, r/chrome_extensions), Dev.to/Hashnode articles,
   AlternativeTo (as an alternative to Jam, Marker.io, BugHerd, Loom), SaaSHub, “awesome” developer-tools lists on GitHub, extension directories.
   Add those profile URLs to `site.sameAs`.
4. Publish 2–4 new guides a month on long-tail questions (“how to report a bug to a developer”, “what is a HAR file”, “bug report vs
   feature request”) and update the `updated` date when you revise a page.
5. In Search Console → *Performance*, pages sitting at positions 5–20 are the quickest wins — expand them and add internal links to them.
6. Keep Core Web Vitals green (GA4 `web_vitals`, PageSpeed Insights).

## Structure
```
app/
  layout.tsx              fonts, site-wide SEO metadata, <Analytics />
  page.tsx                landing page + JSON-LD graph
  [slug]/                 keyword landing pages (lib/content/tools.ts)
  alternatives/, guides/  comparison pages and guides (+ hub pages); tools/ hub
  install/                download + install guide
  uninstalled/            uninstall survey (opened by the extension, noindex)
  privacy/, terms/        legal pages (drafts — review before launch)
  opengraph-image.tsx     generated social share image
  robots.ts, sitemap.ts, manifest.ts, llms.txt/
components/
  Nav, Hero, Included, HowItWorks, Showcase, DevContext, Workflow, Features, UseCases, Privacy, Free, FAQ, Explore, CTA, Footer
  Analytics.tsx           page views, clicks, scroll, web vitals, consent banner
  content/                ContentArticle (template + structured data), Hub, RichText
  InstallGuide, UninstallSurvey, SimpleShell, LegalPage
lib/
  analytics.ts            Firebase Analytics wrapper (lazy, consent-aware)
  content/                SEO page content (typed data)
  seo.tsx                 JSON-LD builders, target keywords
  extension.ts            talks to the extension (externally_connectable)
  site.ts                 name, URLs, emails, nav
```

## Brand — developer theme
- Dark IDE canvas `#090B0F`, surfaces `#0E1217` / `#131820`, lines `#1E252E`, text `#E6EDF3` / `#9BA6B2`
- Accent: terminal green `#4ADE80` → teal `#2DD4BF` → cyan `#22D3EE`; buttons are solid green with near-black text `#03140A`
- Bug red `#FF5C7A`, warning amber `#FBBF24`
- Type: Geist Mono for headings, labels and buttons; Geist Sans for body copy
- No purple / indigo anywhere.

## Deploy
Push to GitHub and import into Vercel (zero config), or any Node host with `npm run build && npm start`.
