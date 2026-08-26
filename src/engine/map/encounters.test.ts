import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import type { EncounterDef } from '@/content/schemas';
import { createRng } from '../rng';
import { choiceStates, meetsRequirement, resolveChoice, type EncounterContext } from './encounters';

const rich: EncounterContext = {
  currencyOf: () => 10_000,
  ownsCardClass: () => true,
  highestStage: 99,
};
const broke: EncounterContext = {
  currencyOf: () => 0,
  ownsCardClass: () => false,
  highestStage: 1,
};

const encounters = [...CONTENT.encounters.values()];
const find = (id: string): EncounterDef => CONTENT.encounters.get(id)!;

describe('authored vignettes are all playable', () => {
  it('gives every encounter at least one choice nobody can be locked out of', () => {
    for (const encounter of encounters) {
      const open = encounter.choices.filter((c) => meetsRequirement(c.requires, broke));
      expect(open.length, `${encounter.id} has no free choice`).toBeGreaterThan(0);
    }
  });

  it('names only loot tables that exist', () => {
    for (const encounter of encounters) {
      for (const choice of encounter.choices) {
        for (const outcome of choice.outcomes) {
          for (const table of outcome.rewards) {
            expect(CONTENT.lootTables.has(table), `${encounter.id} -> ${table}`).toBe(true);
          }
        }
      }
    }
  });

  it('covers all three vignette kinds (Q16)', () => {
    const kinds = new Set(encounters.map((e) => e.kind));
    expect([...kinds].sort()).toEqual(['camp', 'event', 'treasure']);
  });
});

describe('requirements gate and price', () => {
  it('closes a choice the player cannot pay for, with a reason', () => {
    const states = choiceStates(find('encounter.old_shrine'), broke);
    const offering = states[0];
    expect(offering.available).toBe(false);
    expect(offering.blocked).toEqual({ kind: 'currency', currency: 'gold', needed: 400, have: 0 });
    expect(offering.price).toEqual({ currency: 'gold', amount: 400 });
  });

  it('opens it once the player can', () => {
    const states = choiceStates(find('encounter.old_shrine'), rich);
    expect(states[0].available).toBe(true);
  });

  it('gates on owning a hero and on how far the player has walked', () => {
    expect(meetsRequirement({ kind: 'hasCardClass', cardClass: 'hero' }, broke)).toBe(false);
    expect(meetsRequirement({ kind: 'hasCardClass', cardClass: 'hero' }, rich)).toBe(true);
    expect(meetsRequirement({ kind: 'minStage', stage: 5 }, broke)).toBe(false);
    expect(meetsRequirement({ kind: 'minStage', stage: 5 }, rich)).toBe(true);
  });
});

describe('resolving a choice', () => {
  it('is deterministic for a given rng seed', () => {
    const encounter = find('encounter.wrecked_caravan');
    const a = resolveChoice(CONTENT, encounter, 0, rich, createRng(42));
    const b = resolveChoice(CONTENT, encounter, 0, rich, createRng(42));
    expect(a.outcome.description).toBe(b.outcome.description);
    expect(a.rewards).toEqual(b.rewards);
  });

  it('pays out the loot the outcome names', () => {
    const result = resolveChoice(CONTENT, find('encounter.buried_cache'), 0, rich, createRng(7));
    expect(result.rewards.gear.length).toBe(1);
    expect(result.rewards.currencies.gold ?? 0).toBeGreaterThan(0);
  });

  it('reports the price so the caller can deduct it', () => {
    const result = resolveChoice(CONTENT, find('encounter.old_shrine'), 0, rich, createRng(3));
    expect(result.price).toEqual({ currency: 'gold', amount: 400 });
  });

  it('refuses a choice the player cannot take rather than silently doing nothing', () => {
    expect(() =>
      resolveChoice(CONTENT, find('encounter.old_shrine'), 0, broke, createRng(1)),
    ).toThrow();
  });

  it('reaches every outcome of a weighted choice across enough rolls', () => {
    const encounter = find('encounter.wrecked_caravan');
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      seen.add(resolveChoice(CONTENT, encounter, 0, rich, createRng(seed)).outcome.description);
    }
    expect(seen.size).toBe(encounter.choices[0].outcomes.length);
  });

  it('hands a status to the next fight when the outcome says so', () => {
    const encounter = find('encounter.roadside_camp');
    const result = resolveChoice(CONTENT, encounter, 0, rich, createRng(11));
    expect(result.outcome.carriedStatus).toEqual({ status: 'regen', side: 'player', stacks: 1 });
  });
});
