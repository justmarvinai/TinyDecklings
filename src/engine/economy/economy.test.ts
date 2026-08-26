import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { createRng } from '../rng';
import { rollLoot } from './rewards';

/**
 * Economy sanity: the systems the game asks the player to engage with must actually
 * be reachable by playing, because nothing here is for sale for real money (Q13).
 */
describe('play feeds every system', () => {
  const battle = CONTENT.lootTables.get('loot.isles_battle')!;
  const boss = CONTENT.lootTables.get('loot.isles_boss')!;

  function totals(table: typeof battle, runs: number, seed: number) {
    const rng = createRng(seed);
    const sum: Record<string, number> = {};
    let gear = 0;
    for (let i = 0; i < runs; i++) {
      const bundle = rollLoot(CONTENT, table, rng);
      for (const [currency, amount] of Object.entries(bundle.currencies)) {
        sum[currency] = (sum[currency] ?? 0) + (amount ?? 0);
      }
      gear += bundle.gear.length;
    }
    return { sum, gear };
  }

  it('pays gold, gems, tomes and summon tokens over a run of ordinary fights', () => {
    const { sum, gear } = totals(battle, 400, 17);
    expect(sum.gold ?? 0).toBeGreaterThan(0);
    expect(sum.gems ?? 0).toBeGreaterThan(0);
    expect(sum.tome ?? 0, 'tomes must drop or skills can never be upgraded').toBeGreaterThan(0);
    expect(sum.token_unit_t1 ?? 0, 'tokens must drop or summoning is unreachable').toBeGreaterThan(
      0,
    );
    expect(gear).toBeGreaterThan(0);
  });

  it('makes a boss clearly the better payday', () => {
    const many = 200;
    const battleGold = totals(battle, many, 3).sum.gold ?? 0;
    const bossGold = totals(boss, many, 3).sum.gold ?? 0;
    expect(bossGold).toBeGreaterThan(battleGold * 2);
  });

  it('gives bosses a shot at the better summon tokens', () => {
    const { sum } = totals(boss, 300, 5);
    expect((sum.token_unit_t2 ?? 0) + (sum.token_hero ?? 0)).toBeGreaterThan(0);
  });

  it('keeps a first summon within reach of an early run', () => {
    // Roughly a region's worth of fights should afford at least one basic pull.
    const { sum } = totals(battle, 30, 11);
    const pool = CONTENT.summonPools.get('pool.unit_t1')!;
    expect(sum.token_unit_t1 ?? 0).toBeGreaterThanOrEqual(pool.cost);
  });

  it('drops gear across the slots the game has opened', () => {
    const rng = createRng(23);
    const slots = new Set<string>();
    for (let i = 0; i < 600; i++) {
      for (const drop of rollLoot(CONTENT, battle, rng).gear) {
        const def = CONTENT.gear.get(drop.defId);
        if (def) slots.add(def.slot);
      }
    }
    expect(slots.size).toBeGreaterThanOrEqual(6);
  });
});
