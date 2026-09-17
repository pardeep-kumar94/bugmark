import { site } from '@/lib/site';
import { allPages, hrefOf, kindLabel } from '@/lib/content';

export const dynamic = 'force-static';

// https://llmstxt.org — a plain-text map of the site for AI assistants and answer engines.
export function GET() {
  const groups = (['tool', 'guide', 'alternative'] as const).map((k) =>
    `## ${kindLabel[k]}\n\n` + allPages.filter((p) => p.kind === k).map((p) => `- [${p.h1}](${site.url}${hrefOf(p)}): ${p.description}`).join('\n'));
  const body = `# ${site.name}

> ${site.description}

${site.name} is free (every feature, no account, no item limits). It is a Chrome extension (Chrome, Edge, Brave, Arc). Captures are stored locally in the browser.

Key facts:
- Annotated screenshots: visible area, full page, 3-second delay, element, and mobile/tablet/desktop breakpoints in one image
- Screen recording with microphone narration (up to 5 minutes)
- Automatic steps to reproduce, console logs and JavaScript errors
- Network requests with query params, headers, payloads and responses; passwords, tokens and auth headers masked
- HAR export, Copy as cURL, element inspector with CSS selectors
- Create GitHub issues with screenshots, video and logs; export HTML, PDF, CSV and Markdown reports

- [Install ${site.name}](${site.url}/install): download and add to Chrome in about a minute
- [Privacy policy](${site.url}/privacy)

${groups.join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
