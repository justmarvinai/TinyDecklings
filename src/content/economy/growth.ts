/**
 * Level/XP growth curves, one per card rarity.
 *
 * Balance numbers live here, never inline in engine code, so tuning never touches
 * logic (CONTENT_SCHEMA.md §11). Level cap = levelsPerStar x stars (Q8).
 */
import type { GrowthCurveDef } from '../schemas';

export const GROWTH_CURVE_DEFS: readonly GrowthCurveDef[] = [
  { id: 'growth.common', statPerLevel: 1.06, xpBase: 60, xpExponent: 1.5, levelsPerStar: 10 },
  { id: 'growth.uncommon', statPerLevel: 1.07, xpBase: 80, xpExponent: 1.52, levelsPerStar: 10 },
  { id: 'growth.rare', statPerLevel: 1.08, xpBase: 110, xpExponent: 1.55, levelsPerStar: 10 },
  { id: 'growth.epic', statPerLevel: 1.09, xpBase: 150, xpExponent: 1.58, levelsPerStar: 10 },
  { id: 'growth.legendary', statPerLevel: 1.1, xpBase: 200, xpExponent: 1.6, levelsPerStar: 10 },
];
