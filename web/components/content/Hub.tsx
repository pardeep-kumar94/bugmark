import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { IconArrowRight } from '@/components/icons';
import { type ContentPage, hrefOf, kindLabel } from '@/lib/content';
import { JsonLd, abs, breadcrumbLd, organizationLd } from '@/lib/seo';
import { plain } from './RichText';

export function Hub({ path, kicker, title, lead, pages, more }: { path: string; kicker: string; title: string; lead: string; pages: ContentPage[]; more?: { href: string; label: string }[] }) {
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationLd(),
      { '@type': 'CollectionPage', '@id': `${abs(path)}#main`, url: abs(path), name: title, description: lead, isPartOf: { '@id': `${abs('/')}#website` },
        mainEntity: { '@type': 'ItemList', itemListElement: pages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(hrefOf(p)), name: p.h1 })) } },
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: title, path }]),
    ],
  };
  return (
    <>
      <Nav />
      <main className="relative isolate overflow-hidden pb-24 pt-28 sm:pt-36">
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_30%,transparent_100%)]" />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="kicker">{kicker}</p>
          <h1 className="mt-3 max-w-3xl font-mono text-[34px] font-semibold leading-[1.08] tracking-[-0.05em] text-balance sm:text-[50px]">{title}</h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-dim">{lead}</p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={hrefOf(p)} className="card group flex h-full flex-col p-6 transition hover:border-line-2">
                  <span className="font-mono text-[11.5px] text-accent">{p.eyebrow}</span>
                  <h2 className="mt-2 font-mono text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{p.h1}</h2>
                  <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-dim">{plain(p.intro)}</p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-[13.5px] text-accent">Read {kindLabel[p.kind] === 'Guides' ? 'guide' : 'more'} <IconArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
                </Link>
              </li>
            ))}
          </ul>
          {more && (
            <div className="mt-12 flex flex-wrap gap-3">
              {more.map((m) => <Link key={m.href} href={m.href} className="btn-secondary !h-10 !text-[13px]">{m.label}<IconArrowRight size={14} /></Link>)}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <JsonLd data={ld} />
    </>
  );
}
