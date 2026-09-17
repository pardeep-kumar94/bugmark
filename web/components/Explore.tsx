import Link from 'next/link';
import { alternativePages, guidePages, hrefOf, toolPages } from '@/lib/content';

/** Internal links to the tool, guide and comparison pages (helps visitors and search engines discover them). */
export function Explore() {
  const cols = [
    { title: 'tools', href: '/tools', pages: toolPages },
    { title: 'guides', href: '/guides', pages: guidePages },
    { title: 'compare', href: '/alternatives', pages: alternativePages },
  ];
  return (
    <section id="explore" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="kicker">explore</p>
        <h2 className="section-title mt-3">Learn more about bug reporting &amp; debugging</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <Link href={c.href} className="font-mono text-[13px] font-semibold text-accent hover:underline">{c.title} →</Link>
              <ul className="mt-4 space-y-2.5">
                {c.pages.map((p) => (
                  <li key={p.slug}><Link href={hrefOf(p)} className="text-[15px] text-dim transition hover:text-ink">{p.h1}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
