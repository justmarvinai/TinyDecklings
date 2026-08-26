import { z } from 'zod';
import { displayName, id, nonNegativeInt, positiveInt, ref } from './primitives';
import { statusId } from './effects';
import { ICON_KEYS } from './iconKeys';
import { element, statKey } from './stats';

/** Node types on the endless path (Q16). */
export const STAGE_KINDS = ['battle', 'elite', 'boss', 'event', 'treasure', 'camp'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];
export const stageKind = z.enum(STAGE_KINDS);

/** Stages that cost energy and run a fight; vignettes are free (Q14b). */
export const COMBAT_STAGE_KINDS = ['battle', 'elite', 'boss'] as const;
export function isCombatStage(kind: StageKind): boolean {
  return (COMBAT_STAGE_KINDS as readonly StageKind[]).includes(kind);
}

/** Which side of the board a modifier acts on. */
export const modifierSide = z.enum(['player', 'enemy']);
export type ModifierSide = z.infer<typeof modifierSide>;

/**
 * What a stage modifier actually does.
 *
 * Deliberately a small closed set that composes: a modifier is a list of these,
 * and a stage is a list of modifiers. Anything a modifier can do, a card or an
 * encounter boon can do too, so nothing here is bespoke engine logic (rule 3).
 */
export const modifierEffect = z.discriminatedUnion('kind', [
  /** Scales a stat for one side at battle start, e.g. enemies at +25% Attack. */
  z.strictObject({
    kind: z.literal('statScale'),
    side: modifierSide,
    stat: statKey,
    percent: z.number(),
  }),
  /** Opens the fight with a status already on one side. */
  z.strictObject({
    kind: z.literal('startingStatus'),
    side: modifierSide,
    status: statusId,
    stacks: positiveInt.default(1),
  }),
  /** Extra bodies in the enemy reinforcement queue — a longer fight, not a harder one. */
  z.strictObject({ kind: z.literal('extraReinforcements'), count: positiveInt }),
]);
export type ModifierEffect = z.infer<typeof modifierEffect>;

/**
 * A stage modifier (Phase 4): the twist printed on an elite or boss medallion.
 *
 * Modifiers are rolled per stage from the run seed, so the same save always meets
 * the same twist on the same node, and they stack as the road gets deeper.
 */
export const stageModifierDef = z.strictObject({
  id: id('modifier'),
  name: displayName,
  /** One line, shown on the stage sheet before the player commits energy. */
  description: z.string().min(1),
  iconKey: z.enum(ICON_KEYS),
  /** Node kinds allowed to roll this modifier. */
  appliesTo: z.array(stageKind).min(1),
  effects: z.array(modifierEffect).min(1),
  /** Extra payout for the extra risk, as a percentage of the stage's loot. */
  rewardBonusPercent: nonNegativeInt.default(0),
});
export type StageModifierDef = z.infer<typeof stageModifierDef>;

/** Which side of a fork a stage belongs to (Q2). */
export const forkBranch = z.enum(['a', 'b']);
export type ForkBranch = z.infer<typeof forkBranch>;

/**
 * A 2-way fork in the road (Q2).
 *
 * Branch A is simply the region's own plan for those stages; branch B replaces it
 * with a harder detour that pays more. Both sides occupy the same stage numbers
 * and rejoin afterwards, so the road stays a single numbered chain.
 */
export const forkDef = z.strictObject({
  /** 1-based index into the region's node plan where the road splits. */
  startIndex: positiveInt,
  /** Stages per branch before they rejoin — 1 to 3 (Q2). */
  length: z.number().int().min(1).max(3),
  /** Branch B's node kinds; must be exactly `length` long. */
  risky: z.array(stageKind).min(1).max(3),
  /** Extra payout on branch B, as a percentage of the stage's loot. */
  riskyRewardBonusPercent: nonNegativeInt.default(25),
});
export type ForkDef = z.infer<typeof forkDef>;

