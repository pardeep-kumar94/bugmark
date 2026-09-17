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
        {site.name} is currently free to use, with every feature included and no account required. If we ever introduce paid features, we will
        announce them on this website in advance, and nothing you have already captured will be locked.
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
      <p>Email <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p>
    </LegalPage>
  );
}
