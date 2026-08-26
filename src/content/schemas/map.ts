import { z } from 'zod';
import { displayName, id, nonNegativeInt, positiveInt, ref } from './primitives';
import { element } from './stats';

/** Node types on the endless path (Q16). The slice ships battle + boss. */
export const STAGE_KINDS = ['battle', 'elite', 'boss', 'event', 'treasure', 'camp'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];
export const stageKind = z.enum(STAGE_KINDS);

/** Stages that cost energy and run a fight; vignettes are free (Q14b). */
export const COMBAT_STAGE_KINDS = ['battle', 'elite', 'boss'] as const;
export function isCombatStage(kind: StageKind): boolean {
  return (COMBAT_STAGE_KINDS as readonly StageKind[]).includes(kind);
}

export const regionDef = z.strictObject({
  id: id('region'),
  name: displayName,
  /** Palette/backdrop token set for this biome. */
  themeToken: z.string().min(1),
  stageCount: positiveInt,
  /** Name fragments the generator combines into stage names ("34. CORAL KEEP"). */
  nameTable: z.array(z.string().min(1)).min(4),
  enemyPool: z.array(ref('enemy')).min(1),
  elitePool: z.array(ref('enemy')).default([]),
  bossPool: z.array(ref('enemy')).default([]),
  eventPool: z.array(ref('encounter')).default([]),
  lootTable: ref('loot'),
  elementBias: element.optional(),
  /** Multiplier applied on top of the global difficulty curve. */
  difficultyScale: z.number().positive().default(1),
});
export type RegionDef = z.infer<typeof regionDef>;

export const requirement = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('currency'), currency: z.string().min(1), amount: positiveInt }),
  z.strictObject({ kind: z.literal('hasCardClass'), cardClass: z.enum(['unit', 'hero']) }),
  z.strictObject({ kind: z.literal('minStage'), stage: positiveInt }),
]);

export const weightedOutcome = z.strictObject({
  weight: positiveInt,
  description: z.string().min(1),
  rewards: z.array(ref('loot')).default([]),
  /** Statuses carried into the next battle — risk/reward events. */
  appliesStatus: z.string().optional(),
});

export const encounterDef = z.strictObject({
  id: id('encounter'),
  kind: z.enum(['event', 'treasure', 'camp']),
  title: displayName,
  /** Prose, rendered in normal case — caps hurt readability here (rule 9). */
  prompt: z.string().min(1),
  choices: z
    .array(
      z.strictObject({
        label: displayName,
        requires: requirement.optional(),
        outcomes: z.array(weightedOutcome).min(1),
      }),
    )
    .min(1)
    .max(3),
});
export type EncounterDef = z.infer<typeof encounterDef>;

/** Difficulty budget curve for the endless path. */
export const difficultyCurve = z.strictObject({
  id: id('difficulty'),
  base: positiveInt,
  /** Compounding growth per stage (1.06 = +6% per stage). */
  perStage: z.number().positive(),
  /** Extra multiplier on elite and boss nodes. */
  eliteMultiplier: z.number().positive().default(1.4),
  bossMultiplier: z.number().positive().default(2),
});

/** A generated stage as persisted in the run save (engine output, not authored). */
export const generatedStage = z.strictObject({
  number: positiveInt,
  kind: stageKind,
  regionId: ref('region'),
  name: z.string().min(1),
  seed: z.number().int(),
  encounterRef: z.string().min(1),
  difficultyBudget: z.number().positive(),
  elementBias: element.optional(),
  bestStars: z.number().int().min(0).max(3).default(0),
  /** Fork nodes offer a 2-way choice that rejoins the path (Q2, Phase 4). */
  forkOf: positiveInt.optional(),
});
export type GeneratedStage = z.infer<typeof generatedStage>;

/** Star rating rules (Q17): 3* flawless, 2* at most two deaths, 1* any win. */
export const STAR_RULES = { flawlessDeaths: 0, twoStarMaxDeaths: 2 } as const;

export function starsForResult(won: boolean, alliesLost: number): 0 | 1 | 2 | 3 {
  if (!won) return 0;
  if (alliesLost <= STAR_RULES.flawlessDeaths) return 3;
  if (alliesLost <= STAR_RULES.twoStarMaxDeaths) return 2;
  return 1;
}

export const stageProgress = z.strictObject({
  bestStars: z.number().int().min(0).max(3),
  clears: nonNegativeInt,
});
