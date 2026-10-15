// When the on-site exit survey may appear. Pure (no DOM, no imports) so node --test covers it;
// ExitSurvey.tsx gathers the live values and asks canShow().

export const EXIT_SURVEY_KEY = 'bugmark:exit-survey'; // localStorage: ms timestamp of the last time it was shown
export const INSTALL_FLAG_KEY = 'bugmark:install-clicked'; // sessionStorage: '1' once an "Add to Chrome" link is clicked
export const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const DESKTOP_MIN_MS = 15_000; // time on site before exit intent counts
export const MOBILE_MIN_MS = 40_000; // visible time (plus one scroll) before the mobile prompt

const BLOCKED = ['/account', '/install', '/uninstalled', '/privacy', '/terms'];

export function isBlockedPath(path: string): boolean {
  return BLOCKED.some((p) => path === p || path.startsWith(`${p}/`));
}

export function parseLastShown(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function inCooldown(lastShown: number | null, now: number): boolean {
  return lastShown !== null && now - lastShown < COOLDOWN_MS;
}

export type ShowState = {
  path: string;
  lastShown: number | null;
  now: number;
  installClicked: boolean;
  extensionInstalled: boolean;
  consentPending: boolean;
  shownThisPage: boolean;
};

export function canShow(s: ShowState): boolean {
  return (
    !s.shownThisPage &&
    !s.installClicked &&
    !s.extensionInstalled &&
    !s.consentPending &&
    !isBlockedPath(s.path) &&
    !inCooldown(s.lastShown, s.now)
  );
}

/** A `mouseout` that leaves the window through its top edge (towards the tab bar / close button). */
export function isExitIntent(e: { clientY: number; relatedTarget: unknown }): boolean {
  return e.relatedTarget === null && e.clientY <= 0;
}
