import { Reveal } from './Reveal';

const steps = [
  { n: '01', t: 'Capture', d: <>Press <span className="kbd">⌥⇧S</span> to mark up a screenshot or <span className="kbd">⌥⇧R</span> to record. Works on any page you can open.</> },
  { n: '02', t: 'Context is attached', d: 'Steps, console, network payloads and responses, browser, OS and viewport are added automatically.' },
  { n: '03', t: 'Ship the fix', d: 'Create a GitHub issue, export for your tracker or share a report. Add an “after” shot when it’s done.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
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
