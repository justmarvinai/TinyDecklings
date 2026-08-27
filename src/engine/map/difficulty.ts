/**
 * How hard a stage is going to be, before the energy is spent.
 *
 * The stage sheet named the enemies and their count and stopped there, so the only
 * way to learn a fight was out of reach was to pay for it and lose. Energy is the
 * pacing currency (Q14b) — spending it on an unwinnable fight is the worst thing
 * the map can do to a player.
 *
 * This scores the enemy side the same way the collection scores yours, so the two
 * numbers are comparable, and returns a band rather than a sentence: the engine
 * hands back structured facts and the UI writes the words (CLAUDE.md conventions).
 */
import type { Content } from '@/content';
import type { GeneratedStage } from '@/content/schemas';
import { CARD_RARITY_BASE_STARS } from '@/content/schemas';
import { powerRating, statAtGrade } from '../progression';
import { enemySpecsFor } from './stageBattle';

/** Where a deck stands against a stage, coarsely enough to be honest. */
export type DifficultyBand = 'comfortable' | 'fair' | 'stretch' | 'outmatched';

export interface StageReading {
  /** Total power of everything the stage fields, reserves included. */
  stagePower: number;
  /** Total power of the deck being taken in. */
  deckPower: number;
  ratio: number;
  band: DifficultyBand;
}

/**
 * Band edges, in deck-power-to-stage-power.
 *
 * Deliberately generous: a reading that cries wolf gets ignored, and the fight is
 * winnable below parity because the player picks targets and the AI does not.
 * `difficulty.test.ts` pins these against the authored road — a starter deck must
 * read at least `fair` on stage 1, and the region boss must not.
 */
const COMFORTABLE = 1.25;
const FAIR = 0.85;
const STRETCH = 0.55;

/** What the stage fields, scored like a collection card so the numbers compare. */
export function stagePower(content: Content, stage: GeneratedStage): number {
  const specs = enemySpecsFor(content, stage);
  if (!specs) return 0;

  let total = 0;
  for (const spec of specs) {
    const def = content.cards.get(spec.defId);
    if (!def) continue;
    const curve = content.growthCurves.get(def.growth);
    if (!curve) continue;
    const baseStars = CARD_RARITY_BASE_STARS[def.rarity];
    const at = (base: number) => statAtGrade(base, spec.level, spec.stars, baseStars, curve);
    total += powerRating({
      strength: at(def.baseStats.strength),
      attack: at(def.baseStats.attack),
      // Speed does not grow with level for the player either — same rule both sides.
      speed: def.baseStats.speed,
      stars: spec.stars,
      // Enemies do not carry the player's skill ladder, so nothing to add here.
      skillLevels: [],
    });
  }
  return total;
}

export function bandFor(ratio: number): DifficultyBand {
  if (ratio >= COMFORTABLE) return 'comfortable';
  if (ratio >= FAIR) return 'fair';
  if (ratio >= STRETCH) return 'stretch';
  return 'outmatched';
}

/**
 * Null for a stage that fields nobody.
 *
 * Events, treasure and campfires are not fights, and a difficulty line on a
 * campfire is worse than no line at all — it teaches the player to stop reading
 * the one place the warning matters.
 */
export function stageReading(
  content: Content,
  stage: GeneratedStage,
  deckPower: number,
): StageReading | null {
  const power = stagePower(content, stage);
  if (power === 0) return null;
  return {
    stagePower: power,
    deckPower,
    ratio: deckPower / power,
    band: bandFor(deckPower / power),
  };
}
