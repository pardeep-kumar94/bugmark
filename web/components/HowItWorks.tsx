import { Reveal } from './Reveal';
import { JourneyVideo } from './JourneyVideo';

const steps = [
  { n: '01', t: 'Add it to Chrome', d: 'Two clicks from the Chrome Web Store. No account, nothing to set up.' },
  { n: '02', t: 'Capture the bug', d: 'Click Bugmark on any page. Circle the problem on a screenshot, or record your screen.' },
  { n: '03', t: 'Send it', d: 'Bugmark attaches the steps you took and what went wrong in the page. Send it to GitHub or share the report.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker">how it works</p>
          <h2 className="section-title mt-3">See Bugmark in one minute</h2>
          <p className="section-lead">From spotting a bug to a report your developer can fix — no account, nothing to set up.</p>
        </div>

        <JourneyVideo />

        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 80} className="bg-surface p-7">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-accent">{s.n}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em]">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dim">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
