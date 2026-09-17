import Image from 'next/image';
import type { Screen } from '@/lib/screens';

/** A real product screenshot in a quiet window frame. */
export function Frame({ shot, url, className = '', priority = false, sizes = '(min-width: 1024px) 1100px, 100vw', chrome = true, caption }: {
  shot: Screen; url?: string; className?: string; priority?: boolean; sizes?: string; chrome?: boolean; caption?: React.ReactNode;
}) {
  return (
    <figure className={`group relative ${className}`}>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.4),0_30px_80px_-30px_rgba(0,0,0,.85)] sm:rounded-2xl">
        {chrome && (
          <div className="flex h-9 items-center gap-2 border-b border-white/[.07] bg-[#0c1015] px-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
            {url && (
              <span className="mx-auto hidden max-w-[60%] truncate rounded-md bg-white/[.05] px-3 py-1 font-mono text-[11px] text-mute sm:block">{url}</span>
            )}
          </div>
        )}
        <Image src={shot.src} width={shot.w} height={shot.h} alt={shot.alt} sizes={sizes} priority={priority} quality={90} className="block h-auto w-full" />
      </div>
      {caption && <figcaption className="mt-3 text-center font-mono text-[12px] text-mute">{caption}</figcaption>}
    </figure>
  );
}
