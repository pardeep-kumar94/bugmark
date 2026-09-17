import type { ContentPage } from './types';

export const toolPages: ContentPage[] = [
  // ---------------------------------------------------------------------------
  // 1. Free bug reporting tool
  // ---------------------------------------------------------------------------
  {
    slug: 'bug-reporting-tool',
    kind: 'tool',
    title: 'Free Bug Reporting Tool for Chrome, No Account Needed',
    description:
      "Bugmark is a free bug reporting tool for Chrome: annotated screenshots, video, steps to reproduce, console and network logs in one report. No account needed.",
    h1: 'A free bug reporting tool that captures what developers need',
    eyebrow: 'free bug reporting tool',
    intro:
      "Bugmark is a free Chrome extension that turns “it's broken” into a report a developer can act on. One capture gives you an annotated screenshot or screen recording, the steps that led there, console errors, network requests and environment details, stored locally in your browser.",
    primaryKeyword: 'free bug reporting tool',
    keywords: [
      'bug report tool',
      'bug reporting chrome extension',
      'visual bug reporting',
      'free bug tracker chrome',
      'bug report with screenshot',
      'bug reporting software for websites',
      'report website bugs',
    ],
    hero: 'heroCapture',
    sections: [
      {
        heading: 'Why most bug reports get bounced back',
        blocks: [
          {
            type: 'p',
            text: "A typical report arrives as a sentence in chat and a cropped screenshot. The developer then spends the first half hour asking questions: which page, which browser, what did you click first, was there an error, did the request fail or did the UI just not update? By the time the answers come back, the reporter has moved on and the state that caused the bug is gone.",
          },
          {
            type: 'p',
            text: "The problem is rarely effort. Reporters can't see the console, don't know which network call matters, and forget the exact order of their clicks. A **bug reporting tool** earns its place when it collects that context automatically, so the person who found the problem only has to describe what they expected to happen.",
          },
          {
            type: 'p',
            text: "That context also changes how a bug gets triaged. A report that already shows a 500 from the orders API goes straight to the backend engineer who owns it. A report that shows a clean network log and a layout shift at 768 pixels goes to the front end. Without that evidence, every ticket starts in a generic queue and waits for someone to investigate it before anyone can even decide who should fix it.",
          },
        ],
      },
      {
        heading: 'What a Bugmark report contains',
        blocks: [
          {
            type: 'p',
            text: 'Every capture, whether a screenshot or a recording, has the same developer context attached without any extra clicks:',
          },
          {
            type: 'list',
            items: [
              "**Visual evidence** — a screenshot marked up with arrows, rectangles, numbered pins and text labels, or a tab recording of up to 5 minutes with microphone narration.",
              "**Steps to reproduce** — the last 30 actions in the tab: clicks with element labels, which field was typed in (never the text itself), selects, checkboxes, form submits and SPA navigation. You can edit them before saving.",
              '**Console log** — the last 150 console messages, plus JavaScript errors and unhandled promise rejections.',
              '**Network log** — the last 150 requests with method, URL, status and timing, and full request/response detail for the 60 most recent fetch and XHR calls.',
              '**Environment** — URL, page title, browser, OS, viewport, pixel ratio and scroll position.',
            ],
          },
          {
            type: 'shot',
            screen: 'steps',
            caption: 'Steps to reproduce are recorded as you use the page, so nobody has to reconstruct them from memory.',
          },
          {
            type: 'p',
            text: "Passwords, tokens, API keys, session IDs, card numbers and `Authorization`/`Cookie` headers are replaced with `[redacted]` before the report is saved. If you want a checklist for the written part of the report, our guide on [how to write a bug report](/guides/how-to-write-a-bug-report) covers titles, expected versus actual behavior and severity.",
          },
        ],
      },
      {
        heading: 'Manual reporting vs. a visual bug reporting tool',
        blocks: [
          {
            type: 'table',
            head: ['Detail developers ask for', 'Manual report', 'Bugmark'],
            rows: [
              ['What the reporter saw', 'Cropped screenshot, often without context', 'Annotated screenshot or narrated recording'],
              ['How they got there', 'Written from memory, if at all', 'Last 30 tab actions, editable'],
              ['JavaScript errors', 'Only if the reporter opened DevTools', 'Last 150 console messages and uncaught errors'],
              ['Failed API calls', 'Rarely included', 'Status, payload and response body, filterable to failures'],
              ['Browser and viewport', 'Frequently missing', 'Recorded automatically'],
              ['Sensitive values', 'Pasted in by accident', 'Masked before saving'],
            ],
          },
          {
            type: 'p',
            text: "The written part still matters. Bugmark can't know what you expected to happen, so a one-line comment such as “Expected a confirmation screen; the button spins and nothing changes” is what turns the evidence into a bug. The difference is that this line becomes the only thing you type.",
          },
        ],
      },
      {
        heading: 'How it works',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              "Press **⌥⇧S** (Alt+Shift+S) on the page where you found the problem, or start a recording with **⌥⇧R**.",
              'Mark up the page with pins, arrows or the redact tool, then press **Enter** to capture.',
              'Add a title, comment, type and priority, and review the auto-recorded steps.',
              'Save with **⌘/Ctrl+Enter**. The report lands in your local dashboard, grouped by site.',
              'Create a GitHub issue directly, or export HTML, PDF, CSV or Markdown for whatever tracker your team uses.',
            ],
          },
          {
            type: 'shot',
            screen: 'githubDialog',
            caption: 'Create a GitHub issue with labels, steps, failing requests and console errors. Screenshots and recordings are committed to a separate bugmark-assets branch so they render in the issue.',
          },
        ],
      },
      {
        heading: 'Who uses it',
        blocks: [
          {
            type: 'p',
            text: "Bugmark is built for teams where the people finding bugs and the people fixing them are not the same. Product managers and designers use it during reviews. Support teams use it to reproduce a customer's problem once and hand engineering something concrete. Developers use it on their own staging sites to keep a running list of issues without switching to a tracker every few minutes. QA testers get a dedicated workflow, covered on the [QA testing tool](/qa-testing-tool) page, and agencies collecting client comments should look at the [website feedback tool](/website-feedback-tool) page.",
          },
          {
            type: 'callout',
            title: 'Local-first by default',
            text: 'Screenshots, recordings and logs are stored in IndexedDB in your browser. Nothing is uploaded to Bugmark servers; data leaves your machine only when you export a report or create a GitHub issue.',
          },
        ],
      },
      {
        heading: 'What Bugmark does not do (yet)',
        blocks: [
          {
            type: 'p',
            text: "Being precise about limits saves you a trial. Bugmark has no native Jira, Linear or Slack integration today; use CSV export for bulk imports or Markdown copy to paste a formatted report. There are no hosted share links and no team workspace or cloud sync, so reports are shared as files or GitHub issues. It does not replay past sessions: a recording has to be started before the bug happens, although steps, console and network logs are always captured. It runs in Chrome and Chromium browsers such as Edge, Brave and Arc, not Firefox or Safari.",
          },
          {
            type: 'p',
            text: 'If you are comparing options, see how Bugmark stacks up against [Jam](/alternatives/jam) and [Marker.io](/alternatives/marker-io).',
          },
        ],
      },
      {
        heading: 'Start reporting bugs developers can fix',
        blocks: [
          {
            type: 'p',
            text: 'Every feature is unlocked, with no sign-up, no item limits and no required watermark. Installation currently takes about a minute from a downloadable zip, with a Chrome Web Store listing on the way. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Is there a free bug reporting tool for Chrome?',
        a: 'Yes. Bugmark is a free Chrome extension with every feature unlocked, no account and no limits on the number of reports. It captures annotated screenshots, screen recordings, steps to reproduce, console logs and network requests, and it works in Chromium browsers such as Edge, Brave and Arc as well.',
      },
      {
        q: 'What should a good bug report include?',
        a: 'A clear title, the expected and actual behavior, the steps to reproduce, the page URL, browser and viewport, and visual evidence. For web apps, console errors and failed network requests usually point straight at the cause. Bugmark attaches the steps, logs and environment details automatically so the reporter only writes the description.',
      },
      {
        q: 'Do I need an account to use Bugmark?',
        a: 'No. Bugmark runs entirely in your browser without sign-up. Reports are stored locally in IndexedDB. You only connect an account if you choose to create GitHub issues, and even then the token is stored in your browser, not on a Bugmark server.',
      },
      {
        q: 'Can Bugmark send bug reports to Jira or Linear?',
        a: 'There is no native Jira or Linear integration yet. You can export reports as CSV for bulk import, or copy a single report as Markdown and paste it into a Jira or Linear ticket. GitHub issues are supported directly, including screenshots, recordings and HAR files that render inside the issue.',
      },
      {
        q: 'Does Bugmark capture passwords or personal data?',
        a: "Typed text is never recorded in the steps, only which field was used. Passwords, tokens, API keys, session IDs, card numbers and Authorization or Cookie headers are replaced with [redacted] before saving. You can also pixelate anything visible on screen with the redact tool before capturing.",
      },
    ],
    related: ['/qa-testing-tool', '/screen-recorder-for-bug-reports', '/guides/how-to-write-a-bug-report', '/alternatives/jam'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 2. Web developer tools
  // ---------------------------------------------------------------------------
  {
    slug: 'web-developer-tools',
    kind: 'tool',
    title: 'Web Developer Tools for Bug Reports in Chrome',
    description:
      'Free web developer tools for Chrome that package console logs, network payloads, computed styles and HAR files into bug reports you can act on immediately.',
    h1: 'Web developer tools that bring DevTools context into every bug report',
    eyebrow: 'web developer tools',
    intro:
      "Chrome DevTools is excellent when the bug is on your screen. Bugmark covers the other case: the bug happened in someone else's browser, and you need the console, the network calls and the element styles they had at that moment.",
    primaryKeyword: 'web developer tools',
    keywords: [
      'developer tools',
      'chrome developer tools extension',
      'front-end developer tools',
      'browser dev tools for bug reports',
      'copy as curl',
      'computed styles inspector',
      'responsive screenshot tool',
    ],
    hero: 'networkPayload',
    sections: [
      {
        heading: 'The gap between DevTools and the bug report',
        blocks: [
          {
            type: 'p',
            text: "DevTools assumes the person with the bug is the person who knows how to open DevTools. In practice, the bug is found by a designer on a tablet breakpoint, a PM clicking through staging, or a support agent following a customer's description. By the time a developer opens the Network panel, the failing request is long gone and the console is clean.",
          },
          {
            type: 'p',
            text: "Bugmark is a set of **front-end developer tools** packaged for the person reporting the problem. It records the same signals you would look at yourself and freezes them into a report, so you start from evidence rather than a reproduction attempt.",
          },
          {
            type: 'p',
            text: "Consider a common case: a designer reports that a price label is truncated on the product page. In DevTools terms you want the element's computed width and font, the viewport, and whether the price came back from the API longer than expected. Normally that means three follow-up questions. With a Bugmark capture it means opening one report.",
          },
        ],
      },
      {
        heading: 'The developer toolkit inside each capture',
        blocks: [
          {
            type: 'list',
            items: [
              "**Network log with bodies** — the last 150 requests (fetch, XHR and resources) with method, URL, status and timing. For the 60 most recent fetch/XHR calls you also get query params, request headers, the request payload (JSON, form data, `FormData` fields, up to 16 KB), response headers and the response body (up to 32 KB).",
              "**Copy as cURL** — replay any captured request from your terminal against a local or staging API.",
              "**Download HAR** — export the log and open it in Chrome DevTools → Network for the tooling you already know.",
              '**Console with uncaught errors** — the last 150 messages, including JavaScript errors and unhandled promise rejections that never reach a visible UI.',
              "**Element inspector** — click an element to attach its CSS selector, size and computed `font`, `color`, `background`, `padding`, `margin`, `border`, `border-radius` and `display`.",
              '**Environment** — browser, OS, viewport, device pixel ratio and scroll position, which settles most “works on my machine” debates.',
            ],
          },
          {
            type: 'shot',
            screen: 'inspector',
            caption: 'The element inspector attaches a selector, dimensions and computed styles, so a “the spacing looks off” report arrives with the actual padding values.',
          },
        ],
      },
      {
        heading: 'Bugmark alongside Chrome DevTools',
        blocks: [
          {
            type: 'p',
            text: "Bugmark doesn't replace DevTools; it hands you a snapshot that you then open in DevTools or your terminal. Here is how the two divide the work:",
          },
          {
            type: 'table',
            head: ['Task', 'Chrome DevTools', 'Bugmark'],
            rows: [
              ['Inspect a request you can reproduce', 'Network panel, live', 'Not needed'],
              ['Inspect a request from a reporter', 'Only if they export a HAR themselves', 'Captured automatically with payload and response'],
              ['Replay a request', 'Copy as cURL from the panel', 'Copy as cURL from the report'],
              ['Set breakpoints and step through code', 'Sources panel', 'Not supported'],
              ['Profile performance or memory', 'Performance and Memory panels', 'Not supported'],
              ['Check a layout at three widths', 'Toggle device mode repeatedly', 'One capture at 390×844, 768×1024 and 1440×900'],
              ['Record what the user clicked', 'Recorder panel, if started deliberately', 'Last 30 actions, always on'],
            ],
          },
          {
            type: 'p',
            text: 'If you just need a HAR from a teammate without installing anything, our guide on [how to capture a HAR file in Chrome](/guides/how-to-capture-har-file-chrome) walks through the manual route.',
          },
        ],
      },
      {
        heading: 'Responsive checks without toggling device mode',
        blocks: [
          {
            type: 'p',
            text: "The **Mobile · tablet · desktop** capture mode uses Chrome device emulation to render the current page at 390×844, 768×1024 and 1440×900, then combines the three into one side-by-side image. It is a quick way to document a breakpoint regression, or to show that a fix holds at every width before closing an issue. For layout fixes, the before/after mode recaptures the page at the same scroll position so the diff is obvious at a glance.",
          },
          {
            type: 'shot',
            screen: 'breakpoints',
            caption: 'One capture, three breakpoints: useful for spotting overflow and wrapping issues that only appear at one width.',
          },
        ],
      },
      {
        heading: 'How developers use it day to day',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Share the [install page](/install) with the people who test your site; setup takes about a minute.',
              'When they hit a bug, they press ⌥⇧S, mark it up and save. The logs are already attached.',
              'They create a GitHub issue from the capture, or send you the self-contained HTML report.',
              'Open the failing request, copy it as cURL or download the HAR, and reproduce against your local API.',
              'After the fix, add an “after” screenshot to the same report to confirm the change.',
            ],
          },
          {
            type: 'p',
            text: "Developers also use Bugmark solo: when you notice three problems during a feature walkthrough, capturing each with its logs is faster than writing notes and trying to reproduce later. For a deeper look at tracking down a specific failure, see the [debugging tool](/debugging-tool) page, and for the request-level details the [network request logger](/network-request-logger) page.",
          },
        ],
      },
      {
        heading: 'Privacy for the people you ask to report',
        blocks: [
          {
            type: 'p',
            text: "Asking non-developers to hand over network logs raises fair questions. Bugmark masks passwords, tokens, API keys, session IDs, card numbers and `Authorization`/`Cookie` headers with `[redacted]` in JSON keys, form fields and URL params before anything is saved. Reports stay in the browser's IndexedDB and are not uploaded to Bugmark servers. Optional anonymous usage stats only count feature use and can be turned off in settings. Typed text is never stored in the recorded steps, only which field was used, so a tester filling in a signup form doesn't leak their input into a ticket.",
          },
        ],
      },
      {
        heading: 'Get the context before you ask for it',
        blocks: [
          {
            type: 'p',
            text: 'Bugmark is free, with no account and every feature unlocked. It runs in Chrome, Edge, Brave and Arc. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What are web developer tools?',
        a: 'Web developer tools are utilities for inspecting and debugging websites: element and style inspectors, console output, network request viewers, device emulation and performance profilers. Chrome ships DevTools built in, and extensions such as Bugmark add workflows on top, like packaging console and network logs into a shareable bug report.',
      },
      {
        q: 'Is Bugmark a replacement for Chrome DevTools?',
        a: 'No. DevTools is where you debug interactively with breakpoints, profiling and live inspection. Bugmark captures a snapshot of console messages, network requests, user steps and element styles at the moment a bug is reported, and lets you export it as a HAR file or cURL command to continue in DevTools or your terminal.',
      },
      {
        q: 'Can I export network requests from a bug report as a HAR file?',
        a: "Yes. Each Bugmark report has a Download HAR option that exports the captured network log. You can open the file in Chrome DevTools under the Network panel by importing it. Individual requests can also be copied as cURL commands for replaying against your own environment.",
      },
      {
        q: 'Which browsers does Bugmark support?',
        a: 'Bugmark is a Manifest V3 extension for Chrome and Chromium-based browsers, including Microsoft Edge, Brave and Arc. Firefox and Safari are not supported. It is currently installed from a downloadable zip using Load unpacked, and a Chrome Web Store listing is coming.',
      },
      {
        q: 'How do I see computed CSS styles in a bug report?',
        a: "Use Bugmark's element inspector during a capture and click the element in question. The report stores its CSS selector, rendered size and computed styles such as font, color, background, padding, margin, border, radius and display, so the developer sees exact values instead of a description.",
      },
    ],
    related: ['/debugging-tool', '/network-request-logger', '/guides/how-to-capture-har-file-chrome', '/screenshot-annotation-tool'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 3. Debugging tool
  // ---------------------------------------------------------------------------
  {
    slug: 'debugging-tool',
    kind: 'tool',
    title: 'Debugging Tool for Bugs You Cannot Reproduce',
    description:
      "A free web debugging tool for Chrome that records console errors, failed requests and user steps when a bug happens, so you can debug websites without guessing.",
    h1: 'A browser debugging tool for the bugs you can’t reproduce',
    eyebrow: 'web debugging tool',
    intro:
      "The hardest bugs are the ones that vanish when you open DevTools. Bugmark records the evidence at the moment the problem appears — the JavaScript errors, the failing API response and the clicks that led there — so debugging starts from facts.",
    primaryKeyword: 'debugging tool',
    keywords: [
      'web debugging tool',
      'browser debugging tool',
      'javascript debugging tool',
      'debug websites in chrome',
      'unhandled promise rejection',
      'cannot reproduce bug',
      'debug production issues',
    ],
    hero: 'console',
    sections: [
      {
        heading: 'Debugging starts with evidence, not reproduction',
        blocks: [
          {
            type: 'p',
            text: "Classic debugging advice says reproduce first. That works for deterministic bugs on your own machine. It falls apart for a race condition that shows up on a slow connection, a feature flag enabled for one account, a stale cache, or a 500 from an upstream service that recovered ten minutes later. “Cannot reproduce” is often the honest answer, and the ticket is closed with the bug still live.",
          },
          {
            type: 'p',
            text: "A **web debugging tool** that runs where the bug happens changes the order of operations. Instead of trying to recreate the state, you read what the browser logged when the state was wrong. Bugmark does that as a Chrome extension: it keeps a rolling record of console output, network traffic and user actions in the tab, and freezes it into a report the instant someone captures the problem.",
          },
        ],
      },
      {
        heading: 'The signals Bugmark preserves',
        blocks: [
          {
            type: 'list',
            items: [
              "**JavaScript errors and unhandled promise rejections**, alongside the last 150 console messages. An `await` that threw with no `catch` often produces no visible UI change at all; here it appears in the log.",
              "**The last 150 network requests**, with status and timing. Filter to failures to see the 4xx and 5xx responses first, then open a fetch or XHR request to read its headers, payload and response body (bodies are kept for the 60 most recent, up to 16 KB request and 32 KB response).",
              "**Steps to reproduce**: the last 30 actions, including clicks with element labels, form submits and SPA route changes, which tells you the sequence that led into the broken state.",
              '**Environment**: browser, OS, viewport, pixel ratio and scroll position, the variables that most often explain why a bug is intermittent.',
            ],
          },
          {
            type: 'shot',
            screen: 'networkResponse',
            caption: 'The 402 response body for a declined payment, captured at the moment of the bug. The message the API returned is right there.',
          },
        ],
      },
      {
        heading: 'A worked example: the checkout button that does nothing',
        blocks: [
          {
            type: 'p',
            text: 'A support agent reports that “Confirm and pay” does nothing for a customer who applied a promo code. Here is how the report narrows it down:',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              'The steps show: open checkout, apply promo, type in the name field, click **Confirm and pay**. The promo step is the unusual one.',
              'Filtering the network log to failures shows `POST /api/payments/intents` returned a 4xx.',
              'The request payload shows the discounted amount; the response body explains the rejection reason.',
              'The console shows an unhandled promise rejection from the checkout handler, which is why the button appeared to do nothing rather than showing an error.',
              'The developer copies the request as cURL, replays it against staging with the same payload, and has a failing case in minutes.',
            ],
          },
          {
            type: 'p',
            text: 'Two bugs come out of one report: the pricing logic that produced an invalid amount, and the missing error handling that hid it. Neither needed a live reproduction session with the customer.',
          },
          {
            type: 'p',
            text: "Notice what the agent did not need to know. They never opened DevTools, never identified which request mattered, and never wrote steps. They reproduced the problem once on the customer's account in their own browser, pressed a shortcut and wrote one sentence. The debugging skill stayed with the developer; the evidence collection moved to wherever the bug was seen.",
          },
        ],
      },
      {
        heading: 'Recording intermittent problems',
        blocks: [
          {
            type: 'p',
            text: "For bugs that happen over several screens, start a recording with **⌥⇧R** before walking the flow. Recordings run up to 5 minutes, continue across page loads, and can include microphone narration so the tester can say what they expected at each step. The console and network logs are attached to the recording in the same way as a screenshot. The [screen recorder for bug reports](/screen-recorder-for-bug-reports) page covers this workflow in more detail.",
          },
          {
            type: 'shot',
            screen: 'steps',
            caption: 'The recorded action sequence often explains an intermittent bug on its own: the order of clicks is the missing variable.',
          },
        ],
      },
      {
        heading: 'Where Bugmark ends and DevTools begins',
        blocks: [
          {
            type: 'p',
            text: "Bugmark is a capture tool, not an interactive **JavaScript debugging tool**. It does not set breakpoints, step through code, watch variables, map minified stack traces back to source, or profile CPU and memory. It does not record every session in the background either: logs are a rolling window of the most recent activity in the tab, and a video only exists if someone pressed record.",
          },
          {
            type: 'p',
            text: 'The intended hand-off is simple. Use the report to find which request failed and which error was thrown, then download the HAR into DevTools or replay the request with cURL and set your breakpoints there. If you want to collect logs manually for comparison, see [how to capture console logs](/guides/how-to-capture-console-logs).',
          },
          {
            type: 'callout',
            title: 'Secrets stay out of the logs',
            text: 'Before a report is saved, passwords, tokens, API keys, session IDs, card numbers and Authorization/Cookie headers are replaced with [redacted] in JSON keys, form fields and URL params. Reports stay in local browser storage until you export them.',
          },
        ],
      },
      {
        heading: 'Who gets the most out of it',
        blocks: [
          {
            type: 'p',
            text: "Front-end and full-stack developers debugging reports from staging or production. Support engineers who need to escalate with proof. QA testers on exploratory sessions, where the interesting failures are rarely scripted; see the [QA testing tool](/qa-testing-tool) page. And anyone who has closed a ticket as “cannot reproduce” and suspected the bug was still there.",
          },
        ],
      },
      {
        heading: 'Debug from what actually happened',
        blocks: [
          {
            type: 'p',
            text: 'Bugmark is free, needs no account and keeps data on your device. It works in Chrome, Edge, Brave and Arc. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I debug a website in Chrome?',
        a: 'Open Chrome DevTools with F12 or Ctrl+Shift+I (Cmd+Option+I on Mac), check the Console for errors, then use the Network panel to find failed requests and the Sources panel to set breakpoints. When the bug happened on someone else’s machine, a capture tool like Bugmark gives you those logs from their session.',
      },
      {
        q: 'How do you debug a bug you cannot reproduce?',
        a: 'Collect evidence from the moment it occurred instead of recreating it: the console errors, failed network requests with response bodies, the exact sequence of user actions and the environment. Bugmark records these in the background and attaches them to a screenshot or recording, which usually reveals the missing condition.',
      },
      {
        q: 'Does Bugmark capture unhandled promise rejections?',
        a: 'Yes. Along with the last 150 console messages, Bugmark records JavaScript errors and unhandled promise rejections. These are common causes of buttons that silently do nothing, because the error never reaches the interface, so having them in the report saves a lot of guesswork.',
      },
      {
        q: 'Can Bugmark set breakpoints or step through JavaScript?',
        a: 'No. Bugmark is not an interactive debugger. It captures console output, network traffic, user steps and environment details for a report. To step through code, export the HAR or copy a request as cURL, reproduce the failing case locally, and use the Sources panel in Chrome DevTools.',
      },
      {
        q: 'Does Bugmark record every session automatically?',
        a: 'No. It keeps a rolling window of recent tab activity: the last 30 actions, 150 console messages and 150 network requests, attached when you capture. Video is only recorded when you start a recording. Bugmark does not offer replay of past sessions that were not recorded.',
      },
    ],
    related: ['/network-request-logger', '/web-developer-tools', '/guides/how-to-capture-console-logs', '/screen-recorder-for-bug-reports'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 4. Website feedback tool
  // ---------------------------------------------------------------------------
  {
    slug: 'website-feedback-tool',
    kind: 'tool',
    title: 'Website Feedback Tool for Agencies and Client Reviews',
    description:
      'A free website feedback tool for Chrome: pin comments on live pages, check breakpoints and send white-label reports. Built for agencies and client reviews.',
    h1: 'A website feedback tool for agencies, freelancers and client reviews',
    eyebrow: 'website feedback tool',
    intro:
      "Client feedback on a website usually arrives as an email thread with screenshots named “image (3).png”. Bugmark lets reviewers pin numbered comments directly on the live page and gives you a branded report with every note, screenshot and technical detail in one place.",
    primaryKeyword: 'website feedback tool',
    keywords: [
      'website annotation tool',
      'client feedback tool',
      'visual feedback tool for agencies',
      'website review tool',
      'white label website feedback',
      'annotate live website',
      'website QA for clients',
    ],
    hero: 'annotate',
    sections: [
      {
        heading: 'Why website reviews stall',
        blocks: [
          {
            type: 'p',
            text: "The last two weeks before a launch are where agency projects lose time. Feedback is spread across email, chat and a shared document. “The button on the about page is weird” doesn't say which button, at what screen width, or what weird means. Half the comments are design preferences and half are real bugs, and nobody can tell which is which until a developer tries to reproduce each one.",
          },
          {
            type: 'p',
            text: "Then there is version drift. A client comments on Monday's build, the team ships changes on Tuesday, and by Wednesday nobody is sure whether a comment refers to the old layout or the new one. Screenshots without URLs and dates make it worse, and each round of clarification pushes the launch back a little further.",
          },
          {
            type: 'p',
            text: 'A **website feedback tool** fixes this by tying every comment to a specific spot on a specific page, with enough context that the person implementing the change never has to ask a follow-up question.',
          },
        ],
      },
      {
        heading: 'Annotate the live page, not a mockup',
        blocks: [
          {
            type: 'p',
            text: "Bugmark draws directly on the page in the browser. Reviewers can use numbered pins to reference several issues in one capture, arrows and rectangles to point at elements, text labels for short notes, a highlighter for copy changes, and a redact tool to pixelate customer data before sharing. “Interact with page” mode lets them open a dropdown or mobile menu first, and delayed capture (3 seconds) catches hover states and tooltips.",
          },
          {
            type: 'shot',
            screen: 'annotate',
            caption: 'Numbered pins, arrows and text labels drawn over the live page. Each capture keeps the URL, viewport and browser automatically.',
          },
          {
            type: 'p',
            text: "Every capture also records the page URL, viewport, browser and OS, so a comment about the header at tablet width is clearly a tablet-width issue. For design reviews, the element inspector attaches the computed font, color, padding and margin of whatever the reviewer clicks. The full set of markup options is on the [screenshot annotation tool](/screenshot-annotation-tool) page.",
          },
        ],
      },
      {
        heading: 'Features agencies ask for',
        blocks: [
          {
            type: 'list',
            items: [
              '**Breakpoint captures** — one click renders the page at 390×844, 768×1024 and 1440×900 side by side, so responsive feedback covers all three widths.',
              "**Before/after** — add an “after” screenshot to the original report (recaptured at the same scroll position, uploaded or pasted) to show the client exactly what changed.",
              '**White-label reports** — set your logo, accent color and company name on exported reports.',
              '**Self-contained HTML report** — one file with a summary, index and detail pages, screenshots and videos embedded. It opens in any browser without an account.',
              '**PDF and CSV** — print a PDF for sign-off, or export CSV to import into Jira, Linear or a spreadsheet.',
              '**Dashboard grouped by site** — keep feedback for each client project separate, filter by status and sort by priority.',
            ],
          },
          {
            type: 'shot',
            screen: 'reportCover',
            caption: 'An exported HTML report cover with summary stats and an index of every item, ready to send to a client or attach to a sign-off email.',
          },
        ],
      },
      {
        heading: 'A client review round, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Send the client or internal reviewer the [install page](/install). Nobody needs to create an account.',
              'The reviewer walks through the staging site, pressing ⌥⇧S on each page with an issue and dropping numbered pins.',
              'They set a type and priority on each capture and save it to their dashboard.',
              'At the end of the session they export one white-label HTML report and send it to you.',
              "Your team works through the items, adds “after” screenshots, and returns the updated report for approval.",
            ],
          },
          {
            type: 'p',
            text: "Because the technical context comes along automatically, the same report works for both audiences: the client sees annotated screenshots and comments, and your developers see console errors and failed requests for anything that turns out to be a real bug.",
          },
          {
            type: 'p',
            text: "A practical tip for larger reviews: agree on types and priorities before the round starts. If the client marks copy changes, design tweaks and functional bugs with different types, your team can filter the dashboard or the CSV export and route each group to the right person on day one, instead of sorting fifty mixed comments by hand.",
          },
        ],
      },
      {
        heading: 'Trade-offs to know before you roll it out',
        blocks: [
          {
            type: 'p',
            text: "Bugmark is an extension, so each reviewer installs it in Chrome or a Chromium browser (Edge, Brave, Arc); it does not work in Firefox or Safari, and there is no embeddable widget that site visitors can use without installing anything. There are no hosted share links or shared team workspace: feedback lives in each reviewer's browser until they export it, which means reports are passed around as files. If your process depends on clients commenting through a script on the site itself, compare [BugHerd](/alternatives/bugherd) and [Marker.io](/alternatives/marker-io).",
          },
          {
            type: 'p',
            text: 'The upside of that design is privacy. Nothing is uploaded to Bugmark servers, which matters when you are reviewing unreleased client work or a site behind a login.',
          },
        ],
      },
      {
        heading: 'Who it suits',
        blocks: [
          {
            type: 'p',
            text: "Freelancers and small agencies who want structured client feedback without adding another paid seat per reviewer. In-house marketing and design teams reviewing landing pages before a campaign. Product teams running a design QA pass on a new release. If most of your feedback comes from testers rather than clients, the [bug reporting tool](/bug-reporting-tool) page covers that workflow.",
          },
        ],
      },
      {
        heading: 'Run your next review round with Bugmark',
        blocks: [
          {
            type: 'p',
            text: 'Free, no account, every feature including white-label reports unlocked. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a website feedback tool?',
        a: 'A website feedback tool lets reviewers leave comments tied to specific elements on a live web page, usually with annotated screenshots and technical details such as URL, browser and screen size. It replaces scattered emails and chat messages with structured, actionable items a designer or developer can work through.',
      },
      {
        q: 'How do I collect feedback from clients on a website?',
        a: 'Give clients a way to annotate the page directly rather than describing issues in email. With Bugmark, the client installs the free extension, pins comments on each page of the staging site, and exports a single HTML or PDF report. You can brand the report with your logo and colors.',
      },
      {
        q: 'Do clients need an account to leave feedback with Bugmark?',
        a: "No. Bugmark has no sign-up. Clients install the extension in Chrome or another Chromium browser, capture and annotate pages, and export a report file to send back. The trade-off is that there is no hosted share link or shared workspace; feedback is exchanged as exported files.",
      },
      {
        q: 'Can I white-label website feedback reports?',
        a: 'Yes. Bugmark lets you set a logo, accent color and company name on exported reports. The HTML report is a single self-contained file with a summary, index and detail pages, and you can also print it to PDF for sign-off or export CSV for a project tracker.',
      },
      {
        q: 'Can I annotate a website at mobile and tablet sizes?',
        a: 'Yes. The Mobile · tablet · desktop capture mode uses Chrome device emulation to render the page at 390×844, 768×1024 and 1440×900 and combines them into one side-by-side image. This makes it easy to leave responsive feedback without resizing the browser window manually.',
      },
    ],
    related: ['/screenshot-annotation-tool', '/bug-reporting-tool', '/alternatives/bugherd', '/alternatives/marker-io'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 5. Screen recorder for bug reports
  // ---------------------------------------------------------------------------
  {
    slug: 'screen-recorder-for-bug-reports',
    kind: 'tool',
    title: 'Screen Recorder for Bug Reports with Console Logs',
    description:
      'A free screen recorder for bug reports: record a Chrome tab with voice for up to 5 minutes, with console errors, network requests and steps attached.',
    h1: 'A screen recorder for bug reports, with the logs attached',
    eyebrow: 'bug report video',
    intro:
      "Some bugs only make sense in motion: a flicker, a double submit, a spinner that never stops. Bugmark records the tab with your narration and attaches the console, network log and steps from the same session, so the video isn't the only evidence.",
    primaryKeyword: 'screen recorder for bug reports',
    keywords: [
      'bug report video',
      'record bug with console logs',
      'screen recording chrome extension with audio',
      'record browser tab with microphone',
      'video bug report',
      'screen recording for QA',
    ],
    hero: 'recording',
    sections: [
      {
        heading: 'When a screenshot is not enough',
        blocks: [
          {
            type: 'p',
            text: "A still image shows the final state. It can't show that the modal opened twice, that the cart count jumped from 2 to 0 and back, or that the page scrolled to the top on every keystroke. For timing, animation and multi-step flows, a short video is the clearest description you can give.",
          },
          {
            type: 'p',
            text: "The trouble with a generic screen recorder is that the developer watches the video, sees the problem, and still has no idea why it happened. They pause on a frame, squint at the URL bar, and ask for the console output. A **screen recorder for bug reports** should capture the diagnostic data in the same pass.",
          },
          {
            type: 'p',
            text: "Video also has a reviewing cost. A developer triaging twenty tickets won't watch twenty three-minute clips end to end. They need a way to jump to the moment the problem appears and a written summary of what happened. That is why Bugmark attaches the recorded steps and logs next to the player: the video confirms the symptom, and the text tells the developer where to look.",
          },
        ],
      },
      {
        heading: 'What gets recorded',
        blocks: [
          {
            type: 'list',
            items: [
              '**The tab, as WebM video**, for up to 5 minutes per recording.',
              '**Your voice**, via microphone narration, so you can say what you expected while you show what happened.',
              '**Across page loads** — the recording continues through navigation and full reloads, which matters for login redirects and multi-page checkouts.',
              '**Console and network logs** from the session: the last 150 console messages with JavaScript errors and unhandled rejections, and the last 150 requests with payloads and response bodies for recent fetch/XHR calls.',
              "**Steps to reproduce** — the last 30 actions, so the reader can skim the sequence without scrubbing through the video.",
              '**Environment** — URL, browser, OS, viewport and pixel ratio.',
            ],
          },
          {
            type: 'shot',
            screen: 'recordingBar',
            caption: 'The recording bar shows elapsed time and the microphone indicator, with Stop always one click away.',
          },
        ],
      },
      {
        heading: 'Recording a bug in five steps',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Go to the page just before the problem starts.',
              'Press **⌥⇧R** (Alt+Shift+R) or choose **Record video** from the capture menu, and allow microphone access if you want narration.',
              'Walk through the flow at normal speed and narrate: “I apply the promo code, now I click pay, and nothing happens.”',
              'Click **Stop**. Bugmark picks a poster frame and attaches the logs and steps.',
              'Add a title and priority, then create a GitHub issue or export an HTML report with the video embedded.',
            ],
          },
          {
            type: 'shot',
            screen: 'videoPlayer',
            caption: 'Recordings play back in the dashboard and inside exported HTML reports, next to the captured steps and logs.',
          },
        ],
      },
      {
        heading: 'Tips for bug videos developers will actually watch',
        blocks: [
          {
            type: 'list',
            items: [
              "**Keep it short.** Start recording one step before the bug, not at the home page. Thirty seconds that show the problem beat four minutes of navigation.",
              "**Say the expected result out loud.** The video shows the actual behavior; your narration is the only place the expectation lives.",
              '**Reproduce it twice if you can.** A second attempt in the same recording shows whether the bug is consistent or intermittent.',
              '**Use a screenshot for static issues.** A misaligned icon is faster to read as an annotated image; see the [screenshot annotation tool](/screenshot-annotation-tool) page.',
              "**Check the steps before saving.** They are editable, so you can remove irrelevant clicks and keep the list readable.",
              "**Mention the data state.** Say which account, plan or test data you are using. Many bugs depend on an empty cart, an expired trial or a specific role, and none of that is visible on screen.",
            ],
          },
          {
            type: 'p',
            text: 'Our [steps to reproduce template](/guides/steps-to-reproduce-template) pairs well with a recording when the report goes to a team that prefers written steps.',
          },
        ],
      },
      {
        heading: 'Compared with a general-purpose screen recorder',
        blocks: [
          {
            type: 'p',
            text: "Tools like Loom are built for async video messages: hosted links, viewer comments, camera bubbles, recordings of any app on your desktop. Bugmark is narrower. It records the browser tab only, and it has no hosted share links, so you share recordings through a GitHub issue or an exported HTML report file. What you get in return is the technical context alongside the video, local storage with nothing uploaded to Bugmark servers, and no account. There is a fuller breakdown on the [Loom alternative](/alternatives/loom) page.",
          },
          {
            type: 'p',
            text: "One more limit worth stating: Bugmark does not replay past sessions. If the bug happened before you pressed record, you won't have video of it, although the console, network and step logs still cover recent activity and can be attached to a screenshot instead.",
          },
        ],
      },
      {
        heading: 'Where recordings end up',
        blocks: [
          {
            type: 'p',
            text: "When you create a GitHub issue, recordings are committed to a separate orphan branch called `bugmark-assets` so they render in the issue without cluttering your main history. HTML reports embed the video directly, so the file plays offline. Your dashboard keeps every recording with its logs until you resolve or delete it. For teams on Jira or Linear, attach the exported HTML report or use the Markdown copy for the written details.",
          },
          {
            type: 'p',
            text: 'Recordings are stored in IndexedDB in your browser, not uploaded to Bugmark servers. That keeps screen recordings of internal dashboards, admin panels and unreleased features on your own device until you decide to share them, which is often the deciding factor for teams recording anything behind a login.',
          },
        ],
      },
      {
        heading: 'Record your next bug with the context included',
        blocks: [
          {
            type: 'p',
            text: 'Free, no account and no required watermark. Works in Chrome, Edge, Brave and Arc. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I record a bug in Chrome?',
        a: 'Install a screen recording extension, open the page just before the bug appears, start recording, reproduce the issue while narrating what you expect, then stop. With Bugmark, press Alt+Shift+R to record the tab with your microphone; console logs, network requests and steps are attached to the video automatically.',
      },
      {
        q: 'Can I record my screen with audio in a Chrome extension?',
        a: 'Yes. Bugmark records the current tab as WebM video with microphone narration, for up to 5 minutes per recording. Chrome asks for microphone permission the first time. The recording continues across page loads, so multi-page flows like sign-in or checkout can be captured in one video.',
      },
      {
        q: 'How long can a Bugmark screen recording be?',
        a: 'Each recording can run for up to 5 minutes. That covers most bug reproductions comfortably; shorter recordings that start just before the problem are easier for developers to review. If you need to show several separate issues, record them as separate captures so each has its own logs and priority.',
      },
      {
        q: 'Should a bug report include a video or a screenshot?',
        a: 'Use a screenshot for static problems such as layout, copy or styling issues, and a video for anything involving timing, animation, sequences of actions or intermittent behavior. In either case, include steps to reproduce and console and network logs, which Bugmark attaches to both kinds of capture.',
      },
      {
        q: 'Where are Bugmark recordings stored?',
        a: 'Recordings are stored locally in your browser using IndexedDB and are not uploaded to Bugmark servers. They leave your device only when you export an HTML report, which embeds the video, or create a GitHub issue, where the file is committed to a separate bugmark-assets branch in your repository.',
      },
    ],
    related: ['/bug-reporting-tool', '/alternatives/loom', '/guides/steps-to-reproduce-template', '/debugging-tool'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 6. Screenshot annotation tool
  // ---------------------------------------------------------------------------
  {
    slug: 'screenshot-annotation-tool',
    kind: 'tool',
    title: 'Screenshot Annotation Tool for Chrome, Full Page',
    description:
      'A free screenshot annotation tool for Chrome: full page, element and breakpoint captures with arrows, pins, text and redaction, marked up on the live page.',
    h1: 'A screenshot annotation tool that works on the live page',
    eyebrow: 'annotate screenshots in chrome',
    intro:
      "Most screenshot tools capture first and annotate later in a separate editor. Bugmark lets you mark up the page itself, then capture exactly what you need: the visible area, the full scrolling page, a single element, or three breakpoints at once.",
    primaryKeyword: 'screenshot annotation tool',
    keywords: [
      'annotate screenshot chrome',
      'full page screenshot extension',
      'markup tool for websites',
      'redact screenshot',
      'element screenshot chrome',
      'capture hover state screenshot',
      'responsive screenshots',
    ],
    hero: 'captureMenu',
    sections: [
      {
        heading: 'Why annotate before you capture',
        blocks: [
          {
            type: 'p',
            text: "The usual workflow is capture, save, open an editor, draw, export, then drag the file into a ticket. On a web page that detour loses context: the editor doesn't know the URL, the viewport or which element you meant, and a cropped image doesn't show where on the page the problem sits. Repeat that for ten issues and the markup work becomes the slowest part of a review.",
          },
          {
            type: 'p',
            text: "Annotating in place keeps everything attached. The drawing happens over the real page, the capture records where you were, and the result goes straight into a report you can export or turn into an issue. You never manage a folder of image files. Keyboard shortcuts keep the loop short: ⌥⇧S opens the toolbar, Enter captures, and ⌘/Ctrl+Enter saves, so marking up a page takes seconds rather than a trip through a separate app.",
          },
        ],
      },
      {
        heading: 'The drawing tools',
        blocks: [
          {
            type: 'p',
            text: 'Press **⌥⇧S** (Alt+Shift+S) and a toolbar appears over the page. Everything is drawn on top of the live site, so you can scroll and position annotations before you capture.',
          },
          {
            type: 'table',
            head: ['Tool', 'Good for'],
            rows: [
              ['Pen', 'Freehand circles and quick marks'],
              ['Highlighter', 'Copy edits and text that needs attention'],
              ['Arrow', 'Pointing at a small element such as an icon or a link'],
              ['Rectangle / ellipse', 'Grouping an area, such as a misaligned card row'],
              ['Text label', 'Short notes placed next to the problem'],
              ['Numbered pins', 'Several issues in one capture, referenced as 1, 2, 3 in the comment'],
              ['Redact', 'Pixelating emails, names or account numbers before sharing'],
            ],
          },
          {
            type: 'shot',
            screen: 'annotate',
            caption: 'A rectangle, arrow, numbered pin and text label marking a payment error on a live checkout page.',
          },
        ],
      },
      {
        heading: 'Capture modes for awkward pages',
        blocks: [
          {
            type: 'list',
            items: [
              "**Visible area** — what's on screen right now.",
              "**Full page** — scroll-and-stitch capture of the whole document. It also handles inner scrolling panels and SPA containers, where the page body doesn't scroll but a `div` inside it does, which trips up many full page screenshot extensions.",
              '**In 3 seconds** — a delayed capture so you can hover a menu, open a tooltip or trigger a focus state before the screenshot is taken.',
              "**Element** — capture one component on its own, cropped to its bounds.",
              "**Mobile · tablet · desktop** — Chrome device emulation renders the page at 390×844, 768×1024 and 1440×900 and combines them into one side-by-side image.",
            ],
          },
          {
            type: 'p',
            text: '“Interact with page” mode pauses the drawing layer so you can open a dropdown, expand an accordion or switch a tab first, then return to annotating. If you only need a plain full page image without an extension, our guide to a [full page screenshot in Chrome](/guides/full-page-screenshot-chrome) shows the built-in DevTools command.',
          },
          {
            type: 'shot',
            screen: 'breakpoints',
            caption: 'The breakpoints mode produces one image with mobile, tablet and desktop renders, useful for design reviews and responsive bugs.',
          },
        ],
      },
      {
        heading: 'Annotation with measurements, not just markup',
        blocks: [
          {
            type: 'p',
            text: "An arrow that says “too much space” invites a round of back-and-forth. Bugmark's element inspector lets you click the element and attach its CSS selector, rendered size and computed styles: font, color, background, padding, margin, border, radius and display. The designer's note and the actual values arrive together, which is usually enough for a developer to fix spacing or typography issues without opening the page. It also avoids a classic mix-up on component libraries, where the same card appears in several places: the selector says exactly which instance you meant.",
          },
          {
            type: 'p',
            text: 'After the fix, the **before/after** option adds a second screenshot to the same report, recaptured at the same scroll position, uploaded, or pasted from the clipboard, and shows both side by side.',
          },
          {
            type: 'shot',
            screen: 'beforeAfter',
            caption: 'Before and after screenshots of a card layout fix, displayed side by side in the report.',
          },
        ],
      },
      {
        heading: 'From annotated screenshot to shared report',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Open the toolbar with ⌥⇧S and pick a capture mode.',
              'Draw your annotations and redact anything sensitive.',
              'Press **Enter** to capture, then add a title and comment that references your numbered pins.',
              'Save with ⌘/Ctrl+Enter. The screenshot is stored in your local dashboard.',
              'Share it as a GitHub issue, a Markdown copy for Slack or Jira, or an exported HTML or PDF report.',
            ],
          },
          {
            type: 'p',
            text: "Each screenshot also carries steps to reproduce, console messages, network requests and environment details. You can ignore them for a pure design note, but they are there when an annotated “this looks broken” turns out to be a failed API call. The [bug reporting tool](/bug-reporting-tool) page explains that context in detail.",
          },
        ],
      },
      {
        heading: 'What it is not',
        blocks: [
          {
            type: 'p',
            text: "Bugmark is a **markup tool for websites** running in Chrome and Chromium browsers (Edge, Brave, Arc). It does not capture your desktop or other applications, it is not a general image editor with layers and filters, and it does not host images at a public link. Screenshots are stored in IndexedDB on your device and leave only when you export or create a GitHub issue. If you mostly annotate for client sign-off, the [website feedback tool](/website-feedback-tool) page covers white-label reports and review rounds.",
          },
          {
            type: 'callout',
            title: 'Redact before you capture',
            text: 'The redact tool pixelates the area in the captured image itself. Separately, secrets in the attached logs, such as tokens, passwords and Authorization headers, are masked automatically before saving.',
          },
        ],
      },
      {
        heading: 'Annotate your next screenshot in Chrome',
        blocks: [
          {
            type: 'p',
            text: 'Free with no account, no item limits and no required watermark. It installs in about a minute and works in Chrome, Edge, Brave and Arc, so the whole team can mark up pages the same way. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I annotate a screenshot in Chrome?',
        a: 'Chrome has no built-in annotation, so use an extension. With Bugmark, press Alt+Shift+S on the page, draw arrows, rectangles, numbered pins, highlights or text labels directly over the live site, then press Enter to capture. The annotated screenshot is saved to a local dashboard for export or sharing.',
      },
      {
        q: 'How do I take a full page screenshot of a page with an inner scrolling panel?',
        a: 'Many tools only stitch the document body, so apps with a scrolling container get cut off. Bugmark’s full page mode scrolls and stitches both the page and inner scrolling panels or SPA containers. Chrome DevTools also has a Capture full size screenshot command, but it does not annotate.',
      },
      {
        q: 'Can I screenshot a hover state or dropdown menu?',
        a: 'Yes. Use the delayed capture mode, which waits 3 seconds so you can hover a menu or open a tooltip before the screenshot is taken. Alternatively, switch to interact with page mode, open the dropdown, and then return to annotating and capture.',
      },
      {
        q: 'How do I hide sensitive information in a screenshot?',
        a: 'Use a redact or pixelate tool before sharing. Bugmark includes a redact tool that pixelates any area you draw over, such as names, emails or account numbers. Sensitive values in the attached network and console logs, including tokens and passwords, are masked automatically before the capture is saved.',
      },
      {
        q: 'Is Bugmark’s screenshot tool free?',
        a: 'Yes. Bugmark is free with every feature unlocked, including full page, element and breakpoint captures, annotation tools, redaction and exports. There is no account, no limit on the number of screenshots and no required watermark. It runs in Chrome, Edge, Brave and Arc.',
      },
    ],
    related: ['/website-feedback-tool', '/guides/full-page-screenshot-chrome', '/bug-reporting-tool', '/web-developer-tools'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 7. Network request logger
  // ---------------------------------------------------------------------------
  {
    slug: 'network-request-logger',
    kind: 'tool',
    title: 'Network Request Logger for Chrome with HAR Export',
    description:
      'A free network request logger for Chrome: capture requests, payloads, response bodies and console logs with every bug report, then export HAR or cURL.',
    h1: 'A network request logger that attaches API traffic to bug reports',
    eyebrow: 'network request logger',
    intro:
      "When a web app misbehaves, the answer is usually in a request: a 401, a malformed payload, a response missing a field. Bugmark logs recent network requests in the tab, including payloads and response bodies, and attaches them to every screenshot or recording.",
    primaryKeyword: 'network request logger',
    keywords: [
      'capture network requests chrome',
      'console log capture',
      'HAR file export',
      'API request debugging',
      'copy as curl chrome',
      'log fetch and xhr requests',
      'network log for bug report',
    ],
    hero: 'networkPayload',
    sections: [
      {
        heading: 'Why the Network panel is not enough for reports',
        blocks: [
          {
            type: 'p',
            text: "Chrome's Network panel only records while DevTools is open, clears on navigation unless “Preserve log” is ticked, and exporting a HAR is a multi-step process most non-developers have never done. So when a tester says “the save failed,” the one request that explains why was never recorded.",
          },
          {
            type: 'p',
            text: "Bugmark works as a **network request logger** that doesn't depend on anyone remembering to open DevTools. It keeps a rolling log of recent requests in the tab and snapshots it into the report when the bug is captured.",
          },
          {
            type: 'p',
            text: "Pairing that log with the screen matters as much as the log itself. A raw HAR from a busy single-page app can hold hundreds of entries with no indication of which one lines up with the error the user saw. In a Bugmark report the requests sit next to the annotated screenshot, the console output and the recorded clicks, so the timeline is clear: the user clicked Save, a `PUT` went out, a 422 came back, and the UI rendered nothing.",
          },
        ],
      },
      {
        heading: 'Exactly what is captured',
        blocks: [
          {
            type: 'p',
            text: 'Specific limits matter when you are deciding whether a log will contain what you need:',
          },
          {
            type: 'table',
            head: ['Data', 'Scope', 'Limit'],
            rows: [
              ['Method, URL, status, timing', 'fetch, XHR and resource requests', 'Last 150 requests'],
              ['Query params and request headers', 'fetch and XHR', '60 most recent'],
              ['Request payload (JSON, form data, FormData fields)', 'fetch and XHR', '60 most recent, up to 16 KB each'],
              ['Response headers and response body (text)', 'fetch and XHR', '60 most recent, up to 32 KB each'],
              ['Console messages', 'Tab console, JS errors, unhandled rejections', 'Last 150 messages'],
            ],
          },
          {
            type: 'p',
            text: 'In practice that covers the API calls of a typical page interaction many times over. Large file downloads or very big JSON responses beyond 32 KB will not be stored in full, so for those you would still reach for DevTools directly.',
          },
          {
            type: 'shot',
            screen: 'networkPayload',
            caption: 'A failed POST /api/payments/intents with its JSON request payload. Card fields were masked before the report was saved.',
          },
        ],
      },
      {
        heading: 'Working with the log',
        blocks: [
          {
            type: 'list',
            items: [
              '**Filter to failures** to jump straight to 4xx and 5xx responses.',
              '**Per-request detail view** with params, headers, payload and response body on separate panes.',
              "**Copy as cURL** to replay a request in a terminal, change a parameter, and confirm the fix against staging.",
              '**Download HAR** to open the whole log in Chrome DevTools → Network, or share it with a backend engineer who prefers their own tooling.',
              "**GitHub issues** include the failing requests in the issue body and commit the HAR file to the `bugmark-assets` branch.",
            ],
          },
          {
            type: 'shot',
            screen: 'networkResponse',
            caption: 'The response body of a 402 from the payments API, readable inside the report without reproducing the request.',
          },
          {
            type: 'p',
            text: 'Want to understand the manual equivalents? See [how to capture a HAR file in Chrome](/guides/how-to-capture-har-file-chrome) and [how to capture console logs](/guides/how-to-capture-console-logs).',
          },
        ],
      },
      {
        heading: 'Secret masking before anything is saved',
        blocks: [
          {
            type: 'p',
            text: "Network logs are the most sensitive part of any bug report. Bugmark replaces passwords, tokens, API keys, session IDs, card numbers and `Authorization` and `Cookie` headers with `[redacted]` in JSON keys, form fields and URL params before the capture is written to storage. Storage itself is local: IndexedDB in your browser, with nothing uploaded to Bugmark servers. The log leaves your machine only when you export a report or create a GitHub issue, and HAR exports come from the already-masked data.",
          },
          {
            type: 'callout',
            title: 'Review before you share',
            text: 'Masking targets common secret patterns. If your API uses unusual field names for sensitive data, open the request detail view and check the payload before exporting a report outside your team.',
          },
        ],
      },
      {
        heading: 'API request debugging, step by step',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Use the app normally with Bugmark installed; requests are logged in the background.',
              'When something fails, press ⌥⇧S and capture the screen showing the error.',
              'Open the Network tab of the capture and filter to failures.',
              'Read the payload and response body to see whether the client sent bad data or the server returned an error.',
              'Copy as cURL to reproduce, or download the HAR and attach it to the ticket.',
            ],
          },
          {
            type: 'p',
            text: "This workflow is especially useful for front-end and backend developers splitting responsibility for a bug: the payload settles whose side it is on. If the request body is wrong, the front end owns it; if the body is correct and the response is an unexpected error, it goes to the API team, with the exact input needed to reproduce it attached. For broader debugging workflows, including unhandled promise rejections, see the [debugging tool](/debugging-tool) page.",
          },
        ],
      },
      {
        heading: 'Limits worth knowing',
        blocks: [
          {
            type: 'p',
            text: "Bugmark is a logger for bug reports, not a proxy. It does not intercept or modify traffic, mock responses, throttle the connection or inspect traffic from other applications on your computer. It records requests from the Chrome tab it runs in, and the log is a rolling window rather than a complete history of your session. It runs in Chrome and Chromium browsers only. For deep inspection of your own traffic, DevTools or a dedicated proxy is the right tool; Bugmark's job is making sure the evidence exists when someone else hits the bug. Because the window is rolling, capture soon after the failure; on a chatty page that polls an API every few seconds, the relevant request can scroll out of the 150-request log if you wait several minutes.",
          },
        ],
      },
      {
        heading: 'Capture requests with every bug report',
        blocks: [
          {
            type: 'p',
            text: 'Free, no account, data stays on your device. Works in Chrome, Edge, Brave and Arc. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I capture network requests in Chrome?',
        a: 'Open DevTools, go to the Network panel, tick Preserve log and reproduce the issue; you can then export a HAR file. To capture requests without DevTools open, use an extension like Bugmark, which logs the last 150 requests in the tab and attaches payloads and responses to each bug report.',
      },
      {
        q: 'What is a HAR file?',
        a: 'A HAR (HTTP Archive) file is a JSON-formatted record of network requests made by a browser, including URLs, headers, timings and often bodies. Developers use it to analyze failed or slow requests. Bugmark can download captured network logs as a HAR file, which you can import into the Chrome DevTools Network panel.',
      },
      {
        q: 'Does Bugmark capture request and response bodies?',
        a: 'Yes, for fetch and XHR requests. The 60 most recent include query params, request headers, the request payload up to 16 KB, response headers and the text response body up to 32 KB. Older and resource requests in the 150-request log keep method, URL, status and timing.',
      },
      {
        q: 'Is it safe to share network logs in a bug report?',
        a: 'It can expose secrets if not handled carefully. Bugmark masks passwords, tokens, API keys, session IDs, card numbers and Authorization or Cookie headers with [redacted] before saving, and stores reports locally. Still review payloads with unusual sensitive field names before sharing a report outside your team.',
      },
      {
        q: 'Can I copy a captured request as cURL?',
        a: 'Yes. Open any request in a Bugmark report and use Copy as cURL. This gives you a command you can run in a terminal to replay the request, tweak parameters or headers, and verify a fix against a local or staging server. Masked values will need to be replaced with valid credentials.',
      },
    ],
    related: ['/debugging-tool', '/guides/how-to-capture-har-file-chrome', '/guides/how-to-capture-console-logs', '/web-developer-tools'],
    updated: '2026-09-17',
  },

  // ---------------------------------------------------------------------------
  // 8. QA testing tool
  // ---------------------------------------------------------------------------
  {
    slug: 'qa-testing-tool',
    kind: 'tool',
    title: 'QA Testing Tool for Manual Testers and Bug Reports',
    description:
      'A free QA testing tool for Chrome that speeds up manual testing: log bugs with steps, logs and screenshots, triage in a dashboard and export CSV for Jira.',
    h1: 'A QA testing tool that makes manual bug reporting faster',
    eyebrow: 'qa testing tool',
    intro:
      "Manual testers spend a surprising share of a session writing up what they found instead of testing. Bugmark records the steps, logs and environment while you test, so logging a bug takes a capture, a title and a priority.",
    primaryKeyword: 'QA testing tool',
    keywords: [
      'manual testing tool',
      'QA bug reporting',
      'test reporting tool',
      'reporting tool for testers',
      'exploratory testing tool',
      'regression testing evidence',
      'responsive testing chrome',
    ],
    hero: 'dashboard',
    sections: [
      {
        heading: 'The cost of writing bugs up by hand',
        blocks: [
          {
            type: 'p',
            text: "On an exploratory session a tester might find a dozen issues in an hour. For each one, the manual routine is: take a screenshot, crop it, open DevTools to check for errors, note the browser and window size, retrace the clicks to write steps, then paste it all into a ticket. At several minutes per bug, the write-up can take as long as the testing, and the steps are reconstructed from memory by the end of the session.",
          },
          {
            type: 'p',
            text: "Bugmark is a **manual testing tool** focused on that write-up. It doesn't manage test cases or run automated suites; it removes the clerical work from reporting what you find.",
          },
          {
            type: 'p',
            text: "There is a quality cost too. Steps written from memory skip the detail that turns out to matter, such as the filter applied two screens earlier or the checkbox left unticked. Environment details get omitted when a tester is in a hurry. And console errors are only included when someone thinks to look, which is exactly when the bug already seems technical. Automatic capture makes those details consistent across every report, not just the careful ones.",
          },
        ],
      },
      {
        heading: 'What a tester gets on every capture',
        blocks: [
          {
            type: 'list',
            items: [
              "**Recorded steps** — the last 30 actions in the tab, including which field you typed in (never the value), selects, checkboxes, form submits and SPA navigation. Edit them to remove detours before saving.",
              '**Console and network evidence** — the last 150 console messages with uncaught errors, and the last 150 network requests with payloads and responses for recent API calls, so developers can see whether a failure was front end or back end.',
              '**Environment** — URL, browser, OS, viewport, pixel ratio and scroll position, captured without anyone typing them.',
              '**Type and priority** — set on the capture panel and used for sorting, filtering and GitHub labels.',
              '**Video when needed** — record up to 5 minutes with narration for flows that are hard to describe.',
            ],
          },
          {
            type: 'shot',
            screen: 'heroCapture',
            caption: 'The capture panel: an annotated error, title, comment, priority, auto-recorded steps and an option to create a GitHub issue straight away.',
          },
        ],
      },
      {
        heading: 'A test session with Bugmark',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              'Open the build under test in Chrome and work through your charter or checklist.',
              'When something breaks, press **⌥⇧S**, pin the problem, add a title and priority, and save with ⌘/Ctrl+Enter. You are back to testing in under a minute.',
              'For responsive checks, use the **Mobile · tablet · desktop** capture to document the page at 390×844, 768×1024 and 1440×900 in one image.',
              'At the end of the session, open the dashboard, filter by site and status, sort by priority and tidy up titles inline.',
              'Export a CSV to import into Jira, Linear or a test management sheet, create GitHub issues individually, or send a single HTML report as the session summary.',
            ],
          },
          {
            type: 'shot',
            screen: 'dashboard',
            caption: 'The dashboard groups captures by site with search, status and type filters, and counts of recordings, network and console entries per item.',
          },
        ],
      },
      {
        heading: 'Verifying fixes and regressions',
        blocks: [
          {
            type: 'p',
            text: "Retesting is where evidence tends to get lost. With Bugmark, open the original report when a fix is deployed and add an **after** screenshot: recapture the page at the same scroll position, upload an image, or paste one. The report then shows before and after side by side, and you can mark the item resolved in the dashboard. Exported HTML and PDF reports carry the comparison, which is useful for release sign-off or for a client who needs proof that the issues from the last round were addressed.",
          },
          {
            type: 'shot',
            screen: 'beforeAfter',
            caption: 'Before and after captures of a layout fix, kept together in one report for sign-off.',
          },
        ],
      },
      {
        heading: 'Reports developers accept the first time',
        blocks: [
          {
            type: 'p',
            text: "The friction between QA and engineering usually comes from reports that can't be acted on. When each bug includes the failing request's status and response body, the console error and the exact sequence of actions, “works for me” gets much rarer. Developers can copy a request as cURL or download a HAR without asking the tester to reproduce anything. For guidance on the written part, share [how to write a bug report](/guides/how-to-write-a-bug-report) and the [steps to reproduce template](/guides/steps-to-reproduce-template) with your team, and point developers at the [network request logger](/network-request-logger) page for the details of what is captured.",
          },
        ],
      },
      {
        heading: 'Where it fits in a QA stack',
        blocks: [
          {
            type: 'table',
            head: ['Need', 'Bugmark', 'Use something else'],
            rows: [
              ['Logging bugs during manual or exploratory testing', 'Yes', '—'],
              ['Evidence: steps, logs, screenshots, video', 'Yes', '—'],
              ['Test case management and test runs', 'No', 'A test management tool'],
              ['Automated or end-to-end tests', 'No', 'A test automation framework'],
              ['Native Jira or Linear sync', 'Not yet; CSV and Markdown export', 'Your tracker’s own importer'],
              ['Shared team workspace', 'No; reports are local until exported', 'A hosted bug tracker'],
              ['Cross-browser testing in Firefox or Safari', 'No; Chromium browsers only', 'Native browser testing'],
            ],
          },
          {
            type: 'p',
            text: "That scope makes it easy to adopt alongside whatever you already use: nothing to migrate, and nothing to buy per tester. Captures are stored locally in each tester's browser and nothing is uploaded to Bugmark servers. For a shared record across a team, the usual pattern is to create GitHub issues or import the CSV export into your tracker at the end of each session, and use the JSON backup to move a tester's captures between machines.",
          },
        ],
      },
      {
        heading: 'Spend the session testing, not typing',
        blocks: [
          {
            type: 'p',
            text: 'Bugmark is free, with no account and every feature unlocked. Installation takes about a minute and works in Chrome, Edge, Brave and Arc. [Add Bugmark to Chrome — free](/install).',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a QA testing tool?',
        a: 'A QA testing tool is software that helps testers plan, run or report on tests. Categories include test case management, test automation frameworks and bug reporting tools. Bugmark sits in the reporting category: it speeds up manual and exploratory testing by capturing screenshots, steps, logs and environment details for each bug.',
      },
      {
        q: 'How can manual testers report bugs faster?',
        a: 'Automate the parts of the write-up that are clerical: steps to reproduce, browser and viewport, console errors and network failures. With Bugmark a tester captures and annotates the page, adds a title and priority, and saves; the context is attached automatically, and bugs can be exported in bulk at the end of a session.',
      },
      {
        q: 'Can I import Bugmark bug reports into Jira?',
        a: 'Yes, through export. Bugmark has no native Jira integration yet, but you can export reports as CSV and use Jira’s CSV importer, or copy an individual report as Markdown and paste it into a ticket. Exported HTML reports can also be attached to issues as supporting evidence.',
      },
      {
        q: 'Does Bugmark manage test cases or run automated tests?',
        a: 'No. Bugmark does not store test cases, track test runs or execute automated tests. It focuses on capturing and reporting bugs found during manual testing. Teams typically use it alongside a test management tool and an automation framework rather than instead of them.',
      },
      {
        q: 'How do I test a website at different screen sizes?',
        a: 'You can resize the window or use Chrome DevTools device mode. Bugmark adds a Mobile · tablet · desktop capture that renders the current page at 390×844, 768×1024 and 1440×900 using Chrome device emulation and combines them into one side-by-side image for quick responsive checks.',
      },
    ],
    related: ['/bug-reporting-tool', '/guides/steps-to-reproduce-template', '/network-request-logger', '/guides/how-to-write-a-bug-report'],
    updated: '2026-09-17',
  },
];
