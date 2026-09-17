export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="bmMark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4ADE80" />
          <stop offset=".55" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#bmMark)" />
      <path d="M8.5 14V10.5a2 2 0 0 1 2-2H14M26 8.5h3.5a2 2 0 0 1 2 2V14M31.5 26v3.5a2 2 0 0 1-2 2H26M14 31.5h-3.5a2 2 0 0 1-2-2V26" stroke="#03140A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M15.2 18.6 12.6 17M14.8 22.4h-2.6M15.4 26 13 27.6M24.8 18.6l2.6-1.6M25.2 22.4h2.6M24.6 26l2.4 1.6M18.6 13.2 17 11.2M21.4 13.2l1.6-2" stroke="#03140A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="14.9" rx="2.9" ry="2.6" fill="#03140A" />
      <ellipse cx="20" cy="22.4" rx="5.2" ry="6.2" fill="#03140A" />
      <path d="M20 17.6v9.8" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-mono text-[16.5px] font-semibold tracking-[-0.04em] text-ink">bugmark<span className="text-accent">_</span></span>
    </span>
  );
}
