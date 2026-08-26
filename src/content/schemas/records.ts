import { z } from 'zod';
import { displayName, id, positiveInt } from './primitives';
import { rewardDef } from './economy';
import { ICON_KEYS } from './iconKeys';

/**
 * The named numbers an achievement may test (Phase 5).
 *
 * A closed set on purpose. Every one is *derived* from the save by
 * `engine/records/profile.ts` rather than tallied as the player goes, so an
 * achievement is a data entry naming a metric and a target — never engine work
 * (CLAUDE.md rule 3).
 */
export const PROFILE_METRICS = [
  'furthestStage',
  'stagesCleared',
  'totalStars',
  'flawlessClears',
  'battlesWon',
  'regionsCleared',
  'chestsOpened',
  'vignettesResolved',
  'riskyForksWalked',
  'distinctCards',
  'heroesOwned',
  'legendaryCards',
  'sixStarCards',
  'highestCardLevel',
  'gearOwned',
  'fullyGearedCards',
  'summonsMade',
  'goldHeld',
] as const;
export type ProfileMetric = (typeof PROFILE_METRICS)[number];
export const profileMetric = z.enum(PROFILE_METRICS);

/** How achievements are grouped on the profile screen. */
export const ACHIEVEMENT_GROUPS = ['journey', 'collection', 'mastery'] as const;
export type AchievementGroup = (typeof ACHIEVEMENT_GROUPS)[number];

/**
 * Achievements-lite (Q23).
 *
 * Recognition first, with a small earned payout attached — like everything else in
 * this game, in currency the player earns (CLAUDE.md rule 12).
 */
export const achievementDef = z.strictObject({
  id: id('achievement'),
  name: displayName,
  /** One line, written so it reads as an instruction before it is earned. */
  description: z.string().min(1),
  iconKey: z.enum(ICON_KEYS),
  group: z.enum(ACHIEVEMENT_GROUPS),
  metric: profileMetric,
  target: positiveInt,
  reward: rewardDef.optional(),
});
export type AchievementDef = z.infer<typeof achievementDef>;
