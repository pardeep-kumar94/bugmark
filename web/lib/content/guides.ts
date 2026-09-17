import type { ContentPage } from './types';

const bugReportTemplate = `## Summary
Checkout button does nothing on /cart when a coupon is applied

## Environment
- URL: https://shop.example.com/cart
- Browser: Chrome 140 (macOS 15.5)
- Viewport: 1440x900, device pixel ratio 2
- Account / role: test user, logged in
- Build or release: web 4.12.0

## Steps to reproduce
1. Log in as a test user.
2. Add any item to the cart.
3. Go to /cart and apply the coupon SAVE10.
4. Click "Checkout".

## Expected result
The checkout page opens.

## Actual result
Nothing happens. The console shows
"TypeError: Cannot read properties of undefined (reading 'total')".
POST /api/checkout returns 500.

## Frequency
Every time (5 of 5 attempts)

## Severity / priority
High: blocks purchases with a coupon

## Attachments
- Annotated screenshot
- Console log (.log)
- Network log (HAR, sanitized)`;

const strTemplate = `Preconditions:
- Logged in as: <role / test account>
- Starting URL: <https://...>
- Data or settings needed: <e.g. cart contains 1 item, feature flag X on>
- Browser / device: <Chrome 140, Windows 11, 1920x1080>

Steps to reproduce:
1. Go to <URL or screen>.
2. Click <exact button or link label>.
3. Enter <exact value> in <field name>.
4. Click <exact label>.

Expected result:
<what should happen>

Actual result:
<what happens instead, including any error text>

Reproducibility:
<Always | Intermittent (3 of 10) | Once>`;

const strExample = `Preconditions:
- Logged in as: admin@example.test (Admin role)
- Starting URL: https://app.example.com/settings/team
- Team has at least 2 members

Steps to reproduce:
1. Go to Settings > Team.
2. Click the "..." menu next to any member.
3. Click "Change role" and select "Viewer".
4. Click "Save".

Expected result:
A "Role updated" toast appears and the member's role shows "Viewer".

Actual result:
The dialog closes, no toast appears, and the role still shows "Editor"
after a page refresh. PATCH /api/members/42 returns 403.

Reproducibility:
Always (4 of 4) in Chrome and Edge; not tested in Safari.`;

const consoleSnippet = `// Paste in the Console to start collecting messages
// (only captures what is logged after you run this).
const captured = [];
['log', 'info', 'warn', 'error'].forEach((level) => {
  const original = console[level];
  console[level] = (...args) => {
    captured.push({ level, time: new Date().toISOString(), args: args.map(String) });
    original.apply(console, args);
  };
});
window.addEventListener('error', (e) =>
  captured.push({ level: 'uncaught', time: new Date().toISOString(), args: [e.message] })
);
// Later, reproduce the bug, then run:
copy(JSON.stringify(captured, null, 2));`;

const harCheck = `# Quick check for secrets before you share a HAR file (macOS / Linux)
grep -Eio '"name": *"(cookie|set-cookie|authorization|x-api-key)"' network.har | sort | uniq -c
grep -Eio '(access_token|refresh_token|id_token|password|session)[^,]{0,40}' network.har | head`;

