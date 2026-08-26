import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { GEAR_RARITIES } from '@/content/schemas';
import {
  ENHANCE_CAP,
  addGearContribution,
  describeSubstat,
  emptyContribution,
  enhanceCap,
  enhanceCost,
  gearMainStat,
} from './index';

const boots = CONTENT.gear.get('gear.tidewalkers')!;
const helmet = CONTENT.gear.get('gear.tyrants_visor')!;

describe('enhancement (Q11: gold levels, no gambling)', () => {
  it('raises the main stat with every level', () => {
    const values = [0, 1, 5, 9].map((l) => gearMainStat(boots, l));
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[3]).toBeGreaterThan(values[0]);
  });

  it('never exceeds the rarity cap even if asked for more', () => {
    expect(gearMainStat(boots, 999)).toBe(gearMainStat(boots, enhanceCap(boots.rarity)));
  });

  it('treats a negative level as unenhanced', () => {
    expect(gearMainStat(boots, -3)).toBe(boots.mainStatBase);
  });

  it('gives better rarities a longer upgrade path', () => {
    expect(ENHANCE_CAP.mythic).toBeGreaterThan(ENHANCE_CAP.worn);
    for (const rarity of GEAR_RARITIES) expect(enhanceCap(rarity)).toBeGreaterThan(0);
  });

  it('charges progressively more per level, and more for better gear', () => {
    expect(enhanceCost(boots, 5)).toBeGreaterThan(enhanceCost(boots, 0));
    expect(enhanceCost(helmet, 0)).toBeGreaterThan(enhanceCost(boots, 0));
  });
});

describe('contributions', () => {
  it('adds the main stat into the slot it belongs to', () => {
    const slotDef = CONTENT.gearSlots.get(boots.slot)!;
    const total = addGearContribution(emptyContribution(), boots, slotDef, 0, []);
    expect(total.flat[slotDef.mainStat]).toBe(boots.mainStatBase);
  });

  it('separates flat and percentage substats', () => {
    const slotDef = CONTENT.gearSlots.get(helmet.slot)!;
    const total = addGearContribution(emptyContribution(), helmet, slotDef, 0, [
      { stat: 'attack', value: 7, isPercent: false },
      { stat: 'attack', value: 5, isPercent: true },
    ]);
    expect(total.flat.attack).toBe(7);
    expect(total.percent.attack).toBe(5);
  });

  it('accumulates across several pieces', () => {
    const total = emptyContribution();
    addGearContribution(total, boots, CONTENT.gearSlots.get(boots.slot)!, 0, []);
    addGearContribution(total, helmet, CONTENT.gearSlots.get(helmet.slot)!, 0, []);
    expect(total.flat.speed).toBe(boots.mainStatBase);
    expect(total.flat.strength).toBe(helmet.mainStatBase);
  });

  it('describes a substat readably', () => {
    expect(describeSubstat({ stat: 'attack', value: 6, isPercent: true })).toBe('+6% attack');
    expect(describeSubstat({ stat: 'strength', value: 40, isPercent: false })).toBe('+40 strength');
  });
});

describe('gear content covers every slot', () => {
  it('has at least one item for each active slot', () => {
    for (const slot of CONTENT.gearSlots.values()) {
      const items = [...CONTENT.gear.values()].filter((g) => g.slot === slot.id);
      expect(items.length, `no gear for slot ${slot.id}`).toBeGreaterThan(0);
    }
  });

  it('carries no per-item art (owner directive)', () => {
    for (const item of CONTENT.gear.values()) {
      expect(item).not.toHaveProperty('iconKey');
      expect(item).not.toHaveProperty('artKey');
    }
  });
});
