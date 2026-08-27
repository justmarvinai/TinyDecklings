import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { CARD_RARITY_BASE_STARS } from '@/content/schemas';
import { powerRating, statAtGrade } from '../progression';
import { generateStage } from './generate';
import { bandFor, stagePower, stageReading } from './difficulty';

/**
 * The reading has to be calibrated against the road, not against a feeling.
 *
 * A difficulty warning that cries wolf gets ignored within a session, and one that
 * stays quiet in front of an unwinnable fight costs the player energy they cannot
 * get back. These pin the band edges to the authored content: what a starter deck
 * meets on stage 1, and what it meets at the first boss.
 */
const SEED = 20260827;

/** Deck power for a hand-rolled roster, scored the way the collection scores it. */
function deckPowerOf(entries: readonly { defId: string; level: number }[]): number {
  let total = 0;
  for (const { defId, level } of entries) {
    const def = CONTENT.cards.get(defId);
    const curve = def ? CONTENT.growthCurves.get(def.growth) : undefined;
    if (!def || !curve) continue;
    const stars = CARD_RARITY_BASE_STARS[def.rarity];
    const at = (base: number) => statAtGrade(base, level, stars, stars, curve);
    total += powerRating({
      strength: at(def.baseStats.strength),
      attack: at(def.baseStats.attack),
      speed: def.baseStats.speed,
      stars,
      skillLevels: [1],
    });
  }
  return total;
}

/** Nine of whatever the roster's plainest units are, at a given level. */
function starterDeck(level: number) {
  const units = [...CONTENT.cards.values()]
    .filter((c) => c.cardClass === 'unit' && c.rarity !== 'legendary')
    .slice(0, 9);
  return units.map((c) => ({ defId: c.id, level }));
}

describe('stage difficulty reading', () => {
  it('scores every stage that fields enemies, and only those', () => {
    // Events, treasure and campfires field nobody; a difficulty line on a campfire
    // is worse than none, because it teaches the player to stop reading them.
    const combat = new Set(['battle', 'elite', 'boss']);
    for (let n = 1; n <= 30; n++) {
      const stage = generateStage(CONTENT, SEED, n);
      const power = stagePower(CONTENT, stage);
      if (combat.has(stage.kind)) expect(power, `stage ${n} (${stage.kind})`).toBeGreaterThan(0);
      else expect(power, `stage ${n} (${stage.kind})`).toBe(0);
    }
  });

  it('gets harder as the road goes on', () => {
    const first = stagePower(CONTENT, generateStage(CONTENT, SEED, 1));
    const last = stagePower(CONTENT, generateStage(CONTENT, SEED, 30));
    expect(last).toBeGreaterThan(first * 2);
  });

  it('does not warn a starter deck off the first stage', () => {
    const reading = stageReading(
      CONTENT,
      generateStage(CONTENT, SEED, 1),
      deckPowerOf(starterDeck(1)),
    );
    expect(reading, 'stage 1 is a fight and must read').not.toBeNull();
    expect(['comfortable', 'fair'], `stage 1 read as ${reading?.band}`).toContain(reading?.band);
  });

  it('warns that same deck off the first region boss', () => {
    const reading = stageReading(
      CONTENT,
      generateStage(CONTENT, SEED, 10),
      deckPowerOf(starterDeck(1)),
    );
    expect(['stretch', 'outmatched'], `stage 10 read as ${reading?.band}`).toContain(reading?.band);
  });

  it('stops warning once the deck has grown into the fight', () => {
    const stage = generateStage(CONTENT, SEED, 10);
    const grown = stageReading(CONTENT, stage, deckPowerOf(starterDeck(20)));
    expect(['comfortable', 'fair'], `levelled deck read as ${grown?.band}`).toContain(grown?.band);
  });

  it('bands only ever soften as the ratio rises', () => {
    const order: Record<string, number> = { outmatched: 0, stretch: 1, fair: 2, comfortable: 3 };
    let last = -1;
    for (let ratio = 0; ratio <= 3; ratio += 0.05) {
      const rank = order[bandFor(ratio)];
      expect(rank, `ratio ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(last);
      last = rank;
    }
  });

  it('says nothing about a stage that is not a fight', () => {
    const rest = Array.from({ length: 30 }, (_, i) => generateStage(CONTENT, SEED, i + 1)).find(
      (s) => !['battle', 'elite', 'boss'].includes(s.kind),
    );
    expect(rest, 'the road should have a non-combat stage in its first 30').toBeDefined();
    expect(stageReading(CONTENT, rest!, 10_000)).toBeNull();
  });
});
