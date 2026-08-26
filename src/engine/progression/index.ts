/**
 * Progression math: levels, XP, stat growth and the Power rating.
 *
 * All curve values come from `content/economy/growth.ts` — this module only applies
 * them, so balance tuning never touches logic (CONTENT_SCHEMA.md §11).
 */
import type { GrowthCurveDef } from '@/content/schemas';

/** A stat at a given level: compounding growth from the level-1 base. */
export function statAt(base: number, level: number, curve: GrowthCurveDef): number {
  if (level <= 1) return Math.round(base);
  return Math.round(base * Math.pow(curve.statPerLevel, level - 1));
}

/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number, curve: GrowthCurveDef): number {
  return Math.round(curve.xpBase * Math.pow(level, curve.xpExponent));
}

/** Level cap rises with the star grade, driving the level → ascend → level rhythm (Q8). */
export function levelCap(stars: number, curve: GrowthCurveDef): number {
  return curve.levelsPerStar * stars;
}

export interface LevelUpResult {
  level: number;
  xp: number;
  levelsGained: number;
  /** XP that could not be spent because the card sits at its star-gated cap. */
  overflow: number;
}

/** Applies XP, rolling levels over until the cap. Pure — returns a new result. */
export function applyXp(
  level: number,
  xp: number,
  gained: number,
  stars: number,
  curve: GrowthCurveDef,
): LevelUpResult {
  const cap = levelCap(stars, curve);
  let nextLevel = level;
  let pool = xp + Math.max(0, Math.round(gained));
  let levelsGained = 0;

  while (nextLevel < cap) {
    const need = xpForNextLevel(nextLevel, curve);
    if (pool < need) break;
    pool -= need;
    nextLevel++;
    levelsGained++;
  }

  if (nextLevel >= cap) return { level: cap, xp: 0, levelsGained, overflow: pool };
  return { level: nextLevel, xp: pool, levelsGained, overflow: 0 };
}

/** Gold cost of the next level-up, scaling with the level reached. */
export function levelUpGoldCost(level: number): number {
  return Math.round(40 * Math.pow(level, 1.35));
}

export interface PowerInputs {
  strength: number;
  attack: number;
  speed: number;
  stars: number;
  skillLevels: readonly number[];
}

/**
 * Power — a display-only comparison rating (Q5).
 *
 * Deliberately never read by the simulation: it exists so players can tell at a
 * glance whether a card or a deck got stronger.
 */
export function powerRating({ strength, attack, speed, stars, skillLevels }: PowerInputs): number {
  const skillBonus = skillLevels.reduce((sum, level) => sum + (level - 1) * 12, 0);
  return Math.round(strength * 0.6 + attack * 8 + speed * 4 + stars * 45 + skillBonus);
}
