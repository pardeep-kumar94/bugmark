import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});
const mk = (d: React.ReactNode) => function Icon({ size, ...p }: P) { return <svg {...base(size)} {...p}>{d}</svg>; };

export const IconPen = mk(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>);
export const IconHighlighter = mk(<><path d="m9 11-5 5v4h4l5-5" /><path d="m21 10-6.2 6.2a1.8 1.8 0 0 1-2.5 0l-4.5-4.5a1.8 1.8 0 0 1 0-2.5L14 3" /></>);
export const IconArrow = mk(<><path d="M5 19 19 5" /><path d="M9.5 5H19v9.5" /></>);
export const IconRect = mk(<rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />);
export const IconEllipse = mk(<ellipse cx="12" cy="12" rx="8.5" ry="6.5" />);
export const IconText = mk(<><path d="M5 7V5h14v2" /><path d="M12 5v14" /><path d="M9 19h6" /></>);
export const IconPin = mk(<><circle cx="12" cy="12" r="8.5" /><path d="M10.5 9.5 12.5 8v8" /></>);
export const IconRedact = mk(<><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M3.5 9.5h17M3.5 14.5h17M9.5 3.5v17M14.5 3.5v17" /></>);
export const IconInspect = mk(<><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /><path d="m9.5 9.5 6 2.2-2.6 1.1-1.1 2.6-2.3-5.9Z" /></>);
export const IconCursor = mk(<path d="M5 3.5 18.5 10l-6 1.6L9.8 17.5 5 3.5Z" />);
export const IconUndo = mk(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>);
export const IconX = mk(<path d="M18 6 6 18M6 6l12 12" />);
export const IconCheck = mk(<path d="M20 6 9 17l-5-5" />);
export const IconChevron = mk(<path d="m6 9 6 6 6-6" />);
export const IconArrowRight = mk(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconLock = mk(<><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>);
export const IconShield = mk(<><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconUserOff = mk(<><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20a6.5 6.5 0 0 1 10.3-5.3" /><path d="m16 16 5 5M21 16l-5 5" /></>);
export const IconFile = mk(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>);
export const IconFullPage = mk(<><rect x="6" y="2.5" width="12" height="19" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></>);
export const IconCode = mk(<><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /><path d="m13.5 5-3 14" /></>);
export const IconPalette = mk(<><path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3Z" /><circle cx="7.5" cy="11.5" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14.5" cy="7.5" r="1" /></>);
export const IconTimer = mk(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M10 2.5h4" /></>);
export const IconBriefcase = mk(<><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18" /></>);
export const IconUser = mk(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>);
export const IconBug = mk(<><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8M3.5 13H7M17 13h3.5M4.5 8.5 7.5 10M19.5 8.5 16.5 10M4.5 18.5l3-1.5M19.5 18.5l-3-1.5M12 12v6" /></>);
export const IconMegaphone = mk(<><path d="M3.5 10v4a1.5 1.5 0 0 0 1.5 1.5h2L13 19V5L7 8.5H5A1.5 1.5 0 0 0 3.5 10Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>);
export const IconTerminal = mk(<><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="m7.5 10 2.5 2-2.5 2M12.5 14.5h4" /></>);
export const IconMail = mk(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>);
export const IconSparkle = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z" />
  </svg>
);

export const IconPuzzle = mk(<path d="M10 3.5a2 2 0 0 1 4 0V5h3.5A1.5 1.5 0 0 1 19 6.5V10h1.5a2 2 0 0 1 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 0 0-4 0V19H6.5A1.5 1.5 0 0 1 5 17.5V14h1.5a2 2 0 0 0 0-4H5V6.5A1.5 1.5 0 0 1 6.5 5H10V3.5Z" />);

export const IconVideo = mk(<><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10.5 5-3v9l-5-3" /></>);
export const IconMic = mk(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>);
export const IconNetwork = mk(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" /></>);
export const IconDevices = mk(<><rect x="2.5" y="5" width="13" height="10" rx="1.5" /><path d="M6 19h6M9 15v4" /><rect x="17.5" y="8" width="4.5" height="11" rx="1" /></>);
export const IconSplit = mk(<><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M12 4.5v15" /><path d="m7 12 1.5 1.5L11 11M15 10.5l3 3M18 10.5l-3 3" /></>);
export const IconList = mk(<><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.6" /></>);
export const IconIssue = mk(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /></>);
export const IconDownload = mk(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4.5 17v1.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V17" /></>);
export const IconKey = mk(<><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></>);
export const IconKeyboard = mk(<><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" /></>);
export const IconConsole = mk(<><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M3 9h18M7 13l2 1.5L7 16M11.5 16h4" /></>);
export const IconArchive = mk(<><rect x="3" y="4.5" width="18" height="5" rx="1.5" /><path d="M5 9.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9.5M10 13h4" /></>);