export const guidePages: ContentPage[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. How to write a bug report
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-write-a-bug-report',
    kind: 'guide',
    title: 'How to Write a Bug Report (Template + Example)',
    description:
      'Learn how to write a bug report developers can fix on first read: the essential fields, a copy-paste template, a good bug report example and common mistakes.',
    h1: 'How to write a bug report developers can actually fix',
    eyebrow: 'guide',
    intro:
      "A good bug report lets someone who has never seen the problem reproduce it in minutes. This guide covers the fields every report needs, a copy-paste bug report template, a real example, and the mistakes that send tickets back with \"can't reproduce\".",
    primaryKeyword: 'how to write a bug report',
    keywords: [
      'bug report template',
      'good bug report example',
      'bug report format',
      'how to report a bug',
      'bug report fields',
      'writing bug reports for developers',
      'software bug report',
      'bug ticket template',
    ],
    hero: 'reportItem',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'How to write a bug report',
            text: 'Write a specific one-line title, then list the environment (URL, browser, OS, viewport), numbered steps to reproduce, the expected result and the actual result. Attach an annotated screenshot or recording plus console errors and failing network requests. Note how often it happens and how badly it hurts users.',
          },
        ],
      },
      {
        heading: 'What a good bug report includes',
        blocks: [
          {
            type: 'p',
            text: 'Every field in a bug report exists to answer a question the developer would otherwise have to ask you. If you fill in the fields below, most bugs can be reproduced and triaged without a single follow-up message.',
          },
          {
            type: 'table',
            head: ['Field', 'What to write', 'Why it matters'],
            rows: [
              ['Title', 'Where + what is broken, in one line', 'Makes the ticket searchable and easy to triage'],
              ['Environment', 'URL, browser and version, OS, viewport, account role, build', 'Many bugs only appear in one browser, size or role'],
              ['Steps to reproduce', 'Numbered actions from a known starting point', 'The developer must see the bug before fixing it'],
              ['Expected result', 'What should have happened', 'Separates a bug from a misunderstanding'],
              ['Actual result', 'What happened, with exact error text', 'Gives the symptom to search for in code and logs'],
              ['Evidence', 'Screenshot, recording, console log, network log', 'Shows what words cannot and exposes the root cause'],
              ['Frequency', 'Always, intermittent (3 of 10), once', 'Intermittent bugs need a different debugging approach'],
              ['Severity / priority', 'Impact on users and business', 'Decides what gets fixed first'],
            ],
          },
          {
            type: 'p',
            text: 'The single most important field is **steps to reproduce**. If you only have time to do one thing well, do that. Our [steps to reproduce template](/guides/steps-to-reproduce-template) goes deeper on writing them.',
          },
        ],
      },
      {
        heading: 'How to write a bug report, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Reproduce the bug yourself.** Try it again from a clean start (refresh, or a new incognito window) so you know the exact path that triggers it and whether it happens every time.',
              '**Search for an existing report.** Check your tracker for the error message or page name. Add your details to an existing ticket instead of filing a duplicate.',
              '**Write a specific title.** Use the pattern "[Where] [what is wrong] [when]": for example, "Checkout button does nothing on /cart when a coupon is applied".',
              '**Record the environment.** Copy the full URL and note the browser and version (`chrome://version`), operating system, window size, the account or role you used, and the release if you know it.',
              '**List the steps to reproduce.** Number each action, start from a known state, and use the exact labels you see on screen.',
              '**State expected versus actual.** Put them on separate lines. Quote error messages exactly rather than paraphrasing them.',
              '**Attach evidence.** Add an annotated screenshot or short recording, the console errors, and the failing network request. See [how to capture console logs](/guides/how-to-capture-console-logs) and [how to capture a HAR file in Chrome](/guides/how-to-capture-har-file-chrome).',
              '**Set severity and frequency, then proofread.** Read the report as if you were the developer. Remove guesses presented as facts and any passwords or personal data.',
            ],
          },
        ],
      },
      {
        heading: 'Bug report template (Markdown)',
        blocks: [
          {
            type: 'p',
            text: 'Copy this bug report format into GitHub, Jira, Linear or any tracker that accepts Markdown. It is filled in with a realistic example so you can see the level of detail that works.',
          },
          { type: 'code', lang: 'markdown', text: bugReportTemplate },
          {
            type: 'p',
            text: 'Why this is a **good bug report example**: the title names the page and the trigger, the steps start from a known state, the actual result quotes the exact error, and the failing request (`POST /api/checkout` returning 500) points the developer straight at the likely cause.',
          },
        ],
      },
      {
        heading: 'Bad vs. good: a quick comparison',
        blocks: [
          {
            type: 'table',
            head: ['Weak report', 'Strong report'],
            rows: [
              ['"Checkout is broken"', '"Checkout button does nothing on /cart when a coupon is applied"'],
              ['"It doesn\'t work on my computer"', '"Chrome 140, macOS 15.5, 1440x900, logged in as test user"'],
              ['"I tried to buy something and it failed"', 'Four numbered steps with the coupon code and button label'],
              ['"There was some error"', 'Exact console message plus `POST /api/checkout` 500'],
              ['No attachments', 'Annotated screenshot, console log and sanitized HAR'],
            ],
          },
        ],
      },
      {
        heading: 'Common bug reporting mistakes',
        blocks: [
          {
            type: 'list',
            items: [
              '**Several bugs in one ticket.** File one report per problem so each can be assigned, fixed and closed independently.',
              '**Vague titles.** "Bug on homepage" is impossible to search for or prioritize.',
              '**Skipping the starting state.** Steps that begin halfway through a flow are the top cause of "can\'t reproduce".',
              '**Paraphrasing errors.** "Some JavaScript error" hides the stack trace a developer needs. Copy it exactly.',
              '**Screenshots without context.** A cropped image with no URL, arrow or note leaves the reader guessing what is wrong.',
              '**Sharing secrets.** Raw HAR files and screenshots can contain session cookies, tokens and customer data. Redact before you attach.',
              '**Guessing the cause as fact.** Put theories in a separate "Notes" line so they do not send the developer in the wrong direction.',
            ],
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Writing all of this by hand takes 10 to 15 minutes per bug, and the technical parts are the easiest to get wrong. [Bugmark](/bug-reporting-tool) is a free Chrome extension that fills in most of the template for you the moment you capture.',
          },
          {
            type: 'list',
            items: [
              '**Annotated screenshot or recording:** arrows, boxes, numbered pins, text and a redact tool, or a tab recording with voice narration up to 5 minutes.',
              '**Steps to reproduce, recorded automatically:** the last 30 actions in the tab (clicks with element labels, which fields were typed in but never the text). You can edit them before saving.',
              '**Console and network context:** the last 150 console messages and JavaScript errors, plus the last 150 network requests with status, timing and payloads, with passwords, tokens and cookies masked as `[redacted]`.',
              '**Environment:** URL, page title, browser, OS, viewport, pixel ratio and scroll position.',
              '**Export anywhere:** copy as Markdown for GitHub, Jira, Linear or Slack, export CSV or a self-contained HTML report, or create a GitHub issue directly.',
            ],
          },
          { type: 'shot', screen: 'reportItem', caption: 'A Bugmark report with screenshot, steps, console errors and failing requests in one place.' },
          { type: 'shot', screen: 'steps', caption: 'Steps to reproduce are recorded from your actions in the tab and stay editable.' },
          {
            type: 'p',
            text: 'Everything is stored locally in your browser, with no account required. [Add Bugmark to Chrome — free](/install)',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What are the key elements of a bug report?',
        a: 'A useful bug report has a specific title, the environment (URL, browser, operating system, viewport and account), numbered steps to reproduce, the expected result, the actual result with exact error text, visual evidence such as a screenshot or recording, and notes on frequency and severity. Console errors and failing network requests make it much easier for developers to find the cause.',
      },
      {
        q: 'How long should a bug report be?',
        a: 'As short as possible while still letting someone reproduce the problem without asking you questions. Most good reports fit on one screen: a one-line title, a few environment details, three to eight steps, and one line each for expected and actual results. Put long logs in attachments instead of pasting them into the description.',
      },
      {
        q: 'What is the difference between severity and priority?',
        a: 'Severity describes how badly the bug affects the product, for example a crash or data loss versus a cosmetic typo. Priority describes how soon the team should fix it, which also depends on business factors such as how many users are affected or an upcoming launch. A reporter usually suggests severity, while the product owner sets priority.',
      },
      {
        q: 'Should I include screenshots in a bug report?',
        a: 'Yes, for almost every visual or UI bug. Annotate the screenshot with an arrow or box so the problem is obvious, and include the URL so the image has context. For bugs that involve motion, timing or several steps, a short screen recording with narration is usually clearer than a series of screenshots.',
      },
      {
        q: 'What should I do if I cannot reproduce the bug?',
        a: 'Report it anyway, but say so clearly. Describe what you were doing, the exact time it happened, the URL, your browser and any error text you saw. Mark frequency as "seen once" and attach any console or network logs you captured. Timestamps help developers find matching entries in server logs.',
      },
    ],
    related: [
      '/guides/steps-to-reproduce-template',
      '/guides/how-to-capture-console-logs',
      '/bug-reporting-tool',
      '/qa-testing-tool',
    ],
    updated: '2026-09-17',
    howTo: {
      name: 'How to write a bug report',
      totalTime: 'PT10M',
      steps: [
        { name: 'Reproduce the bug', text: 'Trigger the bug again from a clean starting state so you know the exact path and whether it happens every time.' },
        { name: 'Check for duplicates', text: 'Search your issue tracker for the error message or page name and add to an existing ticket if one exists.' },
        { name: 'Write a specific title', text: 'Summarize where the problem is, what is wrong and when it happens in a single line.' },
        { name: 'Record the environment', text: 'Note the full URL, browser and version, operating system, viewport size, account role and release.' },
        { name: 'List steps to reproduce', text: 'Write numbered actions from a known starting point using the exact labels shown on screen.' },
        { name: 'State expected and actual results', text: 'Describe what should happen and what actually happens, quoting any error text exactly.' },
        { name: 'Attach evidence', text: 'Add an annotated screenshot or recording, console errors and a sanitized network log.' },
        { name: 'Set severity and proofread', text: 'Add frequency and severity, remove sensitive data and reread the report as the developer would.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 2. How to capture a HAR file in Chrome
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-capture-har-file-chrome',
    kind: 'guide',
    title: 'How to Capture a HAR File in Chrome (2026 Guide)',
    description:
      'Step-by-step: record and export a HAR file from Chrome DevTools, what a HAR file contains, how to sanitize it before sending it to support, and common mistakes.',
    h1: 'How to capture a HAR file in Chrome',
    eyebrow: 'guide',
    intro:
      'Support teams ask for a HAR file when they need to see exactly what your browser sent and received. Here is how to record and export one from Chrome DevTools in about two minutes, and how to keep your cookies and tokens out of it.',
    primaryKeyword: 'how to capture a HAR file in Chrome',
    keywords: [
      'export HAR chrome devtools',
      'HAR file for support',
      'what is a HAR file',
      'generate HAR file chrome',
      'save network log chrome',
      'HAR sanitized',
      'download HAR file',
      'chrome network log export',
    ],
    hero: 'networkPayload',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'How to capture a HAR file in Chrome',
            text: 'Open the page, press F12 (or Cmd+Option+I on Mac) and select the **Network** panel. Check **Preserve log**, reload the page and reproduce the problem. Then click the download icon, **Export HAR (sanitized)...**, and save the .har file. Sanitized export leaves out cookies and authorization headers.',
          },
        ],
      },
      {
        heading: 'What is a HAR file?',
        blocks: [
          {
            type: 'p',
            text: 'A HAR (HTTP Archive) file is a JSON file that records every network request a browser tab made while it was being recorded: the URL, method, status code, request and response headers, timing, and often the response body. Chrome, Edge, Firefox and Safari can all export it, and DevTools can import it again for analysis.',
          },
          {
            type: 'p',
            text: 'Developers and support engineers use HAR files to diagnose failed API calls, slow page loads, redirects, CORS problems, and login or checkout errors they cannot reproduce on their own machines.',
          },
          {
            type: 'callout',
            title: 'Privacy warning',
            text: 'A HAR file can contain session cookies, authorization tokens, form data and personal information. Anyone who has an unsanitized HAR file may be able to act as you on that site. Use the sanitized export, and only send HAR files to people you trust through a secure channel.',
          },
        ],
      },
      {
        heading: 'How to capture a HAR file in Chrome, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Open the page** where the problem happens. If possible, start from the page just before it.',
              '**Open DevTools.** Press **F12** or **Ctrl+Shift+I** on Windows and Linux, **Cmd+Option+I** on Mac, or right-click the page and choose **Inspect**.',
              '**Select the Network panel.** If you do not see it, click the `>>` overflow arrow in the DevTools tab bar.',
              '**Check Preserve log** in the Network toolbar so requests are kept when the page reloads or redirects. Optionally check **Disable cache** to record what a first-time visitor would load.',
              '**Clear old entries** with the clear icon (a circle with a line through it) so the file only contains the problem.',
              '**Confirm recording is on.** The record button at the top left of the panel should be red. Click it if it is gray.',
              '**Reproduce the problem.** Reload the page and repeat the exact steps that cause the bug until you see the error.',
              '**Export the HAR file.** Click the download icon (**Export HAR (sanitized)...**) in the Network toolbar, or right-click any request and choose **Save all as HAR (sanitized)**. Choose a location and save the .har file.',
            ],
          },
          {
            type: 'p',
            text: 'The download icon exports everything currently listed. If you have a filter active (for example **Fetch/XHR**), right-click and use the "listed" save option to export only the filtered requests.',
          },
        ],
      },
      {
        heading: 'Sanitized vs. with sensitive data',
        blocks: [
          {
            type: 'p',
            text: 'Current Chrome exports HAR files **sanitized** by default. Sanitized files leave out `Cookie`, `Set-Cookie` and `Authorization` headers. If a developer genuinely needs them, you can enable **Settings > Preferences > Network > Allow to generate HAR with sensitive data**, which adds an **Export HAR (with sensitive data)...** option.',
          },
          {
            type: 'table',
            head: ['Export option', 'Includes cookies and auth headers', 'Use it when'],
            rows: [
              ['Export HAR (sanitized)...', 'No', 'Sending to vendor support or anyone outside your team (default choice)'],
              ['Export HAR (with sensitive data)...', 'Yes', 'Debugging your own app locally, when a session issue must be analyzed'],
            ],
          },
          {
            type: 'p',
            text: 'Sanitizing does not remove everything. Tokens in URL query strings, request payloads (such as a login form) and response bodies stay in the file. Search the file before sharing it:',
          },
          { type: 'code', lang: 'bash', text: harCheck },
          {
            type: 'p',
            text: 'When you are done, log out of the site or revoke the session if you shared a file that might contain live credentials.',
          },
        ],
      },
      {
        heading: 'What support looks for in a HAR file',
        blocks: [
          {
            type: 'p',
            text: 'Knowing what the recipient will check helps you capture the right thing. Open the file in DevTools (drag it onto the Network panel) and look for these signals before you send it:',
          },
          {
            type: 'table',
            head: ['Signal', 'Where to find it', 'What it usually means'],
            rows: [
              ['Status 4xx', 'Status column, shown in red', 'Bad input, expired session (401), missing permission (403) or wrong URL (404)'],
              ['Status 5xx', 'Status column, shown in red', 'The server failed; the response body often contains the error'],
              ['(failed) or (blocked)', 'Status column', 'CORS, an ad blocker, a network drop or a Content Security Policy rule'],
              ['Long waiting time', 'Timing tab, Waiting for server response', 'Slow backend or database query'],
              ['Redirect loops', 'Many 301 or 302 rows to the same URLs', 'Misconfigured login, cookies or HTTPS settings'],
            ],
          },
          {
            type: 'p',
            text: 'If you already know which request fails, mention its URL and the time you reproduced the problem in your message. That saves the reader from scanning hundreds of rows. Pair the file with a clear written report using our [bug report template](/guides/how-to-write-a-bug-report).',
          },
          {
            type: 'p',
            text: 'The same flow works in other browsers. In **Firefox**, open the Network panel, reproduce the issue, then use the gear menu and choose **Save All As HAR**. In **Safari**, enable the Develop menu in Settings > Advanced, open Web Inspector, go to Network and click **Export**. Edge, Brave and Arc use Chrome DevTools, so the steps above apply unchanged.',
          },
        ],
      },
      {
        heading: 'Common HAR capture mistakes',
        blocks: [
          {
            type: 'list',
            items: [
              '**Opening DevTools after the problem.** The Network panel only records while it is open. Open it first, then reproduce.',
              '**Forgetting Preserve log.** Without it, a redirect or reload wipes the requests that showed the error.',
              '**Capturing too much.** A long browsing session produces a huge file that is hard to read. Clear the log and record only the failing flow.',
              '**Sharing unsanitized files.** Never post a HAR file in a public forum, GitHub issue or chat channel without checking it for secrets.',
              '**Sending only the HAR.** Include the time it happened, what you clicked and a screenshot. Console errors often explain the failure, so see [how to capture console logs](/guides/how-to-capture-console-logs) too.',
            ],
          },
          {
            type: 'p',
            text: 'Received a HAR file? Open DevTools on any tab, go to **Network**, and drag the .har file into the request list (or use the **Import HAR** upload icon) to inspect it just like a live recording.',
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'The DevTools method works, but you have to remember to open it before the bug happens, and the file still needs checking for secrets. [Bugmark](/network-request-logger) is a free Chrome extension that keeps a rolling network log for the tab, so the failing request is already there when you capture a bug.',
          },
          {
            type: 'list',
            items: [
              'Records the **last 150 requests** (fetch, XHR and resources) with method, URL, status and timing.',
              'For the 60 most recent fetch/XHR calls, keeps query params, request headers and payload, response headers and response body.',
              '**Masks secrets before saving:** passwords, tokens, API keys, session IDs, card numbers and `Authorization`/`Cookie` headers become `[redacted]`.',
              'Filter to failures, **Copy as cURL**, or **Download HAR** and open it in Chrome DevTools.',
              'Attaches the screenshot, console errors and steps to reproduce to the same report.',
            ],
          },
          { type: 'shot', screen: 'networkPayload', caption: 'Inspect a request payload and headers with secrets already masked.' },
          { type: 'shot', screen: 'networkResponse', caption: 'Response bodies for recent fetch and XHR calls, ready to export as HAR.' },
          {
            type: 'p',
            text: 'Data stays in your browser until you export it. [Add Bugmark to Chrome — free](/install)',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a HAR file used for?',
        a: 'A HAR file records the network activity of a browser tab, including request URLs, headers, status codes, timing and response content. Support and engineering teams use it to diagnose failed API calls, slow loading, redirects, login problems and other issues that only happen on a customer\'s machine and cannot be reproduced internally.',
      },
      {
        q: 'Is it safe to share a HAR file?',
        a: 'Only with care. Chrome\'s default sanitized export removes cookies and authorization headers, but URLs, form submissions and response bodies can still contain tokens or personal data. Share it only with people you trust over a private channel, never post it publicly, and log out or revoke sessions afterward if you are unsure.',
      },
      {
        q: 'Why is my HAR file empty?',
        a: 'DevTools only records network requests while the Network panel is open and recording. If you opened DevTools after the page loaded, the requests were never captured. Make sure the record button is red, check Preserve log, reload the page and reproduce the problem again before exporting.',
      },
      {
        q: 'How do I open a HAR file in Chrome?',
        a: 'Open DevTools on any tab, select the Network panel, and drag the .har file onto the request list, or click the Import HAR upload icon in the Network toolbar. Chrome displays the requests as if they had been recorded live, so you can inspect headers, timing and responses.',
      },
      {
        q: 'Can I capture a HAR file in Edge or Brave?',
        a: 'Yes. Edge, Brave, Arc and other Chromium browsers use the same DevTools, so the steps are identical: open DevTools, select Network, enable Preserve log, reproduce the problem and use the export icon to save the HAR file. Menu labels may differ slightly between browser versions.',
      },
    ],
    related: [
      '/guides/how-to-capture-console-logs',
      '/network-request-logger',
      '/debugging-tool',
      '/guides/how-to-write-a-bug-report',
    ],
    updated: '2026-09-17',
    howTo: {
      name: 'How to capture a HAR file in Chrome',
      totalTime: 'PT3M',
      steps: [
        { name: 'Open DevTools', text: 'On the affected page press F12, Ctrl+Shift+I or Cmd+Option+I to open Chrome DevTools.' },
        { name: 'Select the Network panel', text: 'Click the Network tab, using the overflow arrow if it is hidden.' },
        { name: 'Enable Preserve log', text: 'Check Preserve log so requests survive reloads and redirects, and clear old entries.' },
        { name: 'Check recording is on', text: 'Make sure the record button at the top left of the Network panel is red.' },
        { name: 'Reproduce the problem', text: 'Reload the page and repeat the steps that trigger the issue.' },
        { name: 'Export the HAR file', text: 'Click the download icon, Export HAR (sanitized), and save the .har file.' },
        { name: 'Review before sharing', text: 'Search the file for tokens or personal data and share it only over a private channel.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 3. How to capture console logs
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-capture-console-logs',
    kind: 'guide',
    title: 'How to Capture Console Logs in Chrome (Save & Share)',
    description:
      'Learn how to capture console logs in Chrome: open the Console, preserve logs across reloads, save the console log to a file and share errors developers can use.',
    h1: 'How to capture console logs in Chrome',
    eyebrow: 'guide',
    intro:
      'Console errors are often the fastest route to the cause of a web bug. This guide shows how to open the Chrome Console, keep messages across page loads, save the console log to a file, and share errors in a form developers can act on.',
    primaryKeyword: 'how to capture console logs',
    keywords: [
      'save chrome console log',
      'share console errors',
      'export console log',
      'chrome console preserve log',
      'copy console errors',
      'javascript console log file',
      'browser console log for support',
    ],
    hero: 'console',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'How to capture console logs in Chrome',
            text: 'Press Ctrl+Shift+J (Windows, Linux) or Cmd+Option+J (Mac) to open the Console. Open Console settings (gear icon) and check **Preserve log**. Reproduce the problem, then right-click an empty area of the Console and choose **Save as...** to download a .log file with every message.',
          },
        ],
      },
      {
        heading: 'What the browser console shows',
        blocks: [
          {
            type: 'p',
            text: 'The Console in Chrome DevTools collects messages from the page: `console.log` output from the site\'s code, warnings, uncaught JavaScript errors with stack traces, failed resource loads, CORS and Content Security Policy violations, and deprecation notices. When a button does nothing or a page renders blank, the answer is usually a red error here.',
          },
          {
            type: 'table',
            head: ['Message level', 'Looks like', 'Include in a bug report?'],
            rows: [
              ['Error', 'Red, with a stack trace', 'Always'],
              ['Warning', 'Yellow', 'If it appears when the bug happens'],
              ['Info', 'Default color', 'Only if it relates to the failing action'],
              ['Verbose', 'Hidden by default', 'Only when a developer asks for it'],
            ],
          },
        ],
      },
      {
        heading: 'How to capture console logs, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Open the Console.** Press **Ctrl+Shift+J** on Windows and Linux or **Cmd+Option+J** on Mac. You can also press F12 and click the **Console** tab.',
              '**Turn on Preserve log.** Click the gear icon (Console settings) in the top-right of the Console panel and check **Preserve log**, so messages are not cleared when the page reloads or navigates.',
              '**Show all levels.** In the **Default levels** dropdown, make sure Errors, Warnings and Info are checked. Add Verbose only if asked.',
              '**Clear the Console.** Click the clear icon or press **Ctrl+L** (Cmd+K on Mac) so the log only contains the problem.',
              '**Reproduce the bug.** Repeat the exact steps that cause the problem while the Console stays open.',
              '**Expand the errors.** Click the arrow next to each red error to reveal its stack trace, which also gets included when you save.',
              '**Save the log.** Right-click an empty area of the Console and choose **Save as...**. Chrome downloads a plain-text `.log` file named after the site.',
              '**Share it with context.** Attach the file to your bug report along with the URL, the time and what you clicked.',
            ],
          },
          {
            type: 'p',
            text: 'To share a single error instead of the whole log, right-click the message and choose **Copy console message**, then paste it into your ticket inside a code block.',
          },
        ],
      },
      {
        heading: 'Other ways to export a console log',
        blocks: [
          {
            type: 'list',
            items: [
              '**Filter first, then save.** Type a word in the Console filter box or select only **Errors** before using Save as... to keep the file focused.',
              '**Show timestamps.** In DevTools **Settings > Preferences > Console**, enable **Show timestamps** so each message has a time you can match to server logs.',
              '**Capture from the moment you run it.** For long sessions, you can wrap the console methods and copy the results with the DevTools `copy()` helper:',
            ],
          },
          { type: 'code', lang: 'javascript', text: consoleSnippet },
          {
            type: 'p',
            text: 'That snippet only records messages logged after you run it and is lost on reload, so it is a debugging aid, not a replacement for Preserve log.',
          },
        ],
      },
      {
        heading: 'Reading common console errors',
        blocks: [
          {
            type: 'p',
            text: 'You do not need to be a developer to add useful context. Recognizing a few frequent errors helps you judge whether the message is related to your bug and what else to attach.',
          },
          {
            type: 'table',
            head: ['Error text starts with', 'Typical cause', 'Also attach'],
            rows: [
              ['`Uncaught TypeError: Cannot read properties of undefined`', 'Code expected data that was missing', 'The failing API request, if any'],
              ['`Failed to load resource: the server responded with a status of 500`', 'A server error on a request', 'A [HAR file](/guides/how-to-capture-har-file-chrome) or the request details'],
              ['`Access to fetch ... has been blocked by CORS policy`', 'Server does not allow requests from this origin', 'The page URL and the blocked request URL'],
              ['`Refused to load ... because it violates the Content Security Policy`', 'A script, font or image is blocked by site security rules', 'The exact blocked URL from the message'],
              ['`Uncaught (in promise)`', 'An async operation failed and nothing handled it', 'The steps that triggered it'],
              ['`ChunkLoadError` or `Loading chunk failed`', 'A new release was deployed while the tab was open', 'Whether a hard refresh fixes it'],
            ],
          },
          {
            type: 'p',
            text: 'Not every red message is your bug. Errors from browser extensions (URLs starting with `chrome-extension://`) and third-party analytics scripts are common noise. Retest in an incognito window with extensions disabled to rule them out, and mention that you did in your report.',
          },
          {
            type: 'p',
            text: 'The **Issues** panel (open it from the Console toolbar or the Command Menu) groups related problems such as cookie, mixed content and accessibility warnings. If a developer asks for "issues" rather than console errors, that is where to look.',
          },
        ],
      },
      {
        heading: 'Common mistakes when sharing console errors',
        blocks: [
          {
            type: 'list',
            items: [
              '**Screenshots of the Console.** Developers cannot search or copy text from an image, and stack traces are usually cut off. Save or copy the text instead.',
              '**Opening the Console too late.** Messages logged before DevTools was open may be missing. Open it, then reload and reproduce.',
              '**Missing Preserve log.** A redirect after a failed login clears the Console and the evidence with it.',
              '**Collapsed errors.** Expand stack traces before copying so file names and line numbers come along.',
              '**Leaking data.** Some apps log user details or tokens. Skim the file and remove anything sensitive before attaching it.',
              '**No network context.** A console error such as "Failed to fetch" makes more sense next to the failing request. Pair it with a [HAR file](/guides/how-to-capture-har-file-chrome).',
            ],
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Asking every tester or client to open DevTools, set Preserve log and save a file rarely works. [Bugmark](/debugging-tool) is a free Chrome extension that keeps console context automatically, so it is attached to the bug report the moment anyone captures a screenshot or recording.',
          },
          {
            type: 'list',
            items: [
              'Captures the **last 150 console messages**, plus JavaScript errors and unhandled promise rejections.',
              'No need to open DevTools before the bug happens.',
              'The same capture includes the network log, recorded steps to reproduce and environment details.',
              'Export as Markdown, CSV, a self-contained HTML report or PDF, or create a GitHub issue with the console errors included.',
            ],
          },
          { type: 'shot', screen: 'console', caption: 'Console messages and JavaScript errors attached to a Bugmark capture.' },
          {
            type: 'p',
            text: 'Logs stay in your browser until you choose to export them. See [how to write a bug report](/guides/how-to-write-a-bug-report) for what else to include. [Add Bugmark to Chrome — free](/install)',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I save the Chrome console log to a file?',
        a: 'Open DevTools with Ctrl+Shift+J or Cmd+Option+J, reproduce the problem, then right-click any empty area of the Console and choose Save as. Chrome saves a plain-text .log file containing the messages currently shown. Turn on Preserve log first if the problem involves a reload or redirect.',
      },
      {
        q: 'Why does the console clear when the page reloads?',
        a: 'By default, Chrome clears the Console on every navigation so each page starts fresh. To keep messages across reloads and redirects, open Console settings with the gear icon and check Preserve log. This is essential when capturing errors during login flows, form submissions or checkouts that move you to a new page.',
      },
      {
        q: 'How do I share a console error with a developer?',
        a: 'Copy the text rather than taking a screenshot. Right-click the error and choose Copy console message, or save the whole log with Save as. Paste the error into your bug report inside a code block, expand the stack trace first, and include the page URL, time and the steps that triggered it.',
      },
      {
        q: 'Can console logs contain sensitive information?',
        a: 'Yes. Some applications log user IDs, email addresses, API responses or even tokens during development. Before attaching a console log to a ticket or sending it to a vendor, skim it for personal data and credentials and remove anything that should not be shared outside your team.',
      },
      {
        q: 'How do I see console logs on a mobile device?',
        a: 'For Android, connect the device over USB, enable USB debugging, and open chrome://inspect on your desktop Chrome to inspect the tab and view its Console. For a quick check of responsive issues, you can also use the DevTools device toolbar on desktop, which emulates mobile viewports.',
      },
    ],
    related: [
      '/guides/how-to-capture-har-file-chrome',
      '/debugging-tool',
      '/guides/how-to-write-a-bug-report',
      '/web-developer-tools',
    ],
    updated: '2026-09-17',
    howTo: {
      name: 'How to capture console logs in Chrome',
      totalTime: 'PT2M',
      steps: [
        { name: 'Open the Console', text: 'Press Ctrl+Shift+J on Windows and Linux or Cmd+Option+J on Mac.' },
        { name: 'Enable Preserve log', text: 'Click the gear icon in the Console panel and check Preserve log.' },
        { name: 'Clear existing messages', text: 'Click the clear icon so only messages from the problem are captured.' },
        { name: 'Reproduce the bug', text: 'Repeat the steps that cause the problem while the Console is open.' },
        { name: 'Expand errors', text: 'Click the arrow beside each error to reveal its stack trace.' },
        { name: 'Save the log', text: 'Right-click an empty area of the Console and choose Save as to download a .log file.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Steps to reproduce template
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'steps-to-reproduce-template',
    kind: 'guide',
    title: 'Steps to Reproduce Template (With Examples)',
    description:
      'A copy-paste steps to reproduce template for bug reports, with good and bad STR examples, rules for writing reproduction steps and tips for intermittent bugs.',
    h1: 'Steps to reproduce template and examples',
    eyebrow: 'guide',
    intro:
      'Steps to reproduce (STR) are the part of a bug report developers read first and the part most often done badly. Use the template below, follow a few simple rules, and your bugs will stop coming back marked "cannot reproduce".',
    primaryKeyword: 'steps to reproduce template',
    keywords: [
      'steps to reproduce examples',
      'STR bug report',
      'reproduction steps',
      'how to write steps to reproduce',
      'steps to reproduce format',
      'repro steps',
      'bug reproduction steps template',
    ],
    hero: 'steps',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'What goes in steps to reproduce',
            text: 'Start with preconditions (account, starting URL, required data and browser). Then write numbered steps, one action each, using the exact labels on screen and the exact values you entered. Finish with the expected result, the actual result and how often it happens, such as "always" or "3 of 10 tries".',
          },
        ],
      },
      {
        heading: 'Steps to reproduce template',
        blocks: [
          {
            type: 'p',
            text: 'Copy this template into any issue tracker. Replace everything in angle brackets and delete lines that do not apply.',
          },
          { type: 'code', lang: 'text', text: strTemplate },
          {
            type: 'p',
            text: 'This format drops straight into the "Steps to reproduce" section of our full [bug report template](/guides/how-to-write-a-bug-report).',
          },
        ],
      },
      {
        heading: 'Steps to reproduce example',
        blocks: [
          {
            type: 'p',
            text: 'Here is the template filled in for a real-world permissions bug. Notice that a developer who has never used this screen could follow it exactly.',
          },
          { type: 'code', lang: 'text', text: strExample },
          {
            type: 'table',
            head: ['Weak step', 'Strong step'],
            rows: [
              ['"Go to settings"', '"Go to Settings > Team" (with the starting URL in preconditions)'],
              ['"Change someone\'s role"', '"Click the ... menu next to any member, then Change role"'],
              ['"Enter a date"', '"Enter 02/30/2026 in the Start date field"'],
              ['"Submit it"', '"Click Save"'],
              ['"It breaks"', '"No toast appears; PATCH /api/members/42 returns 403"'],
            ],
          },
        ],
      },
      {
        heading: 'How to write steps to reproduce',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Reproduce it twice from scratch.** Use a fresh tab or an incognito window so you know your cache, extensions or earlier actions are not the real cause.',
              '**Write the preconditions.** Note the account or role, starting URL, required data, feature flags, browser, OS and window size.',
              '**Write one action per step.** Each numbered line should be a single click, entry or navigation.',
              '**Use exact labels and values.** Quote buttons and menu items as they appear, and write the literal text, number or file you used.',
              '**Remove unnecessary steps.** Try again while skipping steps. If the bug still happens, delete them so the path is as short as possible.',
              '**End with expected and actual results.** Put them after the steps, on separate lines, with exact error text.',
              '**Add reproducibility.** Record how many attempts triggered it and whether it happens in other browsers.',
            ],
          },
          {
            type: 'callout',
            title: 'Test your steps',
            text: 'Hand your steps to a colleague who has not seen the bug, or follow them yourself in an incognito window without improvising. If either of you has to guess at any point, add the missing detail.',
          },
        ],
      },
      {
        heading: 'Steps to reproduce examples by bug type',
        blocks: [
          {
            type: 'p',
            text: 'Different kinds of bugs need different details in the preconditions and steps. Use this table to check that your reproduction steps include what matters most for the problem you found.',
          },
          {
            type: 'table',
            head: ['Bug type', 'Details that must be in the steps', 'Example step'],
            rows: [
              ['Form validation', 'Exact values typed in each field', '"Enter 12345678901 in Phone number and click Continue"'],
              ['Layout or visual', 'Window width, zoom level, browser, device', '"Resize the window to 390px wide (device toolbar, iPhone 12 Pro)"'],
              ['Permissions', 'Role and account type', '"Log in as a Viewer on the Free plan"'],
              ['Data or search', 'The specific record, filter or query', '"Search for O\'Brien in Customers"'],
              ['Timing or race condition', 'Speed of actions, network throttling', '"Double-click Pay within half a second"'],
              ['File upload', 'File type, size and name', '"Upload a 12 MB .heic image named photo 1.heic"'],
            ],
          },
          {
            type: 'p',
            text: 'For visual bugs, a numbered screenshot is often the clearest companion to written steps: add a numbered pin for each step directly on the image. For bugs across long pages, a [full page screenshot](/guides/full-page-screenshot-chrome) shows where each element sits.',
          },
          {
            type: 'p',
            text: 'Whatever the bug type, write steps in the imperative ("Click", "Enter", "Go to") and in the order the user performs them. Avoid "then I tried" narration; it reads like a story and hides the actual sequence of actions.',
          },
        ],
      },
      {
        heading: 'Intermittent bugs and common mistakes',
        blocks: [
          {
            type: 'p',
            text: 'Some bugs only appear under specific timing, data or network conditions. For those, record what you can: how many attempts out of how many failed, the exact time of each failure, the network speed, and any console errors or failed requests. A short screen recording and a [console log](/guides/how-to-capture-console-logs) are often more useful than perfect steps.',
          },
          {
            type: 'list',
            items: [
              '**Starting mid-flow.** "Click Save" means nothing if the reader does not know which page or data you started with.',
              '**Combining actions.** "Fill in the form and submit" hides which field value triggered the bug.',
              '**Missing test data.** Specific records, coupon codes or file types are often the real trigger. Include them, using test data rather than customer data.',
              '**Leaving out the environment.** A bug that only happens at mobile width or in one role is impossible to reproduce without that detail.',
              '**Mixing results into steps.** Keep observations in the expected and actual sections so the steps read as pure instructions.',
              '**Typing real passwords.** Write "log in as a test admin" rather than including credentials in the ticket.',
            ],
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Most people forget what they clicked by the time they write the ticket. [Bugmark](/qa-testing-tool) is a free Chrome extension that records reproduction steps for you in the background.',
          },
          {
            type: 'list',
            items: [
              'Keeps the **last 30 actions** in the tab: clicks with element labels, which field you typed in (never the typed text), selects, checkboxes, form submits and single-page app navigation.',
              'Steps are **editable before saving**, so you can remove noise or add a precondition.',
              'Each capture also includes the URL, browser, OS and viewport, plus console errors and network requests.',
              'Copy the report as Markdown for GitHub, Jira, Linear or Slack, export CSV, or create a GitHub issue with the steps included.',
            ],
          },
          { type: 'shot', screen: 'steps', caption: 'Bugmark turns your recent clicks and inputs into editable steps to reproduce.' },
          { type: 'shot', screen: 'githubDialog', caption: 'Send the steps, screenshot and failing requests straight to a GitHub issue.' },
          {
            type: 'p',
            text: 'No account needed, and captures stay in your browser. [Add Bugmark to Chrome — free](/install)',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What does STR mean in a bug report?',
        a: 'STR stands for steps to reproduce. It is the numbered list of actions someone must take, from a known starting point, to make a bug happen again. Along with the expected and actual results, it is the most important part of a bug report because developers need to see a problem before they can fix it.',
      },
      {
        q: 'How many steps to reproduce should a bug report have?',
        a: 'As few as possible while still reliably triggering the bug. Most good reports have between three and eight steps. If you have more than ten, try removing steps and reproducing again; often many of them are not needed. Long setup can move into a preconditions list above the numbered steps.',
      },
      {
        q: 'What should I write if a bug is not reproducible?',
        a: 'Say so honestly and describe what you were doing as precisely as you can. Include the time, URL, browser, account and any error messages, and mark reproducibility as "seen once" or "1 of 10 attempts". Attach any screenshots, recordings or logs you captured. Timestamps help developers match your report to server logs.',
      },
      {
        q: 'Should steps to reproduce include expected and actual results?',
        a: 'Yes, but as separate sections after the numbered steps rather than inside them. Keeping the steps as pure instructions makes them easy to follow, and the expected versus actual lines make it clear exactly what went wrong and what correct behavior looks like.',
      },
      {
        q: 'What are preconditions in steps to reproduce?',
        a: 'Preconditions describe the state that must exist before step one: which account or role you are logged in as, the starting URL, required data such as items in a cart, enabled feature flags, and the browser and device. Listing them separately keeps the numbered steps short and prevents failed reproductions.',
      },
    ],
    related: [
      '/guides/how-to-write-a-bug-report',
      '/qa-testing-tool',
      '/bug-reporting-tool',
      '/guides/how-to-capture-console-logs',
    ],
    updated: '2026-09-17',
    howTo: {
      name: 'How to write steps to reproduce',
      totalTime: 'PT5M',
      steps: [
        { name: 'Reproduce from scratch', text: 'Trigger the bug twice from a fresh tab or incognito window to confirm the path.' },
        { name: 'List preconditions', text: 'Note the account or role, starting URL, required data, browser, OS and window size.' },
        { name: 'Write one action per step', text: 'Number each step and limit it to a single click, entry or navigation.' },
        { name: 'Use exact labels and values', text: 'Quote on-screen labels and the literal values you entered.' },
        { name: 'Trim the steps', text: 'Remove any step that is not needed to trigger the bug.' },
        { name: 'Add expected and actual results', text: 'Describe what should happen and what actually happens, with exact error text.' },
        { name: 'Note reproducibility', text: 'Record how often the bug happens and in which browsers you tested.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Full page screenshot in Chrome
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'full-page-screenshot-chrome',
    kind: 'guide',
    title: 'How to Take a Full Page Screenshot in Chrome',
    description:
      'Take a full page screenshot in Chrome without an extension using DevTools, capture mobile sizes with the device toolbar, and fix scrolling screenshot bugs.',
    h1: 'How to take a full page screenshot in Chrome',
    eyebrow: 'guide',
    intro:
      'Chrome can capture an entire scrolling page as one image without installing anything. It is just hidden inside DevTools. This guide covers the built-in command, mobile-size captures, and what to do when the result looks wrong.',
    primaryKeyword: 'how to take a full page screenshot in Chrome',
    keywords: [
      'full page screenshot without extension',
      'capture full size screenshot devtools',
      'scrolling screenshot chrome',
      'chrome full page screenshot',
      'screenshot entire webpage chrome',
      'capture node screenshot',
      'mobile full page screenshot chrome',
    ],
    hero: 'captureMenu',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'Full page screenshot in Chrome',
            text: 'Open DevTools with F12 or Cmd+Option+I, then press Ctrl+Shift+P (Cmd+Shift+P on Mac) to open the Command Menu. Type "screenshot", choose **Capture full size screenshot** and press Enter. Chrome saves a PNG of the entire page, top to bottom, to your Downloads folder.',
          },
        ],
      },
      {
        heading: 'How to take a full page screenshot without an extension',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Open the page** and wait until it has fully loaded. Scroll to the bottom and back up once so lazy-loaded images appear.',
              '**Open DevTools.** Press **F12** or **Ctrl+Shift+I** on Windows and Linux, **Cmd+Option+I** on Mac, or right-click and choose **Inspect**.',
              '**Open the Command Menu.** Press **Ctrl+Shift+P** on Windows and Linux or **Cmd+Shift+P** on Mac. Make sure the DevTools window is focused.',
              '**Type "screenshot".** A list of screenshot commands appears.',
              '**Choose Capture full size screenshot** and press Enter.',
              '**Find the PNG** in your Downloads folder. It is named after the site and can be very tall on long pages.',
            ],
          },
          {
            type: 'p',
            text: 'The window width stays the same, so the screenshot shows the page at your current desktop layout. Dock DevTools to the bottom, or undock it into a separate window, if you want the full browser width.',
          },
        ],
      },
      {
        heading: 'Chrome\'s screenshot commands compared',
        blocks: [
          {
            type: 'table',
            head: ['Command', 'What it captures', 'Best for'],
            rows: [
              ['Capture full size screenshot', 'The entire scrollable page', 'Landing pages, long articles, design reviews'],
              ['Capture screenshot', 'The visible viewport only', 'Showing what a user sees without scrolling'],
              ['Capture area screenshot', 'A region you drag to select', 'Cropping to one component'],
              ['Capture node screenshot', 'The element selected in the Elements panel', 'A single card, table or modal, even taller than the screen'],
            ],
          },
          {
            type: 'p',
            text: 'For **Capture node screenshot**, select the element in the **Elements** panel first. You can also right-click the element node there and choose the screenshot option from the context menu.',
          },
        ],
      },
      {
        heading: 'How to screenshot a single element',
        blocks: [
          {
            type: 'p',
            text: 'Sometimes you only need one component, such as a pricing table, a modal or a long sidebar, without cropping by hand. **Capture node screenshot** captures the element at its full size, even when part of it is scrolled out of view.',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              'Right-click the element on the page and choose **Inspect**. DevTools opens with the element highlighted in the **Elements** panel.',
              'If the wrong node is selected, move up or down the tree until the blue page highlight covers exactly the area you want.',
              'Press **Ctrl+Shift+P** (Cmd+Shift+P on Mac), type "node" and choose **Capture node screenshot**. You can also right-click the node in the Elements panel and pick the screenshot option.',
              'Open the PNG from your Downloads folder. It is cropped to the element\'s box, including any padding but not its margin.',
            ],
          },
          {
            type: 'p',
            text: 'Tip: to get a little breathing room around the element, temporarily add padding to it in the **Styles** pane before capturing.',
          },
        ],
      },
      {
        heading: 'Full page screenshots at mobile and tablet sizes',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Open DevTools and click **Toggle device toolbar** (the phone and tablet icon), or press **Ctrl+Shift+M** (Cmd+Shift+M on Mac).',
              'Choose a device from the **Dimensions** dropdown, or select **Responsive** and type a width and height.',
              'Click the **More options** menu (three dots) at the right of the device toolbar.',
              'Choose **Capture full size screenshot**. Select **Show device frame** first if you want the phone frame in the image (frames are available for some devices only).',
            ],
          },
          {
            type: 'p',
            text: 'To show one layout at several breakpoints, repeat the capture for each size and place the images side by side.',
          },
        ],
      },
      {
        heading: 'Other ways to capture a scrolling screenshot',
        blocks: [
          {
            type: 'p',
            text: 'DevTools is the most accurate built-in option, but it is not the only one. Here is how the alternatives compare for capturing an entire web page:',
          },
          {
            type: 'table',
            head: ['Method', 'Full page?', 'Trade-offs'],
            rows: [
              ['DevTools: Capture full size screenshot', 'Yes', 'Built in and pixel-accurate; no annotation; misses inner scroll areas'],
              ['Print > Save as PDF', 'Yes, split into pages', 'Uses print styles, so layout, backgrounds and sticky elements often change'],
              ['Windows Snipping Tool / macOS Screenshot', 'No, visible screen only', 'Quick for one area; you must stitch images manually'],
              ['Zooming out, then a normal screenshot', 'Sometimes', 'Changes responsive layout and makes text unreadable'],
              ['Screenshot extension', 'Yes', 'Adds annotation and stitching; check what data the extension uploads'],
            ],
          },
          {
            type: 'p',
            text: 'If the screenshot is going into a bug report, a full page image alone is rarely enough. Circle the problem area, add the page URL and your window size, and include console errors when something is broken rather than just misaligned. Our guide on [how to write a bug report](/guides/how-to-write-a-bug-report) lists what else developers need.',
          },
          {
            type: 'p',
            text: 'For design reviews, capture the same page at consistent widths every time, for example 390px, 768px and 1440px, so reviewers can compare versions and spot regressions between releases. Collecting client feedback on a whole site? See our [website feedback tool](/website-feedback-tool) page.',
          },
        ],
      },
      {
        heading: 'Troubleshooting scrolling screenshots',
        blocks: [
          {
            type: 'list',
            items: [
              '**Blank or gray sections:** images were lazy-loaded. Scroll through the whole page before capturing.',
              '**Only part of the page is captured:** the site scrolls inside a container (common in dashboards and single-page apps), not the page itself. DevTools captures the document height, so use **Capture node screenshot** on the scrolling container, or temporarily remove its height limit in the Styles pane.',
              '**Sticky headers or cookie banners in odd places:** fixed elements are drawn once at their position. Dismiss banners first, or hide the element in the Elements panel (select it and press **H**).',
              '**Animations or carousels mid-transition:** wait for them to settle, or pause animations in the **Animations** drawer.',
              '**Huge or failed files:** very long pages can exceed image size limits. Capture sections with **Capture area screenshot** instead.',
              '**Sensitive data visible:** blur or crop names, emails and account numbers before sharing, especially in bug reports sent outside your team.',
            ],
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'DevTools is great for a one-off image, but it cannot annotate, redact, or handle pages that scroll inside panels. [Bugmark](/screenshot-annotation-tool) is a free Chrome extension that captures and marks up screenshots in one step.',
          },
          {
            type: 'list',
            items: [
              '**Full page capture** with scroll-and-stitch, including inner scrolling panels and SPA containers.',
              'Other modes: visible area, a single element, and a **3-second delayed capture** for hover states, menus and tooltips.',
              '**Mobile, tablet and desktop** in one image: renders the page at 390x844, 768x1024 and 1440x900 side by side.',
              'Annotate with arrows, boxes, text, numbered pins and a **redact** tool that pixelates sensitive details.',
              'Start with **Alt+Shift+S** and every capture also carries console errors, network requests and steps to reproduce.',
            ],
          },
          { type: 'shot', screen: 'captureMenu', caption: 'Choose visible area, full page, element, delayed or breakpoint capture.' },
          { type: 'shot', screen: 'breakpoints', caption: 'One capture renders the page at mobile, tablet and desktop widths side by side.' },
          {
            type: 'p',
            text: 'Captures are stored locally in your browser. [Add Bugmark to Chrome — free](/install)',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can Chrome take a full page screenshot without an extension?',
        a: 'Yes. Open DevTools, press Ctrl+Shift+P or Cmd+Shift+P to open the Command Menu, type screenshot and choose Capture full size screenshot. Chrome saves a PNG of the whole scrollable page to your Downloads folder. The same option is available in the device toolbar\'s More options menu for mobile sizes.',
      },
      {
        q: 'Why is my full page screenshot cut off?',
        a: 'The page probably scrolls inside a container element rather than the document itself, which is common in web apps and dashboards. DevTools only captures the document height. Select the scrolling container in the Elements panel and use Capture node screenshot, or use a tool that stitches inner scrolling panels.',
      },
      {
        q: 'Where does Chrome save DevTools screenshots?',
        a: 'Chrome saves DevTools screenshots as PNG files in your default download location, usually the Downloads folder. If Chrome is set to ask where to save each file, you will see a save dialog instead. The file name includes the site name so it is easy to find.',
      },
      {
        q: 'How do I take a full page screenshot of a mobile view?',
        a: 'Open DevTools, press Ctrl+Shift+M or Cmd+Shift+M to turn on the device toolbar, and choose a device or enter a custom size. Then open the three-dot More options menu on the device toolbar and choose Capture full size screenshot. Enable Show device frame first if you want the phone outline.',
      },
      {
        q: 'Why are images missing from my full page screenshot?',
        a: 'Many sites lazy-load images only when they scroll into view, so parts of the page below the fold have not loaded yet when you capture. Scroll slowly to the bottom of the page and back to the top, wait a moment for images to finish loading, then run Capture full size screenshot again.',
      },
    ],
    related: [
      '/screenshot-annotation-tool',
      '/guides/how-to-write-a-bug-report',
      '/website-feedback-tool',
      '/web-developer-tools',
    ],
    updated: '2026-09-17',
    howTo: {
      name: 'How to take a full page screenshot in Chrome',
      totalTime: 'PT1M',
      steps: [
        { name: 'Load the full page', text: 'Open the page and scroll to the bottom and back so lazy-loaded images appear.' },
        { name: 'Open DevTools', text: 'Press F12, Ctrl+Shift+I or Cmd+Option+I.' },
        { name: 'Open the Command Menu', text: 'Press Ctrl+Shift+P on Windows and Linux or Cmd+Shift+P on Mac.' },
        { name: 'Search for screenshot', text: 'Type screenshot to list the capture commands.' },
        { name: 'Capture full size screenshot', text: 'Select Capture full size screenshot and press Enter.' },
        { name: 'Find the PNG', text: 'Open the downloaded PNG file in your Downloads folder.' },
      ],
    },
  },
];
