import { describe, expect, it } from 'vitest';
import { CARD_RARITIES, GEAR_RARITIES } from '@/content/schemas/rarity';
import { CARD_RARITY_VAR, GEAR_RARITY_VAR, cardRarityColor, gearRarityColor } from './rarity';

describe('card and gear rarity systems stay separate (CLAUDE.md rule 4)', () => {
  it('shares no colour token between the two systems', () => {
    const cardTokens = new Set(Object.values(CARD_RARITY_VAR));
    const gearTokens = new Set(Object.values(GEAR_RARITY_VAR));
    const shared = [...cardTokens].filter((t) => gearTokens.has(t));
    expect(shared).toEqual([]);
  });

  it('shares no tier name between the two systems', () => {
    const shared = (CARD_RARITIES as readonly string[]).filter((r) =>
      (GEAR_RARITIES as readonly string[]).includes(r),
    );
    expect(shared).toEqual([]);
  });

  it('maps every tier of both systems to a distinct card/gear-scoped token', () => {
    for (const rarity of CARD_RARITIES) {
      expect(cardRarityColor(rarity)).toBe(`var(--rarity-card-${rarity})`);
    }
    for (const rarity of GEAR_RARITIES) {
      expect(gearRarityColor(rarity)).toBe(`var(--rarity-gear-${rarity})`);
    }
  });

  it('keeps the tier counts intentionally different (5 card tiers, 6 gear tiers)', () => {
    expect(CARD_RARITIES).toHaveLength(5);
    expect(GEAR_RARITIES).toHaveLength(6);
  });
});
