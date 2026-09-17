# Bugmark — Free bug reporting & debugging tool for Chrome

Draw on any web page, capture an annotated screenshot or a narrated screen recording, and every report
automatically includes steps to reproduce, console logs and network requests (with payloads and responses).
Export a clean HTML/PDF/CSV report or send it straight to GitHub issues.

**Bugmark is completely free** — no account, no item limits, every feature unlocked.

> This folder is part of the `bugmark` monorepo (`../web` is the website). See `../README.md`.

## Install (1 minute)
1. Unzip this folder.
2. Open `chrome://extensions` and switch on **Developer mode** (top-right).
3. Click **Load unpacked** and choose the extension folder (the one containing `manifest.json`).
4. Pin Bugmark from the puzzle-piece menu.

Open any website — a small black button appears bottom-right.

## How it works
1. Click the floating button (or press **⌥⇧S / Alt+Shift+S**).
2. Mark up the page with the toolbar, then press **Enter** to capture.
3. Add a title/comment, pick a type and priority, and **Save** (⌘/Ctrl + Enter).
4. Open the report (toast link, popup, or toolbar icon) → review, edit, resolve → **Export HTML report**.

## Tools & shortcuts
| Key | Tool | Key | Action |
|---|---|---|---|
| V | Interact with page (open menus before capturing) | Enter | Capture |
| P | Pen | ⌘/Ctrl Z | Undo (⇧ to redo) |
| H | Highlighter | Esc | Exit |
| A | Arrow (Shift = snap 45°) | ⌘/Ctrl Enter | Save feedback |
| R / O | Rectangle / Ellipse (Shift = square/circle) | | |
| T | Text label | | |
| N | Numbered pin — reference “1, 2, 3” in your comment | | |
| B | Redact — pixelates emails, keys, personal data in the saved image | ⇧ Enter | Full-page capture |
| E | Inspect element | | |

## What gets captured automatically
URL & page title · viewport size & pixel ratio · browser & OS · scroll position ·
JavaScript errors, console messages, network requests (no headers/bodies), failed resource loads and HTTP 4xx/5xx requests,
and the steps that led to the capture.

## Reports
- Grouped by site, searchable, filter by status/type, sort by priority.
- Edit titles/comments inline, change type/priority, mark resolved.
- **Export HTML report**: one file with screenshots embedded, cover summary, stats, index table,
  detail pages and a lightbox. Prints cleanly to PDF.
- **Copy as Markdown** for Jira / Linear / GitHub / Slack.
- **Backup / Import** JSON to move data between machines.

## GitHub issues
Turn a capture into a GitHub issue — title, comment, annotated screenshot, type/priority labels and
the captured context (page, viewport, browser, inspected elements, console errors).

1. **Settings → GitHub issues** → paste a personal access token and **Connect**.
   - Fine-grained token (recommended): select the repositories, then **Issues: Read & write** and
     **Contents: Read & write** (Contents is only needed for screenshots).
   - Classic token: `repo` scope (or `public_repo` for public repositories only).
2. Pick a **default repository** (Bugmark remembers the last one used per website).
3. Create issues from:
   - the capture panel — switch on **Create GitHub issue**, then Save; or
   - the report dashboard — **GitHub issue** button on any item (edit repo, title, labels first).
   Linked items show `#123`, and the link is included in HTML, CSV and Markdown exports.

**Screenshots:** GitHub’s API has no issue-attachment upload, so Bugmark commits the image to a separate
orphan branch (`bugmark-assets` by default, never merged into your code) and embeds it in the issue.
Images in private repositories are visible to people with access to the repo. Turn this off in Settings
to create text-only issues. Empty repositories (no commits yet) can’t hold the branch — the issue is still
created without the image.

**Optional one-click sign-in:** create a GitHub OAuth App, enable **Device flow**, and set
`github.clientId` in `src/shared/config.js`. Settings then shows **Sign in with GitHub** (scope from
`github.scope`, default `repo`). Tokens are kept in this browser’s extension storage only.

