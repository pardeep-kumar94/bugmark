import Link from 'next/link';
import { Logo } from './Logo';
import { site } from '@/lib/site';
import { guidePages, hrefOf } from '@/lib/content';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 sm:grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-mute">
            The free bug reporting &amp; debugging tool for Chrome. Screenshots, recordings, steps, console and network context in every report.
          </p>
        </div>
        <FooterCol title="Product" links={[
          { href: '/#product', label: 'Product' },
          { href: '/#developers', label: 'For developers' },
          { href: '/#workflow', label: 'GitHub & exports' },
          { href: '/#free', label: 'Free — every feature' },
          { href: site.installUrl, label: 'Download extension' },
        ]} />
        <FooterCol title="Tools" links={[
          { href: '/bug-reporting-tool', label: 'Bug reporting tool' },
          { href: '/web-developer-tools', label: 'Web developer tools' },
          { href: '/debugging-tool', label: 'Debugging tool' },
          { href: '/website-feedback-tool', label: 'Website feedback tool' },
          { href: '/network-request-logger', label: 'Network request logger' },
          { href: '/tools', label: 'All tools' },
        ]} />
        <FooterCol title="Resources" links={[
          { href: '/guides', label: 'All guides' },
          ...guidePages.slice(0, 3).map((p) => ({ href: hrefOf(p), label: p.title.split(' (')[0] })),
          { href: '/alternatives', label: 'Compare alternatives' },
        ]} />
        <FooterCol title="Company" links={[
          { href: '/#faq', label: 'FAQ' },
          { href: `mailto:${site.supportEmail}`, label: 'Contact support' },
          { href: '/privacy', label: 'Privacy policy' },
          { href: '/terms', label: 'Terms of service' },
        ]} />
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-3 border-t border-line pt-6 text-[13px] text-mute sm:flex-row">
          <span>© {year} {site.name}. All rights reserved.</span>
          <span>Chrome is a trademark of Google LLC.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="font-mono text-[12.5px] font-semibold text-ink">{title.toLowerCase()}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith('/') ? (
              <Link href={l.href} className="text-[14px] text-mute transition hover:text-ink">{l.label}</Link>
            ) : (
              <a href={l.href} className="text-[14px] text-mute transition hover:text-ink">{l.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
