import Image from 'next/image';
import type { Screen } from '@/lib/screens';

/** A real product screenshot in a quiet window frame. */
export function Frame({ shot, url, className = '', priority = false, sizes = '(min-width: 1024px) 1100px, 100vw', chrome = true, caption }: {
  shot: Screen; url?: string; className?: string; priority?: boolean; sizes?: string; chrome?: boolean; caption?: React.ReactNode;
}) {
  return (
    <figure className={`group relative ${className}`}>
      <div className="overflow-hidden rounded-xl border border-line-2 bg-surface shadow-[var(--sh-lg)] sm:rounded-2xl">
        {chrome && (
          <div className="flex h-9 items-center gap-2 border-b border-line bg-surface-2 px-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            {url && (
              <span className="mx-auto hidden max-w-[60%] truncate rounded-md border border-line bg-surface px-3 py-1 font-mono text-[11px] text-mute sm:block">{url}</span>
            )}
          </div>
        )}
        <Image src={shot.src} width={shot.w} height={shot.h} alt={shot.alt} sizes={sizes} priority={priority} quality={90} className="block h-auto w-full" />
      </div>
      {caption && <figcaption className="mt-3 text-center text-[12px] text-mute">{caption}</figcaption>}
    </figure>
  );
}
