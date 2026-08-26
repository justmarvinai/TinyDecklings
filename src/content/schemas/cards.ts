import { z } from 'zod';
import { displayName, id, nonNegativeInt, percent, ref } from './primitives';
import { attackType, element, statBlock, statKey } from './stats';
import { targetFilter } from './effects';
import { CARD_RARITIES } from './rarity';

export const CARD_CLASSES = ['unit', 'hero'] as const;
export type CardClass = (typeof CARD_CLASSES)[number];
export const cardClass = z.enum(CARD_CLASSES);

/** Cards use CardRarity — never GearRarity (CLAUDE.md rule 4). */
export const cardRarity = z.enum(CARD_RARITIES);

export const skillRef = z.strictObject({
  skillId: ref('skill'),
  /** Slot unlocks at this star grade; slot 1 is available from the start. */
  unlockStars: z.number().int().min(1).max(6),
});

/** Heroes buff the deck passively; exactly one hero sits in a deck (Q12). */
export const leaderSkillDef = z.strictObject({
  description: z.string().min(1),
  target: targetFilter,
  stat: statKey,
  percent,
});

export const cardDef = z
  .strictObject({
    id: id('card'),
    name: displayName,
    cardClass,
    rarity: cardRarity,
    attackType,
    element: element.optional(),
    baseStats: statBlock,
    growth: ref('growth'),
    attackPattern: ref('pattern'),
    skills: z.array(skillRef).max(5).default([]),
    leaderSkill: leaderSkillDef.optional(),
    /**
     * Art is resolved through the manifest; every card currently falls back to the
     * one shared placeholder avatar. Final per-card art is an asset drop later
     * (CLAUDE.md rule 6) — this key never changes.
     */
    artKey: z.string().min(1),
    lore: z.string().optional(),
    /** Enemy-only cards never appear in the collection or summon pools. */
    enemyOnly: z.boolean().default(false),
  })
  .refine((c) => (c.cardClass === 'hero') === (c.leaderSkill !== undefined), {
    message: 'heroes must define a leaderSkill and units must not',
    path: ['leaderSkill'],
  });
export type CardDef = z.infer<typeof cardDef>;

/** A battlefield slot: 0-2 is the front row, 3-5 the back row (2x3 per side). */
export const slotIndex = z.number().int().min(0).max(5);

export const enemyGroupDef = z.strictObject({
  id: id('enemy'),
  name: displayName,
  members: z
    .array(
      z.strictObject({
        cardId: ref('card'),
        slot: slotIndex,
        level: nonNegativeInt.default(1),
      }),
    )
    .min(1)
    .max(6),
  reinforcements: z.array(ref('card')).default([]),
  /** Marks the group as a boss fight; the card gets the gold BOSS frame. */
  bossCardId: ref('card').optional(),
});
export type EnemyGroupDef = z.infer<typeof enemyGroupDef>;
