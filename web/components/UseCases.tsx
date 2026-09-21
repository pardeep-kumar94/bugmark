import { Reveal } from './Reveal';
import { IconBriefcase, IconBug, IconMegaphone, IconUser } from './icons';

const cases = [
  { icon: <IconBriefcase />, who: 'Agencies & studios', what: 'Run structured client reviews, send branded reports, and get sign-off before launch — without adding seats to another tool.' },
  { icon: <IconUser />, who: 'Freelancers', what: 'Look professional from the first round of revisions. One tidy report replaces a dozen emails and screenshots.' },
  { icon: <IconBug />, who: 'QA & dev teams', what: 'File reproducible bugs with steps, payloads, responses and console errors, straight into GitHub issues.' },
  { icon: <IconMegaphone />, who: 'Marketing & content', what: 'Review landing pages and copy changes on staging, pin every tweak, and hand developers a clear list.' },
];

export function UseCases() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="kicker">who-it's-for</p>
            <h2 className="section-title mt-3">Made for people who ship websites.</h2>
          </div>
          <p className="max-w-sm text-[16px] leading-relaxed text-dim">Whether you’re reviewing one landing page or a 200-page redesign, the workflow stays the same.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c, i) => (
            <Reveal key={c.who} delay={i * 80} className="card group p-6 transition hover:-translate-y-1 hover:border-line-2">
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent [&_svg]:h-5 [&_svg]:w-5">{c.icon}</span>
              <h3 className="mt-5 text-[16.5px] font-semibold tracking-[-0.02em]">{c.who}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-dim">{c.what}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
