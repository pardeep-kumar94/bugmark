import Image from 'next/image';
import { Reveal } from './Reveal';
import { Frame } from './Frame';
import { IconCheck, IconDownload, IconFile, IconIssue } from './icons';
import { screens, type Screen } from '@/lib/screens';

const cards: { icon: React.ReactNode; title: string; text: string; shot: Screen; points: string[] }[] = [
  {
    icon: <IconIssue />, title: 'Create GitHub issues',
    text: 'Turn any capture into an issue with labels, the annotated screenshot, recording, steps and failing requests.',
    shot: screens.githubDialog, points: ['Straight from the capture panel', 'Fine-grained token, stored locally'],
  },
  {
    icon: <IconFile />, title: 'Share a polished report',
    text: 'A single HTML file with a summary, an issue index and every screenshot. Opens anywhere, prints to PDF.',
    shot: screens.reportCover, points: ['Recordings embedded', 'White-label with your logo'],
  },
  {
    icon: <IconDownload />, title: 'Export for any tracker',
    text: 'CSV for Jira, Linear or Sheets, Markdown for Slack, and a HAR file for any request log.',
    shot: screens.exportDialog, points: ['HTML · PDF · CSV · Markdown', 'Backups include recordings'],
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">workflow</p>
          <h2 className="section-title mt-3">From “found it” to “fixed it” without the back-and-forth.</h2>
          <p className="section-lead">Triage everything in one dashboard, then send each issue where your team already works.</p>
        </Reveal>

        <Reveal className="mt-14">
          <Frame shot={screens.dashboard} chrome={false} sizes="(min-width: 1200px) 1120px, 100vw" />
        </Reveal>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 80} className="card flex flex-col overflow-hidden">
              <div className="p-6 pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent [&_svg]:h-[18px] [&_svg]:w-[18px]">{c.icon}</span>
                </div>
                <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">{c.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-dim">{c.text}</p>
                <ul className="mt-4 space-y-1.5">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[13.5px] text-ink-2"><IconCheck size={13} className="text-accent" />{p}</li>
                  ))}
                </ul>
              </div>
              <div className="relative mt-auto h-[230px] overflow-hidden border-t border-line bg-canvas">
                <Image src={c.shot.src} width={c.shot.w} height={c.shot.h} alt={c.shot.alt} sizes="(min-width: 768px) 380px, 100vw"
                  className="absolute left-1/2 top-5 w-[88%] -translate-x-1/2 rounded-lg border border-line-2 shadow-[var(--sh)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas to-transparent" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
