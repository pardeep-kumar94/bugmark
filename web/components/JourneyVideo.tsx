'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { track } from '@/lib/analytics';
import { crossedMilestones } from '@/lib/journey';
import { IconPlay } from './icons';

const SRC = '/video/journey.mp4';
const POSTER = '/video/journey-poster.jpg';

/**
 * The one-minute product tour: poster first, the video element itself is only given a `src`
 * (and only then fetches journey.mp4) once someone presses play — and play() is called
 * synchronously inside that click handler, on the same video element that stays mounted
 * throughout, so iOS Safari still treats it as a user gesture and doesn't need a second tap.
 */
export function JourneyVideo() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const fired = useRef<number[]>([]);

  function onPlayClick() {
    setPlaying(true);
    const v = videoRef.current;
    if (!v) return;
    if (!v.src) v.src = SRC;
    v.play().catch(() => {});
  }

  // Focus the <video> once the play button unmounts (controls appear), so focus never falls to <body>.
  useEffect(() => {
    if (playing) videoRef.current?.focus();
  }, [playing]);

  return (
    <div className="relative mx-auto mt-10 aspect-video max-w-4xl overflow-hidden rounded-[18px] border border-line bg-surface-2 shadow-[0_30px_90px_-40px_rgba(0,0,0,.35)]">
      <video
        ref={videoRef}
        poster={POSTER}
        controls={playing}
        playsInline
        preload="none"
        className={`h-full w-full ${playing ? '' : 'pointer-events-none opacity-0'}`}
        onPlay={() => {
          if (started.current) return;
          started.current = true;
          track('video_play', { video: 'journey' });
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          for (const m of crossedMilestones(fired.current, (v.currentTime / v.duration) * 100)) {
            fired.current.push(m);
            track('video_progress', { video: 'journey', percent: m });
          }
        }}
        onEnded={() => {
          if (completed.current) return;
          completed.current = true;
          track('video_complete', { video: 'journey' });
        }}
      />
      {!playing && (
        <button type="button" onClick={onPlayClick} aria-label="Play the one-minute Bugmark tour" className="group absolute inset-0">
          <Image src={POSTER} alt="" fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-ink/[.04] transition motion-reduce:transition-none group-hover:bg-ink/[.08]">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-accent text-on-accent shadow-[0_16px_40px_-12px_rgba(0,113,227,.6)] transition group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-focus-visible:ring-4 group-focus-visible:ring-accent/40">
              <IconPlay size={30} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
