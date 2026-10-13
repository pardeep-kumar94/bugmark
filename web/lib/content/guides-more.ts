import type { ContentPage } from './types';

const CWS = 'https://chromewebstore.google.com/detail/pmddndflbglmpliiinfhhecmfkmfffkj';

const plainReport = `Subject: [Bug] "Pay now" button does nothing on the checkout page

Where: https://shop.example.com/checkout
When: Today, 14:32 (UK time)

What I did:
1. Added the blue hoodie (size M) to the cart.
2. Went to Checkout and filled in the delivery form.
3. Clicked "Pay now".

What I expected:
The payment page to open.

What happened instead:
The button greyed out for a second, then nothing happened.
No error message was shown. I tried 3 times with the same result.

How often: Every time (3 of 3)
My setup: Chrome 156 on Windows 11, laptop screen, logged in as jane@example.com
Also tried: Incognito window (same problem), Edge (same problem)

Attached: screenshot with the button circled, 20-second screen recording`;

const curlBash = String.raw`curl --url 'https://api.example.com/v1/orders?limit=20' \
  -H 'accept: application/json' \
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIs...' \
  -b 'session_id=8f2c41d0; theme=dark' \
  -H 'content-type: application/json' \
  -H 'origin: https://app.example.com' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...' \
  --data-raw '{"status":"open"}'`;

const curlCmd = String.raw`curl --url ^"https://api.example.com/v1/orders?limit=20^" ^
  -H ^"accept: application/json^" ^
  -H ^"authorization: Bearer eyJhbGciOiJIUzI1NiIs...^" ^
  -b ^"session_id=8f2c41d0; theme=dark^"`;

const curlReplay = String.raw`# Show response headers and status line, keep the body
curl -i --url 'https://api.example.com/v1/orders?limit=20' -H 'accept: application/json' ...

# Verbose: TLS, redirects and every header sent and received
curl -v --url 'https://api.example.com/v1/orders?limit=20' ...

# Pretty-print a JSON response (needs jq)
curl -s --url 'https://api.example.com/v1/orders?limit=20' ... | jq .

# Replay the same request against your local API
curl --url 'http://localhost:3000/v1/orders?limit=20' ...

# Windows PowerShell: call curl.exe, not the curl alias
curl.exe --url "https://api.example.com/v1/orders?limit=20" -H "accept: application/json"`;

const curlRedact = String.raw`# macOS: paste the copied command into a file (Linux: wl-paste or xclip -o)
pbpaste > request.sh

# Mask cookies and common auth headers, keep everything else
perl -pe 's/(-b|--cookie) \x27[^\x27]*\x27/$1 \x27[redacted]\x27/g;
          s/(-H \x27(?:authorization|cookie|x-api-key|x-csrf-token|x-xsrf-token): )[^\x27]*\x27/$1\[redacted]\x27/gi' \
  request.sh > request.redacted.sh

# Double-check nothing obvious is left
grep -Eio '(token|secret|password|session|bearer)[^ ]{0,30}' request.redacted.sh`;

const fetchExample = `fetch("https://api.example.com/v1/orders?limit=20", {
  "headers": {
    "accept": "application/json",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
    "content-type": "application/json"
  },
  "referrer": "https://app.example.com/",
  "body": "{\\"status\\":\\"open\\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});`;

