import { IconConsole, IconDevices, IconList, IconNetwork, IconPen, IconTerminal, IconVideo } from './icons';

const items = [
  { icon: <IconPen />, t: 'Annotated screenshot' },
  { icon: <IconVideo />, t: 'Screen recording' },
  { icon: <IconList />, t: 'Steps to reproduce' },
  { icon: <IconNetwork />, t: 'Requests & responses' },
  { icon: <IconConsole />, t: 'Console logs' },
  { icon: <IconTerminal />, t: 'Browser, OS & viewport' },
  { icon: <IconDevices />, t: 'Mobile · tablet · desktop' },
];

export function Included() {
  return (
    <section aria-label="What every report includes" className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-center font-mono text-[12px] uppercase tracking-[0.14em] text-mute">Every report includes</p>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
          {items.map((i) => (
            <li key={i.t} className="flex items-center justify-center gap-2 text-[13.5px] text-ink-2 lg:flex-col lg:gap-2.5 lg:text-center">
              <span className="text-accent [&_svg]:h-[18px] [&_svg]:w-[18px]">{i.icon}</span>{i.t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
