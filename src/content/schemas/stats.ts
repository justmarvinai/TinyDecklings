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

/**
 * How much Attack a counter-element card gains on a themed stage (Q21).
 *
 * Deliberately at the low end of the 10-15% band the owner chose: enough that
 * bringing the right element is worth doing, not so much that it decides fights.
 */
export const ELEMENT_AFFINITY_PERCENT = 12;

/**
 * Which element beats which (Q21). A cycle, so no element is strictly best —
 * except dark, which answers only itself.
 */
export const ELEMENT_COUNTERS: Readonly<Record<ElementId, ElementId>> = {
  nature: 'lightning',
  lightning: 'ice',
  ice: 'fire',
  fire: 'nature',
  dark: 'dark',
};

/** True when `element` counters the element a stage is themed to. */
export function countersElement(
  element: ElementId | undefined,
  stageElement: ElementId | undefined,
): boolean {
  if (!element || !stageElement) return false;
  return ELEMENT_COUNTERS[element] === stageElement;
}
