/**
 * Summoning (Q13).
 *
 * Weighted pulls with **pity counters**: each pool tracks how many summons have
 * passed without a given rarity, and once the threshold is reached the next pull is
 * forced to that rarity. That is the reference's "Legendary 18/55" meter — a hard
 * ceiling on bad luck.
 *
 * Everything here is earnable in play. There is no real-money path, so the maths
 * only has to be fair, not profitable.
 */
import type { CardRarity, SummonPoolDef } from '@/content/schemas';
import type { Rng } from '../rng';

/** Pulls since the last hit, per rarity, for one pool. */
export type PityCounters = Partial<Record<CardRarity, number>>;

export interface SummonResult {
  cardId: string;
  rarity: CardRarity;
  /** True when a pity threshold forced this rarity. */
  fromPity: boolean;
  pity: PityCounters;
}

export interface PoolLike {
  entries: readonly { cardId: string; weight: number }[];
  pity: readonly { rarity: CardRarity; threshold: number }[];
}

/** Rarity lookup for pool entries; injected so the engine stays content-agnostic. */
export type RarityOf = (cardId: string) => CardRarity | undefined;

/**
 * The rarity a pity counter is about to force, if any.
 *
 * When several are due, the rarest wins — a player owed both an Epic and a
 * Legendary should get the Legendary.
 */
function dueRarity(
  pool: PoolLike,
  pity: PityCounters,
  order: readonly CardRarity[],
): CardRarity | null {
  let best: CardRarity | null = null;
  let bestIndex = -1;

  for (const rule of pool.pity) {
    const count = pity[rule.rarity] ?? 0;
    if (count + 1 < rule.threshold) continue;
    const index = order.indexOf(rule.rarity);
    if (index > bestIndex) {
      best = rule.rarity;
      bestIndex = index;
    }
  }
  return best;
}

const RARITY_ORDER: readonly CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** One pull. Returns the card, whether pity forced it, and the updated counters. */
export function summonOnce(
  pool: PoolLike,
  pity: PityCounters,
  rarityOf: RarityOf,
  rng: Rng,
): SummonResult {
  const forced = dueRarity(pool, pity, RARITY_ORDER);

  const candidates = forced
    ? pool.entries.filter((e) => rarityOf(e.cardId) === forced)
    : pool.entries;

  // A pity rarity with nothing to give falls back to the whole pool rather than
  // throwing — content should prevent this, and the registry checks for it.
  const usable = candidates.length > 0 ? candidates : pool.entries;
  const entry = rng.pickWeighted(usable, (e) => e.weight);
  const rarity = rarityOf(entry.cardId) ?? 'common';

  // Every rarity's counter advances, and the one that landed resets. Anything
  // rarer than what landed also resets, since a Legendary satisfies an Epic debt.
  const next: PityCounters = {};
  const landedIndex = RARITY_ORDER.indexOf(rarity);
  for (const rule of pool.pity) {
    const ruleIndex = RARITY_ORDER.indexOf(rule.rarity);
    next[rule.rarity] = landedIndex >= ruleIndex ? 0 : (pity[rule.rarity] ?? 0) + 1;
  }

  return { cardId: entry.cardId, rarity, fromPity: forced !== null, pity: next };
}

/** A batch pull (the reference's ×10), carrying pity forward across the batch. */
export function summonMany(
  pool: PoolLike,
  pity: PityCounters,
  rarityOf: RarityOf,
  rng: Rng,
  count: number,
): { results: SummonResult[]; pity: PityCounters } {
  let carried = pity;
  const results: SummonResult[] = [];
  for (let i = 0; i < count; i++) {
    const result = summonOnce(pool, carried, rarityOf, rng);
    carried = result.pity;
    results.push(result);
  }
  return { results, pity: carried };
}

/** Token cost of a batch, applying the pool's bulk discount. */
export function summonCost(pool: SummonPoolDef, count: number): number {
  const raw = pool.cost * count;
  if (count < 10) return raw;
  return Math.max(1, Math.round(raw * (1 - pool.x10Discount)));
}

/** How far along a pity meter is, for the HUD bars in the reference. */
export function pityProgress(
  pool: PoolLike,
  pity: PityCounters,
): { rarity: CardRarity; count: number; threshold: number }[] {
  return pool.pity.map((rule) => ({
    rarity: rule.rarity,
    count: Math.min(pity[rule.rarity] ?? 0, rule.threshold),
    threshold: rule.threshold,
  }));
}
