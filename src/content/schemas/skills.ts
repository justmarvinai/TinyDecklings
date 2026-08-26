import { z } from 'zod';
import { displayName, id, nonNegativeInt, positiveInt, ref } from './primitives';
import { effectDef } from './effects';
import { ICON_KEYS } from './iconKeys';

export const perLevelCurve = z.strictObject({
  /** Added per skill level beyond 1. */
  flatPerLevel: z.number().default(0),
  /** Multiplied per skill level beyond 1 (1.05 = +5% compounding). */
  multiplierPerLevel: z.number().positive().default(1),
});

export const skillDef = z.strictObject({
  id: id('skill'),
  name: displayName,
  description: z.string().min(1),
  iconKey: z.enum(ICON_KEYS),
  /** Rounds until reusable; the battle card's badge counts this down (Q4). */
  cooldown: nonNegativeInt,
  maxLevel: positiveInt.max(10),
  effects: z.array(effectDef).min(1),
  /** Overrides the card's pattern for this skill only. */
  attackPattern: ref('pattern').optional(),
  scaling: perLevelCurve.optional(),
});
export type SkillDef = z.infer<typeof skillDef>;
