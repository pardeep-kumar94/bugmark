import { site } from './site';
import { faqs as homeFaqs } from '@/components/FAQ';

export const abs = (path: string) => (path.startsWith('http') ? path : `${site.url}${path.startsWith('/') ? '' : '/'}${path}`);

/** Primary keywords the site targets (see README → SEO). */
export const siteKeywords = [
  'bug reporting tool', 'free bug reporting tool', 'bug report chrome extension', 'developer tools', 'web developer tools',
  'debugging tool', 'web debugging tool', 'reporting tool', 'website feedback tool', 'visual bug tracking', 'screen recorder for bug reports',
  'console log capture', 'network request logger', 'HAR file', 'steps to reproduce', 'screenshot annotation tool', 'QA testing tool',
  'GitHub issues from screenshots', 'Jam alternative', 'Marker.io alternative', 'BugHerd alternative',
];

export const organizationLd = () => ({
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: site.name,
  url: site.url,
  logo: { '@type': 'ImageObject', url: abs('/logo.png'), width: 512, height: 512 },
  email: site.supportEmail,
  ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
});

export const websiteLd = () => ({
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: site.name,
  description: site.description,
  publisher: { '@id': `${site.url}/#organization` },
  inLanguage: 'en',
});

export const softwareLd = () => ({
  '@type': 'SoftwareApplication',
  '@id': `${site.url}/#software`,
  name: site.name,
  description: site.description,
  url: site.url,
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: 'Bug reporting & debugging tool',
  operatingSystem: 'Windows, macOS, Linux, ChromeOS',
  browserRequirements: 'Requires Google Chrome or a Chromium-based browser (Edge, Brave, Arc)',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  downloadUrl: abs(site.installUrl),
  screenshot: [abs('/screens/hero-capture.webp'), abs('/screens/network-payload.webp'), abs('/screens/dashboard.webp')],
  featureList: [
    'Annotated screenshots (visible, full page, delayed, element, mobile/tablet/desktop)',
    'Screen recording with microphone narration',
    'Automatic steps to reproduce',
    'Console log and JavaScript error capture',
    'Network requests with payloads and responses, secrets masked',
    'HAR export and Copy as cURL',
    'Create GitHub issues with screenshots, video and logs',
    'HTML, PDF, CSV and Markdown reports',
  ],
  publisher: { '@id': `${site.url}/#organization` },
});

export const faqLd = (items: { q: string; a: string }[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const breadcrumbLd = (crumbs: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const homeGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [organizationLd(), websiteLd(), softwareLd(), faqLd(homeFaqs)],
});

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