export const moreGuidePages: ContentPage[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. How to report a bug on a website
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-report-a-bug-on-a-website',
    kind: 'guide',
    title: 'How to Report a Bug on a Website (Non-Tech Guide)',
    description:
      'How to report a bug on a website without being technical: quick checks first, what to include, a plain-English message template and where to send the report.',
    h1: 'How to report a bug on a website (no technical skills needed)',
    eyebrow: 'guide',
    intro:
      "You found something broken on a website and want it fixed. You do not need to know any code to write a report that gets acted on. This guide covers the quick checks to do first, the six things every report needs, a plain-English template you can paste into an email, and who to send it to.",
    primaryKeyword: 'how to report a bug on a website',
    keywords: [
      'report a website problem',
      'how to report a website error',
      'report a bug to a developer',
      'website bug report example',
      'client website feedback',
      'report broken website',
      'how to report a bug as a non developer',
      'website issue report template',
    ],
    hero: 'heroCapture',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'How to report a bug on a website',
            text: 'First reload the page and try again in an Incognito window to rule out your browser. Then send the site owner a message with: the page URL, what you did step by step, what you expected, what happened instead, a screenshot or short recording, and your browser and device. Send one message per problem.',
          },
        ],
      },
      {
        heading: 'Before you report: five quick checks',
        blocks: [
          {
            type: 'p',
            text: 'A couple of minutes of checking saves a lot of back and forth. These checks tell you, and the person fixing it, whether the problem is in the website or only on your machine.',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              '**Reload without the cache.** Press **Ctrl+Shift+R** on Windows, Linux or ChromeOS, or **Cmd+Shift+R** on Mac. Old cached files after a website update are a common cause of odd behavior.',
              '**Try an Incognito window.** Press **Ctrl+Shift+N** (Cmd+Shift+N on Mac) and repeat what you did. Incognito runs without your cookies and, by default, without most extensions. If the bug disappears, mention that in your report.',
              '**Try another browser or device.** Edge, Firefox, Safari or your phone. "Only happens in Chrome" is a very useful clue.',
              '**Check your Chrome version.** Open the three-dot menu, then **Help > About Google Chrome**. Install any pending update, relaunch and test again. Note the version number for your report.',
              '**Check for known outages.** Many services have a status page (often status.companyname.com) or post updates on social media. If the whole site is down, a report is not needed.',
            ],
          },
          {
            type: 'p',
            text: 'If the problem is still there after these checks, it is almost certainly worth reporting. Write down what you tried, because "same problem in Incognito and Edge" saves the developer from asking.',
          },
        ],
      },
      {
        heading: 'What to include in a website bug report',
        blocks: [
          {
            type: 'p',
            text: 'Developers need to see the bug happen before they can fix it. Everything below helps them do that without coming back to you with questions.',
          },
          {
            type: 'table',
            head: ['Include', 'How to get it', 'Example'],
            rows: [
              ['The exact page', 'Click the address bar and copy the full URL', 'https://shop.example.com/checkout'],
              ['What you did', 'List your clicks and entries in order', '1. Added hoodie to cart 2. Clicked Checkout 3. Clicked Pay now'],
              ['What you expected', 'One sentence', 'The payment page should open'],
              ['What happened instead', 'Describe it and copy any error text word for word', 'Button greyed out, then nothing happened'],
              ['A picture or video', 'Screenshot with the problem circled, or a short recording', 'Screenshot with an arrow pointing at the button'],
              ['Your setup', 'Browser and version, device, and whether you were logged in', 'Chrome 156, Windows 11, logged in'],
            ],
          },
          {
            type: 'p',
            text: 'Two extras make a report much stronger: **how often** it happens ("every time" or "2 out of 5 tries") and **when** it happened, with your time zone. The time lets developers find matching entries in their server logs.',
          },
          {
            type: 'p',
            text: 'Need a screenshot of a long page? See [how to take a full page screenshot in Chrome](/guides/full-page-screenshot-chrome). If the bug involves movement, like a menu that flickers or a form that resets, a short video is clearer, and [how to screen record in Chrome](/guides/how-to-screen-record-in-chrome) shows the built-in options on every computer.',
          },
        ],
      },
      {
        heading: 'How to report a bug on a website, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Make it happen again.** Go back to the page and repeat what you did, slowly. Notice exactly which click or entry triggers the problem.',
              '**Capture it.** Take a screenshot at the moment it goes wrong and draw a circle or arrow on the problem. For anything that moves or takes several steps, record a 10 to 30 second video instead.',
              '**Copy the URL.** Click the address bar, select everything and copy it. "The checkout page" could mean several different pages.',
              '**Write what you did as numbered steps.** Use the words you see on screen: "Clicked **Pay now**", not "clicked the button".',
              '**Write expected and actual results on separate lines.** If an error message appeared, copy the text exactly or include it in the screenshot.',
              '**Add your browser, device and the time.** Plus anything you already tried, such as Incognito or another browser.',
              '**Give it a clear subject line.** Say where and what: "Pay now button does nothing on checkout", not "Website broken!!".',
              '**Send it to the right place** (see below) and keep one problem per message.',
            ],
          },
          { type: 'shot', screen: 'annotate', caption: 'An annotated screenshot points the developer at the exact problem, with no guessing.' },
        ],
      },
      {
        heading: 'A plain-English bug report template',
        blocks: [
          {
            type: 'p',
            text: 'Copy this into an email, a support form, Slack or a project tool. It works for clients reporting to an agency, staff reporting to an internal team, and customers reporting to a company.',
          },
          { type: 'code', lang: 'text', text: plainReport },
          {
            type: 'p',
            text: 'If you are reporting into a developer tool such as GitHub, Jira or Linear, use the fuller [bug report template](/guides/how-to-write-a-bug-report), which adds fields like severity and console errors. For tricky bugs, our [steps to reproduce template](/guides/steps-to-reproduce-template) shows how to write steps anyone can follow.',
          },
        ],
      },
      {
        heading: 'Where to send your bug report',
        blocks: [
          {
            type: 'table',
            head: ['Your situation', 'Where to report it'],
            rows: [
              ['You are a client and an agency or freelancer built the site', 'The feedback channel they gave you: a project board, shared tracker or email thread. Ask if unsure.'],
              ['You use an online service or app', 'The in-app help or chat button, the support page, or the support email in the footer'],
              ['You work for the company', 'Your internal bug tracker or the team channel for that product'],
              ['It is an open-source project', 'The project\'s GitHub or GitLab issues page, after searching for an existing report'],
              ['It is a security or privacy problem', 'Privately, never in public. Look for a security page or /.well-known/security.txt on the site'],
              ['You cannot find any contact', 'The site\'s contact form, or the email in its privacy policy or legal notice'],
            ],
          },
          {
            type: 'callout',
            title: 'Security bugs are different',
            text: 'If you can see other people\'s data, change prices, or log in as someone else, do not post details in public reviews, social media or open issue trackers. Report privately to the site owner, include only what you saw, and do not keep testing the weakness.',
          },
        ],
      },
      {
        heading: 'Tips for clients, PMs and QA testers',
        blocks: [
          {
            type: 'list',
            items: [
              '**One problem per report.** Five issues in one email turn into one ticket that never closes. Separate reports can be fixed and confirmed one at a time.',
              '**Separate bugs from change requests.** "The button does nothing" is a bug. "Make the button green" is a change. Label them so the team can prioritize.',
              '**Say how much it matters.** "Customers cannot pay" and "a typo on the About page" need very different urgency. Describe the impact rather than writing "URGENT".',
              '**Name the device for layout problems.** Something that looks broken on your phone may be fine on a laptop. Mention the phone model or window size.',
              '**Leave out passwords.** Write "logged in as my admin account" instead of sharing credentials, and blur personal or payment details in screenshots.',
              '**Reply when it is fixed.** A quick "confirmed fixed" or "still happening" closes the loop and keeps the tracker accurate.',
            ],
          },
          {
            type: 'p',
            text: 'Collecting feedback from several reviewers on a whole site? Our [website feedback tool](/website-feedback-tool) page covers that workflow.',
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'The manual method works, but non-technical reporters rarely remember every detail, and developers usually need more than a screenshot. [Bugmark](/bug-reporting-tool) is a Chrome extension that gathers the details automatically when you capture a bug.',
          },
          {
            type: 'list',
            items: [
              '**Annotated screenshot or recording:** arrows, boxes, numbered pins, text and a redact tool, or a tab recording with voice narration up to 5 minutes.',
              '**Steps to reproduce, recorded automatically:** the last 30 actions in the tab (clicks with element labels, which fields were typed in but never the text). You can edit them before saving.',
              '**The technical part, handled for you:** the last 150 console messages and the last 150 network requests are attached, with passwords, tokens and cookies masked as `[redacted]`.',
              '**Environment:** URL, page title, browser, OS, viewport, pixel ratio and scroll position.',
              '**Easy to send:** export a self-contained HTML report that opens in any browser, PDF, CSV or Markdown, or create a GitHub issue directly.',
            ],
          },
          { type: 'shot', screen: 'reportItem', caption: 'One Bugmark report holds the screenshot, page details, steps and failed requests.' },
          {
            type: 'p',
            text: 'Bugmark is free to try with every feature unlocked: the free version keeps up to 2 saved reports at a time, and a one-time $15 payment removes the limit. No subscription and no account, and captures stay in your browser. [Add Bugmark to Chrome](' + CWS + ')',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I report a bug on a website if I am not technical?',
        a: 'Send the site owner a short message with the page URL, the steps you took, what you expected, what happened instead, a screenshot or short recording, and your browser and device. You do not need to understand the cause. Clear, specific details are what developers need to find and fix the problem.',
      },
      {
        q: 'Who do I report a website bug to?',
        a: 'Report it to whoever runs the site. For a service you use, try the in-app help button, the support page or the support email in the footer. Clients should use the channel their agency set up. Open-source projects usually accept reports on GitHub. Security problems should always be reported privately.',
      },
      {
        q: 'How do I find my browser version for a bug report?',
        a: 'In Chrome, click the three-dot menu at the top right, then Help and About Google Chrome. The version number appears under the Google Chrome heading. Include it with your operating system, such as Windows 11 or macOS, and the device you used.',
      },
      {
        q: 'Should I include a screenshot or a video?',
        a: 'Use a screenshot for problems you can see in a single moment, such as a wrong price, broken layout or error message, and circle the problem. Use a short video for anything involving movement or several steps, such as a menu that flickers or a form that resets after you click submit.',
      },
      {
        q: 'What if the bug only happened once?',
        a: 'Report it anyway and say it happened once. Include the exact time and time zone, the URL, what you were doing and any error text you saw. Developers can often match the time to their server logs. Mention whether you tried again and what happened.',
      },
    ],
    related: [
      '/guides/how-to-write-a-bug-report',
      '/guides/steps-to-reproduce-template',
      '/guides/how-to-screen-record-in-chrome',
      '/website-feedback-tool',
      '/bug-reporting-tool',
    ],
    updated: '2026-10-13',
    howTo: {
      name: 'How to report a bug on a website',
      totalTime: 'PT10M',
      steps: [
        { name: 'Rule out your browser', text: 'Reload without the cache and try again in an Incognito window or another browser.' },
        { name: 'Reproduce the bug', text: 'Repeat what you did slowly and note exactly which action triggers the problem.' },
        { name: 'Capture it', text: 'Take an annotated screenshot or record a short video of the problem happening.' },
        { name: 'Copy the URL', text: 'Copy the full address of the page from the address bar.' },
        { name: 'Write the steps', text: 'List what you did as numbered steps using the labels shown on screen.' },
        { name: 'Describe expected and actual results', text: 'Say what should have happened and what happened instead, copying any error text exactly.' },
        { name: 'Add your setup', text: 'Include your browser and version, device, the time it happened and anything you already tried.' },
        { name: 'Send it to the right place', text: 'Send one report per problem to the site owner\'s support or feedback channel, privately for security issues.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Copy as cURL in Chrome
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'copy-as-curl-chrome',
    kind: 'guide',
    title: 'Copy as cURL in Chrome DevTools: Replay Any Request',
    description:
      'How to copy as cURL in Chrome DevTools, choose cURL (bash) or cmd on Windows, replay requests in a terminal, use Copy as fetch and strip secrets before sharing.',
    h1: 'How to copy a request as cURL in Chrome',
    eyebrow: 'guide',
    intro:
      "Chrome can turn any request in the Network panel into a ready-to-run cURL command, with the same URL, method, headers, cookies and body the page sent. It is the fastest way to replay a failing API call outside the browser or hand it to a backend developer. Here is how to do it, which variant to pick, and how to remove secrets first.",
    primaryKeyword: 'copy as cURL Chrome',
    keywords: [
      'chrome devtools copy as curl',
      'copy as curl bash vs cmd',
      'copy as fetch chrome',
      'replay network request curl',
      'copy request from network tab',
      'copy all as curl',
      'curl from browser request',
      'copy as powershell chrome',
    ],
    hero: 'networkPayload',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'Copy as cURL in Chrome',
            text: 'Open DevTools (F12, or Cmd+Option+I on Mac), select the **Network** panel and reload or repeat the action. Right-click the request in the **Name** column, hover over **Copy** and choose **Copy as cURL**. On Windows, choose **Copy as cURL (bash)** for Git Bash or WSL, or **Copy as cURL (cmd)** for Command Prompt. Paste into a terminal and press Enter.',
          },
        ],
      },
      {
        heading: 'How to copy as cURL, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Open DevTools** on the page that makes the request: **F12** or **Ctrl+Shift+I** on Windows and Linux, **Cmd+Option+I** on Mac.',
              '**Select the Network panel.** If it is hidden, click the `>>` overflow arrow in the tab bar, or press Ctrl+Shift+P (Cmd+Shift+P) and type "network".',
              '**Trigger the request.** The panel only records while DevTools is open, so reload the page or repeat the click or form submit. Check **Preserve log** if the action redirects.',
              '**Find the request.** Click **Fetch/XHR** in the filter bar to hide images and scripts, or type part of the URL in the filter box. Failed requests show their status in red.',
              '**Right-click the request** in the **Name** column and hover over **Copy**.',
              '**Choose the format.** **Copy as cURL** on Mac and Linux. On Windows, **Copy as cURL (bash)** or **Copy as cURL (cmd)**. The command goes to your clipboard.',
              '**Paste and run it** in a terminal. You should get the same response the browser received.',
            ],
          },
          {
            type: 'p',
            text: 'The same **Copy** submenu has **Copy all as cURL**, which copies every request in the list as a chain of commands. With a filter active it becomes **Copy all listed as cURL**. Requests to `blob:` URLs cannot be copied because they only exist inside the browser.',
          },
        ],
      },
      {
        heading: 'What the copied command contains',
        blocks: [
          {
            type: 'p',
            text: 'A copied command for a JSON API call in current Chrome looks like this (shortened):',
          },
          { type: 'code', lang: 'bash', text: curlBash },
          {
            type: 'table',
            head: ['Part', 'What it is', 'Watch out for'],
            rows: [
              ['`--url`', 'The full request URL, including query string', 'Tokens passed as query parameters. Older Chrome versions put the URL straight after `curl`; both forms work'],
              ['`-H`', 'Every request header the browser sent', '`authorization`, API keys and CSRF tokens are copied as-is'],
              ['`-b`', 'The cookies sent with the request', 'Session cookies let anyone with the command act as you'],
              ['`--data-raw`', 'The request body for POST, PUT and PATCH', 'Form fields, passwords and personal data'],
              ['`-X`', 'The method, added when it cannot be inferred', 'Rarely sensitive'],
            ],
          },
          {
            type: 'p',
            text: 'Chrome leaves out `Accept-Encoding` so cURL does not print compressed bytes, and drops headers cURL sets itself, such as `Host`. Everything else is a faithful copy of what the page sent.',
          },
        ],
      },
      {
        heading: 'cURL (bash) vs cURL (cmd) vs PowerShell',
        blocks: [
          {
            type: 'p',
            text: 'Mac and Linux show a single **Copy as cURL** option. Windows shows two, because Command Prompt cannot read the single-quote and backslash syntax bash uses.',
          },
          {
            type: 'table',
            head: ['Menu option', 'Paste it into', 'Quoting style'],
            rows: [
              ['Copy as cURL', 'Terminal on macOS or Linux (bash, zsh)', 'Single quotes, `\\` line breaks'],
              ['Copy as cURL (bash)', 'Git Bash, WSL, or sharing with Mac and Linux users', 'Single quotes, `\\` line breaks'],
              ['Copy as cURL (cmd)', 'Windows Command Prompt', '`^"` quoting, `^` line breaks'],
              ['Copy as PowerShell', 'PowerShell', '`Invoke-WebRequest` with a web session for cookies'],
            ],
          },
          { type: 'code', lang: 'bat', text: curlCmd },
          {
            type: 'callout',
            title: 'Pasting into PowerShell?',
            text: 'In Windows PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`, so a bash-style command fails with confusing errors. Use **Copy as PowerShell** instead, or type `curl.exe` in place of `curl`. Windows 10 and 11 include curl.exe.',
          },
        ],
      },
      {
        heading: 'Replaying and editing the request',
        blocks: [
          {
            type: 'p',
            text: 'Once the command runs, add flags to see more and edit any part to test a theory. Keep the headers from the original command where the examples show `...`.',
          },
          { type: 'code', lang: 'bash', text: curlReplay },
          {
            type: 'list',
            items: [
              '**Change one thing at a time.** Edit a field in `--data-raw` or a query parameter to find the input that triggers a 400 or 500.',
              '**Point it at another environment.** Swap the host for staging or `localhost` to check whether a fix works with the exact payload from production.',
              '**Got 401 or 403 on replay?** The session or CSRF token has expired. Copy the request again right after reproducing.',
              '**Need to replay in the browser instead?** Right-click a request and choose **Resend** (called **Replay XHR** in older Chrome), or **Edit and resend as fetch**, which puts an editable fetch call in the Console.',
            ],
          },
        ],
      },
      {
        heading: 'Copy as fetch and Copy as fetch (Node.js)',
        blocks: [
          {
            type: 'p',
            text: 'The **Copy** submenu also offers **Copy as fetch**, which produces a JavaScript `fetch()` call you can paste into the Console on the same site:',
          },
          { type: 'code', lang: 'javascript', text: fetchExample },
          {
            type: 'table',
            head: ['Option', 'Cookies', 'Best for'],
            rows: [
              ['Copy as fetch', 'Not in the code; `credentials: "include"` makes the browser send its own', 'Re-running a call in the Console on the same origin, or in a test'],
              ['Copy as fetch (Node.js)', 'Included as a `cookie` header', 'Scripts and reproductions that run outside the browser'],
              ['Copy as cURL', 'Included with `-b`', 'Terminals, backend developers, API clients that import cURL'],
            ],
          },
          {
            type: 'p',
            text: 'Browser fetch cannot set some headers, such as `user-agent` and `cookie`, so Chrome leaves them out of the browser version. An `authorization` header is still copied, so check it before sharing.',
          },
        ],
      },
      {
        heading: 'Strip secrets before you share a cURL command',
        blocks: [
          {
            type: 'callout',
            title: 'A copied cURL command is a working login',
            text: 'Unlike the sanitized HAR export, Copy as cURL includes your cookies and authorization headers. Anyone who runs the command may be able to act as you until the session expires. Never paste an unedited command into a public issue, forum or shared channel.',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              'Replace the `-b` cookie value with `[redacted]`, or delete the line if the request does not need a session.',
              'Replace `authorization`, `x-api-key`, `x-csrf-token` and similar header values.',
              'Check the URL for `token=`, `key=` or `session=` parameters.',
              'Read the `--data-raw` body for passwords, card numbers and personal data.',
              'If you already shared a live command, log out or revoke the token so the session stops working.',
            ],
          },
          {
            type: 'p',
            text: 'For bash-format commands, this masks the most common values automatically. Commands that use `$\'...\'` quoting still need a manual check:',
          },
          { type: 'code', lang: 'bash', text: curlRedact },
          {
            type: 'p',
            text: 'Sharing a whole session rather than one request? A sanitized HAR file is safer: see [how to capture a HAR file in Chrome](/guides/how-to-capture-har-file-chrome). Pair the request with the matching error from the [console log](/guides/how-to-capture-console-logs) and it usually explains the failure on its own.',
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Copy as cURL needs DevTools open before the request happens, and every command needs a manual secrets check. [Bugmark](/network-request-logger) is a Chrome extension that keeps a rolling network log for the tab, so the failing request is already captured when you report the bug.',
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
          { type: 'shot', screen: 'networkResponse', caption: 'The captured response body next to the request, ready to copy as cURL with secrets masked.' },
          {
            type: 'p',
            text: 'Because commands are built from the already-masked log, you add your own test credentials when replaying. Bugmark is free to try with every feature unlocked, up to 2 saved reports at a time; a one-time $15 payment removes the limit, with no subscription or account. [Add Bugmark to Chrome](' + CWS + ')',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Where is Copy as cURL in Chrome?',
        a: 'Open DevTools and select the Network panel, then reproduce the request. Right-click the request in the Name column, hover over Copy, and choose Copy as cURL. On Windows the menu shows Copy as cURL (bash) and Copy as cURL (cmd) instead of a single option.',
      },
      {
        q: 'What is the difference between Copy as cURL (bash) and Copy as cURL (cmd)?',
        a: 'They produce the same request with different quoting. The bash version uses single quotes and backslash line breaks for bash, zsh, Git Bash and WSL. The cmd version uses caret escaping for Windows Command Prompt. For PowerShell, use Copy as PowerShell or run curl.exe explicitly.',
      },
      {
        q: 'Does Copy as cURL include cookies?',
        a: 'Yes. Chrome adds the cookies sent with the request using the -b option, and copies headers such as Authorization unchanged. That is why the command replays as your logged-in session, and also why you should remove cookies and tokens before sharing it with anyone.',
      },
      {
        q: 'Why does my copied cURL command return 401 or 403?',
        a: 'The session cookie, bearer token or CSRF token in the command has usually expired or been rotated. Reproduce the action in the browser again and copy a fresh command. Some APIs also bind tokens to the browser or check the Origin header, so keep the copied headers intact.',
      },
      {
        q: 'Can I copy all network requests as cURL at once?',
        a: 'Yes. Right-click any request, hover over Copy and choose Copy all as cURL. Chrome copies every request in the list as a chain of commands. If you have a filter active, the option becomes Copy all listed as cURL and only includes the filtered requests.',
      },
    ],
    related: [
      '/guides/how-to-capture-har-file-chrome',
      '/network-request-logger',
      '/guides/how-to-capture-console-logs',
      '/debugging-tool',
      '/web-developer-tools',
    ],
    updated: '2026-10-13',
    howTo: {
      name: 'How to copy a request as cURL in Chrome',
      totalTime: 'PT2M',
      steps: [
        { name: 'Open DevTools', text: 'Press F12, Ctrl+Shift+I or Cmd+Option+I on the page that makes the request.' },
        { name: 'Select the Network panel', text: 'Click the Network tab, using the overflow arrow if it is hidden.' },
        { name: 'Trigger the request', text: 'Reload the page or repeat the action so the request appears in the list.' },
        { name: 'Find the request', text: 'Filter by Fetch/XHR or type part of the URL to locate the request.' },
        { name: 'Copy as cURL', text: 'Right-click the request, hover over Copy and choose Copy as cURL, or Copy as cURL (bash) or (cmd) on Windows.' },
        { name: 'Run it in a terminal', text: 'Paste the command into a terminal and press Enter to replay the request.' },
        { name: 'Remove secrets before sharing', text: 'Replace cookie, authorization and token values with placeholders before sending the command to anyone.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 3. How to screen record in Chrome
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-screen-record-in-chrome',
    kind: 'guide',
    title: 'How to Screen Record in Chrome (Mac, Windows, ChromeOS)',
    description:
      'How to screen record in Chrome on Mac, Windows and Chromebook using built-in tools or an extension, plus how to record bugs with console and network logs.',
    h1: 'How to screen record in Chrome on any computer',
    eyebrow: 'guide',
    intro:
      "Chrome has no record button of its own on Mac or Windows, but every operating system ships a screen recorder that captures a Chrome window perfectly well. This guide covers the built-in options on macOS, Windows and ChromeOS, when an extension is the better choice, and how to record a bug so the video comes with the logs developers need.",
    primaryKeyword: 'how to screen record in Chrome',
    keywords: [
      'record chrome tab',
      'screen record chrome mac',
      'screen record chrome windows',
      'chromebook screen record',
      'record browser with audio',
      'chrome screen recorder extension',
      'record a bug in chrome',
      'record screen without software',
    ],
    hero: 'recording',
    sections: [
      {
        heading: 'Quick answer',
        blocks: [
          {
            type: 'callout',
            title: 'How to screen record in Chrome',
            text: 'Use your computer\'s built-in recorder. **Mac:** press Shift+Cmd+5, pick Record Selected Window or Record Selected Portion, click Record. **Windows 11:** press Windows+Shift+R to record a region with Snipping Tool. **Chromebook:** press Shift+Ctrl+Show windows and choose Screen record. To capture just the tab with console and network logs, use a recording extension.',
          },
        ],
      },
      {
        heading: 'Does Chrome have a built-in screen recorder?',
        blocks: [
          {
            type: 'p',
            text: 'Not on Mac, Windows or Linux. Desktop Chrome can take screenshots from DevTools (see our [full page screenshot guide](/guides/full-page-screenshot-chrome)) but it has no video recording command. On a Chromebook, screen recording is part of ChromeOS itself.',
          },
          {
            type: 'p',
            text: 'You may also see the **Recorder** panel in Chrome DevTools. Despite the name, it does not record video. It records user flows (clicks, typing and navigation) as steps you can replay, edit and export for testing. That is useful for automation, but it is not something you can send a client as a video.',
          },
        ],
      },
      {
        heading: 'How to screen record Chrome on a Mac',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Open the Chrome window** you want to record and close tabs or notifications you do not want on video.',
              '**Press Shift+Command+5** to open the Screenshot toolbar.',
              '**Choose what to record:** **Record Entire Screen**, **Record Selected Portion** (drag the frame around the Chrome window), or **Record Selected Window** on macOS Tahoe 26 and later.',
              '**Set Options.** Pick a **Microphone** to narrate, turn on **Show Mouse Clicks** so viewers see where you click, and choose a **Save to** location if you do not want the desktop.',
              '**Click Record**, then reproduce what you want to show.',
              '**Stop** with the stop button in the menu bar, or press **Command+Control+Esc**. The recording saves to your desktop as a .mov file.',
            ],
          },
          {
            type: 'p',
            text: 'QuickTime Player works too: choose **File > New Screen Recording** (Control+Command+N). Both open the same recording toolbar on current macOS.',
          },
        ],
      },
      {
        heading: 'How to screen record Chrome on Windows',
        blocks: [
          {
            type: 'p',
            text: 'Windows 11 has two built-in options. **Snipping Tool** is the better fit for browser recordings because you can choose any region of the screen.',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              '**Press Windows+Shift+R** to open the Snipping Tool recording overlay. You can also open Snipping Tool, select **Record**, then **New**.',
              '**Drag a box** around the Chrome window or the part of the page you want.',
              '**Turn on audio if you want narration.** If your version shows microphone and system audio buttons on the recording toolbar, enable them before starting.',
              '**Select Start**, wait for the countdown and reproduce the problem.',
              '**Select Stop.** The recording opens in Snipping Tool for preview. Save it as an MP4; with automatic saving on, recordings go to a Screen Recordings folder inside Videos.',
            ],
          },
          {
            type: 'p',
            text: '**Xbox Game Bar** is the alternative. Press **Windows+G** to open it, then **Windows+Alt+R** to start and stop recording the active app, and **Windows+Alt+M** to toggle the microphone. Clips are saved as MP4 files in **Videos > Captures**. Game Bar records one app window at a time and cannot record the desktop or File Explorer, so make sure Chrome is focused when you start.',
          },
        ],
      },
      {
        heading: 'How to screen record on a Chromebook',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**Press Shift+Ctrl+Show windows**, or select the time at the bottom right and choose **Screen capture**. On an external keyboard without the Show windows key, use Ctrl+Shift+F5.',
              '**Select Screen record** in the toolbar at the bottom.',
              '**Choose full screen, partial screen or window.** Window is the simplest way to record only Chrome.',
              '**Open Settings** (gear icon) to choose audio input (microphone, device audio or both), turn on **Show clicks and keys**, or add the front camera.',
              '**Start recording** by clicking the screen, dragging an area or clicking the window.',
              '**Select Stop recording** at the bottom right. Videos save as .webm files to Downloads by default.',
            ],
          },
          {
            type: 'p',
            text: 'Partial-screen recordings can also be saved as a GIF, which plays inline almost anywhere but has no sound.',
          },
        ],
      },
      {
        heading: 'Built-in recorders vs. extensions',
        blocks: [
          {
            type: 'table',
            head: ['Method', 'Shortcut', 'Records', 'Output'],
            rows: [
              ['macOS Screenshot toolbar', 'Shift+Cmd+5', 'Screen, window or region, with mic', '.mov on the desktop'],
              ['Windows Snipping Tool', 'Windows+Shift+R', 'Any region', 'MP4'],
              ['Xbox Game Bar', 'Windows+Alt+R', 'The active app window', 'MP4 in Videos > Captures'],
              ['ChromeOS screen capture', 'Shift+Ctrl+Show windows', 'Screen, window or region', '.webm or .gif in Downloads'],
              ['Chrome extension', 'Varies', 'Usually the current tab, sometimes screen or camera', 'Varies, often WebM'],
            ],
          },
          {
            type: 'p',
            text: 'Built-in recorders are free and need no installation. An extension makes sense when you want to record only the tab (so notifications and other windows stay private), keep recording across page loads, or attach technical context to the video. Before installing one, check where it stores videos: some upload every recording to their cloud by default.',
          },
        ],
      },
      {
        heading: 'Recording a bug: what the video should show',
        blocks: [
          {
            type: 'list',
            items: [
              '**Start just before the problem.** A 20-second clip that begins on the page before the bug beats three minutes of navigation.',
              '**Show the address bar,** or say the URL out loud, so viewers know which page and environment it is.',
              '**Narrate:** "I enter the promo code, click Apply, and the total does not change." Expected versus actual, spoken.',
              '**Move slowly** and pause on the moment it breaks so the frame is easy to find.',
              '**Hide private data.** Close other tabs, turn on Do Not Disturb, and avoid real customer records.',
              '**Add text with it.** Paste the URL, steps and time into the ticket. Our guide on [how to report a bug on a website](/guides/how-to-report-a-bug-on-a-website) has a plain-English template.',
            ],
          },
          {
            type: 'p',
            text: 'A video shows the symptom, not the cause. When something fails rather than just looks wrong, developers also need the console errors and the failing request from the same moment. Record with DevTools open, then [save the console log](/guides/how-to-capture-console-logs) and [export a HAR file](/guides/how-to-capture-har-file-chrome) right after you stop recording.',
          },
        ],
      },
      {
        heading: 'Trim, size and share the recording',
        blocks: [
          {
            type: 'p',
            text: 'Short clips get watched. Before you send a recording, cut the dead time at the start and end, and check that the file is small enough for where it is going.',
          },
          {
            type: 'list',
            items: [
              '**Trim on a Mac:** click the thumbnail that appears in the corner of the screen right after you stop, or open the file in QuickTime Player and choose **Edit > Trim**.',
              '**Trim on Windows:** in Snipping Tool, select **Edit in Clipchamp** after recording to cut the clip, or use the Photos app.',
              '**Mind attachment limits.** GitHub accepts .mp4, .mov and .webm videos up to 10 MB in repositories on a free plan and 100 MB on paid plans. Email often caps attachments at around 20 to 25 MB.',
              '**Record a smaller area.** A region around the browser window produces a much smaller file than a full 4K or Retina screen, and is easier to watch on a laptop.',
              '**Name the file usefully,** for example `checkout-pay-button-2026-10-13.mp4`, so it still makes sense when downloaded from a ticket.',
            ],
          },
          {
            type: 'p',
            text: '**Seeing a black box in the recording?** Streaming video protected by DRM is blacked out by design. If a whole Chrome window records as black, update your operating system and Chrome, and on macOS check that the recording app is allowed under **System Settings > Privacy & Security** in the screen recording section.',
          },
        ],
      },
      {
        heading: 'The faster way: Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Juggling a screen recorder, DevTools and two export files for every bug is slow. [Bugmark](/screen-recorder-for-bug-reports) is a Chrome extension that records the tab and attaches the technical context from the same session.',
          },
          {
            type: 'list',
            items: [
              'Press **Alt+Shift+R** (⌥⇧R) or choose **Record video** from the capture menu to record the tab as WebM video, up to 5 minutes, with microphone narration.',
              'The recording **continues across page loads**, so login redirects and multi-page checkouts fit in one video.',
              'The last 150 console messages with JavaScript errors, and the last 150 network requests with payloads and response bodies for recent fetch/XHR calls, are attached automatically.',
              'The last 30 actions become editable **steps to reproduce**, alongside URL, browser, OS and viewport.',
              'Recordings play back in the report and in exported HTML reports, and can be attached to GitHub issues.',
            ],
          },
          { type: 'shot', screen: 'recordingBar', caption: 'The recording bar shows elapsed time and the microphone indicator, with Stop one click away.' },
          { type: 'shot', screen: 'videoPlayer', caption: 'Recordings play back next to the captured steps, console messages and network requests.' },
          {
            type: 'p',
            text: 'Recordings are stored locally in your browser, not uploaded to Bugmark servers. Bugmark is free to try with every feature unlocked, up to 2 saved reports at a time; a one-time $15 payment removes the limit, with no subscription or account. [Add Bugmark to Chrome](' + CWS + ')',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can you screen record in Chrome without an extension?',
        a: 'Yes, by using the recorder built into your operating system. On a Mac press Shift+Command+5, on Windows 11 press Windows+Shift+R for Snipping Tool, and on a Chromebook press Shift+Ctrl+Show windows and choose Screen record. Desktop Chrome itself has no video recording button.',
      },
      {
        q: 'How do I screen record Chrome with audio?',
        a: 'On a Mac, choose a microphone in the Options menu of the Shift+Command+5 toolbar. On a Chromebook, open the screen capture settings and pick microphone, device audio or both. On Windows, Xbox Game Bar toggles the microphone with Windows+Alt+M. Many tab recording extensions also support microphone narration.',
      },
      {
        q: 'How do I record only one Chrome tab?',
        a: 'Built-in recorders capture a window or region, so maximize the tab or drag the recording area around it. To record the tab itself, so other windows and notifications never appear, use a tab recording extension. Some, including Bugmark, keep recording when the page reloads or navigates.',
      },
      {
        q: 'Where are screen recordings saved?',
        a: 'On a Mac, recordings save to the desktop as .mov files unless you change Save to in Options. Xbox Game Bar saves MP4 files to Videos > Captures. Snipping Tool saves MP4 files, by default to Videos > Screen Recordings when automatic saving is on. Chromebooks save .webm files to Downloads.',
      },
      {
        q: 'What is the Recorder panel in Chrome DevTools?',
        a: 'The Recorder panel records user flows, meaning clicks, typing and navigation, as steps you can replay, edit and export for testing and performance measurement. It does not create a video. To record what is on screen, use your operating system recorder or a screen recording extension.',
      },
    ],
    related: [
      '/screen-recorder-for-bug-reports',
      '/guides/how-to-capture-console-logs',
      '/guides/how-to-report-a-bug-on-a-website',
      '/alternatives/loom',
    ],
    updated: '2026-10-13',
    howTo: {
      name: 'How to screen record in Chrome',
      totalTime: 'PT3M',
      steps: [
        { name: 'Prepare the Chrome window', text: 'Open the page, close unrelated tabs and turn on Do Not Disturb.' },
        { name: 'Open your system recorder', text: 'Press Shift+Command+5 on Mac, Windows+Shift+R on Windows 11, or Shift+Ctrl+Show windows on a Chromebook.' },
        { name: 'Choose the area', text: 'Select the Chrome window or drag a region around the part of the page to record.' },
        { name: 'Turn on audio', text: 'Choose a microphone in the recorder options if you want to narrate.' },
        { name: 'Record the problem', text: 'Start recording, then reproduce what you want to show while describing it.' },
        { name: 'Stop and save', text: 'Stop the recording and find the video in its save location: desktop, Videos or Downloads.' },
        { name: 'Attach context', text: 'Share the video with the URL and steps, plus console errors and a HAR file for bugs.' },
      ],
    },
  },
];
