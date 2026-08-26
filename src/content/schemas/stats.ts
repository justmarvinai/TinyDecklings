import { z } from 'zod';
import { nonNegativeInt } from './primitives';

/**
 * Stats (Q5): Strength is max HP and the number shown on the battle card;
 * Attack is a visible first-class stat; Speed is defined but dormant until
 * post-slice. Power is derived for display only and is never stored or
 * read by the simulation.
 */
export const STAT_KEYS = ['strength', 'attack', 'speed'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const statKey = z.enum(STAT_KEYS);

export const statBlock = z.strictObject({
  strength: nonNegativeInt,
  attack: nonNegativeInt,
  speed: nonNegativeInt,
});
export type StatBlock = z.infer<typeof statBlock>;

export const ATTACK_TYPES = ['melee', 'ranged'] as const;
export type AttackType = (typeof ATTACK_TYPES)[number];
export const attackType = z.enum(ATTACK_TYPES);

/**
 * Elements (Q21) — a light stage-affinity system landing in Phase 4: stages carry
 * an element and counter-element cards get a small bonus. Defined now so content
 * can be authored with it; unused until then.
 */
export const ELEMENTS = ['nature', 'fire', 'ice', 'lightning', 'dark'] as const;
export type ElementId = (typeof ELEMENTS)[number];
export const element = z.enum(ELEMENTS);

/** Which element beats which (Phase 4). A cycle, so no element is strictly best. */
export const ELEMENT_COUNTERS: Readonly<Record<ElementId, ElementId>> = {
  nature: 'lightning',
  lightning: 'ice',
  ice: 'fire',
  fire: 'nature',
  dark: 'dark',
};
