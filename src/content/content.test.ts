import { describe, expect, it } from 'vitest';
import { CONTENT, STARTER_CARD_IDS } from '@/content';
import { CARD_RARITY_BASE_STARS, GEAR_RARITIES } from '@/content/schemas';
import { MAX_SKILL_SLOTS, unlockedSkillSlots } from '@/engine/progression';

describe('card skill ladders (Q18)', () => {
  it('gives every player card a full five-slot ladder', () => {
    for (const card of CONTENT.cards.values()) {
      if (card.enemyOnly) continue;
      expect(card.skills.length, `${card.id} ladder`).toBe(MAX_SKILL_SLOTS);
    }
  });

  it('unlocks slots one per star, starting at slot 1', () => {
    for (const card of CONTENT.cards.values()) {
      card.skills.forEach((ref, index) => {
        expect(ref.unlockStars, `${card.id} slot ${index}`).toBe(index + 1);
      });
    }
  });

  it('has every card usable the moment it is collected', () => {
    for (const card of CONTENT.cards.values()) {
      if (card.enemyOnly) continue;
      const atBase = unlockedSkillSlots(CARD_RARITY_BASE_STARS[card.rarity]);
      expect(atBase, `${card.id} starts with no skill`).toBeGreaterThanOrEqual(1);
      expect(
        card.skills.filter((s) => s.unlockStars <= CARD_RARITY_BASE_STARS[card.rarity]).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('references only skills that exist', () => {
    for (const card of CONTENT.cards.values()) {
      for (const ref of card.skills) {
        expect(CONTENT.skills.has(ref.skillId), `${card.id} -> ${ref.skillId}`).toBe(true);
      }
    }
  });

  it('never repeats a skill within one card', () => {
    for (const card of CONTENT.cards.values()) {
      const ids = card.skills.map((s) => s.skillId);
      expect(new Set(ids).size, `${card.id} has a duplicate skill`).toBe(ids.length);
    }
  });
});

describe('gear covers the whole system', () => {
  it('fills every slot the game exposes', () => {
    for (const slot of CONTENT.gearSlots.values()) {
      expect([...CONTENT.gear.values()].filter((g) => g.slot === slot.id).length).toBeGreaterThan(
        0,
      );
    }
  });

  it('uses most of the gear rarity ladder', () => {
    const used = new Set([...CONTENT.gear.values()].map((g) => g.rarity));
    expect(used.size).toBeGreaterThanOrEqual(GEAR_RARITIES.length - 1);
  });

  it('keeps the Artifact slot behind six stars (Q10)', () => {
    expect(CONTENT.gearSlots.get('artifact')?.unlockStars).toBe(6);
  });
});

describe('the starter collection is coherent', () => {
  it('hands out cards that exist and are not enemy-only', () => {
    for (const id of STARTER_CARD_IDS) {
      const def = CONTENT.cards.get(id);
      expect(def, `starter card ${id} missing`).toBeDefined();
      expect(def?.enemyOnly).toBe(false);
    }
  });

  it('includes exactly one hero, so a deck has a leader from the start (Q12)', () => {
    const heroes = STARTER_CARD_IDS.filter((id) => CONTENT.cards.get(id)?.cardClass === 'hero');
    expect(heroes).toHaveLength(1);
  });

  it('has both melee and ranged so the formation rules matter (Q7)', () => {
    const types = new Set(STARTER_CARD_IDS.map((id) => CONTENT.cards.get(id)?.attackType));
    expect(types.has('melee')).toBe(true);
    expect(types.has('ranged')).toBe(true);
  });
});
