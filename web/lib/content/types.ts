import type { screens } from '@/lib/screens';

export type ScreenKey = keyof typeof screens;

/**
 * Text fields support a tiny inline syntax: **bold**, `code` and [link text](/path or https://…).
 */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'shot'; screen: ScreenKey; caption?: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'code'; text: string; lang?: string }
  | { type: 'callout'; title?: string; text: string };

export type Section = { heading: string; blocks: Block[] };
export type Faq = { q: string; a: string };

export type PageKind = 'tool' | 'alternative' | 'guide';

export type ContentPage = {
  slug: string;              // URL segment, kebab-case, contains the primary keyword
  kind: PageKind;
  title: string;             // <title>, max ~60 characters, primary keyword near the start (site name is appended automatically)
  description: string;       // meta description, 140–160 characters
  h1: string;
  eyebrow: string;           // short label above the H1, e.g. "free bug reporting tool"
  intro: string;             // 1–3 sentence lead paragraph under the H1
  primaryKeyword: string;
  keywords: string[];        // 5–12 secondary / long-tail keywords
  hero?: ScreenKey;          // screenshot shown under the intro
  sections: Section[];
  faqs: Faq[];               // 4–6 questions, plain-text answers (used for FAQPage structured data)
  related: string[];         // 3–5 internal hrefs to other content pages, e.g. '/debugging-tool', '/guides/how-to-write-a-bug-report'
  updated: string;           // ISO date, e.g. '2026-09-17'
  howTo?: { name: string; totalTime?: string; steps: { name: string; text: string }[] }; // guides only (HowTo structured data)
  competitor?: string;       // alternatives only, e.g. 'Jam'
};
