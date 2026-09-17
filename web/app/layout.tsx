import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { site } from '@/lib/site';
import { siteKeywords } from '@/lib/seo';
import { Analytics } from '@/components/Analytics';
import './globals.css';

const defaultTitle = `${site.name} — Free Bug Reporting & Debugging Tool for Chrome`;
export const metaDescription = 'Free bug reporting & debugging tool for Chrome: annotated screenshots, screen recording, console logs and network requests in every report. No account.';
const ogTitle = `${site.name} — Free bug reporting tool developers can actually fix from`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: { default: defaultTitle, template: `%s · ${site.name}` },
  description: metaDescription,
  keywords: siteKeywords,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: 'Developer Tools',
  openGraph: { type: 'website', siteName: site.name, title: ogTitle, description: metaDescription, url: site.url, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: ogTitle, description: metaDescription },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#090b0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-dvh overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
