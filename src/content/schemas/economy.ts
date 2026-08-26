import { z } from 'zod';
import { displayName, id, nonNegativeInt, numberRange, positiveInt, ref } from './primitives';
import { CARD_RARITIES } from './rarity';
import { STAGE_KINDS } from './map';
import { gearRarity, gearSlot } from './gear';

/**
 * Currencies (Q13/Q14b/Q15).
 * Summon tokens and gems are fully earnable — there is no real-money IAP.
 * The reference HUD's red-swords counter is deliberately absent (Q15a).
 */
export const CURRENCY_IDS = [
  'gold',
  'gems',
  'energy',
  'token_unit_t1',
  'token_unit_t2',
  'token_unit_t3',
  'token_hero',
  'fragment',
  'tome',
] as const;
export type CurrencyId = (typeof CURRENCY_IDS)[number];
export const currencyId = z.enum(CURRENCY_IDS);

export const rewardDef = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('currency'), currency: currencyId, amount: numberRange }),
  z.strictObject({ kind: z.literal('cardXp'), amount: numberRange }),
  z.strictObject({
    kind: z.literal('gearDrop'),
    slots: z.array(gearSlot).min(1),
    rarityWeights: z.partialRecord(gearRarity, positiveInt),
  }),
  z.strictObject({ kind: z.literal('card'), cardId: ref('card') }),
  z.strictObject({ kind: z.literal('fragment'), cardId: ref('card'), amount: numberRange }),
]);
export type RewardDef = z.infer<typeof rewardDef>;

export const lootTableDef = z.strictObject({
  id: id('loot'),
  /** Always granted. */
  guaranteed: z.array(rewardDef).default([]),
  /** Weighted rolls; `rolls` picks are drawn from `entries`. */
  rolls: nonNegativeInt.default(0),
  entries: z.array(z.strictObject({ weight: positiveInt, reward: rewardDef })).default([]),
});
export type LootTableDef = z.infer<typeof lootTableDef>;

export const summonPoolDef = z.strictObject({
  id: id('pool'),
  name: displayName,
  tokenCurrency: currencyId,
  cost: positiveInt,
  entries: z.array(z.strictObject({ cardId: ref('card'), weight: positiveInt })).min(1),
  /** Pity counters, as in the reference's "Legendary 18/55". */
  pity: z
    .array(z.strictObject({ rarity: z.enum(CARD_RARITIES), threshold: positiveInt }))
    .default([]),
  /** Discount ratio on a x10 pull (0.1 = -10%). */
  x10Discount: z.number().min(0).max(0.5).default(0),
});
export type SummonPoolDef = z.infer<typeof summonPoolDef>;

/**
 * Energy pacing (Q14, owner chose option b).
 *
 * Generous and fast-refilling: pacing without a hard wall. Regen is derived lazily
 * from a stored anchor via an injected clock — the engine never reads Date.now
 * (CLAUDE.md rule 7). Rewards may push current energy above the cap, and regen
 * pauses while above it.
 */
export const energyConfig = z.strictObject({
  cap: positiveInt,
  regenSeconds: positiveInt,
  costs: z.record(z.enum(STAGE_KINDS), nonNegativeInt),
});
export type EnergyConfig = z.infer<typeof energyConfig>;

/** Level/XP growth curve referenced by cards. */
export const growthCurveDef = z.strictObject({
  id: id('growth'),
  /** Multiplied into base stats per level beyond 1. */
  statPerLevel: z.number().positive(),
  /** XP needed for level n: base * n^exponent. */
  xpBase: positiveInt,
  xpExponent: z.number().positive(),
  /** Level cap = starsToCap * stars (Q8). */
  levelsPerStar: positiveInt,
});
export type GrowthCurveDef = z.infer<typeof growthCurveDef>;
