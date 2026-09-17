import { Reveal } from './Reveal';
import { IconLock, IconShield, IconUserOff } from './icons';

const points = [
  { icon: <IconLock />, t: 'Stored on your device', d: 'Screenshots, recordings and network logs live in your browser’s local storage. We don’t run servers that receive them.' },
  { icon: <IconShield />, t: 'Secrets masked automatically', d: 'Passwords, tokens, API keys, card numbers and auth headers become [redacted] before a request is saved.' },
  { icon: <IconUserOff />, t: 'No account required', d: 'Install and start capturing — it’s free. GitHub tokens never leave your browser.' },
];

export function Privacy() {
  return (
    <section className="border-y border-line bg-surface/40 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="kicker">private-by-design</p>
          <h2 className="section-title mt-3">Your client’s website stays your business.</h2>
          <p className="section-lead">
            Reviews happen on unreleased staging sites full of real data. Bugmark is local-first: nothing is uploaded unless you export a report or create an issue.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {points.map((p, i) => (
            <Reveal key={p.t} delay={i * 90} className="flex gap-4 rounded-2xl border border-line bg-canvas p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent [&_svg]:h-5 [&_svg]:w-5">{p.icon}</span>
              <div>
                <h3 className="font-mono text-[15px] font-semibold tracking-[-0.01em]">{p.t}</h3>
                <p className="mt-1 text-[14.5px] leading-relaxed text-dim">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
