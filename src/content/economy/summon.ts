/**
 * Summon pools (Q13).
 *
 * The gacha is an **earnable reward cadence**, not a paywall: every token and gem
 * comes from playing. There is no real-money purchase anywhere in this game.
 *
 * Pity counters match the reference's "Legendary 18/55" meters — a guaranteed
 * ceiling on bad luck, per pool and per rarity.
 */
import type { SummonPoolDef } from '../schemas';
import { CARD_DEFS } from '../cards';

/** Everything a player can pull, by class. Enemy-only cards are excluded upstream. */
const summonable = CARD_DEFS.filter((c) => !c.enemyOnly);
const unitsOf = (...rarities: string[]) =>
  summonable
    .filter((c) => c.cardClass === 'unit' && rarities.includes(c.rarity))
    .map((c) => ({ cardId: c.id, weight: weightFor(c.rarity) }));

/**
 * Relative pull weights. Lower rarities dominate; pity does the heavy lifting for
 * the top end, which is what keeps the meters in the reference meaningful.
 */
function weightFor(rarity: string): number {
  switch (rarity) {
    case 'common':
      return 100;
    case 'uncommon':
      return 60;
    case 'rare':
      return 25;
    case 'epic':
      return 6;
    default:
      return 2;
  }
}

export const SUMMON_POOL_DEFS: readonly SummonPoolDef[] = [
  {
    id: 'pool.unit_t1',
    name: 'Unit 1-3★',
    tokenCurrency: 'token_unit_t1',
    cost: 1,
    entries: unitsOf('common', 'uncommon', 'rare'),
    pity: [{ rarity: 'rare', threshold: 12 }],
    x10Discount: 0.1,
  },
  {
    id: 'pool.unit_t2',
    name: 'Unit 3-5★',
    tokenCurrency: 'token_unit_t2',
    cost: 1,
    entries: unitsOf('rare', 'epic', 'legendary'),
    pity: [
      { rarity: 'epic', threshold: 15 },
      { rarity: 'legendary', threshold: 55 },
    ],
    x10Discount: 0.1,
  },
  {
    id: 'pool.unit_t3',
    name: 'Unit 4-5★',
    tokenCurrency: 'token_unit_t3',
    cost: 1,
    entries: unitsOf('epic', 'legendary'),
    pity: [{ rarity: 'legendary', threshold: 30 }],
    x10Discount: 0.1,
  },
  {
    id: 'pool.hero',
    name: 'Hero 3-5★',
    tokenCurrency: 'token_hero',
    cost: 1,
    entries: summonable
      .filter((c) => c.cardClass === 'hero')
      .map((c) => ({ cardId: c.id, weight: weightFor(c.rarity) })),
    pity: [{ rarity: 'legendary', threshold: 40 }],
    x10Discount: 0.1,
  },
];

/**
 * Fragments earned when a pull duplicates a card you already own, and the cost of
 * trading fragments for a card of your choosing. Duplicates are never dead: they
 * either feed an ascension or become fragments.
 */
export const DUPLICATE_FRAGMENTS: Readonly<Record<string, number>> = {
  common: 2,
  uncommon: 4,
  rare: 10,
  epic: 30,
  legendary: 80,
};

export const FRAGMENT_EXCHANGE_COST: Readonly<Record<string, number>> = {
  common: 20,
  uncommon: 45,
  rare: 120,
  epic: 400,
  legendary: 1200,
};
