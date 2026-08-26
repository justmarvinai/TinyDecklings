/**
 * Gear maths: enhancement, main stat and the flat/percent bonuses a card receives.
 *
 * Enhancement is Q11's "gold levels, no gambling": every upgrade is a guaranteed
 * stat increase for a known price. There are no reroll or destroy mechanics.
 */
import type { GearDef, GearRarity, GearSlotDef, StatKey, SubstatRoll } from '@/content/schemas';

/** Enhancement levels available per gear rarity — better gear is worth investing in. */
export const ENHANCE_CAP: Readonly<Record<GearRarity, number>> = {
  worn: 3,
  sturdy: 6,
  refined: 9,
  ornate: 12,
  exalted: 15,
  mythic: 15,
};

/** Each level adds this share of the item's base main stat. */
export const ENHANCE_STEP = 0.12;

export function enhanceCap(rarity: GearRarity): number {
  return ENHANCE_CAP[rarity];
}

/** Main stat at a given enhancement level. */
export function gearMainStat(def: GearDef, enhanceLevel: number): number {
  const level = Math.max(0, Math.min(enhanceLevel, enhanceCap(def.rarity)));
  return Math.round(def.mainStatBase * (1 + level * ENHANCE_STEP));
}

/** Gold for the next enhancement level; climbs with both rarity and level. */
export function enhanceCost(def: GearDef, currentLevel: number): number {
  const rarityFactor = 1 + ENHANCE_CAP[def.rarity] / 10;
  return Math.round(120 * rarityFactor * Math.pow(currentLevel + 1, 1.45));
}

export interface GearContribution {
  flat: Record<StatKey, number>;
  percent: Record<StatKey, number>;
}

export function emptyContribution(): GearContribution {
  return {
    flat: { strength: 0, attack: 0, speed: 0 },
    percent: { strength: 0, attack: 0, speed: 0 },
  };
}

/** Adds one equipped item's main stat and substats into a running total. */
export function addGearContribution(
  into: GearContribution,
  def: GearDef,
  slotDef: GearSlotDef,
  enhanceLevel: number,
  substats: readonly SubstatRoll[],
): GearContribution {
  into.flat[slotDef.mainStat] += gearMainStat(def, enhanceLevel);
  for (const sub of substats) {
    if (sub.isPercent) into.percent[sub.stat] += sub.value;
    else into.flat[sub.stat] += sub.value;
  }
  return into;
}

/** A one-line summary of an item's power, for inventory rows. */
export function describeSubstat(sub: SubstatRoll): string {
  const sign = sub.value >= 0 ? '+' : '';
  return `${sign}${sub.value}${sub.isPercent ? '%' : ''} ${sub.stat}`;
}
