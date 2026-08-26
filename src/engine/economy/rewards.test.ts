import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { createRng } from '../rng';
import { applyStarBonus, rollLoot } from './rewards';

const battleTable = CONTENT.lootTables.get('loot.slice_battle')!;
const bossTable = CONTENT.lootTables.get('loot.slice_boss')!;

describe('loot rolls', () => {
  it('always pays the guaranteed rewards', () => {
    const bundle = rollLoot(CONTENT, battleTable, createRng(1));
    expect(bundle.currencies.gold ?? 0).toBeGreaterThan(0);
    expect(bundle.cardXp).toBeGreaterThan(0);
  });

  it('is deterministic for a given rng seed', () => {
    expect(rollLoot(CONTENT, battleTable, createRng(9))).toEqual(
      rollLoot(CONTENT, battleTable, createRng(9)),
    );
  });

  it('drops gear at roughly the table weight', () => {
    const rng = createRng(2024);
    let withGear = 0;
    const runs = 4000;
    for (let i = 0; i < runs; i++) {
      if (rollLoot(CONTENT, battleTable, rng).gear.length > 0) withGear++;
    }
    // The table's single roll gives gear 25/100 of the weight.
    expect(withGear / runs).toBeGreaterThan(0.2);
    expect(withGear / runs).toBeLessThan(0.3);
  });

  it('only ever drops gear that exists in the registry', () => {
    const rng = createRng(77);
    for (let i = 0; i < 500; i++) {
      for (const drop of rollLoot(CONTENT, bossTable, rng).gear) {
        expect(CONTENT.gear.has(drop.defId)).toBe(true);
      }
    }
  });

  it('rolls substats within the rarity budget', () => {
    const rng = createRng(5);
    for (let i = 0; i < 300; i++) {
      for (const drop of rollLoot(CONTENT, bossTable, rng).gear) {
        const def = CONTENT.gear.get(drop.defId)!;
        expect(drop.substats.length).toBeLessThanOrEqual(4);
        // Speed only rolls on boots, where it is the slot's own stat.
        for (const sub of drop.substats) {
          if (sub.stat === 'speed') expect(def.slot).toBe('boots');
        }
      }
    }
  });

  it('pays a boss far better than a regular fight', () => {
    const rng = createRng(11);
    const battle = rollLoot(CONTENT, battleTable, rng);
    const boss = rollLoot(CONTENT, bossTable, rng);
    expect(boss.currencies.gold ?? 0).toBeGreaterThan(battle.currencies.gold ?? 0);
    expect(boss.gear.length).toBeGreaterThan(0);
  });
});

describe('star bonus (Q17)', () => {
  it('pays more for a flawless clear', () => {
    const base = rollLoot(CONTENT, battleTable, createRng(3));
    const three = applyStarBonus(base, 3);
    const one = applyStarBonus(base, 1);
    expect(three.currencies.gold ?? 0).toBeGreaterThan(one.currencies.gold ?? 0);
    expect(three.cardXp).toBeGreaterThan(one.cardXp);
  });

  it('leaves a one-star clear untouched', () => {
    const base = rollLoot(CONTENT, battleTable, createRng(4));
    expect(applyStarBonus(base, 1)).toEqual(base);
  });
});