## Recording, logs, breakpoints, steps & before/after
**Screen recording with voice** — Capture ▾ → *Record video*, the popup's **Record video** button, or **⌥⇧R / Alt+Shift+R**.
- From the toolbar icon or shortcut Chrome lets Bugmark record the tab directly. From the on-page menu Chrome shows its
  share dialog — pick the tab (and "Also share tab audio").
- Microphone narration is on by default (Settings → General). The first time, allow the microphone on the page Bugmark opens.
- A red pill shows the timer and **Stop**; recordings stop automatically after 5 minutes and keep going across page loads.
- The recording is saved with a poster frame. Play or download it (WebM) from the report; it's embedded in HTML reports
  (up to ~60 MB total) and uploaded to the GitHub issue (up to 40 MB).

**Network & console log** — every capture keeps the last 150 requests (fetch, XHR, page resources: method, URL, status, timing)
and 150 console messages. For fetch/XHR calls Bugmark also saves **query params, request headers, the request payload
(JSON, form data, FormData fields), response headers and the response body** for the 60 most recent requests.
Text only: request bodies up to 16 KB, responses up to 32 KB (larger ones are marked *truncated*); binary bodies and
event streams are not stored. Before anything is saved, passwords, tokens, API keys, card numbers, session IDs and
`Authorization`/`Cookie`-style headers are replaced with `[redacted]` — in JSON keys, form fields and URL params. Values a
server echoes back inside free text can't be detected, so review before sharing. Turn bodies off in Settings → General
(*Record request & response bodies*). View per item (**Network / Console**), click a request for params, payload, response and
headers, **Copy as cURL**, filter to problems, and **Download HAR** (opens in Chrome DevTools → Network). Failed requests and console errors are added to HTML reports,
Markdown, CSV and GitHub issues (with the HAR attached).

**Mobile · tablet · desktop** — Capture ▾ → *Mobile · tablet · desktop* renders the page at 390×844, 768×1024 and 1440×900
using Chrome's device emulation and saves one side-by-side image. Chrome briefly shows "Bugmark started debugging this
browser" while it runs. Annotations aren't added to these captures.

**Steps to reproduce** — Bugmark remembers the last 30 actions in a tab (clicks with the element's label, which field you typed in,
checkboxes, selects, form submits, page changes). It never stores what you typed; password fields are only called "password field".
The steps pre-fill an editable field in the feedback panel and are cleared after you save. Turn it off in Settings → General.

**Before / after** — on any item in the report, **+ After shot** → capture the page now (Bugmark reopens it at the same scroll
position), upload an image, or paste one. The card, lightbox, HTML/PDF report and GitHub issue show Before and After side by side.

## Everything is free
Unlimited feedback items, full-page / delayed / element / breakpoint captures, the element inspector, screen recording,
network & console logs, branded (white-label) reports, HTML / PDF / CSV / Markdown export and GitHub issues.

The old Dodo Payments licensing code was removed; it's still in git history if paid plans come back.

