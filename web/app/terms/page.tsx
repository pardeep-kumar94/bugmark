import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: `Terms of service for ${site.name}, the free bug reporting and debugging Chrome extension, and this website.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="September 17, 2026">
      <p>
        These terms govern your use of the {site.name} Chrome extension and website. By installing or using {site.name}, you agree to them.
        {/* TODO: replace with your legal entity, governing law and have these terms reviewed by a lawyer before launch. */}
      </p>

      <h2>Price</h2>
      <p>
        {site.name} is free to try, with every feature unlocked and no account required; the free version keeps up to two saved reports at
        a time. A one-time payment of $15 (USD) unlocks unlimited reports permanently — there is no subscription and no recurring charge.
        Payments are processed by our payment provider, who acts as merchant of record. Nothing you have already captured is ever deleted
        by reaching a limit.
      </p>

      <h2>Your content</h2>
      <p>
        You own the screenshots, annotations and reports you create. Because they are stored locally on your device, you are responsible for backing
        them up and for having permission to capture the websites you review.
      </p>

      <h2>Acceptable use</h2>
      <p>Don’t use {site.name} to capture or distribute content you don’t have the right to share, or to break the law.</p>

      <h2>Availability and changes</h2>
      <p>
        We work hard to keep {site.name} reliable, but the service is provided “as is” without warranties. We may update features, pricing or these
        terms; material changes will be announced on this website.
      </p>

      <h2>Limitation of liability</h2>
      <p>To the extent permitted by law, {site.name} is not liable for indirect or consequential losses, including loss of data.</p>

      <h2>Contact</h2>
      <p>Reach us through the <a href={site.chromeStoreUrl} target="_blank" rel="noopener">Chrome Web Store listing</a>&rsquo;s support tab.</p>
    </LegalPage>
  );
}
