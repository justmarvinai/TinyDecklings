/**
 * Ascension — the reference's EVOLVE (Q8).
 *
 * A card climbs from its rarity's base star grade up to 6★ by consuming fodder:
 * other cards of the same grade, duplicates included. Each star raises the level
 * cap and unlocks the next skill slot, which is what creates the
 * level → ascend → level rhythm.
 *
 * Pure maths only: which cards get consumed is the store's business.
 */

export const MAX_STARS = 6;

/** Fodder cards required to go from `stars` to `stars + 1`. */
export function fodderRequired(stars: number): number {
  return Math.max(1, stars);
}

/** Gold required alongside the fodder. */
export function ascendGoldCost(stars: number): number {
  return Math.round(500 * Math.pow(stars, 1.6));
}

/** Stat multiplier applied at a given star grade, relative to the base grade. */
export function starMultiplier(stars: number, baseStars: number): number {
  const steps = Math.max(0, stars - baseStars);
  return Math.pow(1.15, steps);
}

/**
 * How many skill slots a card has unlocked.
 *
 * One skill at the base grade, one more per star gained, capped at five (Q18).
 */
export const MAX_SKILL_SLOTS = 5;

export function unlockedSkillSlots(stars: number): number {
  return Math.max(1, Math.min(MAX_SKILL_SLOTS, stars));
}

export function canAscend(stars: number): boolean {
  return stars < MAX_STARS;
}

export interface AscendRequirement {
  fodder: number;
  gold: number;
  /** The star grade fodder cards must have. */
  fodderStars: number;
}

export function ascendRequirement(stars: number): AscendRequirement {
  return { fodder: fodderRequired(stars), gold: ascendGoldCost(stars), fodderStars: stars };
}

/** Gold + tomes to take a skill from `level` to `level + 1` (Q18). */
export function skillUpgradeCost(level: number): { gold: number; tomes: number } {
  return {
    gold: Math.round(300 * Math.pow(level, 1.5)),
    tomes: level,
  };
}
