import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import {
  CARD_RARITIES,
  CURRENCY_IDS,
  ELEMENTS,
  GEAR_RARITIES,
  STAGE_KINDS,
} from '@/content/schemas';
import {
  cardRarityLabel,
  compactNumber,
  currencyLabel,
  elementLabel,
  gearRarityLabel,
  stageKindLabel,
} from './labels';

/**
 * The string contract (Q30).
 *
 * The release is English-only, but every *vocabulary* the game repeats — currencies,
 * both rarity ladders, elements, node kinds — is named in one place rather than
 * spelled out at each call site. That is what makes a later translation pass a
 * translation rather than an excavation. These guard the property; prose that
 * appears once still lives with the component that says it.
 */

const looksLikeAnId = (text: string) => /[._]/.test(text) || text === text.toLowerCase();

describe('every repeated vocabulary is named', () => {
  it('names every currency', () => {
    for (const id of CURRENCY_IDS) {
      const label = currencyLabel(id);
      expect(label, id).toBeTruthy();
      expect(looksLikeAnId(label), `${id} shows its id`).toBe(false);
    }
  });

  it('names both rarity ladders, which are separate systems (rule 4)', () => {
    for (const rarity of CARD_RARITIES) {
      expect(looksLikeAnId(cardRarityLabel(rarity)), rarity).toBe(false);
    }
    for (const rarity of GEAR_RARITIES) {
      expect(looksLikeAnId(gearRarityLabel(rarity)), rarity).toBe(false);
    }
    // The two ladders never share a name, or the colours would be the only thing
    // telling a player which system they are looking at.
    const cards = new Set(CARD_RARITIES.map(cardRarityLabel));
    for (const rarity of GEAR_RARITIES) {
      expect(cards.has(gearRarityLabel(rarity)), `${rarity} collides with a card rarity`).toBe(
        false,
      );
    }
  });

  it('names every element and node kind', () => {
    for (const element of ELEMENTS) {
      expect(looksLikeAnId(elementLabel(element)), element).toBe(false);
    }
    for (const kind of STAGE_KINDS) {
      expect(looksLikeAnId(stageKindLabel(kind)), kind).toBe(false);
    }
  });

  it('falls back readably for a currency it has never heard of', () => {
    expect(currencyLabel('token_of_something')).not.toContain('_');
  });
});

describe('shipped content is written for a player, not a parser', () => {
  it('gives every card, gear item and skill a real name', () => {
    for (const table of [CONTENT.cards, CONTENT.gear, CONTENT.skills]) {
      for (const def of table.values()) {
        expect(looksLikeAnId(def.name), def.id).toBe(false);
      }
    }
  });

  it('writes achievement and modifier descriptions as sentences', () => {
    for (const def of CONTENT.achievements.values()) {
      expect(def.description.endsWith('.'), def.id).toBe(true);
    }
    for (const def of CONTENT.stageModifiers.values()) {
      expect(def.description.endsWith('.'), def.id).toBe(true);
    }
  });
});

describe('compactNumber', () => {
  it('leaves anything that already fits exactly alone', () => {
    expect(compactNumber(0)).toBe('0');
    expect(compactNumber(720)).toBe('720');
    expect(compactNumber(9999)).toBe('9999');
  });

  it('rounds past the point where every digit is legible', () => {
    expect(compactNumber(10_000)).toBe('10K');
    expect(compactNumber(12_340)).toBe('12.3K');
    expect(compactNumber(184_000)).toBe('184K');
    expect(compactNumber(1_400_000)).toBe('1.4M');
    expect(compactNumber(999_999)).toBe('1M');
  });

  it('never exceeds the five characters the card corner has room for', () => {
    for (const n of [0, 9, 99, 9999, 10_000, 99_999, 999_999, 1e6, 9.99e8, 1e12]) {
      expect(compactNumber(n).length).toBeLessThanOrEqual(5);
    }
  });

  it('keeps a negative sign, for the numbers that can carry one', () => {
    expect(compactNumber(-45)).toBe('-45');
  });
});
