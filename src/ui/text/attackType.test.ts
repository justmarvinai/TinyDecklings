import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { ATTACK_TYPES } from '@/content/schemas';
import { attackTypeLabel } from './labels';

/**
 * Where a card stands is one of the three facts on its face, so it has a name.
 *
 * "Melee" and "ranged" are jargon for a row; the tile says which row. These guard
 * that every card can be described that way, since the collection prints it
 * unconditionally.
 */
describe('attack type labels', () => {
  it('names every type', () => {
    for (const type of ATTACK_TYPES) {
      expect(attackTypeLabel(type).length, type).toBeGreaterThan(0);
    }
    expect(new Set(ATTACK_TYPES.map(attackTypeLabel)).size).toBe(ATTACK_TYPES.length);
  });

  it('covers every card in the roster', () => {
    for (const card of CONTENT.cards.values()) {
      expect(attackTypeLabel(card.attackType), card.id).toBeTruthy();
    }
  });
});
