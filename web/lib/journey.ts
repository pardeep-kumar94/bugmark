// Progress milestones for the journey film's analytics (video_progress).
export const MILESTONES = [25, 50, 75] as const;

/** Milestones reached at `percent` that haven't been reported yet, in order. */
export function crossedMilestones(fired: readonly number[], percent: number): number[] {
  if (!Number.isFinite(percent)) return [];
  return MILESTONES.filter((m) => percent >= m && !fired.includes(m));
}
