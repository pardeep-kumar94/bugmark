import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${site.name}, the free bug reporting extension, and this website handle your data.`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="September 17, 2026">
      <p>
        {site.name} is built to be local-first. This policy explains what the {site.name} Chrome extension and this website do with
        information. {/* TODO: replace with your legal entity name and address, and have this reviewed before launch. */}
      </p>

      <h2>Summary</h2>
      <ul>
        <li>Screenshots, recordings, network and console logs, annotations and comments are stored only in your browser, on your device.</li>
        <li>We do not upload, sell or share the content you capture. It leaves your device only when you export it or create a GitHub issue.</li>
        <li>Passwords, tokens, API keys, card numbers and authorization headers are masked before network data is saved.</li>
        <li>The extension can send anonymous feature-usage counts (never page addresses or content). You can turn this off in Settings.</li>
        <li>This website uses Google Analytics for Firebase to measure visits. You can decline it in the banner.</li>
      </ul>

      <h2>Information the extension stores on your device</h2>
      <p>When you capture feedback, the extension saves the following locally in your browser’s storage (IndexedDB and extension storage):</p>
      <ul>
        <li>The annotated screenshot and a thumbnail</li>
        <li>Your title, comment, type, priority and status</li>
        <li>Page URL and title, viewport size, pixel ratio, scroll position, browser and operating system</li>
        <li>Screen recordings (video, tab audio and, if you allow it, your microphone)</li>
        <li>Up to 150 recent console messages and JavaScript errors from the page</li>
        <li>Up to 150 recent network requests: method, URL, status and timing, and for fetch/XHR calls the query parameters, request and response headers, request payload and response body (text only, capped at 16 KB / 32 KB). Values that look like passwords, tokens, API keys, session IDs or card numbers, and Authorization/Cookie headers, are replaced with “[redacted]” before saving. You can turn payload recording off in Settings.</li>
        <li>Steps to reproduce: the names of buttons, links and fields you interacted with and pages you visited. The text you type is never stored.</li>
        <li>Optional “after” screenshots you capture, upload or paste</li>
        <li>CSS selectors and computed styles for elements you choose to inspect</li>
        <li>Your settings, such as your name, branding and the position of the floating button</li>
      </ul>
      <p>This data never leaves your device unless you export a report or backup file and choose to share it. Uninstalling the extension removes it.</p>

      <h2>GitHub issues</h2>
      <p>
        If you connect GitHub, your access token is stored only in your browser’s extension storage. When you create an issue, the extension sends
        that item’s title, comment, steps, context, logs and (if enabled) its screenshot, recording and HAR file directly from your browser to GitHub’s
        API, into the repository you choose. We never receive your token or this content. GitHub’s own privacy terms apply to data stored there.
      </p>

      <h2 id="extension-analytics">Anonymous usage statistics in the extension</h2>
      <p>
        To learn which features are used, the extension sends anonymous events to Google Analytics (through Firebase), for example “screenshot captured”
        with the capture mode, “report exported” with the format, or “recording finished” with a rounded duration. Each event includes the extension
        version, your browser’s interface language, a random installation ID created by the extension and a session ID. It never includes page
        addresses or website names, page titles, screenshots, recordings, comments, console or network logs, GitHub repositories or tokens, or anything
        you type on a page. Switch it off at any time in <strong>Settings → Privacy → Share anonymous usage statistics</strong>. When you uninstall the
        extension, Chrome opens a short page on this website that records the uninstall and asks why.
      </p>

      <h2>Permissions the extension requests</h2>
      <ul>
        <li><strong>Access to websites</strong> — to show the feedback button and drawing tools on pages you review, and to capture the visible tab.</li>
        <li><strong>Storage & unlimited storage</strong> — to keep your screenshots locally on your device.</li>
        <li><strong>Scripting & active tab</strong> — to start annotating on tabs that were already open when you installed the extension.</li>
        <li><strong>Tab capture & offscreen documents</strong> — to record the current tab (and your microphone, if you allow it) when you start a recording.</li>
        <li><strong>Debugger</strong> — used only while you take a mobile · tablet · desktop capture, to render the page at those screen sizes. Chrome shows a notice while it runs.</li>
        <li><strong>Messages from {site.domain}</strong> — so our install page can show whether Bugmark is installed. No other website can talk to the extension.</li>
      </ul>

      <h2 id="website-analytics">This website</h2>
      <p>
        This website does not require an account. We use Google Analytics for Firebase to understand how visitors find and use the site: pages viewed,
        approximate location (country/city), device and browser type, referring site and campaign, scroll depth, clicks on buttons such as “Add to Chrome”,
        downloads and page-speed measurements. Google Analytics sets first-party cookies (such as <code>_ga</code>) to recognise returning visitors.
        IP addresses are not logged or stored by Google Analytics 4, Google signals and ad personalisation are turned off, and we don’t use this data for
        advertising. You can decline analytics in the cookie banner; to change your choice later, clear this site’s data in your browser. Google’s
        privacy policy applies to the data it processes on our behalf.
      </p>
      <p>If you email us, we use your message only to respond to you.</p>

      <h2>Contact</h2>
      <p>Questions about privacy? Reach us through the <a href={site.chromeStoreUrl} target="_blank" rel="noopener">Chrome Web Store listing</a>&rsquo;s support tab.</p>
    </LegalPage>
  );
}