### Before publishing
- `manifest.json` has a `key` that pins the extension ID (ebljpcoilmbiinebhadcchngeimdbepd) for unpacked and zip installs. **Remove it for the Chrome Web Store upload.**
- `src/shared/config.js` → set `WEBSITE` (your site) and `supportEmail`, plus the analytics IDs.
- `manifest.json` → `externally_connectable.matches`: replace `your-domain.com` with your domain and remove `http://localhost/*`
  (the website's install page uses it to detect that Bugmark is installed).

## Analytics (anonymous usage statistics)
Bugmark can send anonymous feature-usage events to **Google Analytics 4 — the property linked to your Firebase project** —
using the GA4 Measurement Protocol (extensions can't load the Firebase/gtag SDK because MV3 forbids remote code).

1. Firebase console → your project → **Project settings → Integrations → Google Analytics** (enable it if needed) and open the GA4 property.
2. GA4 **Admin → Data streams →** your web stream → copy the **Measurement ID** (`G-…`), then
   **Measurement Protocol API secrets → Create** and copy the secret.
3. Put both in `src/shared/config.js` → `analytics`, or set `BUGMARK_GA_MEASUREMENT_ID` and `BUGMARK_GA_API_SECRET` when you run
   `npm run package:extension` in the website repo (they're injected into the downloadable zip).
4. Set `analytics.debug: true` to validate events against GA's debug endpoint (results are logged in the service worker console),
   and use GA4 **Admin → DebugView** / **Reports → Realtime**.

With the IDs empty nothing is sent. Users can switch it off in **Settings → Privacy**. Recommended: in GA4 register the custom
dimensions below (Admin → Custom definitions) so they show up in reports.

| Event | Parameters |
|---|---|
| `extension_installed`, `extension_updated`, `browser_started` | `previous_version` |
| `popup_opened` | `restricted_page`, `total_items` (bucket) |
| `annotate_opened` / `annotate_started`, `shortcut_used`, `tool_selected` | `open_source`, `shortcut`, `tool` |
| `screenshot_captured`, `capture_failed` | `capture_mode` (visible · full_page · element · breakpoints), `segments` |
| `recording_started`, `recording_finished`, `recording_failed` | `microphone`, `picker`, `start_source`, `duration_sec`, `size_mb`, `stop_reason` |
| `feedback_saved`, `feedback_deleted` | `feedback_type`, `priority`, `capture_mode`, `has_title`, `has_steps`, `marks`, `console_errors`, `network_requests` (buckets) |
| `after_screenshot_captured` | |
| `report_opened`, `report_action`, `report_exported`, `har_downloaded`, `backup_exported`, `backup_imported` | `items`, `sites`, `action`, `export_format`, `scope`, `has_video` |
| `github_connected`, `github_issue_created`, `github_issue_failed` | `method`, `with_screenshot`, `with_context`, `has_video` |
| `setting_changed`, `analytics_opt_in`, `analytics_opt_out`, `page_view` | `setting`, `enabled` |

Every event also carries `extension_version`, `ui_language`, a random install ID and a session ID. **Never sent:** page URLs or
hostnames, titles, comments, screenshots, recordings, console/network logs, repositories, tokens or anything typed on a page.

When someone removes the extension, Chrome opens `CONFIG.uninstallUrl` (the website's `/uninstalled` page), which records the
uninstall and asks why.

## Privacy
Everything stays on your computer (IndexedDB inside the extension, including recordings and network payloads). Your captures are
never uploaded — unless you create a GitHub issue, which sends that item (and its screenshot, if enabled) directly from your browser
to GitHub. The only other traffic is the optional anonymous usage statistics described above.

## Files
```
manifest.json            MV3 manifest
src/background.js        capture, redaction, compression, storage routing
src/content/content.js   floating button, drawing overlay, toolbar, feedback panel (Shadow DOM)
src/content/page-hook.js page-world listener: errors, console, fetch/XHR (params, payloads, responses — secrets masked), SPA navigation
src/offscreen/            screen recorder (offscreen document)
src/permissions/          one-time microphone permission page
src/popup/               toolbar popup
src/report/              dashboard + report generator (HTML / PDF / CSV)
src/options/             settings: branding, GitHub, general, privacy
src/shared/config.js     product config (URLs, analytics IDs, GitHub OAuth app)
src/shared/analytics.js  anonymous GA4 (Firebase) usage events via the Measurement Protocol
src/shared/har.js        HAR export of the network log
src/shared/github.js     GitHub auth (token / device flow), repo list, screenshot upload, issue creation
src/shared/              IndexedDB, settings, design tokens
```

## Roadmap ideas
Share links (hosted reports clients can comment on) · push to Jira / Linear / Trello · close GitHub issues when items are resolved ·
team workspaces & sync · screen + voice recording · responsive breakpoint captures ·
client guest reviewers · status notifications.