export const regionDef = z.strictObject({
  id: id('region'),
  name: displayName,
  /** Palette/backdrop token set for this biome. */
  themeToken: z.string().min(1),
  /** One line of flavour under the region name on the map header. */
  tagline: z.string().min(1),
  stageCount: positiveInt,
  /**
   * What sits on each stage of the region, in order. Authored rather than derived
   * so a biome's rhythm — where the elite lands, where you get to breathe — is a
   * content decision. Must be exactly `stageCount` long (checked by the registry).
   */
  nodePlan: z.array(stageKind).min(1),
  fork: forkDef.optional(),
  /** Name fragments the generator combines into stage names ("34. CORAL KEEP"). */
  nameTable: z.array(z.string().min(1)).min(4),
  enemyPool: z.array(ref('enemy')).min(1),
  elitePool: z.array(ref('enemy')).default([]),
  bossPool: z.array(ref('enemy')).default([]),
  eventPool: z.array(ref('encounter')).default([]),
  /** Modifiers elites and bosses in this biome may roll. */
  modifierPool: z.array(ref('modifier')).default([]),
  lootTable: ref('loot'),
  bossLootTable: ref('loot'),
  elementBias: element.optional(),
  /** Multiplier applied on top of the global difficulty curve. */
  difficultyScale: z.number().positive().default(1),
  /** Star totals that unlock this region's chests, ascending (Phase 4). */
  chestThresholds: z.array(positiveInt).default([]),
  /** Loot table paid out by each chest, in the same order as the thresholds. */
  chestLootTable: ref('loot').optional(),
});
export type RegionDef = z.infer<typeof regionDef>;

export const requirement = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('currency'), currency: z.string().min(1), amount: positiveInt }),
  z.strictObject({ kind: z.literal('hasCardClass'), cardClass: z.enum(['unit', 'hero']) }),
  z.strictObject({ kind: z.literal('minStage'), stage: positiveInt }),
]);
export type Requirement = z.infer<typeof requirement>;

export const weightedOutcome = z.strictObject({
  weight: positiveInt,
  description: z.string().min(1),
  rewards: z.array(ref('loot')).default([]),
  /**
   * A status carried into the next battle — a camp blessing, or a curse you
   * picked up taking the shortcut. Consumed by the first fight that follows.
   */
  carriedStatus: z
    .strictObject({ status: statusId, side: modifierSide, stacks: positiveInt })
    .optional(),
});
export type WeightedOutcome = z.infer<typeof weightedOutcome>;

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
        /** One line under the button explaining the trade. */
        hint: z.string().optional(),
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
  /** Compounding multiplier per completed pass over the authored regions. */
  perLoop: z.number().positive().default(1.6),
});

/** A generated stage as persisted in the run save (engine output, not authored). */
export const generatedStage = z.strictObject({
  number: positiveInt,
  kind: stageKind,
  regionId: ref('region'),
  name: z.string().min(1),
  seed: z.number().int(),
  /** An enemy group id on combat stages, an encounter id on vignettes. */
  encounterRef: z.string().min(1),
  difficultyBudget: z.number().positive(),
  elementBias: element.optional(),
  bestStars: z.number().int().min(0).max(3).default(0),
  modifiers: z.array(ref('modifier')).default([]),
  /** Extra payout from modifiers and the risky fork branch, as a percentage. */
  rewardBonusPercent: nonNegativeInt.default(0),
  /** Fork nodes offer a 2-way choice that rejoins the path (Q2). */
  forkOf: positiveInt.optional(),
  branch: forkBranch.optional(),
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

/**
 * How many stars a stage can be worth.
 *
 * Fights are scored out of three (Q17); a vignette has nothing to score, so
 * resolving one is worth a single star — it marks the node walked, and keeps
 * region star totals meaningful either side of a fork.
 */
export function maxStarsForKind(kind: StageKind): 1 | 3 {
  return isCombatStage(kind) ? 3 : 1;
}

/** The node kinds a region's road actually walks, for one side of its fork. */
export function regionPlanFor(region: RegionDef, branch: ForkBranch): StageKind[] {
  const plan = [...region.nodePlan];
  if (branch === 'b' && region.fork) {
    for (let i = 0; i < region.fork.length; i++) {
      plan[region.fork.startIndex - 1 + i] = region.fork.risky[i];
    }
  }
  return plan;
}

/** Best possible star total for a region, on one side of its fork. */
export function maxRegionStars(region: RegionDef, branch: ForkBranch): number {
  return regionPlanFor(region, branch).reduce((sum, kind) => sum + maxStarsForKind(kind), 0);
}

export const stageProgress = z.strictObject({
  bestStars: z.number().int().min(0).max(3),
  clears: nonNegativeInt,
});
