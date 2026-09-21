import { site, ctaHref } from '@/lib/site';
import { IconChevron } from './icons';

const link = 'font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent';

/** `a` is plain text (also used for FAQPage structured data); `rich` optionally replaces it on the page. */
export const faqs: { q: string; a: string; rich?: React.ReactNode }[] = [
  {
    q: 'Is Bugmark really free?',
    a: 'Yes. Every feature is free: screenshots and annotation, screen recording, console and network logs, steps to reproduce, GitHub issues, and HTML, PDF and CSV exports. There is no account, no credit card, no item limit and no watermark.',
  },
  {
    q: 'How do I install Bugmark?',
    a: 'Click Add to Chrome to open the Chrome Web Store listing, then click “Add to Chrome” and confirm. It takes a few seconds — no account or sign-up required. It also works in Edge, Brave and Arc.',
    rich: <>Click <b className="font-medium text-ink-2">Add to Chrome</b> to open the <a className={link} href={ctaHref} target="_blank" rel="noopener">Chrome Web Store listing</a>, then click <b className="font-medium text-ink-2">Add to Chrome</b> and confirm. It takes a few seconds — no account or sign-up required. It also works in Edge, Brave and Arc.</>,
  },
  {
    q: 'Which browsers does Bugmark work in?',
    a: 'Google Chrome and most Chromium-based browsers that support Chrome extensions, such as Microsoft Edge, Brave and Arc.',
  },
  {
    q: 'What exactly does Bugmark record from the page?',
    a: 'At capture time it keeps the last 150 network requests (method, URL, status, timing, and for fetch/XHR calls the query params, headers, request payload and response body) plus the last 150 console messages, your recent clicks and page changes as steps to reproduce, and the URL, browser, OS and viewport. Request bodies are capped at 16 KB and responses at 32 KB. You can turn payload recording off in Settings.',
  },
  {
    q: 'Is it safe to capture network data on a production app?',
    a: 'Bugmark masks passwords, tokens, API keys, session IDs, card numbers and Authorization/Cookie headers with [redacted] before anything is saved, in JSON, form fields and URLs. It never stores what you type into fields for the steps. Everything stays on your device until you choose to export or send it. Values a server echoes back inside free text can’t be detected, so review a report before sharing it outside your team.',
  },
  {
    q: 'How do GitHub issues work?',
    a: 'Connect a fine-grained GitHub token in Settings (Issues and Contents read & write). Bugmark creates the issue from your browser with labels, steps, failing requests and console errors. Screenshots, recordings and HAR files are committed to a separate bugmark-assets branch so they display inside the issue. Your token is stored only in your browser.',
  },
  {
    q: 'Can I record video with my voice?',
    a: 'Yes. Start a recording from the capture menu, the toolbar popup or ⌥⇧R. Allow the microphone once to narrate. Recordings are up to 5 minutes, continue across page loads, play back in the report and can be attached to GitHub issues.',
  },
  {
    q: 'Is Bugmark a replacement for Chrome DevTools?',
    a: 'No — it complements DevTools. DevTools is where you debug; Bugmark captures the evidence at the moment a bug happens (screenshot or video, console, network payloads and steps) and packages it into a report or GitHub issue someone else can act on.',
    rich: <>No — it complements DevTools. DevTools is where you debug; Bugmark captures the evidence at the moment a bug happens (screenshot or video, console, network payloads and steps) and packages it into a report or GitHub issue someone else can act on. See <a className={link} href="/web-developer-tools">how it fits with other web developer tools</a>.</>,
  },
  {
    q: 'Do my clients or teammates need to install anything?',
    a: 'No. Reports export as a single self-contained HTML file that opens in any modern browser — screenshots included. You can also export PDF, CSV or Markdown for GitHub, Jira or Linear.',
  },
  {
    q: 'Where are my screenshots stored?',
    a: 'Locally, in your browser’s storage on your computer, including recordings and network logs. Bugmark doesn’t upload your captures to our servers. Data only leaves your device when you export a report or create a GitHub issue. You can export a backup at any time to move to another machine.',
  },
  {
    q: 'Does it work on localhost, staging and password-protected sites?',
    a: 'Yes. Bugmark captures exactly what you see in your tab, so it works anywhere you can open the page — including localhost, staging environments and apps behind a login.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-surface/40 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="kicker">faq</p>
          <h2 className="section-title mt-3">Questions, answered.</h2>
          <p className="section-lead">
            Something else on your mind? Email{' '}
            <a className={link} href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f, i) => (
            <details key={f.q} className="group py-1" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-[16px] font-medium tracking-[-0.01em] text-ink">
                <span><span className="mr-3 text-[12px] text-mute">{String(i + 1).padStart(2, '0')}</span>{f.q}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line-2 text-mute transition group-open:rotate-180 group-open:border-accent/40 group-open:text-accent">
                  <IconChevron size={14} />
                </span>
              </summary>
              <p className="pb-5 pl-9 pr-12 text-[15px] leading-relaxed text-dim">{f.rich ?? f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
