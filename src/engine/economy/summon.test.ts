import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import type { CardRarity } from '@/content/schemas';
import { createRng } from '../rng';
import {
  pityProgress,
  poolOdds,
  summonCost,
  summonMany,
  summonOnce,
  type PityCounters,
  type PoolLike,
} from './summon';

const rarityOf = (cardId: string): CardRarity | undefined => CONTENT.cards.get(cardId)?.rarity;
const pool = (id: string) => CONTENT.summonPools.get(id)!;

const t2 = pool('pool.unit_t2');
const t1 = pool('pool.unit_t1');
const hero = pool('pool.hero');

describe('pools are coherent', () => {
  it('never offers an enemy-only card', () => {
    for (const p of CONTENT.summonPools.values()) {
      for (const entry of p.entries) {
        expect(CONTENT.cards.get(entry.cardId)?.enemyOnly, entry.cardId).toBe(false);
      }
    }
  });

  it('can actually deliver every rarity its pity promises', () => {
    for (const p of CONTENT.summonPools.values()) {
      for (const rule of p.pity) {
        const available = p.entries.filter((entry) => rarityOf(entry.cardId) === rule.rarity);
        expect(available.length, `${p.id} promises ${rule.rarity} but offers none`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('keeps heroes and units in separate pools (Q12)', () => {
    for (const entry of hero.entries) {
      expect(CONTENT.cards.get(entry.cardId)?.cardClass).toBe('hero');
    }
    for (const entry of t1.entries) {
      expect(CONTENT.cards.get(entry.cardId)?.cardClass).toBe('unit');
    }
  });
});

describe('pulls', () => {
  it('is deterministic for a seed', () => {
    const a = summonOnce(t2, {}, rarityOf, createRng(7));
    const b = summonOnce(t2, {}, rarityOf, createRng(7));
    expect(a.cardId).toBe(b.cardId);
  });

  it('only ever returns cards from the pool', () => {
    const rng = createRng(3);
    const ids = new Set(t2.entries.map((e) => e.cardId));
    let pity: PityCounters = {};
    for (let i = 0; i < 300; i++) {
      const result = summonOnce(t2, pity, rarityOf, rng);
      pity = result.pity;
      expect(ids.has(result.cardId)).toBe(true);
    }
  });

  it('favours commoner cards, matching the weights', () => {
    const rng = createRng(11);
    let pity: PityCounters = {};
    const counts: Partial<Record<CardRarity, number>> = {};
    for (let i = 0; i < 4000; i++) {
      const result = summonOnce(t1, pity, rarityOf, rng);
      pity = result.pity;
      counts[result.rarity] = (counts[result.rarity] ?? 0) + 1;
    }
    expect(counts.common ?? 0).toBeGreaterThan(counts.rare ?? 0);
  });
});

describe('pity is a real guarantee (the reference "18/55" meters)', () => {
  it('forces the rarity once the threshold is reached', () => {
    const rule = t2.pity.find((p) => p.rarity === 'legendary')!;
    // One pull short of the threshold.
    const pity: PityCounters = { legendary: rule.threshold - 1, epic: 0 };
    const result = summonOnce(t2, pity, rarityOf, createRng(99));
    expect(result.rarity).toBe('legendary');
    expect(result.fromPity).toBe(true);
  });

  it('never lets a player exceed the threshold without a hit', () => {
    const rule = t2.pity.find((p) => p.rarity === 'legendary')!;
    const rng = createRng(5);
    let pity: PityCounters = {};
    let sinceLegendary = 0;

    for (let i = 0; i < 400; i++) {
      const result = summonOnce(t2, pity, rarityOf, rng);
      pity = result.pity;
      sinceLegendary = result.rarity === 'legendary' ? 0 : sinceLegendary + 1;
      expect(sinceLegendary, `went ${sinceLegendary} pulls without a legendary`).toBeLessThan(
        rule.threshold,
      );
    }
  });

  it('resets the counter on a natural hit, not just a forced one', () => {
    const rng = createRng(21);
    let pity: PityCounters = { epic: 5 };
    for (let i = 0; i < 200; i++) {
      const result = summonOnce(t2, pity, rarityOf, rng);
      if (result.rarity === 'epic' || result.rarity === 'legendary') {
        expect(result.pity.epic).toBe(0);
        return;
      }
      pity = result.pity;
    }
  });

  it('lets a rarer pull satisfy a lesser debt', () => {
    const result = summonOnce(t2, { epic: 10, legendary: 54 }, rarityOf, createRng(3));
    expect(result.rarity).toBe('legendary');
    expect(result.pity.epic).toBe(0);
  });

  it('reports meter progress for the UI', () => {
    const meters = pityProgress(t2, { legendary: 18, epic: 3 });
    const legendary = meters.find((m) => m.rarity === 'legendary')!;
    expect(legendary.count).toBe(18);
    expect(legendary.threshold).toBe(55);
  });

  it('clamps a meter that somehow overshot', () => {
    const meters = pityProgress(t2, { legendary: 9999 });
    expect(meters.find((m) => m.rarity === 'legendary')!.count).toBe(55);
  });
});

describe('batches', () => {
  it('carries pity across a ten-pull', () => {
    const rule = t2.pity.find((p) => p.rarity === 'legendary')!;
    const { results } = summonMany(
      t2,
      { legendary: rule.threshold - 3, epic: 0 },
      rarityOf,
      createRng(2),
      10,
    );
    expect(results).toHaveLength(10);
    expect(results.some((r) => r.rarity === 'legendary')).toBe(true);
  });

  it('discounts a ten-pull but not a single', () => {
    expect(summonCost(t2, 1)).toBe(t2.cost);
    expect(summonCost(t2, 10)).toBeLessThan(t2.cost * 10);
    expect(summonCost(t2, 10)).toBeGreaterThan(0);
  });
});

describe('poolOdds', () => {
  const fakeRarity = (id: string): CardRarity | undefined =>
    ({ a: 'common', b: 'common', c: 'legendary' })[id] as CardRarity | undefined;

  const fake: PoolLike = {
    entries: [
      { cardId: 'a', weight: 60 },
      { cardId: 'b', weight: 30 },
      { cardId: 'c', weight: 10 },
    ],
    pity: [],
  };

  it('splits the pool by rarity, rarest first', () => {
    const odds = poolOdds(fake, fakeRarity);
    expect(odds.map((o) => o.rarity)).toEqual(['legendary', 'common']);
    expect(odds[0].chance).toBeCloseTo(0.1);
    expect(odds[1].chance).toBeCloseTo(0.9);
  });

  it('counts how many different cards carry each rarity', () => {
    expect(poolOdds(fake, fakeRarity).map((o) => o.cards)).toEqual([1, 2]);
  });

  it('sums to one, so nothing in the pool goes unaccounted for', () => {
    const total = poolOdds(fake, fakeRarity).reduce((sum, o) => sum + o.chance, 0);
    expect(total).toBeCloseTo(1);
  });

  it('ignores entries whose card it cannot resolve rather than skewing the rest', () => {
    const odds = poolOdds(
      { ...fake, entries: [...fake.entries, { cardId: '?', weight: 900 }] },
      fakeRarity,
    );
    expect(odds.reduce((sum, o) => sum + o.chance, 0)).toBeCloseTo(1);
    expect(odds[0].chance).toBeCloseTo(0.1);
  });

  it('has nothing to say about an empty pool', () => {
    expect(poolOdds({ entries: [], pity: [] }, fakeRarity)).toEqual([]);
  });

  it('matches what the real content pools actually roll', () => {
    for (const real of CONTENT.summonPools.values()) {
      const odds = poolOdds(real, rarityOf);
      expect(odds.length).toBeGreaterThan(0);
      expect(odds.reduce((sum, o) => sum + o.chance, 0)).toBeCloseTo(1);
    }
  });
});
