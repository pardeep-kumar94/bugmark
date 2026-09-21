import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { Frame } from '@/components/Frame';
import { IconArrowRight, IconCheck, IconChevron, IconPuzzle } from '@/components/icons';
import { screens } from '@/lib/screens';
import { InstallLink } from '@/components/InstallLink';
import { site } from '@/lib/site';
import { type ContentPage, hrefOf, kindIndex, kindLabel, pageByHref } from '@/lib/content';
import type { Block } from '@/lib/content/types';
import { JsonLd, abs, breadcrumbLd, faqLd, organizationLd, softwareLd } from '@/lib/seo';
import { RichText, plain, slugify } from './RichText';

const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export function wordCount(p: ContentPage) {
  const txt = [p.intro, ...p.sections.flatMap((s) => [s.heading, ...s.blocks.map(blockText)]), ...p.faqs.flatMap((f) => [f.q, f.a])].join(' ');
  return plain(txt).split(/\s+/).filter(Boolean).length;
}
function blockText(b: Block): string {
  switch (b.type) {
    case 'p': case 'callout': case 'code': return b.text;
    case 'list': return b.items.join(' ');
    case 'table': return [...b.head, ...b.rows.flat()].join(' ');
    case 'shot': return b.caption || '';
  }
}

export function ContentArticle({ page }: { page: ContentPage }) {
  const href = hrefOf(page);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: kindLabel[page.kind], path: kindIndex[page.kind] },
    { name: page.h1, path: href },
  ];
  const minutes = Math.max(3, Math.round(wordCount(page) / 230));
  const related = page.related.map((h) => ({ href: h, page: pageByHref(h) })).filter((r) => r.page);
  const hero = page.hero ? screens[page.hero] : null;

  const article = {
    '@type': page.kind === 'guide' ? 'TechArticle' : 'WebPage',
    '@id': `${abs(href)}#main`,
    url: abs(href),
    headline: page.h1,
    name: page.title,
    description: page.description,
    inLanguage: 'en',
    datePublished: page.updated,
    dateModified: page.updated,
    keywords: [page.primaryKeyword, ...page.keywords].join(', '),
    ...(hero ? { image: abs(hero.src) } : {}),
    author: { '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
    about: { '@id': `${site.url}/#software` },
    isPartOf: { '@id': `${site.url}/#website` },
  };
  const graph: unknown[] = [organizationLd(), softwareLd(), article, breadcrumbLd(crumbs), faqLd(page.faqs.map((f) => ({ q: f.q, a: plain(f.a) })))];
  if (page.howTo) {
    graph.push({
      '@type': 'HowTo',
      name: page.howTo.name,
      ...(page.howTo.totalTime ? { totalTime: page.howTo.totalTime } : {}),
      step: page.howTo.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: plain(s.text), url: `${abs(href)}#step-${i + 1}` })),
    });
  }

  return (
    <>
      <Nav />
      <main>
        <article>
          <header className="relative isolate overflow-hidden pb-10 pt-28 sm:pt-36">
            <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_30%,transparent_100%)]" />
            <div className="mx-auto max-w-3xl px-5 sm:px-8">
              <nav aria-label="Breadcrumb" className="font-mono text-[12.5px] text-mute">
                <ol className="flex flex-wrap items-center gap-1.5">
                  {crumbs.slice(0, -1).map((c) => (
                    <li key={c.path} className="flex items-center gap-1.5">
                      <Link href={c.path} className="hover:text-ink">{c.name.toLowerCase()}</Link><span aria-hidden>/</span>
                    </li>
                  ))}
                  <li aria-current="page" className="text-dim">{page.slug}</li>
                </ol>
              </nav>
              <p className="kicker mt-6">{page.eyebrow}</p>
              <h1 className="mt-3 font-mono text-[32px] font-semibold leading-[1.08] tracking-[-0.05em] text-ink text-balance sm:text-[48px]">{page.h1}</h1>
              <p className="mt-5 text-[18px] leading-relaxed text-dim text-pretty"><RichText text={page.intro} /></p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <InstallLink className="btn-primary"><IconPuzzle size={18} />Add to Chrome — free</InstallLink>
                <span className="font-mono text-[12.5px] text-mute">Updated {fmtDate(page.updated)} · {minutes} min read</span>
              </div>
            </div>
            {hero && (
              <div className="mx-auto mt-12 max-w-5xl px-3 sm:px-8">
                <Frame shot={hero} priority sizes="(min-width: 1024px) 960px, 100vw" />
              </div>
            )}
          </header>

          <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="font-mono text-[12px] font-semibold text-mute">on this page</p>
                <ol className="mt-3 space-y-2 border-l border-line">
                  {page.sections.map((s) => (
                    <li key={s.heading}><a href={`#${slugify(s.heading)}`} className="-ml-px block border-l border-transparent pl-3 text-[13.5px] leading-snug text-dim hover:border-accent hover:text-ink">{s.heading}</a></li>
                  ))}
                  <li><a href="#faq" className="-ml-px block border-l border-transparent pl-3 text-[13.5px] text-dim hover:border-accent hover:text-ink">FAQ</a></li>
                </ol>
              </div>
            </aside>

            <div className="min-w-0 max-w-3xl">
              {page.sections.map((s) => (
                <section key={s.heading} id={slugify(s.heading)} className="scroll-mt-24 pt-10 first:pt-0">
                  <h2 className="font-mono text-[24px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[28px]">{s.heading}</h2>
                  <div className="mt-5 space-y-5 text-[16.5px] leading-[1.75] text-ink-2">
                    {s.blocks.map((b, i) => <BlockView key={i} block={b} />)}
                  </div>
                </section>
              ))}

              {page.howTo && (
                <section id="steps" className="scroll-mt-24 pt-12">
                  <h2 className="font-mono text-[22px] font-semibold tracking-[-0.03em]">{page.howTo.name}</h2>
                  <ol className="mt-5 space-y-3">
                    {page.howTo.steps.map((st, i) => (
                      <li key={st.name} id={`step-${i + 1}`} className="card grid grid-cols-[auto_1fr] gap-4 p-4">
                        <span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/25 bg-accent/10 font-mono text-[13px] font-semibold text-accent">{i + 1}</span>
                        <div><h3 className="font-mono text-[15px] font-semibold text-ink">{st.name}</h3><p className="mt-1 text-[15px] leading-relaxed text-dim"><RichText text={st.text} /></p></div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <section id="faq" className="scroll-mt-24 pt-14">
                <h2 className="font-mono text-[24px] font-semibold tracking-[-0.035em] sm:text-[28px]">Frequently asked questions</h2>
                <div className="mt-5 divide-y divide-line border-y border-line">
                  {page.faqs.map((f, i) => (
                    <details key={f.q} className="group py-1" open={i === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-[16px] font-medium text-ink">
                        <h3>{f.q}</h3>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line-2 text-mute transition group-open:rotate-180 group-open:text-accent"><IconChevron size={14} /></span>
                      </summary>
                      <p className="pb-5 pr-10 text-[15.5px] leading-relaxed text-dim"><RichText text={f.a} /></p>
                    </details>
                  ))}
                </div>
              </section>

              <section id="get-started" className="mt-14 rounded-2xl border border-line bg-surface p-7 sm:p-9">
                <h2 className="font-mono text-[22px] font-semibold tracking-[-0.03em] sm:text-[26px]">Try Bugmark free — no account needed</h2>
                <ul className="mt-4 grid gap-2 text-[14.5px] text-ink-2 sm:grid-cols-2">
                  {['Screenshots & screen recording', 'Console & network logs', 'Steps to reproduce', 'GitHub issues & reports'].map((t) => (
                    <li key={t} className="flex items-center gap-2"><IconCheck size={14} className="text-accent" />{t}</li>
                  ))}
                </ul>
                <InstallLink className="btn-primary mt-6"><IconPuzzle size={18} />Add to Chrome — free</InstallLink>
              </section>

              {related.length > 0 && (
                <nav aria-label="Related" className="pt-14">
                  <h2 className="font-mono text-[18px] font-semibold tracking-[-0.02em]">Related</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {related.map(({ href: h, page: r }) => (
                      <li key={h}>
                        <Link href={h} className="card group flex h-full flex-col p-5 transition hover:border-line-2">
                          <span className="font-mono text-[11.5px] text-mute">{kindLabel[r!.kind].toLowerCase()}</span>
                          <span className="mt-1.5 font-mono text-[15px] font-semibold leading-snug text-ink">{r!.h1}</span>
                          <span className="mt-auto flex items-center gap-1 pt-3 text-[13px] text-accent">Read <IconArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': graph }} />
    </>
  );
}

function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case 'p':
      return <p><RichText text={b.text} /></p>;
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag className={`space-y-2.5 pl-6 ${b.ordered ? 'list-decimal marker:font-mono marker:text-accent' : 'list-disc marker:text-accent'}`}>
          {b.items.map((it, i) => <li key={i} className="pl-1"><RichText text={it} /></li>)}
        </Tag>
      );
    }
    case 'shot':
      return <div className="py-2"><Frame shot={screens[b.screen]} chrome={false} caption={b.caption} sizes="(min-width: 1024px) 760px, 100vw" /></div>;
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] border-collapse text-left text-[14.5px]">
            <thead className="bg-surface-2">
              <tr>{b.head.map((h) => <th key={h} scope="col" className="border-b border-line px-4 py-3 font-mono text-[12.5px] font-semibold text-ink">{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i} className="border-b border-line last:border-0 odd:bg-surface/40">
                  {row.map((cell, j) => j === 0
                    ? <th key={j} scope="row" className="px-4 py-3 align-top font-medium text-ink">{<RichText text={cell} />}</th>
                    : <td key={j} className="px-4 py-3 align-top text-dim"><RichText text={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl border border-line bg-[#0b0f14] p-4 font-mono text-[13px] leading-relaxed text-ink-2"><code>{b.text}</code></pre>
      );
    case 'callout':
      return (
        <div className="rounded-xl border border-accent/25 bg-accent/[.06] p-5">
          {b.title && <p className="font-mono text-[13px] font-semibold text-accent">{b.title}</p>}
          <p className={`${b.title ? 'mt-1.5 ' : ''}text-[15.5px] leading-relaxed text-ink-2`}><RichText text={b.text} /></p>
        </div>
      );
  }
}
