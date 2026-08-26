/**
 * Gear.
 *
 * Two owner directives are enforced structurally here:
 *  1. Gear rarity is its own system — `GearRarity`, never `CardRarity`.
 *  2. Icons are fixed per slot type. `gearDef` is a STRICT object with no icon or
 *     art field, so an item that tries to carry bespoke art fails validation.
 *     Icons resolve via `gearSlotIcon(slot)` alone.
 */
import { z } from 'zod';
import { displayName, id, nonNegativeInt } from './primitives';
import { statKey } from './stats';
import { GEAR_RARITIES } from './rarity';
import { GEAR_SLOTS, ICON_KEYS } from './iconKeys';

export const gearSlot = z.enum(GEAR_SLOTS);
export const gearRarity = z.enum(GEAR_RARITIES);

export const gearSlotDef = z.strictObject({
  id: gearSlot,
  name: displayName,
  /** THE icon for every item in this slot — the only place gear art is named. */
  iconKey: z.enum(ICON_KEYS),
  mainStat: statKey,
  /** Star grade required to unlock the slot (the artifact slot opens at 6*). */
  unlockStars: z.number().int().min(1).max(6).default(1),
  /** Slots switched on for the current phase; the rest render locked. */
  active: z.boolean().default(true),
});
export type GearSlotDef = z.infer<typeof gearSlotDef>;

export const substatRoll = z.strictObject({
  stat: statKey,
  /** Flat bonus, or percentage when `isPercent` is set. */
  value: z.number(),
  isPercent: z.boolean().default(false),
});
export type SubstatRoll = z.infer<typeof substatRoll>;

export const gearDef = z.strictObject({
  id: id('gear'),
  name: displayName,
  slot: gearSlot,
  rarity: gearRarity,
  stars: z.number().int().min(1).max(5),
  mainStatBase: nonNegativeInt,
  /** Set bonuses (artifact sets) are deferred past first release (Q22). */
  setId: id('set').optional(),
  // NOTE: deliberately no `icon`/`iconKey`/`art` field. See the module docblock.
});
export type GearDef = z.infer<typeof gearDef>;
