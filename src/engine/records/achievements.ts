/**
 * Reading achievements off the profile (Q23).
 *
 * Nothing is tallied as the player goes: an achievement compares its target to a
 * metric derived from the save, so it is earned the moment the save says so. That
 * also means an achievement authored later is correctly already earned by a player
 * who did the thing months ago.
 */
import type { Content } from '@/content';
import type { AchievementDef, AchievementGroup } from '@/content/schemas';
import { ACHIEVEMENT_GROUPS } from '@/content/schemas';
import type { ProfileRecord } from './profile';

export interface AchievementState {
  def: AchievementDef;
  progress: number;
  target: number;
  earned: boolean;
  claimed: boolean;
  /** 0-1, for the progress bar on an unearned row. */
  ratio: number;
}

export function achievementStates(
  content: Content,
  record: ProfileRecord,
  claimedIds: readonly string[],
): AchievementState[] {
  const claimed = new Set(claimedIds);
  return [...content.achievements.values()].map((def) => {
    const progress = record.metrics[def.metric];
    return {
      def,
      progress,
      target: def.target,
      earned: progress >= def.target,
      claimed: claimed.has(def.id),
      ratio: def.target === 0 ? 1 : Math.min(1, progress / def.target),
    };
  });
}

/** Earned, paying something, and not yet taken. */
export function claimableAchievements(states: readonly AchievementState[]): AchievementState[] {
  return states.filter((s) => s.earned && !s.claimed && s.def.reward !== undefined);
}

export function groupAchievements(
  states: readonly AchievementState[],
): { group: AchievementGroup; states: AchievementState[] }[] {
  return ACHIEVEMENT_GROUPS.map((group) => ({
    group,
    // Earned but unclaimed first, then the ones closest to earning: the list
    // always opens on what the player can act on.
    states: states
      .filter((s) => s.def.group === group)
      .sort((a, b) => {
        const actionable = (s: AchievementState) => (s.earned && !s.claimed ? 0 : s.earned ? 2 : 1);
        const byAction = actionable(a) - actionable(b);
        return byAction !== 0 ? byAction : b.ratio - a.ratio;
      }),
  })).filter((entry) => entry.states.length > 0);
}

export function earnedCount(states: readonly AchievementState[]): number {
  return states.filter((s) => s.earned).length;
}
