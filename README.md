# Bugmark

Free bug reporting & debugging tool for Chrome — annotated screenshots, screen recording, steps to reproduce,
console logs and network requests in every report.

```
bugmark/
├── extension/   Chrome extension (Manifest V3) — load this folder in chrome://extensions
├── web/         Marketing website (Next.js 16 + Tailwind v4) — install page, SEO pages, analytics
└── package.json shortcuts for the website commands
```

## Quick start
```bash
npm run setup               # installs the website's dependencies (web/node_modules)
npm run dev                 # website at http://localhost:3000
npm run package:extension   # zips ./extension into web/public/downloads for the “Add to Chrome” download
npm run build               # production build of the website
```

**Extension (development):** `chrome://extensions` → Developer mode → **Load unpacked** → choose `bugmark/extension`.
After changing extension code, click the reload ↻ icon on the Bugmark card.

`extension/manifest.json` contains a `key`, so the extension ID is always **ebljpcoilmbiinebhadcchngeimdbepd**, wherever the
folder lives — your saved captures survive moving or renaming the folder. Remove the `key` line from the copy you upload to the
Chrome Web Store (the store assigns its own ID).

## Release checklist
1. Bump `version` in `extension/manifest.json`.
2. `npm run package:extension` (reads `web/.env.local` for the site URL, support email and analytics IDs).
3. Commit, then deploy `web/` (on Vercel set **Root Directory** to `web`).

Details: [extension/README.md](extension/README.md) · [web/README.md](web/README.md)

## Keep private
`web/scripts/.private/extension-key.pem` (git-ignored) and `web/.env.local`. Back up the `.pem` file somewhere safe.
